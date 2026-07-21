import { CalendarDays, Check, Minus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchRecentStats, RecentMatch } from "@/types/match";

type RecentStatsInput = Partial<MatchRecentStats> & {
  recentMatches?: RecentMatch[];
  last10?: { win?: number; draw?: number; loss?: number };
  goals?: { scored?: number; conceded?: number };
};

function toCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeStats(input: MatchRecentStats | undefined): MatchRecentStats {
  const raw = (input ?? {}) as RecentStatsInput;
  const matches = Array.isArray(raw.matches) ? raw.matches : Array.isArray(raw.recentMatches) ? raw.recentMatches : [];
  return {
    matches,
    wins: toCount(raw.wins ?? raw.last10?.win),
    draws: toCount(raw.draws ?? raw.last10?.draw),
    losses: toCount(raw.losses ?? raw.last10?.loss),
    goalsFor: toCount(raw.goalsFor ?? raw.goals?.scored),
    goalsAgainst: toCount(raw.goalsAgainst ?? raw.goals?.conceded),
    trend: Array.isArray(raw.trend) ? raw.trend : matches.map((match) => match.result),
  };
}

function ResultMark({ result }: { result: RecentMatch["result"] }) {
  const config = result === "win"
    ? { icon: Check, label: "胜", tone: "bg-green-500/15 text-green-400" }
    : result === "draw"
      ? { icon: Minus, label: "平", tone: "bg-amber-500/15 text-amber-400" }
      : { icon: X, label: "负", tone: "bg-red-500/15 text-red-400" };
  const Icon = config.icon;
  return <span className={`flex h-7 w-7 items-center justify-center rounded-full ${config.tone}`} title={config.label}><Icon className="h-3.5 w-3.5" /></span>;
}

function resultLabel(result: RecentMatch["result"]) {
  return result === "win" ? "胜" : result === "draw" ? "平" : "负";
}

function TeamRecentCard({ team, input }: { team: string; input: MatchRecentStats | undefined }) {
  const stats = normalizeStats(input);
  const matches = stats.matches.slice(0, 5);

  if (!matches.length) {
    return <div className="flex min-h-44 flex-col justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-6 text-center"><h3 className="text-sm font-semibold text-white">{team}</h3><p className="mt-4 text-sm text-slate-300">暂无近期比赛数据</p><p className="mt-2 text-xs leading-5 text-slate-500">当前赛事暂无完整历史数据支持</p></div>;
  }

  return <div className="rounded-xl border border-slate-800 bg-slate-900/35 p-4">
    <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-white">{team}</h3><span className="text-xs text-slate-500">最近 {matches.length} 场</span></div>
    <div className="mt-4 flex flex-wrap items-center gap-2"><div className="flex gap-2">{matches.map((item, index) => <ResultMark key={`${item.opponent}-${index}`} result={item.result} />)}</div><span className="text-xs text-slate-500">状态趋势：{matches.map((item) => resultLabel(item.result)).join(" · ")}</span></div>
    <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div><p className="text-lg font-semibold text-green-300">{stats.wins}</p><p className="text-[10px] text-slate-500">胜</p></div><div><p className="text-lg font-semibold text-amber-300">{stats.draws}</p><p className="text-[10px] text-slate-500">平</p></div><div><p className="text-lg font-semibold text-red-300">{stats.losses}</p><p className="text-[10px] text-slate-500">负</p></div></div>
    <div className="mt-4 space-y-2 border-t border-slate-800 pt-3">{matches.map((item, index) => <div key={`${item.opponent}-detail-${index}`} className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate text-slate-500">{item.venue === "home" ? "主场" : "客场"} · {item.opponent}</span><span className="font-medium text-slate-200">{item.score}</span><span className="w-5 text-right font-semibold text-slate-400">{resultLabel(item.result)}</span></div>)}</div>
    <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs"><span className="text-slate-500">进球 <strong className="ml-1 text-slate-200">{stats.goalsFor}</strong></span><span className="text-slate-500">失球 <strong className="ml-1 text-slate-200">{stats.goalsAgainst}</strong></span></div>
  </div>;
}

export function RecentFormOverview({ homeTeam, awayTeam, home, away }: { homeTeam: string; awayTeam: string; home: MatchRecentStats; away: MatchRecentStats }) {
  return <section className="scroll-mt-24"><div className="mb-4 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-400" /><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-400">FORM INDEX</p><h2 className="mt-1 text-xl font-semibold text-white">球队近期状态</h2></div></div><Card><CardHeader><CardTitle className="text-base text-white">最近5场表现</CardTitle><p className="text-xs text-slate-500">胜平负趋势、比赛比分与进失球数据汇总</p></CardHeader><CardContent className="grid gap-4 p-5 sm:p-6 md:grid-cols-2"><TeamRecentCard team={homeTeam} input={home} /><TeamRecentCard team={awayTeam} input={away} /></CardContent></Card></section>;
}
