import { Clock3, Database, Globe2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ReportDataSources({ generatedAt, hasAnalysis }: { generatedAt: string; hasAnalysis: boolean }) {
  const time = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", dateStyle: "medium", timeStyle: "short" }).format(new Date(generatedAt));
  const sources = [{ icon: Globe2, label: "比赛与球队数据", value: "Football API / Supabase" }, { icon: Database, label: "模型输入", value: "近期状态 · 攻防指标 · 市场数据" }, { icon: Sparkles, label: "分析引擎", value: "Athena Prediction Engine" }, { icon: Clock3, label: "报告状态", value: hasAnalysis ? `已生成 · ${time}` : "等待赛前生成" }];
  return <Card className="border-slate-800 bg-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><Database className="h-4 w-4 text-blue-300" />数据来源与更新时间</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{sources.map(({ icon: Icon, label, value }) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3"><Icon className="h-4 w-4 text-blue-300" /><p className="mt-3 text-[11px] text-slate-500">{label}</p><p className="mt-1 text-sm leading-5 text-slate-200">{value}</p></div>)}</CardContent></Card>;
}
