"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Eye, KeyRound, Loader2, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnalysisStatus = "generated" | "pending" | "error";

type AnalysisMatch = {
  match_id: string;
  status: AnalysisStatus;
  created_at: string;
  updated_at: string;
  confidence: number | null;
  version: string;
  league: string;
  home_team: string;
  away_team: string;
  match_time: string;
};

type AnalysisScope = "today" | "upcoming_7_days";

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "待定";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function normalizeDisplayText(value: string) {
  if (!value || !/[ÃÂÐÑæåçèéêëïðñòóôõöùúûüÿ]/.test(value)) return value;

  try {
    const bytes = Uint8Array.from(Array.from(value), (character) => character.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return decoded.includes("�") ? value : decoded;
  } catch {
    return value;
  }
}

function getConfidence(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return { percent: "--", level: "暂无", explanation: "当前还没有可用的 AI 可信度数据。" };
  }

  const percent = Math.min(100, Math.max(0, Math.round(value)));
  if (percent <= 40) {
    return { percent: `${percent}%`, level: "低", explanation: "当前数据维度有限，AI判断需要结合更多比赛信息。" };
  }
  if (percent <= 70) {
    return { percent: `${percent}%`, level: "中", explanation: "已有基础赛事数据支持，仍需关注临场信息变化。" };
  }
  return { percent: `${percent}%`, level: "高", explanation: "球队状态与模型输入较完整，当前判断相对稳定。" };
}

const statusMeta: Record<AnalysisStatus, { label: string; className: string }> = {
  generated: { label: "已生成", className: "text-emerald-300" },
  pending: { label: "待生成", className: "text-amber-300" },
  error: { label: "生成失败", className: "text-rose-300" },
};

export function AnalysisDashboard() {
  const [secret, setSecret] = useState("");
  const [matches, setMatches] = useState<AnalysisMatch[]>([]);
  const [scope, setScope] = useState<AnalysisScope>("today");
  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadMatches = useCallback(async () => {
    if (!secret.trim()) {
      setMessage("请输入后台密钥后再读取比赛。");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/analysis-status", {
        headers: { Authorization: `Bearer ${secret.trim()}` },
        cache: "no-store",
      });
      const payload = (await response.json()) as { data?: AnalysisMatch[]; scope?: AnalysisScope; error?: string };
      if (!response.ok) throw new Error(payload.error || "读取分析状态失败");
      setMatches(payload.data ?? []);
      setScope(payload.scope ?? "today");
      if (!payload.data?.length) setMessage("今天暂无可生成的比赛。");
    } catch (error) {
      setMatches([]);
      setMessage(error instanceof Error ? error.message : "读取分析状态失败");
    } finally {
      setLoading(false);
    }
  }, [secret]);

  async function generate(matchId: string) {
    setGeneratingId(matchId);
    setMessage("");
    try {
      const response = await fetch("/api/admin/generate-analysis", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ match_id: matchId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "AI分析生成失败");
      setMessage("AI分析已生成并保存。");
      await loadMatches();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI分析生成失败");
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-500/20 bg-gradient-to-br from-[#111827] to-[#111d3a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white"><KeyRound className="h-5 w-5 text-blue-300" />后台访问验证</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-6 text-slate-400">输入 ANALYSIS_ADMIN_SECRET。密钥只保存在当前页面内存中，不会写入浏览器存储。</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="后台密钥"
              className="h-10 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-white outline-none ring-blue-500/40 placeholder:text-slate-600 focus:ring-2"
            />
            <Button onClick={loadMatches} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              读取今日比赛
            </Button>
          </div>
        </CardContent>
      </Card>

      {message && <p className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">{message}</p>}

      <Card className="border-slate-800 bg-[#111827]">
        <CardHeader><CardTitle className="text-white">{scope === "today" ? "今日比赛" : "未来 7 天最近赛事"} AI 生成状态</CardTitle></CardHeader>
        <CardContent>
          {matches.length ? (
            <div className="space-y-3">
              {matches.map((match) => {
                const meta = statusMeta[match.status];
                const isGenerating = generatingId === match.match_id;
                const confidence = getConfidence(match.confidence);
                return (
                  <div key={match.match_id} className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/30 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>{normalizeDisplayText(match.league) || "未定联赛"}</span><span>·</span><span>{formatTime(match.match_time)}</span></div>
                      <p className="mt-2 break-words text-sm font-medium leading-6 text-white">{normalizeDisplayText(match.home_team)} <span className="px-1 text-slate-600">VS</span> {normalizeDisplayText(match.away_team)}</p>
                      <p className={`mt-2 flex items-center gap-1.5 text-xs ${meta.className}`}>
                        {match.status === "generated" ? <CheckCircle2 className="h-3.5 w-3.5" /> : match.status === "error" ? <TriangleAlert className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                        {meta.label}{match.version ? ` · ${match.version}` : ""}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 sm:grid-cols-4 md:items-center">
                      <div><p className="text-slate-600">生成时间</p><p className="mt-1 text-slate-300">{match.created_at ? formatTime(match.created_at) : "--"}</p></div>
                      <div><p className="text-slate-600">数据更新时间</p><p className="mt-1 text-slate-300">{match.updated_at ? formatTime(match.updated_at) : "--"}</p></div>
                      <div><p className="text-slate-600">AI判断可信度</p><p className="mt-1 font-medium text-blue-300">{confidence.percent}</p><p className="mt-1 text-slate-500">等级：{confidence.level}</p><p className="mt-1 max-w-48 leading-5 text-slate-600">{confidence.explanation}</p></div>
                      <div className="flex flex-wrap gap-2 sm:col-span-1">
                        <Button variant="outline" onClick={() => generate(match.match_id)} disabled={Boolean(generatingId) || !secret.trim()} className="gap-2">
                          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          {isGenerating ? "生成中" : match.status === "generated" ? "重新生成" : "生成分析"}
                        </Button>
                        <Button asChild variant="ghost" className="gap-2">
                          <Link href={`/matches/${encodeURIComponent(match.match_id)}`}><Eye className="h-4 w-4" />查看报告</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">输入后台密钥并读取今日比赛。</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
