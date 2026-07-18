import { Star } from "lucide-react";
import type { FeaturedMatch as FeaturedMatchData } from "@/types/match";
import { MatchCard } from "@/components/match-card";

export function FeaturedMatch({ match }: { match: FeaturedMatchData }) {
  return <div className="relative pt-2"><div className="absolute left-4 top-0 z-10 inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-[#111827] px-2 py-1 text-[10px] font-medium text-amber-300"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />精选</div><MatchCard match={match} /></div>;
}
