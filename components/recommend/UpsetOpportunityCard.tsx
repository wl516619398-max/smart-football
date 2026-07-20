import Link from "next/link";
import { ArrowRight, Siren } from "lucide-react";
import type { UpsetAnalysis } from "@/lib/ai/upset-engine";
import type { FeaturedMatch } from "@/types/match";
import { Card } from "@/components/ui/card";

export function UpsetOpportunityCard({ match, analysis }: { match: FeaturedMatch; analysis: UpsetAnalysis }) {
  return <Card className="border-red-500/20 bg-gradient-to-br from-red-950/25 to-[#111827] p-4"><div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-medium text-red-300"><Siren className="h-3.5 w-3.5" />非主流结果概率</p><h3 className="mt-2 text-sm font-semibold text-white">{match.homeTeam.name} vs {match.awayTeam.name}</h3><p className="mt-1 text-xs text-slate-500">模型关注：{analysis.underdog} 可能改变比赛走势</p></div><span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-300">{analysis.upsetProbability}%</span></div><p className="mt-3 text-xs leading-5 text-slate-400">{analysis.reason}</p><Link href={`/matches/${match.id}`} className="mt-3 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">查看完整分析 <ArrowRight className="h-3 w-3" /></Link></Card>;
}
