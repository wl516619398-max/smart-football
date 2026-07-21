import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { AnalysisDashboard } from "@/components/admin/AnalysisDashboard";

export const metadata: Metadata = {
  title: "AI分析后台 | Project Athena",
  description: "Project Athena 预生成 AI 分析调试页面。",
};

export default function AnalysisAdminPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-140px)] w-full max-w-6xl px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start gap-3">
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-300"><ShieldCheck className="h-5 w-5" /></div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-300">ATHENA ADMIN</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">预生成 AI 分析</h1>
          <p className="mt-2 text-sm text-slate-400">查看今日比赛状态，并手动触发赛前分析生成。</p>
        </div>
      </div>
      <AnalysisDashboard />
    </main>
  );
}
