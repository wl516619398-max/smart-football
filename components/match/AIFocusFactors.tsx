import { BrainCircuit, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchFocusFactor } from "@/types/match";
import { decodeUnicode } from "@/lib/utils/decode-unicode";

const toneStyles = { blue: "border-blue-500/20 bg-blue-500/5 text-blue-200", green: "border-emerald-500/20 bg-emerald-500/5 text-emerald-200", amber: "border-amber-500/20 bg-amber-500/5 text-amber-200", violet: "border-violet-500/20 bg-violet-500/5 text-violet-200" };

export function AIFocusFactors({ factors }: { factors: MatchFocusFactor[] }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><BrainCircuit className="h-5 w-5 text-cyan-400" />AI关注因素</CardTitle><p className="text-xs text-slate-500">模型综合参考的关键数据维度</p></CardHeader><CardContent className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">{factors.map((factor) => { const label = decodeUnicode(factor.label); const value = decodeUnicode(factor.value); return <div key={label} className={`rounded-xl border p-4 ${toneStyles[factor.tone]}`}><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-xs font-medium"><Tag className="h-3.5 w-3.5" />{label}</span><span className="text-[11px] opacity-80">{value}</span></div></div>; })}</CardContent></Card>;
}
