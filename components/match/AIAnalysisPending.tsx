import { Clock3, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AIAnalysisPending() {
  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-[#111d3a] to-[#111827]">
      <CardContent className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-300">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-semibold text-white">AI分析将在赛前生成</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          后台正在整理球队状态、历史交锋和比赛数据，分析生成后会自动显示。
        </p>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-600">
          <Clock3 className="h-3.5 w-3.5" /> 当前仅展示已生成的赛前分析
        </p>
      </CardContent>
    </Card>
  );
}
