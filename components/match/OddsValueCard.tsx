import { BadgeDollarSign, Info, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
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

function clampProbability(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getJudgment(difference: number, label: string) {
  if (difference >= 0.05) return label === "客胜" ? "客队存在低估可能" : "模型倾向高于市场";
  if (difference <= -0.05) return "市场热度偏高";
  return "双方接近";
}

function TooltipLabel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <span className="inline-flex items-center gap-1" title={title}>
      {children}
      <Info className="h-3 w-3 text-slate-600" aria-hidden="true" />
    </span>
  );
}

export function OddsValueCard({ odds, value }: OddsValueCardProps) {
  const attentionIndex = getAttentionIndex(value);
  const attention = getAttentionMeta(attentionIndex);
  const rows = [
    { label: "主胜", odds: odds.home.odds, market: value.impliedProbability.home, difference: value.value.home },
    { label: "平局", odds: odds.draw.odds, market: value.impliedProbability.draw, difference: value.value.draw },
    { label: "客胜", odds: odds.away.odds, market: value.impliedProbability.away, difference: value.value.away },
  ];

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-[#211d16] to-[#111827]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <BadgeDollarSign className="h-4 w-4 text-amber-400" />
          赔率价值分析
        </CardTitle>
        <p className="text-xs text-slate-500">用更直观的方式对比市场倾向与 Athena 模型估算。</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => {
          const modelProbability = clampProbability(row.market + row.difference);
          return (
            <div key={row.label} className="grid gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-3 text-xs sm:grid-cols-[64px_repeat(3,minmax(0,1fr))] sm:items-center">
              <span className="font-medium text-slate-200">{row.label}</span>
              <div className="text-slate-400">
                <p className="text-slate-500">当前赔率</p>
                <p className="mt-1 font-semibold text-slate-200">{row.odds.toFixed(2)}</p>
              </div>
              <div className="text-slate-400">
                <p className="text-slate-500"><TooltipLabel title="市场预测：根据赔率换算出的市场倾向">市场预测</TooltipLabel></p>
                <p className="mt-1 font-semibold text-slate-200">{(row.market * 100).toFixed(1)}%</p>
              </div>
              <div className="text-slate-400">
                <p className="text-slate-500"><TooltipLabel title="AI模型预测：Athena模型综合球队数据后的预测">AI模型预测</TooltipLabel></p>
                <p className="mt-1 font-semibold text-blue-200">{(modelProbability * 100).toFixed(1)}%</p>
                <p className="mt-2 text-slate-500"><TooltipLabel title="AI判断：两者之间的差异说明">AI判断</TooltipLabel></p>
                <p className={`mt-1 ${row.difference >= 0.05 ? "text-emerald-300" : row.difference <= -0.05 ? "text-amber-300" : "text-slate-400"}`}>
                  {getJudgment(row.difference, row.label)}
                </p>
              </div>
            </div>
          );
        })}

        <div className="flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm text-slate-300">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              AI关注指数
            </p>
            <p className="mt-1 text-xs text-slate-500">{attention.explanation}</p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-2xl tracking-widest text-amber-300" aria-label={`${attention.label} ${attentionIndex}分`}>
              {"★".repeat(attention.stars)}<span className="text-slate-700">{"★".repeat(5 - attention.stars)}</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-amber-200">{attention.label} · {attentionIndex}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
