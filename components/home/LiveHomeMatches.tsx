import Link from "next/link";
import { ChevronRight, CircleDot } from "lucide-react";
import { HeroAI } from "@/components/home/HeroAI";
import { MatchCard } from "@/components/home/MatchCard";
import { formatMatchDateTime } from "@/lib/football/date-format";
import { getTeamDisplayName } from "@/lib/football/team-name-map";
import type { FeaturedMatch as FeaturedMatchData, MatchRisk, MatchTeam } from "@/types/match";

export type SyncedHomeMatch = {
  external_id: string;
  home_team_id?: string | null;
  away_team_id?: string | null;
  league: string;
  home_team: string;
  away_team: string;
  match_time: string;
  home_logo?: string | null;
  away_logo?: string | null;
  home_win: number | null;
  draw: number | null;
  away_win: number | null;
  ai_score: number | null;
  ai_pick?: string | null;
  risk_level?: string | null;
};

export type HomeMatchesResult = {
  matches: SyncedHomeMatch[];
  useFallback: boolean;
};

type HomeMatchData = {
  id: string;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  league: string;
  date: string;
  time: string;
  scorePrediction: string;
  homeProbability: number;
  drawProbability: number;
  awayProbability: number;
  aiConfidence: number;
  recommendation: string;
  risk: MatchRisk;
};

const teamColors = ["#2563EB", "#22C55E", "#A855F7", "#F59E0B"];

function toTeam(name: string, index: number, id?: string | null): MatchTeam {
  const displayName = getTeamDisplayName(name);
  return { id: id ?? undefined, name: displayName, englishName: name, shortName: displayName.slice(0, 3).toUpperCase(), color: teamColors[index % teamColors.length], secondaryColor: teamColors[(index + 1) % teamColors.length] };
}

function toHomeMatchData(match: SyncedHomeMatch, index: number): HomeMatchData {
  const formattedDate = formatMatchDateTime(match.match_time);
  const homeProbability = match.home_win ?? 40;
  const drawProbability = match.draw ?? 27;
  const awayProbability = match.away_win ?? Math.max(0, 100 - homeProbability - drawProbability);
  const recommendation = match.ai_pick || (homeProbability >= awayProbability ? "主胜" : "客胜");
  const risk = (match.risk_level || (Math.max(homeProbability, awayProbability) >= 47 ? "低" : "中")) as MatchRisk;
  const scorePrediction = recommendation === "客胜" ? "1:2" : recommendation === "平局" ? "1:1" : "2:1";

  return {
    id: match.external_id,
    homeTeam: toTeam(match.home_team, index, match.home_team_id),
    awayTeam: toTeam(match.away_team, index + 1, match.away_team_id),
    league: match.league,
    date: formattedDate.date,
    time: formattedDate.time,
    scorePrediction,
    homeProbability,
    drawProbability,
    awayProbability,
    aiConfidence: match.ai_score ?? Math.max(homeProbability, drawProbability, awayProbability),
    recommendation,
    risk,
  };
}

function toFeaturedMatch(match: HomeMatchData): FeaturedMatchData {
  return { id: match.id, league: match.league, date: match.date, time: match.time, homeTeam: match.homeTeam, awayTeam: match.awayTeam, aiScore: match.aiConfidence, prediction: match.recommendation, score: match.scorePrediction, risk: match.risk, homeWin: match.homeProbability, draw: match.drawProbability, awayWin: match.awayProbability };
}

export function LiveHomeMatchesLoading() {
  return <><div className="h-56 animate-pulse bg-[#111827]" /><section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"><div className="mb-5 h-12 animate-pulse rounded-lg bg-[#111827]" /><div className="grid gap-5 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-xl border border-slate-800 bg-[#111827]" />)}</div></section></>;
}

export async function LiveHomeMatches({ matchesPromise, fallbackMatches }: { matchesPromise: Promise<HomeMatchesResult>; fallbackMatches: FeaturedMatchData[] }) {
  const { matches: apiMatches, useFallback } = await matchesPromise;
  const matches = apiMatches.length ? apiMatches.slice(0, 3).map(toHomeMatchData).map(toFeaturedMatch) : fallbackMatches.slice(0, 3);
  const highlight = matches[0] ?? fallbackMatches[0];

  return <><HeroAI match={highlight} /><section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"><div className="mb-5 flex items-end justify-between"><div><div className="flex items-center gap-2 text-xs font-medium text-blue-400"><CircleDot className="h-3.5 w-3.5" />TODAY&apos;S FOCUS</div><h2 className="mt-2 text-2xl font-semibold text-white">焦点比赛</h2><p className="mt-1 text-sm text-slate-500">AI 已为你筛选今天最值得分析的对决</p>{useFallback && <p className="mt-1 text-[11px] text-amber-400/80">实时数据暂不可用，当前显示 Mock 数据</p>}</div><Link href="/matches" className="hidden items-center gap-1 text-sm text-blue-400 hover:text-blue-300 sm:flex">全部比赛 <ChevronRight className="h-4 w-4" /></Link></div><div className="grid gap-5 lg:grid-cols-3">{matches.map((match) => <MatchCard key={match.id} match={match} />)}</div><Link href="/matches" className="mt-4 flex items-center justify-center gap-1 text-sm text-blue-400 sm:hidden">查看全部比赛 <ChevronRight className="h-4 w-4" /></Link></section></>;
}
