import Link from "next/link";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { FeaturedMatch } from "@/types/match";
import { decodeUnicode } from "@/lib/utils/decode-unicode";

type MatchCardProps = { match: FeaturedMatch };

function display(value: number | null) {
  return value === null ? "\u2014" : `${value}%`;
}

export function MatchCard({ match }: MatchCardProps) {
  const league = decodeUnicode(match.league);
  const homeTeam = decodeUnicode(match.homeTeam.name);
  const awayTeam = decodeUnicode(match.awayTeam.name);
  const prediction = decodeUnicode(match.prediction);
  const goalTrend = decodeUnicode(match.goalTrend || "\u6570\u636e\u540c\u6b65\u4e2d");
  const matchStatus = decodeUnicode(match.matchStatus || "\u672a\u5f00\u59cb");
  const aiStatus = match.aiScore === null ? "\u5f85\u751f\u6210" : "\u5df2\u5b8c\u6210";
  const matchStatusStyle = matchStatus === "\u8fdb\u884c\u4e2d"
    ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
    : matchStatus === "\u5df2\u7ed3\u675f"
      ? "border-slate-700 bg-slate-900/60 text-slate-400"
      : "border-blue-500/20 bg-blue-500/10 text-blue-300";

  return (
    <Link href={`/matches/${encodeURIComponent(match.id)}`} className="group block h-full">
      <Card className="h-full overflow-hidden border-slate-800/90 bg-[#111827] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-blue-500/40 group-hover:shadow-glow">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-blue-400">{league}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
              <CalendarDays className="h-3 w-3 shrink-0" />
              <span className="truncate">{decodeUnicode(`${match.date} ${match.time}`)}</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            <span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${matchStatusStyle}`}>{matchStatus}</span>
            <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-[10px] font-medium text-violet-300">AI {aiStatus}</span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5 text-center">
          <div className="min-w-0">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/15 text-sm font-bold text-blue-200">{decodeUnicode(match.homeTeam.shortName).slice(0, 3)}</div>
            <p className="mt-2 truncate text-sm font-semibold text-slate-200">{homeTeam}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">VS</p>
            <p className="mt-1 max-w-20 truncate text-xs text-blue-300">{prediction}</p>
          </div>
          <div className="min-w-0">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/15 text-sm font-bold text-emerald-200">{decodeUnicode(match.awayTeam.shortName).slice(0, 3)}</div>
            <p className="mt-2 truncate text-sm font-semibold text-slate-200">{awayTeam}</p>
          </div>
        </div>

        <div className="mx-4 grid grid-cols-3 gap-2 border-t border-slate-800/80 py-3 text-center">
          <div><p className="text-[10px] text-slate-500">{decodeUnicode("\u4e3b\u80dc")}</p><p className="mt-0.5 text-sm font-semibold text-blue-400">{display(match.homeWin)}</p></div>
          <div><p className="text-[10px] text-slate-500">{decodeUnicode("\u5e73\u5c40")}</p><p className="mt-0.5 text-sm font-semibold text-slate-300">{display(match.draw)}</p></div>
          <div><p className="text-[10px] text-slate-500">{decodeUnicode("\u5ba2\u80dc")}</p><p className="mt-0.5 text-sm font-semibold text-emerald-400">{display(match.awayWin)}</p></div>
        </div>

        <div className="flex items-center justify-between gap-3 bg-slate-900/40 px-4 py-3">
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-300">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span className="truncate">{decodeUnicode("\u8fdb\u7403\u8d8b\u52bf")}：{goalTrend}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-blue-400">{decodeUnicode("\u67e5\u770bAI\u5206\u6790")} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" /></span>
        </div>
      </Card>
    </Link>
  );
}
