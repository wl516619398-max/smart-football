import { BrainCircuit, CheckCircle2, ShieldAlert, Target } from "lucide-react";
import type { FootballAnalysisResult } from "@/lib/ai/football-analyzer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { decodeUnicode } from "@/lib/utils/decode-unicode";

type FootballExpertAnalysisCardProps = { analysis: FootballAnalysisResult };

export function FootballExpertAnalysisCard({ analysis }: FootballExpertAnalysisCardProps) {
  const displayAnalysis = {
    ...analysis,
    analysis: analysis.analysis.map((item) => decodeUnicode(item)),
    recommendation: {
      safe: decodeUnicode(analysis.recommendation.safe),
      risk: decodeUnicode(analysis.recommendation.risk),
      goals: decodeUnicode(analysis.recommendation.goals),
    },
    predictedScores: analysis.predictedScores.map((score) => decodeUnicode(score)),
  };

  return <Card className="border-violet-500/20 bg-gradient-to-br from-[#16152f] via-[#111827] to-[#111827] shadow-xl shadow-violet-950/20"><CardHeader><div className="flex items-center gap-2 text-xs font-medium text-violet-300"><BrainCircuit className="h-4 w-4" />ATHENA AI EXPERT ANALYSIS</div><CardTitle className="mt-2 text-xl text-white">Athena AI专家分析</CardTitle><p className="text-sm text-slate-400">基于球队状态、攻防指标与预测引擎结果生成</p></CardHeader><CardContent className="space-y-5"><div className="rounded-xl border border-violet-500/15 bg-violet-500/5 p-4"><p className="flex items-center gap-2 text-xs font-medium text-violet-200"><CheckCircle2 className="h-4 w-4" />AI分析</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">{displayAnalysis.analysis.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />{item}</li>)}</ul></div><div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="flex items-center gap-2 text-xs text-emerald-200"><CheckCircle2 className="h-4 w-4" />稳健方向</p><p className="mt-3 text-sm leading-6 text-slate-300">{displayAnalysis.recommendation.safe}</p></div><div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"><p className="flex items-center gap-2 text-xs text-amber-200"><ShieldAlert className="h-4 w-4" />关注风险</p><p className="mt-3 text-sm leading-6 text-slate-300">{displayAnalysis.recommendation.risk}</p></div><div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4"><p className="flex items-center gap-2 text-xs text-blue-200"><Target className="h-4 w-4" />进球方向</p><p className="mt-3 text-sm leading-6 text-slate-300">{displayAnalysis.recommendation.goals}</p></div></div><div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5"><span className="text-xs text-slate-500">预测比分</span>{displayAnalysis.predictedScores.map((score) => <span key={score} className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-sm font-semibold text-blue-200">{score}</span>)}<span className="ml-auto rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">AI判断可信度 {displayAnalysis.confidence}%</span></div></CardContent></Card>;
}
