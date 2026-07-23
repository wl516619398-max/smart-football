import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, Clock3, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPredictionHistory, summarizePredictionHistory, type PredictionHistoryRecord } from "@/lib/history/prediction-history";
import { decodeUnicode } from "@/lib/utils/decode-unicode";

export const metadata: Metadata = {
  title: "历史分析 | Project Athena",
  description: "查看 Project Athena 已生成的赛事分析与复盘记录。",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return decodeUnicode("\\u65f6\\u95f4\\u5f85\\u5b9a");
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

function resultLabel(record: PredictionHistoryRecord) {
  const normalized = (record.final_result ?? record.actual_result ?? "").trim().toLowerCase();
  if (record.prediction_hit === true || ["hit", "correct", "win", "命中", "正确"].includes(normalized)) return { label: "已命中", tone: "text-emerald-300", icon: CheckCircle2 };
  if (record.prediction_hit === false || ["miss", "loss", "wrong"].includes(normalized)) return { label: "未命中", tone: "text-slate-400", icon: CheckCircle2 };
  return { label: "待结果", tone: "text-amber-300", icon: Clock3 };
}

function percentage(value: number | null) {
  return value === null ? "—" : `${Math.round(value)}%`;
}

export default async function HistoryPage() {
  const records = await getPredictionHistory(50);
  const summary = summarizePredictionHistory(records);
  const stats = [
    { label: "总分析场次", value: summary.totalPredictions, suffix: "场", tone: "text-white" },
    { label: "胜负方向命中率", value: summary.directionHitRate, suffix: "%", tone: "text-blue-300" },
    { label: "进球预测命中率", value: summary.goalsHitRate, suffix: "%", tone: "text-amber-300" },
    { label: "比分TOP3命中率", value: summary.scoreTop3HitRate, suffix: "%", tone: "text-emerald-300" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" />返回首页</Link>
      <div className="mt-6 flex items-start gap-3"><div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-300"><History className="h-6 w-6" /></div><div><h1 className="text-2xl font-semibold text-white sm:text-3xl">历史分析记录</h1><p className="mt-2 text-sm leading-6 text-slate-400">查看已生成的比赛分析与结果复盘。</p></div></div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map((item) => <Card key={item.label} className="border-slate-800 bg-[#111827] p-4"><p className="text-xs leading-5 text-slate-500">{item.label}</p><p className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}<span className="ml-1 text-sm font-normal text-slate-500">{item.suffix}</span></p></Card>)}</div>

      <Card className="mt-6 border-slate-800 bg-[#111827]">
        <CardHeader><CardTitle className="text-lg text-white">最近记录</CardTitle></CardHeader>
        <CardContent>
          {records.length ? <div className="space-y-3">{records.map((record) => { const result = resultLabel(record); const ResultIcon = result.icon; return <Link key={record.match_id} href={`/matches/${encodeURIComponent(record.match_id)}`} className="block rounded-xl border border-slate-800 bg-slate-950/30 p-4 transition-colors hover:border-blue-500/30 hover:bg-blue-500/5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-words text-sm font-medium text-white">{decodeUnicode(record.home_team)} <span className="px-1 text-slate-500">VS</span> {decodeUnicode(record.away_team)}</p><p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><CalendarClock className="h-3.5 w-3.5" />{formatDate(record.match_time ?? record.created_at)}</p></div><div className="flex items-center justify-between gap-4 sm:justify-end"><div className="text-left sm:text-right"><p className="text-xs text-slate-500">AI判断可信度</p><p className="mt-1 text-sm font-semibold text-blue-300">{record.confidence}%</p></div><span className={`flex items-center gap-1 text-xs ${result.tone}`}><ResultIcon className="h-3.5 w-3.5" />{result.label}</span></div></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-800 pt-3 text-xs text-slate-400"><span>主胜 {percentage(record.home_win_probability)}</span><span>平局 {percentage(record.draw_probability)}</span><span>客胜 {percentage(record.away_win_probability)}</span>{record.actual_score && <span>实际比分 {decodeUnicode(record.actual_score)}</span>}</div><p className="mt-2 text-xs text-slate-400">模型观点：{decodeUnicode(record.prediction)}</p></Link>; })}</div> : <div className="rounded-xl border border-dashed border-slate-700 px-5 py-12 text-center"><p className="text-sm text-slate-300">暂无历史分析记录</p><p className="mt-2 text-xs text-slate-500">生成比赛分析后，记录会显示在这里。</p></div>}
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs leading-5 text-slate-500">模型分析仅供参考，不构成投注建议。</p>
    </div>
  );
}
