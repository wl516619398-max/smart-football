import { BarChart3, Check, Minus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchRecentStats } from "@/types/match";

function ResultIcon({ result }: { result: "win" | "draw" | "loss" }) {
  const config = result === "win" ? { icon: Check, tone: "bg-emerald-500/20 text-emerald-300" } : result === "draw" ? { icon: Minus, tone: "bg-amber-500/20 text-amber-300" } : { icon: X, tone: "bg-rose-500/20 text-rose-300" };
  const Icon = config.icon;
  return <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${config.tone}`}><Icon className="h-4 w-4" /></span>;
}

function FormColumn({ team, stats, tone }: { team: string; stats: MatchRecentStats; tone: "blue" | "green" }) {
  const matches = stats.matches.slice(0, 5);
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-white">{team}</h3><span className="text-xs text-slate-500">最近 {matches.length} 场</span></div>{matches.length ? <><div className="mt-4 flex gap-2">{matches.map((match, index) => <ResultIcon key={`${match.opponent}-${index}`} result={match.result} />)}</div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div><p className="text-xl font-bold text-emerald-300">{stats.wins}</p><p className="text-[11px] text-slate-500">胜</p></div><div><p className="text-xl font-bold text-amber-300">{stats.draws}</p><p className="text-[11px] text-slate-500">平</p></div><div><p className="text-xl font-bold text-rose-300">{stats.losses}</p><p className="text-[11px] text-slate-500">负</p></div></div><div className={`mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800`}><div className={`h-full rounded-full ${tone === "blue" ? "bg-blue-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (stats.wins * 3 + stats.draws) / Math.max(1, matches.length * 3) * 100)}%` }} /></div><div className="mt-3 flex justify-between text-xs text-slate-500"><span>进球 <strong className="text-slate-200">{stats.goalsFor}</strong></span><span>失球 <strong className="text-slate-200">{stats.goalsAgainst}</strong></span></div></> : <div className="mt-8 rounded-xl border border-dashed border-slate-700 p-5 text-center"><p className="text-sm text-slate-300">暂无近期比赛数据</p><p className="mt-2 text-xs leading-5 text-slate-500">当前赛事暂无完整历史数据支持</p></div>}</div>;
}

export function ReportFormChart({ homeTeam, awayTeam, home, away }: { homeTeam: string; awayTeam: string; home: MatchRecentStats; away: MatchRecentStats }) {
  return <Card className="border-slate-800 bg-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><BarChart3 className="h-4 w-4 text-blue-300" />最近5场比赛趋势</CardTitle><p className="text-xs text-slate-500">胜平负分布、进失球和近期状态变化</p></CardHeader><CardContent className="grid gap-4 p-5 sm:p-6 md:grid-cols-2"><FormColumn team={homeTeam} stats={home} tone="blue" /><FormColumn team={awayTeam} stats={away} tone="green" /></CardContent></Card>;
}
