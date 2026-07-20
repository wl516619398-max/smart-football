import { CalendarDays, Clock3, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type MatchOverviewProps = {
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchTime: string | null;
};

function formatTime(value: string | null) {
  if (!value) return "待定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function MatchOverview({ homeTeam, awayTeam, league, matchTime }: MatchOverviewProps) {
  return <Card className="border-blue-500/20 bg-gradient-to-br from-[#111d3a] to-[#111827] shadow-lg shadow-blue-950/15"><CardContent className="p-5 sm:p-6"><div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center"><div className="text-center md:text-right"><p className="text-xs text-slate-500">主队</p><h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{homeTeam}</h2></div><div className="text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">MATCH OVERVIEW</p><p className="mt-2 text-2xl font-bold tracking-widest text-white">VS</p></div><div className="text-center md:text-left"><p className="text-xs text-slate-500">客队</p><h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{awayTeam}</h3></div></div><div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs text-slate-400"><span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-blue-400" />{league || "联赛信息待定"}</span><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-blue-400" />{formatTime(matchTime)}</span><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-slate-500" />赛前数据分析</span></div></CardContent></Card>;
}
