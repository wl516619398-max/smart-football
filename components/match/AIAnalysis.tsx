"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, BrainCircuit, CalendarDays, CheckCircle2, Loader2, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/match/SectionHeader";
import { getAccessToken } from "@/lib/supabase/auth";
import type { AIAnalysisRequest, AIErrorCode, AthenaAIAnalysis, AthenaPrediction } from "@/types/ai";
import type { MatchDetailData } from "@/types/match";
import type { Prediction } from "@/types/prediction";
import { decodeUnicode, decodeUnicodeDeep } from "@/lib/utils/decode-unicode";

type AnalysisState = "reading" | "empty" | "success" | "regenerating" | "error";
type AnalysisResponse = { success: true; data: AthenaAIAnalysis | null };
type AnalysisUsage = { limit: number | null; used: number; remaining: number | null };

const focusTags = ["主场优势", "近期状态", "历史交锋", "伤病影响", "数据完整度"];

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
    probabilities: { homeWin: match.probabilities[0]?.value ?? null, draw: match.probabilities[1]?.value ?? null, awayWin: match.probabilities[2]?.value ?? null },
    homeWin: match.probabilities[0]?.value ?? null,
    draw: match.probabilities[1]?.value ?? null,
    awayWin: match.probabilities[2]?.value ?? null,
    metrics: { home: match.homeStats, away: match.awayStats, ai: match.aiAnalysis },
    headToHead: { matches: match.headToHead.slice(0, 10), summary: match.headToHeadSummary },
    focusFactors: focusTags,
    prediction,
  };
}

function isAnalysis(value: unknown): value is AthenaAIAnalysis {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Partial<AthenaAIAnalysis>;
  return typeof data.summary === "string"
    && typeof data.prediction === "object"
    && data.prediction !== null
    && typeof data.recommendation === "string"
    && Array.isArray(data.strengths)
    && Array.isArray(data.risks)
    && Array.isArray(data.keyFactors)
    && Array.isArray(data.dataLimitations)
    && typeof data.confidence === "number"
    && typeof data.score === "number"
    && typeof data.generatedAt === "string";
}

function decodePrediction(value?: AthenaPrediction): AthenaPrediction | undefined {
  if (!value) return undefined;
  return {
    homeWin: decodeUnicode(value.homeWin),
    draw: decodeUnicode(value.draw),
    awayWin: decodeUnicode(value.awayWin),
  };
}

function decodeAnalysis(value: AthenaAIAnalysis): AthenaAIAnalysis {
  return decodeUnicodeDeep({
    ...value,
    summary: value.summary,
    prediction: decodePrediction(value.prediction),
    strengths: value.strengths,
    risks: value.risks,
    recommendation: value.recommendation,
    keyFactors: value.keyFactors,
    dataLimitations: value.dataLimitations,
    scorePrediction: value.scorePrediction,
    halfTimePrediction: decodePrediction(value.halfTimePrediction),
    scoreProbabilities: value.scoreProbabilities,
    riskLevel: value.riskLevel,
    generatedAt: value.generatedAt,
  }) as AthenaAIAnalysis;
}

