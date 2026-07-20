import { CalendarDays, Check, Minus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchRecentStats } from "@/types/match";

function ResultMark({ result }: { result: "win" | "draw" | "loss" }) {
  const config = result === "win" ? { icon: Check, label: "胜", tone: "bg-green-500/15 text-green-400" } : result === "draw" ? { icon: Minus, label: "平", tone: "bg-amber-500/15 text-amber-400" } : { icon: X, label: "负", tone: "bg-red-500/15 text-red-400" };
  const Icon = config.icon;
  return <span className={`flex h-7 w-7 items-center justify-center rounded-full ${config.tone}`} title={config.label}><Icon className="h-3.5 w-3.5" /></span>;
}

function TeamRecentCard({ team, stats }: { team: string; stats: MatchRecentStats }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-900/35 p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-white">{team}</h3><span className="text-xs text-slate-500">最近 {stats.matches.length} 场</span></div><div className="mt-4 flex gap-2">{stats.matches.slice(0, 5).map((item, index) => <ResultMark key={`${item.opponent}-${index}`} result={item.result} />)}</div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div><p className="text-lg font-semibold text-green-300">{stats.wins}</p><p className="text-[10px] text-slate-500">胜</p></div><div><p className="text-lg font-semibold text-amber-300">{stats.draws}</p><p className="text-[10px] text-slate-500">平</p></div><div><p className="text-lg font-semibold text-red-300">{stats.losses}</p><p className="text-[10px] text-slate-500">负</p></div></div><div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs"><span className="text-slate-500">进球 <strong className="ml-1 text-slate-200">{stats.goalsFor}</strong></span><span className="text-slate-500">失球 <strong className="ml-1 text-slate-200">{stats.goalsAgainst}</strong></span></div></div>;
}

export function RecentFormOverview({ homeTeam, awayTeam, home, away }: { homeTeam: string; awayTeam: string; home: MatchRecentStats; away: MatchRecentStats }) {
  return <section className="scroll-mt-24"><div className="mb-4 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-400" /><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-400">FORM INDEX</p><h2 className="mt-1 text-xl font-semibold text-white">球队近期状态</h2></div></div><Card><CardHeader><CardTitle className="text-base text-white">最近 5 场表现</CardTitle><p className="text-xs text-slate-500">胜平负分布与进失球数据汇总</p></CardHeader><CardContent className="grid gap-4 p-5 sm:p-6 md:grid-cols-2"><TeamRecentCard team={homeTeam} stats={home} /><TeamRecentCard team={awayTeam} stats={away} /></CardContent></Card></section>;
}
