import { AlertTriangle, BarChart3, Goal, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchPrediction, PredictionTeamStats } from "@/lib/prediction/types";

type MatchResearchInsightsProps = { homeTeam: string; awayTeam: string; homeStats: PredictionTeamStats; awayStats: PredictionTeamStats; prediction: MatchPrediction };

function normalize(values: number[]) {
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  return values.map((value) => Math.round((value / total) * 100));
}

function ProbabilityList({ items }: { items: { label: string; value: number; tone: string }[] }) {
  return <div className="space-y-3">{items.map((item) => <div key={item.label}><div className="mb-1 flex items-center justify-between text-xs"><span className="text-slate-400">{item.label}</span><span className={`font-semibold ${item.tone}`}>{item.value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${item.tone.replace("text-", "bg-")}`} style={{ width: `${item.value}%` }} /></div></div>)}</div>;
}

export function MatchResearchInsights({ homeTeam, awayTeam, homeStats, awayStats, prediction }: MatchResearchInsightsProps) {
  const half = normalize([prediction.homeWin * 0.72 + 8, prediction.draw * 1.18 + 8, prediction.awayWin * 0.72 + 8]);
  const halfScores = normalize([homeStats.attack + homeStats.form, homeStats.attack * 0.7 + awayStats.defense * 0.45, homeStats.form + awayStats.form, awayStats.attack * 0.7 + homeStats.defense * 0.45]);
  const totalGoals = prediction.expectedGoals.home + prediction.expectedGoals.away;
  const goalTrend = normalize([Math.max(10, 42 - totalGoals * 9), 35 + totalGoals * 8, Math.max(8, totalGoals * 6)]);
  const primaryScore = `${Math.round(prediction.expectedGoals.home)}-${Math.round(prediction.expectedGoals.away)}`;
  const alternatives = Array.from(new Set(["1-1", prediction.homeWin >= prediction.awayWin ? "2-1" : "1-2", "1-0"].filter((score) => score !== primaryScore))).slice(0, 2);
  const risks = [
    Math.abs(homeStats.form - awayStats.form) > 18 ? "双方近期状态存在波动，比赛走势可能变化" : "双方近期状态差距有限，走势仍有不确定性",
    Math.min(homeStats.defense, awayStats.defense) < 60 ? "至少一方防守稳定性偏弱" : "防守数据需要结合临场阵容进一步确认",
    "当前数据样本和临场信息有限",
  ];

  return <section className="grid gap-6 lg:grid-cols-2"><Card className="border-blue-500/20 bg-gradient-to-br from-[#111d3a] to-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><Timer className="h-4 w-4 text-blue-400" />半场预测</CardTitle><p className="text-xs text-slate-500">基于全场模型概率与攻防状态的阶段性估算</p></CardHeader><CardContent className="space-y-6"><div><p className="mb-3 text-xs font-medium text-slate-300">上半场胜平负概率</p><ProbabilityList items={[{ label: `${homeTeam}方向`, value: half[0], tone: "text-blue-300" }, { label: "平局", value: half[1], tone: "text-slate-200" }, { label: `${awayTeam}方向`, value: half[2], tone: "text-emerald-300" }]} /></div><div className="border-t border-slate-800 pt-5"><p className="mb-3 text-xs font-medium text-slate-300">半场比分预测</p><div className="grid grid-cols-2 gap-2">{["0-0", "1-0", "1-1", "0-1"].map((score, index) => <div key={score} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm"><span className="text-slate-300">{score}</span><span className="font-semibold text-blue-300">{halfScores[index]}%</span></div>)}</div></div></CardContent></Card><Card className="border-violet-500/20 bg-gradient-to-br from-[#16152f] to-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><Goal className="h-4 w-4 text-violet-400" />比分与进球趋势</CardTitle><p className="text-xs text-slate-500">AI模拟结果，仅作为赛事信息参考</p></CardHeader><CardContent className="space-y-5"><div><p className="text-xs text-slate-500">全场比分预测</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-lg font-bold text-blue-200">{primaryScore}</span><span className="text-xs text-slate-500">备选</span>{alternatives.map((score) => <span key={score} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">{score}</span>)}</div></div><div className="border-t border-slate-800 pt-5"><p className="mb-3 text-xs font-medium text-slate-300">总进球趋势</p><ProbabilityList items={[{ label: "0-1球", value: goalTrend[0], tone: "text-slate-200" }, { label: "2-3球", value: goalTrend[1], tone: "text-blue-300" }, { label: "4球以上", value: goalTrend[2], tone: "text-amber-300" }]} /></div></CardContent></Card><Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-[#111827] lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><AlertTriangle className="h-4 w-4 text-amber-400" />风险提示</CardTitle></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-3">{risks.map((risk) => <div key={risk} className="flex gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 p-3 text-sm leading-6 text-amber-100/80"><BarChart3 className="mt-1 h-4 w-4 shrink-0 text-amber-400" />{risk}</div>)}</div></CardContent></Card></section>;
}
