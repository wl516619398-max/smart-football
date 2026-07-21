import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UpsetRiskProps = { riskLevel: number; riskReason: string };

export function UpsetRisk({ riskLevel, riskReason }: UpsetRiskProps) {
  const stars = Math.min(5, Math.max(1, Math.ceil(riskLevel / 15)));
  const riskLabel = riskLevel >= 65 ? "高不确定性" : riskLevel >= 40 ? "中等不确定性" : "低不确定性";

  return <Card className="border-amber-500/25 bg-gradient-to-br from-amber-950/25 to-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><ShieldAlert className="h-5 w-5 text-amber-400" />非主流结果概率分析</CardTitle></CardHeader><CardContent><div className="flex items-end justify-between gap-4"><div><p className="text-xs text-slate-500">非主流结果概率</p><p className="mt-1 text-4xl font-black text-amber-300">{riskLevel}%</p></div><div className="text-right"><p className="text-xs text-slate-500">分析可靠度</p><p className="mt-1 text-lg tracking-widest" aria-label={riskLabel}>{"★".repeat(stars)}<span className="text-slate-700">{"☆".repeat(5 - stars)}</span></p><p className="mt-1 text-xs font-medium text-amber-200">{riskLabel}</p><p className="mt-2 max-w-44 text-xs leading-5 text-slate-500">数据越完整，分析参考价值越高。</p></div></div><div className="mt-5 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4"><p className="text-xs text-slate-500">模型观察</p><p className="mt-2 text-sm leading-6 text-amber-100/80">{riskReason}</p></div><p className="mt-4 text-[11px] text-slate-600">数据来自 Athena AI 风险模型</p></CardContent></Card>;
}
