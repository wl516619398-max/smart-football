import { Activity, BrainCircuit, CheckCircle2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PredictionHistorySummary } from "@/lib/history/prediction-history";

export function AccuracyCard({ summary }: { summary: PredictionHistorySummary }) {
  return (
    <Card className="overflow-hidden border-blue-500/20 bg-gradient-to-br from-[#111827] via-[#111d3a] to-[#111827] shadow-lg shadow-blue-950/20">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-blue-300"><BrainCircuit className="h-4 w-4" />ATHENA AI ACCURACY</div>
          <CardTitle className="mt-2 text-xl text-white">Athena AI历史表现</CardTitle>
          <p className="mt-1 text-sm text-slate-400">基于已记录的模型观点与最终赛果统计</p>
        </div>
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-right">
          <p className="text-[10px] text-slate-400">整体命中率</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{summary.hitRate}%</p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="flex items-center gap-2 text-xs text-slate-400"><Activity className="h-4 w-4 text-blue-400" />总预测数量</p>
          <p className="mt-3 text-2xl font-semibold text-white">{summary.totalPredictions}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="h-4 w-4 text-emerald-400" />命中数量</p>
          <p className="mt-3 text-2xl font-semibold text-white">{summary.hitCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="flex items-center gap-2 text-xs text-slate-400"><Target className="h-4 w-4 text-amber-400" />最近30场表现</p>
          <p className="mt-3 text-2xl font-semibold text-amber-300">{summary.recent30.hitRate}%</p>
          <p className="mt-1 text-xs text-slate-500">{summary.recent30.hitCount}/{summary.recent30.total} 场命中</p>
        </div>
      </CardContent>
    </Card>
  );
}
