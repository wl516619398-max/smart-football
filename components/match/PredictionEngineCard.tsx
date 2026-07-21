import { BrainCircuit, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchPrediction } from "@/lib/prediction/types";

type PredictionEngineCardProps = {
  homeTeam: string;
  awayTeam: string;
  prediction: MatchPrediction;
  dataAvailable?: boolean;
};

const probabilityItems = [
  { key: "homeWin", label: "主胜", tone: "text-blue-300", bar: "bg-blue-500" },
  { key: "draw", label: "平局", tone: "text-slate-200", bar: "bg-slate-400" },
  { key: "awayWin", label: "客胜", tone: "text-emerald-300", bar: "bg-emerald-500" },
] as const;

export function PredictionEngineCard({ homeTeam, awayTeam, prediction, dataAvailable = true }: PredictionEngineCardProps) {
  return (
    <Card className="border-blue-500/25 bg-gradient-to-br from-[#111d3a] via-[#111827] to-[#111827] shadow-xl shadow-blue-950/20">
      <CardHeader>
        <div className="flex items-center gap-2 text-xs font-medium text-blue-300"><BrainCircuit className="h-4 w-4" />ATHENA PREDICTION ENGINE</div>
        <CardTitle className="mt-2 text-xl text-white">Athena 预测引擎</CardTitle>
        <p className="text-sm text-slate-400">{homeTeam} <span className="px-2 text-slate-600">VS</span> {awayTeam}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {probabilityItems.map((item) => {
            const value = prediction[item.key];
            return (
              <div key={item.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-2"><span className="text-xs text-slate-400">{item.label}</span><span className={`text-2xl font-bold ${item.tone}`}>{value}%</span></div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${item.bar}`} style={{ width: `${value}%` }} /></div>
              </div>
            );
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-xs text-slate-500">模型预测比分</p>
            {dataAvailable ? <><p className="mt-2 text-3xl font-bold text-white">{Math.round(prediction.expectedGoals.home)}-{Math.round(prediction.expectedGoals.away)}</p><p className="mt-1 text-xs text-slate-500">预计进球 {prediction.expectedGoals.home.toFixed(2)} : {prediction.expectedGoals.away.toFixed(2)}</p></> : <p className="mt-3 text-sm text-slate-500">数据同步中</p>}
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-xs text-slate-500">AI判断可信度</p>
            {dataAvailable ? <><p className="mt-2 text-3xl font-bold text-emerald-300">{prediction.confidence}%</p><p className="mt-1 text-xs text-slate-500">AI根据球队实力、近期表现、攻防数据综合计算，数据越完整，判断越可靠。</p></> : <p className="mt-3 text-sm text-slate-500">数据同步中</p>}
          </div>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"><p className="flex items-center gap-2 text-xs text-amber-200"><Sparkles className="h-4 w-4" />AI模型倾向</p><div className="mt-3 flex flex-wrap gap-2">{prediction.recommendation.map((item) => <span key={item} className="rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-1.5 text-xs text-slate-200">{item}</span>)}</div></div>
        <p className="text-xs leading-5 text-slate-500">AI模型分析结果，仅作为赛事信息参考，不代表比赛结果</p>
      </CardContent>
    </Card>
  );
}
