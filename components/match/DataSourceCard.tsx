import { Clock3, Database, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMatchDateTime } from "@/lib/football/date-format";

export function DataSourceCard({ generatedAt }: { generatedAt: string }) {
  return <Card className="border-slate-800 bg-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><Database className="h-4 w-4 text-blue-400" />数据说明</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm sm:grid-cols-3"><div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"><p className="flex items-center gap-2 text-xs text-slate-500"><span>⚽</span>比赛数据</p><p className="mt-2 font-medium text-slate-200">Football API</p></div><div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"><p className="flex items-center gap-2 text-xs text-slate-500"><Sparkles className="h-3.5 w-3.5" />AI分析</p><p className="mt-2 font-medium text-slate-200">Athena Prediction Engine</p></div><div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"><p className="flex items-center gap-2 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" />更新时间</p><p className="mt-2 font-medium text-slate-200">{formatMatchDateTime(generatedAt).label}</p></div></CardContent></Card>;
}
