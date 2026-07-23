import { AlertTriangle, BrainCircuit, CheckCircle2, RefreshCw } from "lucide-react";
import { decodeUnicode } from "@/lib/utils/decode-unicode";

export type MatchAIAnalysis = {
  summary: string;
  recommendation: string;
  confidence: string;
  reasons: string[];
  risks: string[];
  goalsPrediction: string;
  betDirection: string;
  scorePrediction?: string[];
  halfTimePrediction?: { homeWin: string; draw: string; awayWin: string };
};

type AIAnalysisCardProps = {
  analysis: MatchAIAnalysis | null;
  prediction?: { homeWin: number; draw: number; awayWin: number };
  loading: boolean;
  error: string;
  onRetry: () => void;
};

function Probability({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><div className="flex items-center justify-between text-sm"><span className="text-slate-300">{label}</span><strong className="text-white">{value}%</strong></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>;
}

function ListBlock({ title, items, tone }: { title: string; items: string[]; tone: "green" | "amber" }) {
  const styles = tone === "green" ? "border-emerald-500/15 bg-emerald-500/5" : "border-amber-500/15 bg-amber-500/5";
  return <div className={`rounded-xl border p-5 ${styles}`}><h3 className="flex items-center gap-2 text-sm font-semibold text-white">{tone === "green" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}{title}</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">{items.length ? items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />{decodeUnicode(item)}</li>) : <li className="text-slate-500">暂无内容</li>}</ul></div>;
}

export default function AIAnalysisCard({ analysis, prediction, loading, error, onRetry }: AIAnalysisCardProps) {
  return <section className="rounded-2xl border border-violet-500/20 bg-[#111827] p-5 sm:p-6">
    <div className="flex items-center gap-3"><div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-300"><BrainCircuit className="h-5 w-5" /></div><div><p className="text-xs text-violet-300">ATHENA AI</p><h2 className="text-xl font-semibold text-white">赛事分析</h2></div></div>
    {loading && <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/30 p-5 text-sm text-slate-400">AI分析生成中，请稍候。</div>}
    {!loading && error && <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5"><p className="text-sm text-amber-200">{error}</p><button type="button" onClick={onRetry} className="mt-4 inline-flex items-center rounded-lg border border-amber-400/30 px-3 py-2 text-sm text-amber-200 transition-colors hover:bg-amber-400/10"><RefreshCw className="mr-2 h-3.5 w-3.5" />重新生成</button></div>}
    {!loading && !error && analysis && <div className="mt-6 space-y-5">
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5"><h3 className="text-sm font-semibold text-white">Athena AI 综合观点</h3><p className="mt-3 text-sm leading-7 text-slate-300">{decodeUnicode(analysis.summary)}</p></div>
      {prediction && <section><h3 className="mb-3 text-sm font-semibold text-white">胜平负</h3><div className="grid gap-3 sm:grid-cols-3"><Probability label="主胜" value={prediction.homeWin} color="bg-blue-500" /><Probability label="平局" value={prediction.draw} color="bg-slate-400" /><Probability label="客胜" value={prediction.awayWin} color="bg-emerald-500" /></div></section>}
      <section><h3 className="mb-3 text-sm font-semibold text-white">半场</h3>{analysis.halfTimePrediction ? <div className="grid gap-3 sm:grid-cols-3"><Probability label="半场主胜" value={Number.parseFloat(analysis.halfTimePrediction.homeWin) || 0} color="bg-blue-500" /><Probability label="半场平局" value={Number.parseFloat(analysis.halfTimePrediction.draw) || 0} color="bg-slate-400" /><Probability label="半场客胜" value={Number.parseFloat(analysis.halfTimePrediction.awayWin) || 0} color="bg-emerald-500" /></div> : <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-500">当前分析结果未提供半场概率数据，暂不补充推测。</div>}</section>
      <section><h3 className="mb-3 text-sm font-semibold text-white">进球与比分</h3><div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5"><p className="text-sm leading-6 text-slate-300">{decodeUnicode(analysis.goalsPrediction)}</p>{analysis.scorePrediction?.length ? <div className="mt-4 flex flex-wrap gap-2">{analysis.scorePrediction.map((score, index) => <span key={`${score}-${index}`} className="rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1.5 text-sm font-semibold text-violet-200">{decodeUnicode(score)}</span>)}</div> : null}</div></section>
      <div className="grid gap-4 sm:grid-cols-2"><ListBlock title="胜负分析依据" items={analysis.reasons} tone="green" /><ListBlock title="风险提示" items={analysis.risks} tone="amber" /></div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4 text-sm leading-6 text-slate-300"><span className="font-semibold text-white">模型观点：</span>{decodeUnicode(analysis.recommendation)}<p className="mt-3 text-xs text-slate-500">模型参考，不构成投注建议。足球比赛存在不确定性，请理性看待。</p></div>
    </div>}
  </section>;
}
