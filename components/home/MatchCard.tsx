import Link from "next/link";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { calculateOddsValue } from "@/lib/odds/value-engine";
import { formatMatchDateTime } from "@/lib/football/date-format";
import type { FeaturedMatch } from "@/types/match";

type MatchCardProps = {
  match: FeaturedMatch;
  odds?: { home: number; draw: number; away: number };
};

const fallbackOdds = { home: 2.1, draw: 3.4, away: 3.2 };

function valueLevel(recommendation: string) {
  if (recommendation.startsWith("高价值")) return { label: "高价值", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" };
  if (recommendation.startsWith("低价值")) return { label: "低价值", className: "border-amber-500/20 bg-amber-500/10 text-amber-300" };
  return { label: "正常", className: "border-slate-700 bg-slate-900/60 text-slate-300" };
}

export function MatchCard({ match, odds = fallbackOdds }: MatchCardProps) {
  const valueAnalysis = calculateOddsValue({ prediction: { homeWin: match.homeWin, draw: match.draw, awayWin: match.awayWin }, odds });
  const level = valueLevel(valueAnalysis.recommendation);
  const formattedDate = /^\d+月\d+日/.test(match.date)
    ? { label: `${match.date} ${match.time}` }
    : formatMatchDateTime(`${match.date}T${match.time}:00+08:00`);
  const probabilities = [
    { label: "主胜", value: match.homeWin, className: "text-blue-300" },
    { label: "平局", value: match.draw, className: "text-slate-200" },
    { label: "客胜", value: match.awayWin, className: "text-emerald-300" },
  ];

  return <Link href={`/matches/${encodeURIComponent(match.id)}`} className="group block h-full"><Card className="h-full overflow-hidden border-slate-800/90 bg-[#111827] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-blue-500/40 group-hover:shadow-glow">
    <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3"><div className="min-w-0"><p className="truncate text-[11px] font-medium text-blue-400">{match.league}</p><p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500"><CalendarDays className="h-3 w-3" />{formattedDate.label}</p></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ${level.className}`}>赔率价值 {level.label}</span></div>
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5 text-center"><div className="min-w-0"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/15 text-sm font-bold text-blue-200">{match.homeTeam.shortName.slice(0, 3)}</div><p className="mt-2 truncate text-sm font-semibold text-slate-200">{match.homeTeam.name}</p></div><div><p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">VS</p><p className="mt-1 text-xs text-slate-500">模型观点</p></div><div className="min-w-0"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/15 text-sm font-bold text-emerald-200">{match.awayTeam.shortName.slice(0, 3)}</div><p className="mt-2 truncate text-sm font-semibold text-slate-200">{match.awayTeam.name}</p></div></div>
    <div className="mx-4 grid grid-cols-3 gap-2 border-y border-slate-800/80 py-3 text-center">{probabilities.map((item) => <div key={item.label}><p className="text-[10px] text-slate-500">{item.label}</p><p className={`mt-1 text-lg font-bold ${item.className}`}>{item.value}%</p></div>)}</div>
    <div className="flex items-center justify-between gap-3 px-4 py-4"><div className="min-w-0"><p className="flex items-center gap-1.5 text-[11px] text-slate-500"><Sparkles className="h-3.5 w-3.5 text-amber-400" />AI 信心 {match.aiScore}%</p><p className="mt-1 truncate text-sm font-semibold text-white">推荐方向：{match.prediction}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-blue-400 transition-transform group-hover:translate-x-1" /></div>
  </Card></Link>;
}
