import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import type { MatchDetailData } from "@/types/match";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { ShareButton } from "@/components/common/ShareButton";

type MatchHeaderProps = { match: MatchDetailData };

export function MatchHeader({ match }: MatchHeaderProps) {
  return (
    <Card className="overflow-hidden border-white/10 bg-[#111827]">
      <CardContent className="relative p-5 sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-violet-500" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/matches" className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> 返回比赛列表
          </Link>
          <div className="flex items-center gap-2">
            <FavoriteButton matchId={match.id} />
            <ShareButton matchId={match.id} />
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-blue-300">{match.league}</p>
          <h1 className="mt-3 text-2xl font-bold text-white sm:text-4xl">{match.home.name} VS {match.away.name}</h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-400">
            <CalendarDays className="h-4 w-4 text-blue-400" />
            <span>2026-03-16 22:30</span>
            <span className="text-slate-600">·</span>
            <span>英格兰超级联赛</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
