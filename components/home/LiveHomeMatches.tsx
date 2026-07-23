import Link from "next/link";
import { ChevronRight, CircleDot } from "lucide-react";
import { HeroAI } from "@/components/home/HeroAI";
import { MatchCard } from "@/components/home/MatchCard";
import { TodayMatches } from "@/components/home/TodayMatches";
import { formatMatchDateTime } from "@/lib/football/date-format";
import { getTeamDisplayName } from "@/lib/football/team-name-map";
import { isHotLeague } from "@/lib/football/hot-leagues";
import { ComplianceDisclaimer } from "@/components/common/ComplianceDisclaimer";
import { decodeUnicode, decodeUnicodeDeep } from "@/lib/utils/decode-unicode";
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
  score_prediction?: string | null;
  goal_trend?: string | null;
  status?: string | null;
  risk_level?: string | null;
  analysis_status?: "已分析" | "待分析";
};

export type HomeMatchesResult = { matches: SyncedHomeMatch[]; useFallback: boolean };

type HomeMatchData = {
  id: string;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  league: string;
  date: string;
  time: string;
  scorePrediction: string;
  goalTrend: string;
  homeProbability: number | null;
  drawProbability: number | null;
  awayProbability: number | null;
  aiConfidence: number | null;
  recommendation: string;
  risk: MatchRisk;
  matchStatus: string;
  analysisStatus: "已分析" | "待分析";
};

const teamColors = ["#2563EB", "#22C55E", "#A855F7", "#F59E0B"];
const unavailable = "\u6570\u636e\u540c\u6b65\u4e2d";

function getGoalTrend(score: string | null | undefined) {
  if (!score) return unavailable;
  const values = score.match(/\d+/g)?.map(Number) ?? [];
  if (values.length < 2) return unavailable;
  const total = values[0] + values[1];
  if (total >= 4) return "\u8fdb\u7403\u504f\u591a";
  if (total >= 2) return "\u8fdb\u7403\u9002\u4e2d";
  return "\u8fdb\u7403\u504f\u5c11";
}

function getMatchStatus(status: string | null | undefined) {
  const value = decodeUnicode(status).trim().toUpperCase();
  if (["FT", "AET", "PEN", "CANC", "ABD", "AWD", "WO", "FINISHED", "ENDED", "已结束"].includes(value)) return "\u5df2\u7ed3\u675f";
  if (["1H", "2H", "HT", "ET", "P", "LIVE", "IN PLAY", "进行中"].includes(value)) return "\u8fdb\u884c\u4e2d";
  return "\u672a\u5f00\u59cb";
}

function toTeam(name: string, index: number, id?: string | null): MatchTeam {
  const decodedName = decodeUnicode(name);
  const displayName = getTeamDisplayName(decodedName);
  return { id: id ?? undefined, name: displayName, englishName: decodedName, shortName: displayName.slice(0, 3).toUpperCase(), color: teamColors[index % teamColors.length], secondaryColor: teamColors[(index + 1) % teamColors.length] };
}

function toHomeMatchData(match: SyncedHomeMatch, index: number): HomeMatchData {
  const decodedMatch = decodeUnicodeDeep(match);
  const formattedDate = formatMatchDateTime(decodedMatch.match_time);
  const scorePrediction = decodeUnicode(decodedMatch.score_prediction || unavailable);
  return {
    id: decodedMatch.external_id,
    homeTeam: toTeam(decodedMatch.home_team, index, decodedMatch.home_team_id),
    awayTeam: toTeam(decodedMatch.away_team, index + 1, decodedMatch.away_team_id),
    league: decodeUnicode(decodedMatch.league),
    date: formattedDate.date,
    time: formattedDate.time,
    scorePrediction,
    goalTrend: decodeUnicode(decodedMatch.goal_trend || getGoalTrend(scorePrediction)),
    homeProbability: decodedMatch.home_win,
    drawProbability: decodedMatch.draw,
    awayProbability: decodedMatch.away_win,
    aiConfidence: decodedMatch.ai_score,
    recommendation: decodeUnicode(decodedMatch.ai_pick || unavailable),
    risk: decodeUnicode(decodedMatch.risk_level || "\u4e2d") as MatchRisk,
    matchStatus: getMatchStatus(decodedMatch.status),
    analysisStatus: decodedMatch.analysis_status ?? (decodedMatch.ai_score === null ? "待分析" : "已分析"),
  };
}

