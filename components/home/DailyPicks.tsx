import Link from "next/link";
import { ArrowRight, CalendarDays, Flame, Sparkles } from "lucide-react";
import { getFixtureOdds } from "@/lib/football/odds";
import { calculateOddsValue } from "@/lib/odds/value-engine";
import { predictMatch } from "@/lib/prediction/engine";
import type { PredictionTeamStats } from "@/lib/prediction/types";
import { getPredictionHistory, summarizePredictionHistory } from "@/lib/history/prediction-history";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getUpcomingFixturesWithSource } from "@/lib/football/fixture-service";
import { footballMatchesToMatchCenterRows } from "@/lib/football/match-center";
import { getUpcomingDateWindow } from "@/lib/football/date-window";
import { featured } from "@/data/matches";
import type { FeaturedMatch } from "@/types/match";
import type { HomeMatchesResult, SyncedHomeMatch } from "@/components/home/LiveHomeMatches";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingCard } from "@/components/common/LoadingCard";

type DailyPick = {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchTime: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  recommendation: string;
  confidence: number;
  value: number;
  valueLevel: string;
};

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

function statsFromProbabilities(homeWin: number, awayWin: number, confidence: number, isHome: boolean): PredictionTeamStats {
  const ownProbability = isHome ? homeWin : awayWin;
  const opponentProbability = isHome ? awayWin : homeWin;
  return {
    attack: clamp(48 + ownProbability * 0.35 + confidence * 0.15),
    defense: clamp(52 + (100 - opponentProbability) * 0.25),
    form: clamp(44 + ownProbability * 0.3 + confidence * 0.2),
    homeAdvantage: isHome ? 90 : 50,
  };
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "待定";
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date).replaceAll("/", "-");
}

function valueLabel(value: number) {
  if (value >= 0.05) return "高价值";
  if (value >= -0.05) return "正常";
  return "低价值";
}

function valueTone(value: number) {
  if (value >= 0.05) return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
  if (value >= -0.05) return "border-slate-700 bg-slate-900/60 text-slate-300";
  return "border-amber-500/25 bg-amber-500/10 text-amber-300";
}

function toPickInput(match: SyncedHomeMatch | FeaturedMatch) {
  if ("external_id" in match) {
    const homeWin = match.home_win ?? 40;
    const draw = match.draw ?? 27;
    const awayWin = match.away_win ?? Math.max(0, 100 - homeWin - draw);
    return { id: match.external_id, league: match.league, homeTeam: match.home_team, awayTeam: match.away_team, matchTime: match.match_time, homeWin, draw, awayWin, confidence: match.ai_score ?? Math.max(homeWin, draw, awayWin) };
  }
  return { id: match.id, league: match.league, homeTeam: match.homeTeam.name, awayTeam: match.awayTeam.name, matchTime: `${match.date}T${match.time}:00`, homeWin: match.homeWin, draw: match.draw, awayWin: match.awayWin, confidence: match.aiScore };
}

async function getDailyPicksMatches(): Promise<HomeMatchesResult> {
  try {
    const liveResult = await getUpcomingFixturesWithSource();
    if (liveResult.source === "football-api" && liveResult.matches.length) {
      return { matches: footballMatchesToMatchCenterRows(liveResult.matches) as SyncedHomeMatch[], useFallback: false };
    }
  } catch {
    // Continue to database and local fallbacks.
  }

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const window = getUpcomingDateWindow();
      const { data, error } = await supabase.from("matches").select("external_id,league,home_team,away_team,match_time,home_win,draw,away_win,ai_score").gte("match_time", window.start.toISOString()).order("match_time", { ascending: true }).limit(6);
      if (!error && data?.length) return { matches: data as SyncedHomeMatch[], useFallback: false };
    } catch {
      // Use Mock data when the database is unavailable.
    }
  }
  return { matches: [], useFallback: true };
}

async function buildDailyPick(match: SyncedHomeMatch | FeaturedMatch, history: Awaited<ReturnType<typeof getPredictionHistory>>) {
  const input = toPickInput(match);
  const homeStats = statsFromProbabilities(input.homeWin, input.awayWin, input.confidence, true);
  const awayStats = statsFromProbabilities(input.homeWin, input.awayWin, input.confidence, false);
  const prediction = predictMatch(homeStats, awayStats);
  const odds = await getFixtureOdds(input.id);
  const oddsValue = calculateOddsValue({ prediction, odds: { home: odds.home.odds, draw: odds.draw.odds, away: odds.away.odds } });
  const bestValue = Math.max(oddsValue.value.home, oddsValue.value.draw, oddsValue.value.away);
  const historyRecord = history.find((record) => record.match_id === input.id);
  return {
    id: input.id,
    league: input.league,
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
    matchTime: input.matchTime,
    homeWin: prediction.homeWin,
    draw: prediction.draw,
    awayWin: prediction.awayWin,
    recommendation: prediction.recommendation[0] ?? historyRecord?.prediction ?? "双方数据接近",
    confidence: historyRecord?.confidence ?? prediction.confidence,
    value: bestValue,
    valueLevel: valueLabel(bestValue),
  } satisfies DailyPick;
}

