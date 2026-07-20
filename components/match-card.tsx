import Link from "next/link";
import { ArrowRight, CalendarDays, ShieldAlert, Sparkles } from "lucide-react";
import type { FeaturedMatch, MatchRisk } from "@/types/match";
import { Card } from "@/components/ui/card";
import { TeamBadge } from "@/components/team-badge";
import { cn } from "@/lib/utils";

const riskTone: Record<MatchRisk, string> = {
  低: "border-green-500/20 bg-green-500/10 text-green-400",
  中: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  高: "border-red-500/20 bg-red-500/10 text-red-400",
};

function teamHref(team: { id?: string; englishName: string }) {
  if (team.id) return `/teams/${encodeURIComponent(team.id)}`;
  const slug = team.englishName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `/teams/${slug || encodeURIComponent(team.englishName)}`;
}

export function MatchCard({ match, compact = false }: { match: FeaturedMatch; compact?: boolean }) {
  return <Card className={cn("group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-glow", compact ? "" : "h-full")}>
    <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
      <div><p className="text-[11px] font-medium text-blue-400">{match.league}</p><div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500"><CalendarDays className="h-3 w-3" />{match.date} · {match.time}</div></div>
      <span className={cn("rounded-full border px-2 py-1 text-[10px]", riskTone[match.risk])}><ShieldAlert className="mr-1 inline h-3 w-3" />风险{match.risk}</span>
    </div>
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5">
      <Link href={teamHref(match.homeTeam)} className="flex min-w-0 flex-col items-center gap-2 text-center hover:text-blue-300"><TeamBadge {...match.homeTeam} size={compact ? "sm" : "md"} /><span className="truncate text-sm font-medium text-slate-200">{match.homeTeam.name}</span></Link>
      <div className="text-center"><p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">VS</p><p className="mt-1 text-xl font-semibold tracking-wider text-white">{match.score}</p></div>
      <Link href={teamHref(match.awayTeam)} className="flex min-w-0 flex-col items-center gap-2 text-center hover:text-blue-300"><TeamBadge {...match.awayTeam} size={compact ? "sm" : "md"} /><span className="truncate text-sm font-medium text-slate-200">{match.awayTeam.name}</span></Link>
    </div>
    <div className="mx-4 grid grid-cols-3 gap-2 border-t border-slate-800/80 py-3 text-center"><div><p className="text-[10px] text-slate-500">主胜</p><p className="mt-0.5 text-sm font-semibold text-blue-400">{match.homeWin}%</p></div><div><p className="text-[10px] text-slate-500">平局</p><p className="mt-0.5 text-sm font-semibold text-slate-300">{match.draw}%</p></div><div><p className="text-[10px] text-slate-500">客胜</p><p className="mt-0.5 text-sm font-semibold text-green-400">{match.awayWin}%</p></div></div>
    <div className="flex items-center justify-between gap-3 bg-slate-900/40 px-4 py-3"><span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-300"><Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400" /><span className="truncate">AI {match.aiScore}% · {match.prediction}</span></span><Link href={`/matches/${match.id}`} className="flex shrink-0 items-center gap-1 text-xs text-blue-400 opacity-80 transition-opacity group-hover:opacity-100">查看分析 <ArrowRight className="h-3 w-3" /></Link></div>
  </Card>;
}
