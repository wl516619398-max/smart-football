import { ArrowLeftRight, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MatchDetailData, TeamStat } from "@/types/match";
import { SectionHeader } from "@/components/match/SectionHeader";

const copy = { title: "\u7403\u961f\u6570\u636e\u5bf9\u6bd4", description: "\u7528\u7b80\u6d01\u7684\u53cc\u5411\u5bf9\u6bd4\u6761\u67e5\u770b\u53cc\u65b9\u8fd1\u671f\u6570\u636e\u3002", note: "\u6570\u503c\u8f83\u4f18\u7684\u4e00\u65b9\u4ee5\u989c\u8272\u8f7b\u5fae\u9ad8\u4eae\uff0c\u4e0d\u4ee3\u8868\u5b9e\u9645\u6bd4\u8d5b\u7ed3\u679c\u3002" };

function StatRow({ stat }: { stat: TeamStat }) {
  const homeIsBetter = stat.higherIsBetter ? stat.home >= stat.away : stat.home <= stat.away;
  const awayIsBetter = stat.higherIsBetter ? stat.away > stat.home : stat.away < stat.home;
  const max = Math.max(stat.home, stat.away, 1);
  return <div className="grid grid-cols-[56px_1fr_94px_1fr_56px] items-center gap-2 text-xs sm:grid-cols-[72px_1fr_118px_1fr_72px]"><span className={homeIsBetter ? "text-right font-semibold text-blue-300" : "text-right text-slate-400"}>{stat.home}{stat.unit ?? ""}</span><div className="flex justify-end"><div className="h-2 w-full max-w-[150px] overflow-hidden rounded-full bg-slate-800"><div className="ml-auto h-full rounded-full bg-blue-500/80" style={{ width: Math.max(12, stat.home / max * 100) + "%" }} /></div></div><span className="truncate text-center text-[11px] text-slate-500">{stat.label}</span><div><div className="h-2 w-full max-w-[150px] overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-green-500/70" style={{ width: Math.max(12, stat.away / max * 100) + "%" }} /></div></div><span className={awayIsBetter ? "font-semibold text-green-300" : "text-slate-400"}>{stat.away}{stat.unit ?? ""}</span></div>;
}

export function TeamComparison({ match }: { match: MatchDetailData }) {
  return <section id="comparison" className="scroll-mt-24"><SectionHeader icon={BarChart3} title={copy.title} description={copy.description} /><Card><CardContent className="p-5 sm:p-6"><div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs"><div className="flex items-center justify-end gap-2 font-medium text-blue-300"><span className="hidden sm:inline">{match.home.name}</span><span>{match.home.shortName}</span><span className="h-3 w-3 rounded-full" style={{ backgroundColor: match.home.color }} /></div><ArrowLeftRight className="mx-auto h-4 w-4 text-slate-600" /><div className="flex items-center gap-2 font-medium text-green-300"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: match.away.color }} /><span>{match.away.shortName}</span><span className="hidden sm:inline">{match.away.name}</span></div></div><div className="space-y-4">{match.teamStats.map((stat) => <StatRow key={stat.label} stat={stat} />)}</div><p className="mt-5 text-[11px] text-slate-500">{copy.note}</p></CardContent></Card></section>;
}
