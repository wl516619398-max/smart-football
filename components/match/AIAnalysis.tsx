"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, BrainCircuit, CalendarDays, CheckCircle2, Clock3, Loader2, RefreshCw, ShieldAlert, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/match/SectionHeader";
import { getAccessToken } from "@/lib/supabase/auth";
import type { AIAnalysisRequest, AIErrorCode, AthenaAIAnalysis } from "@/types/ai";
import type { MatchDetailData } from "@/types/match";
import type { Prediction } from "@/types/prediction";

type AnalysisState = "reading" | "empty" | "success" | "regenerating" | "error";
type AnalysisSuccessResponse = { success: true; data: AthenaAIAnalysis; model: string; provider?: string; fallbackReason?: string | null };
type CacheResponse = { success: true; data: AthenaAIAnalysis | null; model: string; provider?: string; fallbackReason?: string | null };
type AnalysisUsage = { limit: number | null; used: number; remaining: number | null };

const focusTags = ["主场优势", "最近状态", "历史交锋", "伤病影响", "数据一致性"];

function requestFromMatch(match: MatchDetailData, prediction?: Prediction): AIAnalysisRequest {
  return {
    external_id: match.id,
    matchId: match.id,
    homeTeam: { name: match.home.name, stats: match.homeStats, ai: match.aiAnalysis.home },
    awayTeam: { name: match.away.name, stats: match.awayStats, ai: match.aiAnalysis.away },
    league: match.league,
    recentForm: match.recentForm,
    h2h: { matches: match.headToHead.slice(0, 10), summary: match.headToHeadSummary },
    standings: {},
    attackStrength: { home: match.homeStats.attack, away: match.awayStats.attack },
    defenseStrength: { home: match.homeStats.defense, away: match.awayStats.defense },
    injuries: [],
    matchTime: `${match.date} ${match.time}`,
    probabilities: {
      homeWin: match.probabilities[0]?.value ?? null,
      draw: match.probabilities[1]?.value ?? null,
      awayWin: match.probabilities[2]?.value ?? null,
    },
    homeWin: match.probabilities[0]?.value ?? null,
    draw: match.probabilities[1]?.value ?? null,
    awayWin: match.probabilities[2]?.value ?? null,
    metrics: { home: match.homeStats, away: match.awayStats, ai: match.aiAnalysis },
    headToHead: { matches: match.headToHead.slice(0, 10), summary: match.headToHeadSummary },
    focusFactors: focusTags,
    prediction,
  };
}

function isAnalysisResponse(value: unknown): value is AthenaAIAnalysis {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Partial<AthenaAIAnalysis>;
  return typeof data.summary === "string" && typeof data.prediction === "object" && data.prediction !== null && typeof data.recommendation === "string" && Array.isArray(data.strengths) && Array.isArray(data.risks) && Array.isArray(data.keyFactors) && Array.isArray(data.dataLimitations) && typeof data.confidence === "number" && typeof data.score === "number" && typeof data.generatedAt === "string";
}

function isSuccessResponse(value: unknown): value is AnalysisSuccessResponse {
  if (typeof value !== "object" || value === null) return false;
  const data = value as { success?: unknown; data?: unknown; model?: unknown };
  return data.success === true && typeof data.model === "string" && isAnalysisResponse(data.data);
}

function isCacheResponse(value: unknown): value is CacheResponse {
  if (typeof value !== "object" || value === null) return false;
  const data = value as { success?: unknown; data?: unknown; model?: unknown };
  return data.success === true && typeof data.model === "string" && (data.data === null || isAnalysisResponse(data.data));
}

function getErrorCode(value: unknown, status: number): AIErrorCode {
  if (typeof value === "object" && value !== null) {
    const code = (value as { error?: { code?: unknown } }).error?.code;
    if (code === "AI_RATE_LIMITED" || code === "AI_MODEL_UNAVAILABLE" || code === "AI_REQUEST_FAILED") return code;
  }
  if (status === 429) return "AI_RATE_LIMITED";
  if (status === 503) return "AI_MODEL_UNAVAILABLE";
  return "AI_REQUEST_FAILED";
}

