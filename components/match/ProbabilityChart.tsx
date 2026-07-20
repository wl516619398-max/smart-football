import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchPrediction } from "@/lib/prediction/types";

export function ProbabilityChart({ prediction }: { prediction: MatchPrediction }) {
  const items = [{ label: "主胜概率", value: prediction.homeWin, color: "bg-blue-500", text: "text-blue-300" }, { label: "平局概率", value: prediction.draw, color: "bg-slate-400", text: "text-slate-200" }, { label: "客胜概率", value: prediction.awayWin, color: "bg-emerald-500", text: "text-emerald-300" }];
  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><BarChart3 className="h-4 w-4 text-blue-400" />胜平负概率</CardTitle></CardHeader><CardContent className="space-y-5">{items.map((item) => <div key={item.label}><div className="mb-2 flex items-center justify-between text-xs"><span className="text-slate-400">{item.label}</span><span className={`text-lg font-bold ${item.text}`}>{item.value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} /></div></div>)}<p className="border-t border-slate-800 pt-4 text-xs leading-5 text-slate-500">AI模型分析结果，仅作为赛事信息参考，不代表比赛结果</p></CardContent></Card>;
}
