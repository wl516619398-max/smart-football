import { BadgeDollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FixtureOdds } from "@/lib/football/odds";
import type { OddsValueOutput } from "@/lib/odds/value-engine";

type OddsValueCardProps = { odds: FixtureOdds; value: OddsValueOutput };

function getAttentionIndex(value: OddsValueOutput) {
  const maxDifference = Math.max(Math.abs(value.value.home), Math.abs(value.value.draw), Math.abs(value.value.away));
  return Math.min(100, Math.max(0, Math.round(50 + maxDifference * 300 + (value.confidence - 50) * 0.35)));
}

function getAttentionMeta(index: number) {
  if (index >= 90) return { label: "强烈关注", stars: 5, explanation: "模型预测与市场数据存在明显偏差，具有较高研究价值。" };
  if (index >= 70) return { label: "值得关注", stars: 4, explanation: "模型预测与市场数据存在一定偏差，具有研究价值。" };
  if (index >= 50) return { label: "保持观察", stars: 3, explanation: "模型与市场数据整体接近，建议结合更多赛事信息观察。" };
  return { label: "低关注", stars: 2, explanation: "当前模型与市场数据未形成明显差异，信息参考价值有限。" };
}

export function OddsValueCard({ odds, value }: OddsValueCardProps) {
  const attentionIndex = getAttentionIndex(value);
  const attention = getAttentionMeta(attentionIndex);
  const rows = [
    { label: "主胜", odd: odds.home.odds, implied: value.impliedProbability.home, difference: value.value.home },
    { label: "平局", odd: odds.draw.odds, implied: value.impliedProbability.draw, difference: value.value.draw },
    { label: "客胜", odd: odds.away.odds, implied: value.impliedProbability.away, difference: value.value.away },
  ];

  return <Card className="border-amber-500/20 bg-gradient-to-br from-[#211d16] to-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><BadgeDollarSign className="h-4 w-4 text-amber-400" />市场数据变化分析</CardTitle><p className="text-xs text-slate-500">市场数据与模型估算概率的差异观察</p></CardHeader><CardContent className="space-y-3">{rows.map((row) => <div key={row.label} className="grid grid-cols-[0.8fr_0.8fr_1fr_1fr] items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-3 text-xs"><span className="font-medium text-slate-200">{row.label}</span><span className="text-slate-400">市场 {row.odd.toFixed(2)}</span><span className="text-slate-400">隐含 {(row.implied * 100).toFixed(1)}%</span><span className={row.difference >= 0 ? "text-emerald-300" : "text-amber-300"}>差异 {(row.difference * 100).toFixed(1)}%</span></div>)}<div className="flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="flex items-center gap-2 text-sm text-slate-300"><TrendingUp className="h-4 w-4 text-amber-400" />AI关注指数</p><p className="mt-1 text-xs text-slate-500">{attention.explanation}</p></div><div className="shrink-0 text-left sm:text-right"><p className="text-2xl tracking-widest text-amber-300" aria-label={`${attention.label} ${attentionIndex}分`}>{"★".repeat(attention.stars)}<span className="text-slate-700">{"★".repeat(5 - attention.stars)}</span></p><p className="mt-1 text-sm font-semibold text-amber-200">{attention.label} · {attentionIndex}</p></div></div></CardContent></Card>;
}
