import { ShieldAlert } from "lucide-react";

export const ATHENA_DISCLAIMER = "本工具提供足球赛事数据分析、概率模型预测及趋势参考，不构成任何投注建议。";

export function Disclaimer({ className = "" }: { className?: string }) {
  return <div className={`flex gap-3 rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-xs leading-5 text-slate-500 ${className}`}><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><p>{ATHENA_DISCLAIMER} 足球比赛存在随机性，请理性参考。</p></div>;
}