function PickCard({ pick }: { pick: DailyPick }) {
  return <Link href={`/matches/${encodeURIComponent(pick.id)}`} className="group block h-full"><Card className="h-full overflow-hidden border-slate-800/90 bg-[#111827] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-blue-500/40 group-hover:shadow-glow"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-[11px] font-medium text-blue-400">{pick.league}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{dateLabel(pick.matchTime)}</p></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ${valueTone(pick.value)}`}>Value {pick.valueLevel}</span></div><div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center"><p className="truncate text-sm font-semibold text-white">{pick.homeTeam}</p><span className="text-xs font-semibold tracking-[0.16em] text-slate-500">VS</span><p className="truncate text-sm font-semibold text-white">{pick.awayTeam}</p></div><div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-blue-500/15 bg-blue-500/5 p-3 text-center"><div><p className="text-[10px] text-slate-500">主胜</p><p className="mt-1 text-lg font-bold text-blue-300">{pick.homeWin}%</p></div><div><p className="text-[10px] text-slate-500">平局</p><p className="mt-1 text-lg font-bold text-slate-200">{pick.draw}%</p></div><div><p className="text-[10px] text-slate-500">客胜</p><p className="mt-1 text-lg font-bold text-emerald-300">{pick.awayWin}%</p></div></div><div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-4"><div className="min-w-0"><p className="flex items-center gap-1.5 text-[11px] text-slate-500"><Sparkles className="h-3.5 w-3.5 text-amber-400" />模型一致性 {pick.confidence}%</p><p className="mt-1 truncate text-sm font-semibold text-white">关注方向：{pick.recommendation}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-blue-400 transition-transform group-hover:translate-x-1" /></div></CardContent></Card></Link>;
}

export function DailyPicksLoading() {
  return <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8"><div className="h-8 w-48 animate-pulse rounded bg-[#111827]" /><div className="mt-5 grid gap-5 lg:grid-cols-3">{[0, 1, 2].map((item) => <LoadingCard key={item} className="h-72" />)}</div></section>;
}

export async function DailyPicks({ matchesPromise, fallbackMatches = featured.slice(0, 3) }: { matchesPromise?: Promise<HomeMatchesResult>; fallbackMatches?: FeaturedMatch[] }) {
  const sourceResult = matchesPromise ? await matchesPromise : await getDailyPicksMatches();
  const [{ matches, useFallback }, history] = await Promise.all([Promise.resolve(sourceResult), getPredictionHistory()]);
  const source = matches.length ? matches.slice(0, 6) : fallbackMatches.slice(0, 6);
  const allPicks = (await Promise.all(source.map((match) => buildDailyPick(match, history)))).sort((a, b) => b.value - a.value || b.confidence - a.confidence);
  const picks = allPicks.slice(0, 3);
  const accuracy = summarizePredictionHistory(history);
  const valueOpportunities = allPicks.filter((pick) => pick.value >= 0.05).length;

  if (!picks.length) return <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8"><EmptyState /></section>;

  return <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8"><div className="mb-5 rounded-2xl border border-blue-500/25 bg-gradient-to-r from-blue-500/15 via-[#111d3a] to-[#111827] p-5 shadow-lg shadow-blue-950/20 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2 text-xs font-medium text-amber-300"><Flame className="h-3.5 w-3.5" />ATHENA AI FOOTBALL</div><h2 className="mt-2 text-2xl font-semibold text-white">每日智能赛事分析</h2><p className="mt-1 text-sm text-slate-400">从今日赛事中筛选 Value 与模型一致性更突出的观察对象</p></div><div className="grid grid-cols-3 gap-2 sm:gap-3"><div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-3 text-center"><p className="text-[10px] text-slate-500">今日分析数量</p><p className="mt-1 text-xl font-bold text-blue-200">{source.length}</p></div><div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-3 text-center"><p className="text-[10px] text-slate-500">模型准确率</p><p className="mt-1 text-xl font-bold text-emerald-300">{accuracy.hitRate}%</p></div><div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-3 text-center"><p className="text-[10px] text-slate-500">价值机会数量</p><p className="mt-1 text-xl font-bold text-amber-300">{valueOpportunities}</p></div></div></div></div><div className="mb-5 flex items-end justify-between"><div><div className="flex items-center gap-2 text-xs font-medium text-amber-400"><Flame className="h-3.5 w-3.5" />ATHENA AI DAILY PICKS</div><h2 className="mt-2 text-2xl font-semibold text-white">Athena AI今日精选</h2><p className="mt-1 text-sm text-slate-500">按 Value 价值优先、模型一致性次优排序</p>{useFallback && <p className="mt-1 text-[11px] text-amber-400/80">实时数据暂不可用，当前显示本地示例精选</p>}</div><Link href="/matches" className="hidden items-center gap-1 text-sm text-blue-400 hover:text-blue-300 sm:flex">全部比赛 <ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-5 lg:grid-cols-3">{picks.map((pick) => <PickCard key={pick.id} pick={pick} />)}</div></section>;
}
