import { CalendarX2 } from "lucide-react";

export function EmptyState({ title = "暂无可分析赛事", description = "稍后回来查看。" }: { title?: string; description?: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-[#111827]/60 px-6 py-10 text-center">
      <CalendarX2 className="h-8 w-8 text-slate-600" />
      <p className="mt-3 text-sm font-medium text-slate-300">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}
