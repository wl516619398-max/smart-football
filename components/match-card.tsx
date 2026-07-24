import Link from "next/link";
import { ArrowRight, CalendarDays, ShieldAlert, Sparkles } from "lucide-react";
import type { FeaturedMatch, MatchRisk } from "@/types/match";
import { Card } from "@/components/ui/card";
import { TeamBadge } from "@/components/team-badge";
import { cn } from "@/lib/utils";
import { decodeUnicode } from "@/lib/utils/decode-unicode";

const riskTone: Record<MatchRisk, string> = {
  "\u4f4e": "border-green-500/20 bg-green-500/10 text-green-400",
  "\u4e2d": "border-amber-500/20 bg-amber-500/10 text-amber-400",
  "\u9ad8": "border-red-500/20 bg-red-500/10 text-red-400",
};

function teamHref(team: { id?: string; englishName: string }) {
  const slug = team.id || team.englishName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `/teams/${encodeURIComponent(slug || team.englishName)}`;
}

function display(value: number | null) {
  return value === null ? "\u2014" : `${value}%`;
}

export function MatchCard({ match, compact = false }: { match: FeaturedMatch; compact?: boolean }) {
  const homeTeam = { ...match.homeTeam, name: decodeUnicode(match.homeTeam.name), shortName: decodeUnicode(match.homeTeam.shortName), englishName: decodeUnicode(match.homeTeam.englishName) };
  const awayTeam = { ...match.awayTeam, name: decodeUnicode(match.awayTeam.name), shortName: decodeUnicode(match.awayTeam.shortName), englishName: decodeUnicode(match.awayTeam.englishName) };
  const league = decodeUnicode(match.league);
  const prediction = decodeUnicode(match.prediction);
  const score = decodeUnicode(match.score);
  const labels = {
    homeWin: decodeUnicode("\\u4e3b\\u80dc"),
    draw: decodeUnicode("\\u5e73\\u5c40"),
    awayWin: decodeUnicode("\\u5ba2\\u80dc"),
    uncertainty: decodeUnicode("\\u6570\\u636e\\u4e0d\\u786e\\u5b9a\\u6027"),
    syncing: decodeUnicode("\\u6570\\u636e\\u540c\\u6b65\\u4e2d"),
    viewAnalysis: decodeUnicode("\\u67e5\\u770b\\u5206\\u6790"),
  };
  const aiScore = match.aiScore === null ? labels.syncing : `${match.aiScore}%`;
  const aiConsistency = match.aiConsistency === null || match.aiConsistency === undefined ? labels.syncing : `${match.aiConsistency}%`;

  return (
    <Card className={cn("group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-glow", compact ? "" : "h-full")}>
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
        <div>
          <p className="text-[11px] font-medium text-blue-400">{league}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500"><CalendarDays className="h-3 w-3" />{decodeUnicode(match.date)} {decodeUnicode(match.time)}</div>
        </div>
        <span className={cn("rounded-full border px-2 py-1 text-[10px]", riskTone[match.risk])}><ShieldAlert className="mr-1 inline h-3 w-3" />{labels.uncertainty} {decodeUnicode(match.risk)}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5">
        <Link href={teamHref(homeTeam)} className="flex min-w-0 flex-col items-center gap-2 text-center hover:text-blue-300"><TeamBadge {...homeTeam} size={compact ? "sm" : "md"} /><span className="truncate text-sm font-medium text-slate-200">{homeTeam.name}</span></Link>
        <div className="text-center"><p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">VS</p><p className="mt-1 text-xl font-semibold tracking-wider text-white">{score}</p></div>
        <Link href={teamHref(awayTeam)} className="flex min-w-0 flex-col items-center gap-2 text-center hover:text-blue-300"><TeamBadge {...awayTeam} size={compact ? "sm" : "md"} /><span className="truncate text-sm font-medium text-slate-200">{awayTeam.name}</span></Link>
      </div>
      <div className="mx-4 grid grid-cols-3 gap-2 border-t border-slate-800/80 py-3 text-center">
        <div><p className="text-[10px] text-slate-500">{labels.homeWin}</p><p className="mt-0.5 text-sm font-semibold text-blue-400">{display(match.homeWin)}</p></div>
        <div><p className="text-[10px] text-slate-500">{labels.draw}</p><p className="mt-0.5 text-sm font-semibold text-slate-300">{display(match.draw)}</p></div>
        <div><p className="text-[10px] text-slate-500">{labels.awayWin}</p><p className="mt-0.5 text-sm font-semibold text-green-400">{display(match.awayWin)}</p></div>
      </div>
      <div className="flex items-center justify-between gap-3 bg-slate-900/40 px-4 py-3">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-300"><Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400" /><span className="truncate">AI评分 {aiScore} · AI一致性 {aiConsistency} · {prediction}</span></span>
        <Link href={`/matches/${encodeURIComponent(match.id)}`} className="flex shrink-0 items-center gap-1 text-xs text-blue-400 opacity-80 transition-opacity group-hover:opacity-100">{labels.viewAnalysis} <ArrowRight className="h-3 w-3" /></Link>
      </div>
    </Card>
  );
}
