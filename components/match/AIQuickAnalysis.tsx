"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAccessToken } from "@/lib/supabase/auth";
import type { AIAnalysisRequest } from "@/types/ai";

type QuickAnalysisResult = {
  data?: {
    prediction?: { homeWin?: string | number; draw?: string | number; awayWin?: string | number };
    confidence?: number;
    riskLevel?: string;
  };
};

export function AIQuickAnalysis({ request }: { request: AIAnalysisRequest }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickAnalysisResult | null>(null);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    try {
      const accessToken = await getAccessToken();
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify(request),
      });
      const payload = await response.json().catch(() => null) as QuickAnalysisResult | null;
      if (!response.ok || !payload?.data) throw new Error("AI分析暂不可用，请稍后重试");
      setResult(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI分析暂不可用，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  const prediction = result?.data?.prediction;
  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      <Button type="button" variant="outline" onClick={handleAnalyze} disabled={loading} className="border-blue-500/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 hover:text-white">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4 text-amber-300" />}
        {loading ? "AI分析生成中..." : "⚡ AI深度分析"}
      </Button>
      {error && <p className="text-xs text-amber-300">{error}</p>}
      {result?.data && (
        <div className="w-full max-w-xl rounded-xl border border-blue-500/20 bg-slate-950/35 p-4 text-left">
          <p className="text-xs font-medium text-slate-400">AI赛前参考</p>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <span className="rounded-lg bg-blue-500/10 px-3 py-2 text-blue-200">主胜概率：{prediction?.homeWin ?? "--"}</span>
            <span className="rounded-lg bg-slate-800/70 px-3 py-2 text-slate-200">平局概率：{prediction?.draw ?? "--"}</span>
            <span className="rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-200">客胜概率：{prediction?.awayWin ?? "--"}</span>
            <span className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-200">AI判断可信度：{result.data.confidence ?? "--"}</span>
            <span className="rounded-lg bg-violet-500/10 px-3 py-2 text-violet-200 sm:col-span-2">分析可靠度：{result.data.riskLevel ?? "--"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
