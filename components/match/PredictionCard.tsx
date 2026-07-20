import { Activity, BrainCircuit, ShieldAlert, Target } from "lucide-react";
import type { MatchDetailData } from "@/types/match";
import type { Prediction } from "@/types/prediction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PredictionCardProps = { match: MatchDetailData; prediction: Prediction };

export function PredictionCard({ match, prediction }: PredictionCardProps) {
  const probabilities = [
    { label: "主胜", value: prediction.homeWinProbability, color: "bg-blue-500" },
    { label: "平局", value: prediction.drawProbability, color: "bg-amber-500" },
    { label: "客胜", value: prediction.awayWinProbability, color: "bg-violet-500" },
  ];

  return <Card className="border-blue-500/30 bg-gradient-to-br from-blue-950/70 via-[#111827] to-[#111827] shadow-xl shadow-blue-950/20">
    <CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle className="flex items-center gap-2 text-base text-white"><BrainCircuit className="h-5 w-5 text-blue-400" />Athena 预测</CardTitle><span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">Athena Score {prediction.athenaScore}</span></CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center sm:gap-6"><div><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-sm font-bold text-red-300">{match.home.shortName}</div><p className="mt-2 text-sm font-semibold text-white">{match.home.name}</p></div><div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">模型观点</p><p className="mt-1 text-lg font-semibold text-blue-300">{prediction.recommendation}</p></div><div><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-sm font-bold text-red-300">{match.away.shortName}</div><p className="mt-2 text-sm font-semibold text-white">{match.away.name}</p></div></div>
      <div className="grid gap-3 sm:grid-cols-3">{probabilities.map((item) => <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-400">{item.label}</span><span className="font-bold text-white">{item.value}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`${item.color} h-full rounded-full`} style={{ width: `${item.value}%` }} /></div></div>)}</div>
      <div className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2"><div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3"><p className="flex items-center gap-2 text-xs text-slate-500"><Activity className="h-4 w-4 text-emerald-400" />模型一致性</p><p className="mt-2 text-xl font-semibold text-emerald-300">{prediction.athenaScore}%</p></div><div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3"><p className="flex items-center gap-2 text-xs text-slate-500"><ShieldAlert className="h-4 w-4 text-amber-400" />数据不确定性等级</p><p className="mt-2 text-xl font-semibold text-amber-200">{prediction.riskLevel}</p></div></div>
      <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-4"><p className="flex items-center gap-2 text-xs text-slate-500"><Target className="h-4 w-4 text-blue-400" />关键影响因素</p><ul className="mt-3 grid gap-2 text-xs leading-5 text-slate-300 sm:grid-cols-2">{prediction.factors.map((factor) => <li key={factor}>· {factor}</li>)}</ul></div>
    </CardContent>
  </Card>;
}
