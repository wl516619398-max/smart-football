import { ArrowRight, Gauge, Sparkles, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MatchDetailData, PlayerAnalysis } from "@/types/match";
import { SectionHeader } from "@/components/match/SectionHeader";

const copy = {
  title: "\u5173\u952e\u7403\u5458\u5206\u6790",
  subtitle: "\u57fa\u4e8e\u8fd1 5 \u573a\u8bc4\u5206\u3001\u8fdb\u653b\u53c2\u4e0e\u548c\u9632\u5b88\u5f71\u54cd\u8bc4\u4f30\u672c\u573a\u5173\u952e\u4eba\u7269\u3002",
  form: "\u72b6\u6001\u6307\u6570",
  matchup: "\u5173\u952e\u5bf9\u4f4d",
  matchupText: "\u66fc\u8054\u9700\u8981\u901a\u8fc7 Bruno \u7684\u524d\u573a\u4f20\u7403\u5bfb\u627e\u80c1\u90e8\u7a7a\u95f4\uff0c\u800c\u5229\u7269\u6d66\u4f1a\u4f9d\u9760 Mac Allister \u7684\u79fb\u52a8\u4e0e\u62e6\u622a\u9650\u5236\u5176\u6301\u7403\u8282\u594f\u3002",
};

function PlayerAnalysisCard({ player }: { player: PlayerAnalysis }) {
  return <Card className="h-full border-slate-800/90 bg-[#111827]"><CardContent className="p-4"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-slate-800 text-xs font-semibold text-blue-200 ring-1 ring-blue-400/20">{player.avatar}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="truncate text-sm font-medium text-white">{player.name}</p><p className="mt-1 text-[11px] text-slate-500">{player.team} · {player.position}</p></div><div className="flex items-center gap-1 text-sm font-semibold text-amber-300"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{player.rating}</div></div></div></div><div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-800 py-3">{player.stats.map((stat) => <div key={stat.label}><p className="text-[10px] text-slate-500">{stat.label}</p><p className="mt-1 text-sm font-semibold text-slate-200">{stat.value}</p></div>)}</div><div className="mt-3 flex items-center justify-between"><span className="flex items-center gap-1.5 text-[11px] text-slate-500"><Gauge className="h-3.5 w-3.5 text-blue-400" />{copy.form}</span><span className="text-sm font-semibold text-blue-300">{player.formIndex}</span></div><p className="mt-3 text-xs leading-5 text-slate-400">{player.impact}</p><div className="mt-3 flex gap-2 rounded-lg bg-slate-900/60 p-3 text-[11px] leading-5 text-slate-400"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />{player.note}</div></CardContent></Card>;
}

export function KeyPlayersSection({ match }: { match: MatchDetailData }) {
  return <section id="players" className="scroll-mt-24"><SectionHeader icon={Sparkles} title={copy.title} description={copy.subtitle} /><div className="grid gap-4 sm:grid-cols-2">{match.players.map((player) => <PlayerAnalysisCard key={player.name} player={player} />)}</div><Card className="mt-4 border-blue-500/20 bg-blue-500/5"><CardContent className="p-4 sm:p-5"><div className="flex flex-wrap items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-blue-300"><ArrowRight className="h-4 w-4" /></div><div><p className="text-xs text-blue-300">{copy.matchup}</p><p className="mt-1 text-sm font-semibold text-white">Bruno Fernandes vs Mac Allister</p></div></div><p className="mt-3 text-sm leading-6 text-slate-400">{copy.matchupText}</p></CardContent></Card></section>;
}