class AIRequestError extends Error {
  constructor(public code: AIErrorCode, public upgrade = false) {
    super("AI request failed");
  }
}

function readUsage(value: unknown): AnalysisUsage | null {
  if (typeof value !== "object" || value === null) return null;
  const usage = (value as { usage?: unknown }).usage;
  if (typeof usage !== "object" || usage === null) return null;
  const parsed = usage as Partial<AnalysisUsage>;
  if ((typeof parsed.limit !== "number" && parsed.limit !== null) || typeof parsed.used !== "number" || (typeof parsed.remaining !== "number" && parsed.remaining !== null)) return null;
  return { limit: parsed.limit ?? null, used: parsed.used, remaining: parsed.remaining ?? null };
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN");
}

function riskLabel(analysis: AthenaAIAnalysis, prediction?: Prediction) {
  if (analysis.riskLevel) return analysis.riskLevel;
  if (prediction?.riskLevel) return prediction.riskLevel;
  return analysis.risks.length >= 3 ? "高" : analysis.risks.length ? "中" : "低";
}

export function AIAnalysis({ request, match, prediction }: { request?: AIAnalysisRequest; match?: MatchDetailData; prediction?: Prediction }) {
  const analysisRequest = request ?? (match ? requestFromMatch(match, prediction) : null);
  const [state, setState] = useState<AnalysisState>("reading");
  const [analysis, setAnalysis] = useState<AthenaAIAnalysis | null>(null);
  const [model, setModel] = useState("");
  const [provider, setProvider] = useState("");
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<AIErrorCode>("AI_REQUEST_FAILED");
  const [limitReached, setLimitReached] = useState(false);
  const [usage, setUsage] = useState<AnalysisUsage | null>(null);
  const [mode, setMode] = useState<"cache" | "generate">("cache");
  const [requestVersion, setRequestVersion] = useState(0);
  const externalId = analysisRequest?.external_id ?? analysisRequest?.matchId ?? "";
  const requestBody = JSON.stringify(analysisRequest ? { ...analysisRequest, force: true } : null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setState(mode === "generate" ? "regenerating" : "reading");
    setErrorCode("AI_REQUEST_FAILED");
    setLimitReached(false);

    if (!externalId) {
      setState("empty");
      return () => controller.abort();
    }

    const loadAnalysis = async () => {
      const accessToken = await getAccessToken();
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
      if (mode === "cache") {
        const response = await fetch(`/api/ai/analyze?external_id=${encodeURIComponent(externalId)}`, { cache: "no-store", headers, signal: controller.signal });
        const payload: unknown = await response.json().catch(() => null);
        setUsage(readUsage(payload));
        if (!response.ok || !isCacheResponse(payload)) throw new AIRequestError(getErrorCode(payload, response.status), (payload as { upgrade?: boolean } | null)?.upgrade === true);
        if (cancelled) return;
        if (payload.data) {
          setAnalysis(payload.data);
          setModel(payload.model);
          setProvider(payload.provider ?? "");
          setFallbackReason(payload.fallbackReason ?? null);
          setState("success");
        } else {
          setMode("generate");
        }
        return;
      }

      const response = await fetch("/api/ai/analyze", { method: "POST", headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, body: requestBody, signal: controller.signal });
      const payload: unknown = await response.json().catch(() => null);
      setUsage(readUsage(payload));
      if (!response.ok) throw new AIRequestError(getErrorCode(payload, response.status), (payload as { upgrade?: boolean } | null)?.upgrade === true);
      if (!isSuccessResponse(payload)) throw new AIRequestError("AI_REQUEST_FAILED");
      if (cancelled) return;
      setAnalysis(payload.data);
      setModel(payload.model);
      setProvider(payload.provider ?? "");
      setFallbackReason(payload.fallbackReason ?? null);
      setState("success");
    };

    void loadAnalysis().catch((error: unknown) => {
      if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
      setErrorCode(error instanceof AIRequestError ? error.code : "AI_REQUEST_FAILED");
      setLimitReached(error instanceof AIRequestError && error.upgrade);
      setState("error");
    });
    return () => { cancelled = true; controller.abort(); };
  }, [externalId, mode, requestBody, requestVersion]);

  const requestGeneration = () => { setLimitReached(false); setMode("generate"); setRequestVersion((version) => version + 1); };
  const errorMessage = limitReached ? "今日免费分析次数已用完" : errorCode === "AI_RATE_LIMITED" ? "免费 AI 当前繁忙，请稍后重试" : errorCode === "AI_MODEL_UNAVAILABLE" ? "当前 AI 模型暂不可用" : "AI 分析暂不可用，请稍后重试";

  return <section id="ai-analysis" className="scroll-mt-24"><SectionHeader icon={BrainCircuit} eyebrow="ATHENA AI ANALYSIS" title="Athena AI 深度分析" description="从赛事数据、模型预测和可解释因素中提炼综合观点。" /><Card className="overflow-hidden border-blue-500/25 bg-gradient-to-br from-[#111d3a] to-[#111827] shadow-xl shadow-blue-950/20"><CardContent className="p-0">
    {match && <div className="border-b border-white/10 bg-slate-950/20 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-blue-300">{match.league}</span><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{match.date} {match.time}</span></div><div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center sm:gap-8"><div><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/25 bg-blue-500/15 text-sm font-bold text-blue-200">{match.home.shortName}</div><p className="mt-2 truncate text-sm font-semibold text-white sm:text-base">{match.home.name}</p></div><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">MATCH AI</p><ArrowRight className="mx-auto mt-2 h-4 w-4 text-blue-400" /></div><div><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/15 text-sm font-bold text-emerald-200">{match.away.shortName}</div><p className="mt-2 truncate text-sm font-semibold text-white sm:text-base">{match.away.name}</p></div></div></div>}
    <div className="p-5 sm:p-6">
      {usage && <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-3 text-xs text-slate-400"><span>今日剩余 AI 分析次数</span><span className="font-semibold text-blue-300">{usage.remaining === null ? "不限次数" : `${usage.remaining} 次`}</span></div>}
      {state === "reading" && <StatusBlock icon={Loader2} text="正在读取已保存分析" loading />}
      {state === "empty" && <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center"><BrainCircuit className="h-7 w-7 text-slate-500" /><p className="text-sm text-slate-300">当前暂无已保存的 AI 分析</p><p className="text-xs text-slate-500">生成后结果会保存到当前比赛，刷新时优先读取缓存。</p><Button type="button" variant="outline" size="sm" onClick={requestGeneration}>生成分析</Button></div>}
      {state === "regenerating" && analysis && <div className="mb-5 flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-200"><Loader2 className="h-4 w-4 animate-spin" />正在更新分析，当前报告仍可查看。</div>}
      {state === "error" && !analysis && <StatusBlock icon={AlertTriangle} text={errorMessage} action={<Button type="button" variant="outline" size="sm" onClick={requestGeneration}>重新生成</Button>} />}
      {state === "error" && analysis && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{errorMessage}，已保留上次报告</span><Button type="button" variant="outline" size="sm" onClick={requestGeneration}>重新生成</Button></div>}
      {analysis && <div className="space-y-6" aria-live="polite"><div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles className="h-4 w-4 text-blue-400" />Athena AI 综合观点</p><div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><span>provider: {provider || "unknown"}</span><span>model: {model || "unknown"}</span>{fallbackReason && <span className="text-amber-300">fallbackReason: {fallbackReason}</span>}</div></div><p className="mt-4 text-sm leading-7 text-slate-300">{analysis.summary}</p>{analysis.scorePrediction.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400"><span>模型预测比分</span>{analysis.scorePrediction.map((score) => <span key={score} className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-blue-200">{score}</span>)}</div>}</div>
        <div className="grid gap-3 sm:grid-cols-3">{[["主胜概率", analysis.prediction.homeWin, "border-blue-500/25 bg-blue-500/10 text-blue-200"], ["平局概率", analysis.prediction.draw, "border-slate-700 bg-slate-900/60 text-slate-200"], ["客胜概率", analysis.prediction.awayWin, "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"]].map(([label, value, tone]) => <div key={label} className={`rounded-2xl border p-5 ${tone}`}><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-current opacity-80" style={{ width: value }} /></div></div>)}</div>
        <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-5"><p className="text-xs text-slate-400">Athena Score</p><p className="mt-1 text-5xl font-black tracking-tight text-blue-200">{analysis.score}</p><p className="mt-2 text-xs text-blue-200/70">模型综合评分</p></div><div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5"><p className="flex items-center gap-2 text-xs text-slate-400"><ShieldAlert className="h-4 w-4 text-amber-400" />数据不确定性等级</p><p className="mt-3 text-3xl font-bold text-amber-200">{riskLabel(analysis, prediction)}</p><p className="mt-2 text-xs text-amber-200/70">请结合数据局限理解模型观点</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><FactorCard title="优势因素" items={analysis.strengths} tone="emerald" icon={CheckCircle2} /><FactorCard title="风险因素" items={analysis.risks} tone="amber" icon={ShieldAlert} /></div><div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-5"><p className="text-sm font-semibold text-white">AI 总结报告</p><p className="mt-3 text-sm leading-7 text-slate-300">{analysis.recommendation}</p><div className="mt-4 flex flex-wrap gap-2">{analysis.keyFactors.map((factor) => <span key={factor} className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[11px] text-blue-200">{factor}</span>)}</div></div>
        <div className="grid gap-4 sm:grid-cols-2"><FactorCard title="数据局限" items={analysis.dataLimitations} tone="slate" icon={Clock3} /><div><p className="mb-2 text-xs font-medium text-slate-400">关注维度</p><div className="flex flex-wrap gap-2">{focusTags.map((tag) => <span key={tag} className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/50 px-2.5 py-1.5 text-[11px] text-slate-400"><Tag className="h-3 w-3 text-blue-400" />{tag}</span>)}</div></div></div>
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-5 text-[11px] text-slate-500"><span>生成时间：<strong className="text-slate-300">{formatDate(analysis.generatedAt)}</strong></span><div className="ml-auto"><Button type="button" variant="outline" size="sm" disabled={state === "regenerating"} onClick={requestGeneration}><RefreshCw className="mr-2 h-3.5 w-3.5" />{state === "regenerating" ? "处理中" : "重新生成"}</Button></div></div>
      </div>}
    </div>
  </CardContent></Card></section>;
}

function StatusBlock({ icon: Icon, text, loading = false, action }: { icon: typeof Loader2; text: string; loading?: boolean; action?: React.ReactNode }) {
  return <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center" role="status"><Icon className={`h-7 w-7 ${loading ? "animate-spin text-blue-400" : "text-amber-400"}`} /><p className="text-sm text-slate-300">{text}</p>{action}</div>;
}

function FactorCard({ title, items, tone, icon: Icon }: { title: string; items: string[]; tone: "emerald" | "amber" | "slate"; icon: typeof CheckCircle2 }) {
  const styles = tone === "emerald" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-100" : tone === "amber" ? "border-amber-500/20 bg-amber-500/5 text-amber-100" : "border-slate-800 bg-slate-900/50 text-slate-300";
  return <div className={`rounded-2xl border p-5 ${styles}`}><p className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4" />{title}</p><ul className="mt-4 space-y-2">{items.length ? items.map((item) => <li key={item} className="rounded-lg border border-white/5 bg-black/10 px-3 py-2 text-xs leading-5">{item}</li>) : <li className="text-xs opacity-60">暂无记录</li>}</ul></div>;
}
