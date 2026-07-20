import { BadgeDollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FixtureOdds } from "@/lib/football/odds";
import type { OddsValueOutput } from "@/lib/odds/value-engine";

type OddsValueCardProps = {
  odds: FixtureOdds;
  value: OddsValueOutput;
};

function valueLevel(recommendation: string) {
  if (recommendation.startsWith("高价值")) return { label: "高价值", tone: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" };
  if (recommendation.startsWith("低价值")) return { label: "低价值", tone: "text-amber-300 bg-amber-500/10 border-amber-500/20" };
  return { label: "正常", tone: "text-slate-300 bg-slate-900/60 border-slate-700" };
}

export function OddsValueCard({ odds, value }: OddsValueCardProps) {
  const level = valueLevel(value.recommendation);
  const rows = [
    { label: "主胜", odd: odds.home.odds, implied: value.impliedProbability.home, value: value.value.home },
    { label: "平局", odd: odds.draw.odds, implied: value.impliedProbability.draw, value: value.value.draw },
    { label: "客胜", odd: odds.away.odds, implied: value.impliedProbability.away, value: value.value.away },
  ];

  return <Card className="border-amber-500/20 bg-gradient-to-br from-[#211d16] to-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><BadgeDollarSign className="h-4 w-4 text-amber-400" />赔率价值分析</CardTitle><p className="text-xs text-slate-500">市场赔率与模型估算的差值观察</p></CardHeader><CardContent className="space-y-3">{rows.map((row) => <div key={row.label} className="grid grid-cols-[0.8fr_0.8fr_1fr_1fr] items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-3 text-xs"><span className="font-medium text-slate-200">{row.label}</span><span className="text-slate-400">赔率 {row.odd.toFixed(2)}</span><span className="text-slate-400">隐含 {(row.implied * 100).toFixed(1)}%</span><span className={row.value >= 0 ? "text-emerald-300" : "text-amber-300"}>Value {(row.value * 100).toFixed(1)}%</span></div>)}<div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4"><p className="flex items-center gap-2 text-sm text-slate-300"><TrendingUp className="h-4 w-4 text-amber-400" />模型概率与市场数据对比</p><span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${level.tone}`}>价值等级：{level.label}</span></div></CardContent></Card>;
}
