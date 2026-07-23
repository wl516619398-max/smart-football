import { AlertTriangle, BarChart3, CircleGauge, Goal, ShieldCheck, Sparkles } from "lucide-react";
import type { ReactElement } from "react";
import type { AiMatchAnalysisRow } from "@/types/ai-match-analysis";
import { decodeUnicode } from "@/lib/utils/decode-unicode";

type Prediction = {
  homeWin: number;
  draw: number;
  awayWin: number;
  confidence: number;
  expectedGoals?: { home: number; away: number };
};

type ScoreItem = { score: string; probability?: number };

type Props = {
  homeTeam: string;
  awayTeam: string;
  prediction: Prediction;
  analysis: AiMatchAnalysisRow | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function text(value: unknown, fallback = "数据同步中"): string {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return decodeUnicode(value.trim());
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function percent(value: number | null): string {
  if (value === null) return "数据同步中";
  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(Math.max(0, Math.min(100, normalized)))}%`;
}

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string").map((item) => decodeUnicode(item.trim())).filter(Boolean);
  if (typeof value !== "string") return [];
  return value.split(/[\n。；;]+/).map((item) => decodeUnicode(item.replace(/^[-•\s]+/, "").trim())).filter(Boolean);
}

function parseScores(value: unknown): ScoreItem[] {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => {
        const record = asRecord(item);
        const score = typeof item === "string" ? item : record.score;
        const probability = numberValue(record.probability ?? record.percent);
        return typeof score === "string" && score.trim() ? { score: decodeUnicode(score.trim()), probability: probability ?? undefined } : null;
      })
      .filter((item) => item !== null);
    return items.slice(0, 5);
  }

  if (typeof value !== "string") return [];
  return Array.from(new Set(value.match(/\d+\s*[-:：]\s*\d+/g) ?? []))
    .slice(0, 5)
    .map((score) => ({ score: score.replace(/\s+/g, "") }));
}

function progress(value: number, color: string): ReactElement {
  return <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

function ProbabilityCards({ prediction }: { prediction: Prediction }) {
  const items = [
    { label: "主胜", value: prediction.homeWin, color: "text-blue-300", bar: "bg-blue-500" },
    { label: "平局", value: prediction.draw, color: "text-slate-200", bar: "bg-slate-400" },
    { label: "客胜", value: prediction.awayWin, color: "text-emerald-300", bar: "bg-emerald-500" },
  ];
  return <div className="grid gap-3 sm:grid-cols-3">{items.map((item) => <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm text-slate-400">{item.label}</span><span className={`text-xl font-semibold ${item.color}`}>{percent(item.value)}</span></div><div className="mt-3">{progress(item.value, item.bar)}</div></div>)}</div>;
}

export function MatchAnalysisOverview({ homeTeam, awayTeam, prediction, analysis }: Props) {
  const raw = asRecord(analysis);
  const content = { ...raw, ...asRecord(raw.analysis) };
  const half = asRecord(content.halfTimePrediction ?? content.half_time_prediction ?? content.half_probabilities);
  const halfItems = [
    { label: "主胜", value: numberValue(half.homeWin ?? half.home_win_probability) },
    { label: "平局", value: numberValue(half.draw ?? half.draw_probability) },
    { label: "客胜", value: numberValue(half.awayWin ?? half.away_win_probability) },
  ];
  const hasHalfProbability = halfItems.some((item) => item.value !== null);
  const goal = asRecord(content.goalRangePrediction ?? content.goal_range_prediction);
  const goalItems = [
    { label: "0-1球", value: numberValue(goal.zeroToOne ?? goal.zero_to_one) },
    { label: "2-3球", value: numberValue(goal.twoToThree ?? goal.two_to_three) },
    { label: "4球以上", value: numberValue(goal.fourPlus ?? goal.four_plus) },
  ];
  const hasGoalProbability = goalItems.some((item) => item.value !== null);
  const scoreItems = parseScores(content.scoreProbabilities ?? content.score_probabilities ?? content.score_prediction);
  const risks = parseList(content.risks ?? content.risk_factors ?? content.risk_warning);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-blue-500/20 bg-[#111827] p-4 shadow-lg shadow-blue-950/10 sm:p-6">
        <div className="mb-4 flex items-center gap-2"><CircleGauge className="h-5 w-5 text-blue-300" /><h2 className="text-lg font-semibold text-white">胜平负概率</h2></div>
        <ProbabilityCards prediction={prediction} />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-violet-300" /><h2 className="text-lg font-semibold text-white">半场概率</h2></div>
          {hasHalfProbability ? <div className="space-y-4">{halfItems.map((item) => <div key={item.label}><div className="mb-2 flex justify-between text-sm"><span className="text-slate-400">{item.label}</span><span className="text-slate-200">{percent(item.value)}</span></div>{progress(item.value ?? 0, "bg-violet-500")}</div>)}</div> : <p className="text-sm leading-6 text-slate-400">{text(content.half_prediction, "数据同步中")}<span className="mt-1 block text-xs text-slate-500">当前暂未获得结构化半场概率。</span></p>}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2"><Goal className="h-5 w-5 text-amber-300" /><h2 className="text-lg font-semibold text-white">总进球趋势</h2></div>
          {hasGoalProbability ? <div className="space-y-4">{goalItems.map((item) => <div key={item.label}><div className="mb-2 flex justify-between text-sm"><span className="text-slate-400">{item.label}</span><span className="text-slate-200">{percent(item.value)}</span></div>{progress(item.value ?? 0, "bg-amber-500")}</div>)}</div> : <p className="text-sm leading-6 text-slate-400">{text(content.goal_prediction, prediction.expectedGoals ? `预计进球 ${prediction.expectedGoals.home.toFixed(1)} - ${prediction.expectedGoals.away.toFixed(1)}` : "数据同步中")}</p>}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-[#111827] p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-blue-300" /><h2 className="text-lg font-semibold text-white">比分概率 TOP5</h2></div>
        {scoreItems.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{scoreItems.map((item) => <div key={item.score} className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-3 text-center"><p className="text-lg font-semibold text-white">{item.score}</p><p className="mt-1 text-xs text-slate-400">{item.probability === undefined ? "模型参考" : percent(item.probability)}</p></div>)}</div> : <p className="text-sm text-slate-400">比分参考数据同步中。</p>}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#111827] to-[#111d3a] p-4 sm:p-6"><div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-blue-300" /><h2 className="text-lg font-semibold text-white">AI观点</h2></div><p className="text-sm leading-7 text-slate-300">{text(content.summary ?? content.match_trend, "该比赛AI分析将在赛前生成")}</p><p className="mt-4 text-xs leading-5 text-slate-500">模型参考，不构成购买或资金决策建议。</p></section>
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-6"><div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-300" /><h2 className="text-lg font-semibold text-white">风险提示</h2></div>{risks.length ? <ul className="space-y-3 text-sm leading-6 text-slate-300">{risks.slice(0, 5).map((risk, index) => <li key={`${risk}-${index}`} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{risk}</li>)}</ul> : <p className="text-sm leading-6 text-slate-400">风险数据同步中，请结合最新阵容与赛事信息理性参考。</p>}</section>
      </div>
      <p className="text-center text-xs leading-5 text-slate-500">{decodeUnicode(`${homeTeam} vs ${awayTeam} · AI赛前信息参考`)}</p>
    </div>
  );
}
