import { ShieldAlert } from "lucide-react";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <div className={`flex gap-3 rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-xs leading-5 text-slate-500 ${className}`}>
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <p>Athena AI 提供数据分析、概率模型和风险评估，不保证比赛结果。足球比赛存在随机性，请理性参考。</p>
    </div>
  );
}
