import { Activity, BrainCircuit, Target } from "lucide-react";
import type { CommercialMatchData, MatchDetailData } from "@/types/match";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PredictionCardProps = { match: MatchDetailData; prediction: CommercialMatchData["prediction"] };

export function PredictionCard({ match, prediction }: PredictionCardProps) {
  const probabilities = [
    { label: "主胜", value: prediction.homeWin, color: "bg-blue-500" },
    { label: "平局", value: prediction.draw, color: "bg-amber-500" },
    { label: "客胜", value: prediction.awayWin, color: "bg-violet-500" },
  ];

  return (
    <Card className="border-blue-500/30 bg-gradient-to-br from-blue-950/70 via-[#111827] to-[#111827] shadow-xl shadow-blue-950/20">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-base text-white"><BrainCircuit className="h-5 w-5 text-blue-400" />Athena AI预测</CardTitle>
        <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">AI信心 {prediction.confidence}%</span>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center sm:gap-6">
          <div><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-sm font-bold text-red-300">{match.home.shortName}</div><p className="mt-2 text-sm font-semibold text-white">{match.home.name}</p></div>
          <div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">预测比分</p><p className="mt-1 text-4xl font-black tracking-tight text-white">{prediction.score}</p></div>
          <div><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-sm font-bold text-red-300">{match.away.shortName}</div><p className="mt-2 text-sm font-semibold text-white">{match.away.name}</p></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {probabilities.map((item) => <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-400">{item.label}</span><span className="font-bold text-white">{item.value}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`${item.color} h-full rounded-full`} style={{ width: `${item.value}%` }} /></div></div>)}
        </div>
        <div className="flex items-center justify-center gap-2 border-t border-white/10 pt-4 text-sm text-slate-400"><Target className="h-4 w-4 text-emerald-400" />综合模型倾向：<span className="font-semibold text-emerald-300">主胜</span><Activity className="ml-2 h-4 w-4 text-blue-400" />实时模型评分</div>
      </CardContent>
    </Card>
  );
}

