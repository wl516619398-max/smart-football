import { History, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchAnalysisData } from "@/types/match";

export function HeadToHeadOverview({ homeTeam, awayTeam, data }: { homeTeam: string; awayTeam: string; data: MatchAnalysisData["headToHead"] }) {
  const hasData = data.matches.length > 0;

  return (
    <section className="scroll-mt-24">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-violet-400" />
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-400">HEAD TO HEAD</p>
          <h2 className="mt-1 text-xl font-semibold text-white">历史交锋</h2>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-white">最近 10 次交锋</CardTitle>
          <p className="text-xs text-slate-500">展示双方历史对话中的结果分布</p>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          {hasData ? (
            <>
              <div className="mb-5 grid grid-cols-3 gap-2 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
                <div>
                  <p className="truncate text-[11px] text-slate-500">{homeTeam}</p>
                  <p className="mt-1 text-xl font-semibold text-blue-300">{data.homeWins}</p>
                  <p className="text-[10px] text-slate-600">胜场</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">平局</p>
                  <p className="mt-1 text-xl font-semibold text-slate-200">{data.draws}</p>
                  <p className="text-[10px] text-slate-600">场</p>
                </div>
                <div>
                  <p className="truncate text-[11px] text-slate-500">{awayTeam}</p>
                  <p className="mt-1 text-xl font-semibold text-green-300">{data.awayWins}</p>
                  <p className="text-[10px] text-slate-600">胜场</p>
                </div>
              </div>
              <div className="grid gap-2 lg:grid-cols-[1fr_180px]">
                <div className="space-y-2">
                  {data.matches.map((item, index) => (
                    <div key={`${item.date}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2.5 text-xs">
                      <span className="w-20 shrink-0 text-slate-600">{item.date}</span>
                      <span className="min-w-0 flex-1 truncate text-right text-slate-300">{item.home}</span>
                      <span className="rounded bg-slate-800 px-2.5 py-1 font-semibold text-white">{item.score}</span>
                      <span className="min-w-0 flex-1 truncate text-slate-300">{item.away}</span>
                    </div>
                  ))}
                </div>
                <div className="h-fit rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <p className="mt-3 text-[11px] text-slate-500">最近一次交锋比分</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{data.latestScore}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
              <p className="text-sm font-medium text-slate-300">暂无历史交锋记录</p>
              <p className="mt-2 text-xs text-slate-500">当前数据源未找到双方有效历史交手信息。</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
