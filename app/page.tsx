import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CalendarDays, ShieldCheck } from "lucide-react";
import { featured } from "@/data/matches";
import { fallbackHomeLeagues, fallbackHomeStats, latestInsights, type HomeLeagueSummary, type HomeOverviewStats } from "@/data/home";
import { players } from "@/data/mock-data";
import { analyzeMatch } from "@/lib/analysis-engine";
import { footballMatchToMatchData } from "@/lib/data-provider/football-api";
import { getTodayFixturesWithSource, getTodayHotFixturesWithSource } from "@/lib/football/fixture-service";
import { getUpcomingDateWindow } from "@/lib/football/date-window";
import { filterTodayHotMatches } from "@/lib/football/hot-leagues";
import type { FootballMatch } from "@/lib/football/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getPredictionHistorySummary } from "@/lib/history/prediction-history";
import { decodeUnicodeDeep } from "@/lib/utils/decode-unicode";
import type { HomeMatchesResult, SyncedHomeMatch } from "@/components/home/LiveHomeMatches";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveHomeMatches, LiveHomeMatchesLoading } from "@/components/home/LiveHomeMatches";
import { StatsOverview } from "@/components/home/StatsOverview";
import { PopularLeagues } from "@/components/home/PopularLeagues";
import { LatestInsights } from "@/components/home/LatestInsights";
import { AccuracyCard } from "@/components/dashboard/AccuracyCard";
import { VIPBanner } from "@/components/home/VIPBanner";
import { PerformanceChart } from "@/components/performance-chart";
import { PlayerCard } from "@/components/player-card";

const legacyHomeMetadata: Metadata = {
  title: "Project Athena - AI足球比赛分析平台",
  description: "足球数据分析与赛事信息平台，提供赛事概率模型、球员分析、xG数据与市场数据变化观察。",
};

export const metadata: Metadata = {
  ...legacyHomeMetadata,
  title: "Project Athena｜AI足球赛事分析平台",
  description: "今日足球赛事中心，提供比赛状态、胜平负概率、进球趋势与AI赛前分析，帮助你快速了解值得关注的赛事。",
  openGraph: {
    title: "Project Athena｜AI足球赛事分析平台",
    description: "今日赛事、概率模型与AI赛前分析，一站式查看足球比赛信息。",
    type: "website",
    locale: "zh_CN",
  },
};

async function toSyncedHomeMatch(match: FootballMatch): Promise<SyncedHomeMatch> {
  const prediction = analyzeMatch(footballMatchToMatchData(match));
  return decodeUnicodeDeep({
    external_id: match.id,
    home_team_id: match.homeTeam.id,
    away_team_id: match.awayTeam.id,
    league: match.league,
    home_team: match.homeTeam.name,
    away_team: match.awayTeam.name,
    match_time: match.date,
    status: match.status ?? "NS",
    home_logo: match.homeTeam.logo ?? null,
    away_logo: match.awayTeam.logo ?? null,
    home_win: prediction.home_win_probability,
    draw: prediction.draw_probability,
    away_win: prediction.away_win_probability,
    ai_score: prediction.confidence,
    ai_pick: prediction.recommended_pick,
    score_prediction: prediction.expected_score,
    analysis_status: "待分析",
    risk_level: prediction.confidence >= 70 ? "低" : prediction.confidence >= 50 ? "中" : "高",
  });
}

async function getHomeMatches(): Promise<HomeMatchesResult> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const window = getUpcomingDateWindow(0);
      const nextDay = getUpcomingDateWindow(1);
      const { data, error } = await supabase
        .from("matches")
        .select("external_id,league,home_team,away_team,match_time,status,home_win,draw,away_win,ai_score")
        .gte("match_time", window.start.toISOString())
        .lt("match_time", nextDay.end.toISOString())
        .order("match_time", { ascending: true })
        .limit(100);

      if (!error && data?.length) {
        const todayRows = decodeUnicodeDeep(data as SyncedHomeMatch[]).map((row) => ({
          ...row,
          analysis_status: row.ai_score === null ? "待分析" : "已分析",
        }));
        if (todayRows.length) {
          return { matches: todayRows.slice(0, 50) as SyncedHomeMatch[], useFallback: false };
        }
      }
    } catch {
      // Continue to the football provider and static Mock fallbacks.
    }
  }

  try {
    const liveResult = await getTodayFixturesWithSource();
    if (liveResult.matches.length) {
      return { matches: await Promise.all(liveResult.matches.slice(0, 50).map(toSyncedHomeMatch)), useFallback: liveResult.source === "mock" };
    }
  } catch {
    // Continue to the existing internal API and static Mock fallbacks.
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  if (!host) return { matches: [], useFallback: true };
  const protocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0] || "http";

  try {
    const response = await fetch(`${protocol}://${host}/api/matches?page=1&pageSize=50`, { cache: "no-store" });
    if (!response.ok) return { matches: [], useFallback: true };
    const payload = (await response.json()) as { success: boolean; data: SyncedHomeMatch[] };
      const hasLiveData = payload.success === true && Array.isArray(payload.data) && payload.data.length > 0;
    return {
      matches: hasLiveData ? decodeUnicodeDeep(payload.data.slice(0, 50)) : [],
      useFallback: !hasLiveData,
    };
  } catch {
    return { matches: [], useFallback: true };
  }
}