function isResponse(value: unknown): value is AnalysisResponse {
  if (typeof value !== "object" || value === null) return false;
  const data = value as { success?: unknown; data?: unknown };
  return data.success === true && (data.data === null || isAnalysis(data.data));
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
  constructor(public code: AIErrorCode, public upgrade = false) { super("AI request failed"); }
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

function getReliability(analysis: AthenaAIAnalysis, prediction?: Prediction) {
  const confidence = analysis.confidence || 0;
  const risk = decodeUnicode(analysis.riskLevel || prediction?.riskLevel || "").toLowerCase();
  if (risk.includes("高") || risk === "high" || confidence < 55) return { label: "低", reason: "当前数据维度有限或差异较大，结论需要保留更多观察空间。" };
  if (risk.includes("低") || risk === "low" || confidence >= 75) return { label: "高", reason: "球队实力、近期表现和攻防数据相对完整，多个数据维度方向较为一致。" };
  return { label: "中", reason: "基础数据支持当前判断，但样本量和临场信息仍然有限。" };
}

function probabilityNumber(value: string) {
  const parsed = Number(value.replace("%", ""));
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0;
}

function ProbabilityCard({ label, value, color }: { label: string; value: string; color: string }) {
  const width = probabilityNumber(value);
  return <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm text-slate-300">{label}</span><strong className="text-2xl text-white">{value}</strong></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} /></div></div>;
}

function PendingCard({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5"><h3 className="text-sm font-semibold text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{children}</p></div>;
}

function ListCard({ title, items, tone = "blue" }: { title: string; items: string[]; tone?: "blue" | "amber" | "emerald" }) {
  const styles = tone === "amber" ? "border-amber-500/20 bg-amber-500/5" : tone === "emerald" ? "border-emerald-500/20 bg-emerald-500/5" : "border-blue-500/20 bg-blue-500/5";
  return <div className={`rounded-2xl border p-5 ${styles}`}><h3 className="flex items-center gap-2 text-sm font-semibold text-white">{tone === "amber" ? <ShieldAlert className="h-4 w-4 text-amber-400" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}{title}</h3><ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">{items.length ? items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />{decodeUnicode(item)}</li>) : <li className="text-slate-500">暂无内容</li>}</ul></div>;
}

export function AIAnalysis({ request, match: inputMatch, prediction }: { request?: AIAnalysisRequest; match?: MatchDetailData; prediction?: Prediction }) {
  const match = inputMatch ? decodeUnicodeDeep(inputMatch) : inputMatch;
  const analysisRequest = request ?? (match ? requestFromMatch(match, prediction) : null);
  const [state, setState] = useState<AnalysisState>("reading");
  const [analysis, setAnalysis] = useState<AthenaAIAnalysis | null>(null);
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
    if (!externalId) { setState("empty"); return () => controller.abort(); }

    const loadAnalysis = async () => {
      const accessToken = await getAccessToken();
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
      if (mode === "cache") {
        const response = await fetch(`/api/ai/analyze?external_id=${encodeURIComponent(externalId)}`, { cache: "no-store", headers, signal: controller.signal });
        const payload: unknown = await response.json().catch(() => null);
        setUsage(readUsage(payload));
        if (!response.ok || !isResponse(payload)) throw new AIRequestError(getErrorCode(payload, response.status), (payload as { upgrade?: boolean } | null)?.upgrade === true);
        if (cancelled) return;
        if (payload.data) { setAnalysis(decodeAnalysis(payload.data)); setState("success"); } else setMode("generate");
        return;
      }

      const response = await fetch("/api/ai/analyze", { method: "POST", headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, body: requestBody, signal: controller.signal });
      const payload: unknown = await response.json().catch(() => null);
      setUsage(readUsage(payload));
      if (!response.ok || !isResponse(payload) || !payload.data) throw new AIRequestError(getErrorCode(payload, response.status), (payload as { upgrade?: boolean } | null)?.upgrade === true);
      if (cancelled) return;
      setAnalysis(decodeAnalysis(payload.data));
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
  const errorMessage = limitReached ? "今日免费分析次数已用完" : errorCode === "AI_RATE_LIMITED" ? "免费AI当前繁忙，请稍后重试" : errorCode === "AI_MODEL_UNAVAILABLE" ? "当前AI模型暂不可用" : "AI分析暂不可用，请稍后重试";
  const reliability = analysis ? getReliability(analysis, prediction) : null;
  const halfTime = analysis?.halfTimePrediction;
  const goalRange = analysis?.goalRangePrediction;

  return <section id="ai-analysis" className="scroll-mt-24"><SectionHeader icon={BrainCircuit} eyebrow="ATHENA AI ANALYSIS" title="Athena AI 赛事分析" description="将模型结果转换为清晰的胜平负、半场、进球、比分和风险参考。" /><Card className="overflow-hidden border-blue-500/25 bg-gradient-to-br from-[#111d3a] to-[#111827] shadow-xl shadow-blue-950/20"><CardContent className="p-0">
    {match && <div className="border-b border-white/10 bg-slate-950/20 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-blue-300">{match.league}</span><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{match.date} {match.time}</span></div><div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center sm:gap-8"><div><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/25 bg-blue-500/15 text-sm font-bold text-blue-200">{match.home.shortName}</div><p className="mt-2 truncate text-sm font-semibold text-white sm:text-base">{match.home.name}</p></div><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">VS</p><ArrowRight className="mx-auto mt-2 h-4 w-4 text-blue-400" /></div><div><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/15 text-sm font-bold text-emerald-200">{match.away.shortName}</div><p className="mt-2 truncate text-sm font-semibold text-white sm:text-base">{match.away.name}</p></div></div></div>}
    <div className="p-5 sm:p-6">
      {usage && <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-3 text-xs text-slate-400"><span>今日剩余 AI 分析次数</span><span className="font-semibold text-blue-300">{usage.remaining === null ? "不限次数" : `${usage.remaining} 次`}</span></div>}
      {state === "reading" && <StatusBlock icon={Loader2} text="正在读取已保存的 AI 分析" loading />}
      {state === "empty" && <StatusBlock icon={BrainCircuit} text="当前暂无已保存的 AI 分析" action={<Button type="button" variant="outline" size="sm" onClick={requestGeneration}>生成分析</Button>} />}
      {state === "regenerating" && analysis && <div className="mb-5 flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-200"><Loader2 className="h-4 w-4 animate-spin" />正在更新分析，当前报告仍可查看。</div>}
      {state === "error" && !analysis && <StatusBlock icon={AlertTriangle} text={errorMessage} action={<Button type="button" variant="outline" size="sm" onClick={requestGeneration}>重新生成</Button>} />}
      {state === "error" && analysis && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{errorMessage}，已保留上次报告</span><Button type="button" variant="outline" size="sm" onClick={requestGeneration}>重新生成</Button></div>}
      {analysis && <div className="space-y-5" aria-live="polite">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 sm:p-6"><p className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles className="h-4 w-4 text-blue-400" />Athena AI 综合观点</p><p className="mt-4 text-sm leading-7 text-slate-300">{decodeUnicode(analysis.summary)}</p></div>
        <section><h3 className="mb-3 text-sm font-semibold text-white">胜平负</h3><div className="grid gap-3 sm:grid-cols-3"><ProbabilityCard label="主胜" value={decodeUnicode(analysis.prediction.homeWin)} color="bg-blue-500" /><ProbabilityCard label="平局" value={decodeUnicode(analysis.prediction.draw)} color="bg-slate-400" /><ProbabilityCard label="客胜" value={decodeUnicode(analysis.prediction.awayWin)} color="bg-emerald-500" /></div></section>
        <section><h3 className="mb-3 text-sm font-semibold text-white">半场</h3>{halfTime ? <div className="grid gap-3 sm:grid-cols-3"><ProbabilityCard label="半场主胜" value={decodeUnicode(halfTime.homeWin)} color="bg-blue-500" /><ProbabilityCard label="半场平局" value={decodeUnicode(halfTime.draw)} color="bg-slate-400" /><ProbabilityCard label="半场客胜" value={decodeUnicode(halfTime.awayWin)} color="bg-emerald-500" /></div> : <PendingCard title="半场走势">当前分析结果未提供半场概率数据，暂不补充推测。</PendingCard>}</section>
        <section><h3 className="mb-3 text-sm font-semibold text-white">进球</h3>{goalRange ? <div className="grid gap-3 sm:grid-cols-3"><ProbabilityCard label="0-1球" value={`${goalRange.zeroToOne}%`} color="bg-slate-400" /><ProbabilityCard label="2-3球" value={`${goalRange.twoToThree}%`} color="bg-blue-500" /><ProbabilityCard label="4球以上" value={`${goalRange.fourPlus}%`} color="bg-amber-500" /></div> : <PendingCard title="进球趋势">{analysis.scorePrediction.length ? `比分参考：${analysis.scorePrediction.join("、")}` : "当前分析结果未提供进球区间数据，暂不补充推测。"}</PendingCard>}</section>
        <section><h3 className="mb-3 text-sm font-semibold text-white">比分</h3><div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5"><div className="flex flex-wrap gap-2">{analysis.scorePrediction.length ? analysis.scorePrediction.map((score, index) => <span key={`${score}-${index}`} className="rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-2 text-sm font-semibold text-violet-200">{decodeUnicode(score)}</span>) : <span className="text-sm text-slate-500">暂无比分参考</span>}</div>{analysis.scoreProbabilities?.length ? <div className="mt-4 space-y-2">{analysis.scoreProbabilities.map((item) => <div key={item.score} className="flex items-center gap-3 text-xs text-slate-400"><span className="w-12 text-slate-200">{decodeUnicode(item.score)}</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-violet-400" style={{ width: `${item.probability}%` }} /></div><span>{item.probability}%</span></div>)}</div> : null}</div></section>
        <div className="grid gap-4 sm:grid-cols-2"><ListCard title="分析依据" items={[...analysis.strengths, ...analysis.keyFactors].slice(0, 6)} tone="emerald" /><ListCard title={`风险提示 · ${decodeUnicode(analysis.riskLevel) || reliability?.label || "中"}`} items={analysis.risks} tone="amber" /></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-5"><p className="text-sm font-semibold text-white">模型观点</p><p className="mt-3 text-sm leading-7 text-slate-300">{decodeUnicode(analysis.recommendation)}</p><p className="mt-3 text-xs leading-5 text-slate-500">分析可靠度：{reliability?.label}。{reliability?.reason}</p></div>
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-5 text-[11px] text-slate-500"><span>生成时间：<strong className="text-slate-300">{formatDate(analysis.generatedAt)}</strong></span><div className="ml-auto"><Button type="button" variant="outline" size="sm" disabled={state === "regenerating"} onClick={requestGeneration}><RefreshCw className="mr-2 h-3.5 w-3.5" />{state === "regenerating" ? "处理中" : "重新生成"}</Button></div></div>
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-6 text-amber-100">模型参考，不构成投注建议。足球比赛存在不确定性，请理性看待以上概率、比分和风险提示。</p>
      </div>}
    </div>
  </CardContent></Card></section>;
}

function StatusBlock({ icon: Icon, text, loading = false, action }: { icon: typeof Loader2; text: string; loading?: boolean; action?: ReactNode }) {
  return <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center" role="status"><Icon className={`h-7 w-7 ${loading ? "animate-spin text-blue-400" : "text-amber-400"}`} /><p className="text-sm text-slate-300">{text}</p>{action}</div>;
}