function toFeaturedMatch(match: HomeMatchData): FeaturedMatchData {
  return decodeUnicodeDeep({ id: match.id, league: match.league, date: match.date, time: match.time, homeTeam: match.homeTeam, awayTeam: match.awayTeam, aiScore: match.aiConfidence, prediction: match.recommendation, score: match.scorePrediction, goalTrend: match.goalTrend, matchStatus: match.matchStatus, risk: match.risk, homeWin: match.homeProbability, draw: match.drawProbability, awayWin: match.awayProbability, analysisStatus: match.analysisStatus });
}

export function LiveHomeMatchesLoading() {
  return <><div className="h-56 animate-pulse bg-[#111827]" /><section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"><div className="mb-5 h-12 animate-pulse rounded-lg bg-[#111827]" /><div className="grid gap-5 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-xl border border-slate-800 bg-[#111827]" />)}</div></section></>;
}

export async function LiveHomeMatches({ matchesPromise, fallbackMatches }: { matchesPromise: Promise<HomeMatchesResult>; fallbackMatches: FeaturedMatchData[] }) {
  const { matches: apiMatches, useFallback } = await matchesPromise;
  const decodedFallbackMatches = decodeUnicodeDeep(fallbackMatches);
  const matches = apiMatches.length ? apiMatches.slice(0, 50).map(toHomeMatchData).map(toFeaturedMatch) : decodedFallbackMatches.slice(0, 3);
  const highlight = matches.find((match) => isHotLeague(decodeUnicode(match.league))) ?? matches[0] ?? decodedFallbackMatches[0];

  return <><HeroAI match={highlight} /><section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"><div className="mb-5 flex items-end justify-between"><div><div className="flex items-center gap-2 text-xs font-medium text-blue-400"><CircleDot className="h-3.5 w-3.5" />TODAY&apos;S FOCUS</div><h2 className="mt-2 text-2xl font-semibold text-white">{decodeUnicode("\\u4eca\\u65e5\\u8d5b\\u4e8b\\u4e2d\\u5fc3")}</h2><p className="mt-1 text-sm text-slate-500">{decodeUnicode("\\u57fa\\u4e8e Football API \\u7684\\u4eca\\u65e5\\u53ef\\u5206\\u6790\\u6bd4\\u8d5b")}</p>{useFallback && <p className="mt-1 text-[11px] text-amber-400/80">{decodeUnicode("\\u5b9e\\u65f6\\u6570\\u636e\\u6682\\u4e0d\\u53ef\\u7528\\uff0c\\u5f53\\u524d\\u4f7f\\u7528 Mock \\u6570\\u636e")}</p>}</div><div className="hidden items-center gap-4 sm:flex"><Link href="/history" className="text-sm text-slate-400 hover:text-white">{decodeUnicode("\\u5386\\u53f2\\u5206\\u6790")}</Link><Link href="/matches" className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">{decodeUnicode("\\u5168\\u90e8\\u6bd4\\u8d5b")} <ChevronRight className="h-4 w-4" /></Link></div></div><TodayMatches matches={matches} /><div className="mt-4 flex justify-center gap-4 sm:hidden"><Link href="/history" className="flex items-center gap-1 text-sm text-slate-400">{decodeUnicode("\\u5386\\u53f2\\u5206\\u6790")}</Link><Link href="/matches" className="flex items-center gap-1 text-sm text-blue-400">{decodeUnicode("\\u67e5\\u770b\\u5168\\u90e8\\u6bd4\\u8d5b")} <ChevronRight className="h-4 w-4" /></Link></div><div className="mt-8"><ComplianceDisclaimer /><p className="mt-2 text-center text-xs text-slate-500">模型分析仅供参考，不构成投注建议。</p></div></section></>;
}

export default LiveHomeMatches;
