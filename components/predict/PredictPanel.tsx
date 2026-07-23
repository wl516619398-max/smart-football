"use client";

import { useState } from "react";
import { BarChart3, CheckCircle2, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import AIAnalysisCard, { type MatchAIAnalysis } from "@/components/predict/AIAnalysisCard";

type TeamOption = {
  id: string;
  name: string;
};

type TeamFormSummary = {
  teamId: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  averageGoalsFor: number;
  averageGoalsAgainst: number;
  formScore: number;
};

type PredictionResult = {
  homeTeam: TeamOption;
  awayTeam: TeamOption;
  homeForm: TeamFormSummary;
  awayForm: TeamFormSummary;
  prediction: { homeWin: number; draw: number; awayWin: number };
  recommendation: string;
  risk: string;
};

const TEAM_OPTIONS: TeamOption[] = [
  { id: "33", name: "曼联" },
  { id: "40", name: "利物浦" },
  { id: "42", name: "阿森纳" },
  { id: "49", name: "切尔西" },
  { id: "50", name: "曼城" },
  { id: "541", name: "皇家马德里" },
  { id: "529", name: "巴塞罗那" },
  { id: "157", name: "拜仁慕尼黑" },
  { id: "165", name: "多特蒙德" },
  { id: "496", name: "尤文图斯" },
  { id: "85", name: "巴黎圣日耳曼" },
];

function ProbabilityBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-white">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function FormCard({ label, form }: { label: string; form: TeamFormSummary }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium text-white">{label}</h3>
        <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300">状态 {form.formScore}</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-emerald-500/10 p-2"><p className="text-emerald-300">胜</p><p className="mt-1 text-lg font-semibold text-white">{form.wins}</p></div>
        <div className="rounded-lg bg-slate-800/80 p-2"><p className="text-slate-400">平</p><p className="mt-1 text-lg font-semibold text-white">{form.draws}</p></div>
        <div className="rounded-lg bg-rose-500/10 p-2"><p className="text-rose-300">负</p><p className="mt-1 text-lg font-semibold text-white">{form.losses}</p></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-400">
        <span>场均进球 <strong className="text-slate-200">{form.averageGoalsFor}</strong></span>
        <span>场均失球 <strong className="text-slate-200">{form.averageGoalsAgainst}</strong></span>
        <span>进球总数 <strong className="text-slate-200">{form.goalsFor}</strong></span>
        <span>零封场次 <strong className="text-slate-200">{form.cleanSheets}</strong></span>
      </div>
    </div>
  );
}

export default function PredictPanel() {
  const [homeTeamId, setHomeTeamId] = useState("33");
  const [awayTeamId, setAwayTeamId] = useState("40");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiAnalysis, setAIAnalysis] = useState<MatchAIAnalysis | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState("");

  async function generateAIAnalysis(nextResult: PredictionResult) {
    setAILoading(true);
    setAIError("");
    try {
      const response = await fetch("/api/ai/analyze-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextResult),
      });
      const payload = (await response.json()) as { success?: boolean; data?: MatchAIAnalysis; error?: string; model?: string };
      if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error || "AI分析暂不可用，请稍后重试");
      setAIAnalysis(payload.data);
    } catch (requestError) {
      setAIAnalysis(null);
      setAIError(requestError instanceof Error ? requestError.message : "AI分析暂不可用，请稍后重试");
    } finally {
      setAILoading(false);
    }
  }

  async function handlePredict() {
    if (homeTeamId === awayTeamId) {
      setError("请选择两支不同的球队。");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setAIAnalysis(null);
    setAIError("");
    try {
      const response = await fetch(`/api/football/predict?home_team_id=${encodeURIComponent(homeTeamId)}&away_team_id=${encodeURIComponent(awayTeamId)}`);
      const payload = (await response.json()) as PredictionResult & { error?: string };
      if (!response.ok) throw new Error(payload.error || "预测数据暂不可用");
      setResult(payload);
      void generateAIAnalysis(payload);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "预测数据暂不可用");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#111827] via-[#111d3a] to-[#111827] p-6 sm:p-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/15 blur-[80px]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-300"><Sparkles className="h-4 w-4" />ATHENA PREDICTION</div>
          <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">赛事预测</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">选择两支球队，基于最近10场比赛的状态、进失球与主场因素生成规则模型预测。</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-[#111827] p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
          <label className="text-sm text-slate-300">主队<select value={homeTeamId} onChange={(event) => setHomeTeamId(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-white outline-none focus:border-blue-500">
            {TEAM_OPTIONS.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select></label>
          <span className="hidden pb-3 text-center text-xs font-semibold text-slate-500 md:block">VS</span>
          <label className="text-sm text-slate-300">客队<select value={awayTeamId} onChange={(event) => setAwayTeamId(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-white outline-none focus:border-blue-500">
            {TEAM_OPTIONS.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select></label>
          <Button type="button" size="lg" onClick={handlePredict} disabled={loading} className="w-full md:w-auto">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />分析中</> : <><BarChart3 className="mr-2 h-4 w-4" />开始分析</>}
          </Button>
        </div>
        {error && <p className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
      </section>

      {result && <section className="mt-6 space-y-6">
        <div className="rounded-2xl border border-blue-500/20 bg-[#111827] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs text-blue-400">MODEL RESULT</p><h2 className="mt-1 text-2xl font-semibold text-white">{result.homeTeam.name} <span className="text-slate-500">VS</span> {result.awayTeam.name}</h2></div>
            <div className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" />模型观点：{result.recommendation}</div>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <ProbabilityBar label="主胜概率" value={result.prediction.homeWin} color="bg-blue-500" />
            <ProbabilityBar label="平局概率" value={result.prediction.draw} color="bg-slate-400" />
            <ProbabilityBar label="客胜概率" value={result.prediction.awayWin} color="bg-emerald-500" />
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-slate-300"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" /><span>{result.risk}</span></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2"><FormCard label={result.homeTeam.name} form={result.homeForm} /><FormCard label={result.awayTeam.name} form={result.awayForm} /></div>
        <AIAnalysisCard analysis={aiAnalysis} prediction={result.prediction} loading={aiLoading} error={aiError} onRetry={() => void generateAIAnalysis(result)} />
        <p className="text-center text-xs leading-5 text-slate-500">本页面仅展示基于近期数据的规则模型估算，结果存在不确定性，仅供赛事信息参考。</p>
      </section>}
    </main>
  );
}
