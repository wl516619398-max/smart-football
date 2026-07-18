import { CircleUserRound, Footprints, Star, Trophy } from "lucide-react";
import type { CommercialPlayer } from "@/types/match";
import { Card, CardContent } from "@/components/ui/card";

export function PlayerCard({ player }: { player: CommercialPlayer }) {
  return <Card className="border-white/10 bg-[#111827] transition-colors hover:border-blue-500/30"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 text-sm font-bold text-blue-100">{player.avatar || <CircleUserRound className="h-6 w-6" />}</div><div className="min-w-0"><p className="truncate font-semibold text-white">{player.name}</p><p className="text-xs text-slate-500">{player.team}</p></div><div className="ml-auto flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-sm font-bold text-amber-300"><Star className="h-3.5 w-3.5 fill-current" />{player.rating}</div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/[0.03] p-3"><Trophy className="h-4 w-4 text-blue-400" /><p className="mt-2 text-lg font-bold text-white">{player.goals}</p><p className="text-[11px] text-slate-500">进球</p></div><div className="rounded-xl bg-white/[0.03] p-3"><Footprints className="h-4 w-4 text-emerald-400" /><p className="mt-2 text-lg font-bold text-white">{player.assists}</p><p className="text-[11px] text-slate-500">助攻</p></div></div></CardContent></Card>;
}

