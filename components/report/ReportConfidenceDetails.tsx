import { CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceMeter } from "@/components/report/ConfidenceMeter";

function labelFor(value: number) { return value >= 75 ? "高" : value >= 55 ? "中" : "低"; }

export function ReportConfidenceDetails({ value, dataComplete, factors }: { value: number; dataComplete: boolean; factors: string[] }) {
  const level = labelFor(value);
  return <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-[#111827] to-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><ShieldCheck className="h-4 w-4 text-emerald-300" />AI可信度详细解释</CardTitle><p className="text-xs leading-5 text-slate-500">可信度反映数据一致性，不代表比赛结果确定性。</p></CardHeader><CardContent><div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:items-center"><div><p className="text-xs text-slate-500">当前分析可靠度</p><p className="mt-2 text-3xl font-bold text-white">{level}<span className="ml-2 text-sm font-normal text-slate-500">等级</span></p><ConfidenceMeter value={value} /></div><div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4"><div className="flex items-start gap-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" /><p className="text-sm leading-7 text-slate-300">AI 根据球队实力、近期表现、攻防数据和主客场因素综合计算。数据维度越完整、多个指标方向越一致，判断参考价值越高；临场阵容、天气和比赛中的随机变化仍可能改变实际走势。</p></div><ul className="mt-4 grid gap-2 sm:grid-cols-2">{factors.map((factor) => <li key={factor} className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />{factor}</li>)}</ul>{!dataComplete ? <p className="mt-4 text-xs text-amber-300">部分历史数据仍在同步，当前可信度会保守处理。</p> : null}</div></div></CardContent></Card>;
}
