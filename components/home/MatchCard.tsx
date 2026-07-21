import Link from "next/link";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { calculateOddsValue } from "@/lib/odds/value-engine";
import { formatMatchDateTime } from "@/lib/football/date-format";
import type { FeaturedMatch } from "@/types/match";

type MatchCardProps = { match: FeaturedMatch; odds?: { home: number; draw: number; away: number } };
const fallbackOdds = { home: 2.1, draw: 3.4, away: 3.2 };

function valueLevel(match: FeaturedMatch, odds: { home: number; draw: number; away: number }) {
  if ([match.homeWin, match.draw, match.awayWin].some((value) => value === null)) return { label: "\u6570\u636e\u540c\u6b65\u4e2d", className: "border-slate-700 bg-slate-900/60 text-slate-400" };
  const analysis = calculateOddsValue({ prediction: { homeWin: match.homeWin ?? 0, draw: match.draw ?? 0, awayWin: match.awayWin ?? 0 }, odds });
  if (analysis.recommendation.startsWith("\u9ad8")) return { label: "\u9ad8\u4ef7\u503c", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" };
  if (analysis.recommendation.startsWith("\u4f4e")) return { label: "\u4f4e\u4ef7\u503c", className: "border-amber-500/20 bg-amber-500/10 text-amber-300" };
  return { label: "\u6b63\u5e38", className: "border-slate-700 bg-slate-900/60 text-slate-300" };
}

function display(value: number | null) { return value === null ? "\u2014" : `${value}%`; }

export function MatchCard({ match, odds = fallbackOdds }: MatchCardProps) {
  const level = valueLevel(match, odds);
  const formattedDate = /^\d+\u6708\d+\u65e5/.test(match.date) ? { label: `${match.date} ${match.time}` } : formatMatchDateTime(`${match.date}T${match.time}:00+08:00`);
  return <Link href={`/matches/${encodeURIComponent(match.id)}`} className="group block h-full"><Card className="h-full overflow-hidden border-slate-800/90 bg-[#111827] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-blue-500/40 group-hover:shadow-glow"><div className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3"><div className="min-w-0"><p className="truncate text-[11px] font-medium text-blue-400">{match.league}</p><p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500"><CalendarDays className="h-3 w-3" />{formattedDate.label}</p></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ${level.className}`}>AI {level.label}</span></div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5 text-center"><div className="min-w-0"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/15 text-sm font-bold text-blue-200">{match.homeTeam.shortName.slice(0, 3)}</div><p className="mt-2 truncate text-sm font-semibold text-slate-200">{match.homeTeam.name}</p></div><div><p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">VS</p><p className="mt-1 text-xs text-slate-500">{match.score}</p></div><div className="min-w-0"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/15 text-sm font-bold text-emerald-200">{match.awayTeam.shortName.slice(0, 3)}</div><p className="mt-2 truncate text-sm font-semibold text-slate-200">{match.awayTeam.name}</p></div></div><div className="mx-4 grid grid-cols-3 gap-2 border-y border-slate-800/80 py-3 text-center"><div><p className="text-[10px] text-slate-500">\u4e3b\u80dc</p><p className="mt-1 text-lg font-bold text-blue-300">{display(match.homeWin)}</p></div><div><p className="text-[10px] text-slate-500">\u5e73\u5c40</p><p className="mt-1 text-lg font-bold text-slate-200">{display(match.draw)}</p></div><div><p className="text-[10px] text-slate-500">\u5ba2\u80dc</p><p className="mt-1 text-lg font-bold text-emerald-300">{display(match.awayWin)}</p></div></div><div className="flex items-center justify-between gap-3 px-4 py-4"><div className="min-w-0"><p className="flex items-center gap-1.5 text-[11px] text-slate-500"><Sparkles className="h-3.5 w-3.5 text-amber-400" />AI \u4e00\u81f4\u6027 {match.aiScore === null ? "\u2014" : `${match.aiScore}%`}</p><p className="mt-1 truncate text-sm font-semibold text-white">\u6a21\u578b\u89c2\u70b9: {match.prediction}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-blue-400 transition-transform group-hover:translate-x-1" /></div></Card></Link>;
}
