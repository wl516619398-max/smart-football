import { ArrowUpRight, TrendingUp } from "lucide-react";
import type { OddsTrendData } from "@/types/match";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OddsTrendProps = { odds: OddsTrendData; aiLean?: string };

export function OddsTrend({ odds, aiLean = "偏向主队方向" }: OddsTrendProps) {
  return <Card className="border-white/10 bg-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><TrendingUp className="h-5 w-5 text-emerald-400" />市场数据变化分析</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><p className="text-xs text-slate-500">数据类型</p><p className="mt-2 font-semibold text-white">{odds.market}</p></div><div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><p className="text-xs text-slate-500">初始记录</p><p className="mt-2 font-semibold text-slate-200">{odds.initial}</p></div><div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4"><p className="text-xs text-slate-500">当前记录</p><p className="mt-2 flex items-center gap-1 font-semibold text-emerald-300">{odds.current}<ArrowUpRight className="h-4 w-4" /></p></div><div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4"><p className="text-xs text-slate-500">模型观点</p><p className="mt-2 font-semibold text-blue-200">{aiLean}</p></div></div><div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">变化：<span className="font-semibold">↑ {odds.trend}</span></div></CardContent></Card>;
}