type HomeMatchSummaryRow = { league: string | null; match_time: string | null };

function getLeagueSummaries(rows: HomeMatchSummaryRow[]): HomeLeagueSummary[] {
  const aliases = [
    { name: "英超", aliases: ["英超", "Premier League", "English Premier League"], logo: "英", accent: "#60A5FA" },
    { name: "西甲", aliases: ["西甲", "La Liga", "Primera Division"], logo: "西", accent: "#F59E0B" },
    { name: "德甲", aliases: ["德甲", "Bundesliga"], logo: "德", accent: "#EF4444" },
    { name: "欧冠", aliases: ["欧冠", "UEFA Champions League", "Champions League"], logo: "欧", accent: "#A78BFA" },
  ];

  return aliases.map((league) => ({ ...league, matchesToday: rows.filter((row) => row.league && league.aliases.some((alias) => row.league?.toLowerCase().includes(alias.toLowerCase()))).length }));
}

function getOverviewFromRows(rows: HomeMatchSummaryRow[]): { leagues: HomeLeagueSummary[]; stats: HomeOverviewStats } | null {
  if (!rows.length) return null;
  const leagueCount = new Set(rows.map((row) => row.league).filter(Boolean)).size;
  const matchCount = rows.length;
  return { leagues: getLeagueSummaries(rows), stats: { matchCount, leagueCount, analysisCount: matchCount * 4, accuracy: 78.6 } };
}

async function getHomeOverview(): Promise<{ leagues: HomeLeagueSummary[]; stats: HomeOverviewStats }> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const window = getUpcomingDateWindow(0);
      const nextDay = getUpcomingDateWindow(1);
      const { data, count, error } = await supabase
        .from("matches")
        .select("league,match_time", { count: "exact" })
        .gte("match_time", window.start.toISOString())
        .lt("match_time", nextDay.end.toISOString())
        .limit(100);
      if (!error && data?.length) {
        const rows = filterTodayHotMatches(decodeUnicodeDeep(data as HomeMatchSummaryRow[]).map((row) => ({ ...row, date: row.match_time })));
        const summaryRows = rows.map((row) => ({ league: row.league ?? "", match_time: row.match_time ?? "" }));
        if (!summaryRows.length) return { leagues: fallbackHomeLeagues, stats: { ...fallbackHomeStats, matchCount: 0 } };
        return getOverviewFromRows(summaryRows) ?? { leagues: fallbackHomeLeagues, stats: { ...fallbackHomeStats, matchCount: count ?? 0 } };
      }
    } catch {
      // Continue to the football provider and static Mock fallbacks.
    }
  }

  try {
    const liveResult = await getTodayHotFixturesWithSource();
    const providerOverview = getOverviewFromRows(liveResult.matches.map((match) => ({ league: match.league, match_time: match.date })));
    if (providerOverview) return decodeUnicodeDeep(providerOverview);
  } catch {
    // Use the static Mock overview when the provider is unavailable.
  }

  return { leagues: fallbackHomeLeagues, stats: fallbackHomeStats };
}

async function HomeOverview({ overviewPromise }: { overviewPromise: Promise<{ leagues: HomeLeagueSummary[]; stats: HomeOverviewStats }> }) {
  const [overview, accuracy] = await Promise.all([overviewPromise, getPredictionHistorySummary()]);
  return <><StatsOverview stats={overview.stats} /><section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8"><AccuracyCard summary={accuracy} /></section><PopularLeagues leagues={overview.leagues} /><LatestInsights insights={latestInsights} /></>;
}

function HomeOverviewLoading() {
  return <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">{[0, 1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl border border-slate-800 bg-[#111827]" />)}</div>;
}

export default function HomePage() {
  const matchesPromise = getHomeMatches();
  const overviewPromise = getHomeOverview();

  return <div className="grid-glow"><Suspense fallback={<LiveHomeMatchesLoading />}><LiveHomeMatches matchesPromise={matchesPromise} fallbackMatches={featured.slice(0, 3)} /></Suspense><Suspense fallback={<HomeOverviewLoading />}><HomeOverview overviewPromise={overviewPromise} /></Suspense><section className="border-y border-slate-800/70 bg-[#0C1426]/70"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8"><div><div className="mb-5 flex items-end justify-between"><div><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><CalendarDays className="h-3.5 w-3.5" />FORM INDEX</div><h2 className="mt-2 text-xl font-semibold text-white">球队状态指数</h2></div><div className="flex gap-3 text-[11px] text-slate-500"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-blue-500" />主队</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-green-500" />客队</span></div></div><Card><CardContent className="p-4"><PerformanceChart /></CardContent></Card></div><Card className="h-fit"><CardHeader><div className="flex items-center justify-between"><div><p className="text-xs text-amber-400">ATHENA RADAR</p><CardTitle className="mt-1 text-xl">本周关注球员</CardTitle></div><ShieldCheck className="h-5 w-5 text-blue-400" /></div></CardHeader><CardContent className="space-y-3">{players.slice(0, 3).map((player) => <PlayerCard key={player.name} player={player} />)}<Button asChild variant="ghost" className="w-full text-slate-400"><Link href="/ai">进入 AI 球员中心 <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link></Button></CardContent></Card></div></section><section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><VIPBanner /></section></div>;
}
