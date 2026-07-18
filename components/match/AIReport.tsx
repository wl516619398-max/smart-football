import { BrainCircuit, CheckCircle2, ShieldAlert } from "lucide-react";
import type { CommercialMatchData } from "@/types/match";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AIReportProps = { report: CommercialMatchData["report"]; recommendation?: string };

export function AIReport({ report, recommendation = "结合概率与盘口，优先关注主胜方向。" }: AIReportProps) {
  return <Card className="border-blue-500/25 bg-gradient-to-br from-[#111d3a] to-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><BrainCircuit className="h-5 w-5 text-blue-400" />Athena 深度分析</CardTitle><p className="text-xs text-slate-500">基于球队状态、攻击效率、防守稳定性与盘口变化生成</p></CardHeader><CardContent className="space-y-5"><div><p className="text-xs font-medium text-blue-300">AI报告</p><p className="mt-2 text-sm leading-7 text-slate-300">{report.summary}</p></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4"><p className="text-[11px] text-slate-500">比赛倾向</p><p className="mt-2 text-lg font-semibold text-blue-200">{report.lean}</p></div><div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4"><p className="flex items-center gap-1.5 text-[11px] text-slate-500"><ShieldAlert className="h-3.5 w-3.5 text-amber-400" />风险提醒</p><p className="mt-2 text-sm font-medium leading-6 text-amber-200">{report.risk}</p></div><div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4"><p className="flex items-center gap-1.5 text-[11px] text-slate-500"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />推荐策略</p><p className="mt-2 text-sm font-medium leading-6 text-emerald-200">{recommendation}</p></div></div></CardContent></Card>;
}
