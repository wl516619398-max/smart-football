import { AlertTriangle, BarChart3, CheckCircle2, Gauge, Sparkles } from "lucide-react";
import { decodeUnicode } from "@/lib/utils/decode-unicode";

type Prediction = {
  homeWin: number;
  draw: number;
  awayWin: number;
  confidence: number;
  recommendation: string[];
};

type MatchAnalysisPanelProps = {
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchTime: string | null;
  homeWin: number | null;
  draw: number | null;
  awayWin: number | null;
  aiScore: number | null;
  aiPick: string | null;
  riskLevel: string | null;
  prediction: Prediction;
};

function normalizeProbability(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.round(Math.max(0, Math.min(100, value <= 1 ? value * 100 : value)));
}

function percent(value: number | null) {
  return value === null ? "--" : `${value}%`;
}

function completeness(values: Array<unknown>) {
  const available = values.filter((value) => value !== null && value !== undefined && String(value).trim() !== "").length;
  return Math.round((available / values.length) * 100);
}

function probabilityBar(value: number | null, tone: string) {
  return <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${tone}`} style={{ width: `${value ?? 0}%` }} /></div>;
}

export function MatchAnalysisPanel({
  league,
  homeTeam: rawHomeTeam,
  awayTeam: rawAwayTeam,
  matchTime,
  homeWin: rawHomeWin,
  draw: rawDraw,
  awayWin: rawAwayWin,
  aiScore: rawAiScore,
  aiPick: rawAiPick,
  riskLevel: rawRiskLevel,
  prediction,
}: MatchAnalysisPanelProps) {
  const homeTeam = decodeUnicode(rawHomeTeam);
  const awayTeam = decodeUnicode(rawAwayTeam);
  const leagueName = decodeUnicode(league);
  const homeWin = normalizeProbability(rawHomeWin ?? prediction.homeWin);
  const draw = normalizeProbability(rawDraw ?? prediction.draw);
  const awayWin = normalizeProbability(rawAwayWin ?? prediction.awayWin);
  const aiScore = normalizeProbability(rawAiScore ?? prediction.confidence);
  const aiPick = decodeUnicode(rawAiPick || prediction.recommendation[0] || "数据同步中");
  const riskLevel = decodeUnicode(rawRiskLevel || "数据同步中");
  const dataCompleteness = completeness([league, homeTeam, awayTeam, matchTime, rawHomeWin, rawDraw, rawAwayWin, rawAiScore, rawAiPick, rawRiskLevel]);
  const leader = (homeWin ?? 0) >= (awayWin ?? 0) ? homeTeam : awayTeam;
  const summary = `${homeTeam}与${awayTeam}的模型观点主要基于比赛基础信息、当前胜平负概率和已有分析字段。现有数据下，${leader}方向的模型估算相对更高，但平局与另一方的概率仍然代表不可忽略的比赛变化空间。建议结合临场阵容、最新状态和比赛进程理解本页结果。`;

  const probabilityItems = [
    { label: "主胜概率", value: homeWin, tone: "bg-blue-500", text: "text-blue-300" },
    { label: "平局概率", value: draw, tone: "bg-slate-400", text: "text-slate-200" },
    { label: "客胜概率", value: awayWin, tone: "bg-emerald-500", text: "text-emerald-300" },
  ];

  return (
    <section className="mt-6 space-y-5">
      <div className="rounded-2xl border border-blue-500/20 bg-[#111827] p-4 shadow-lg shadow-blue-950/10 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><div className="flex items-center gap-2 text-xs font-medium text-blue-300"><Sparkles className="h-4 w-4" />ATHENA AI ANALYSIS</div><h2 className="mt-2 text-xl font-semibold text-white">Athena AI 分析</h2><p className="mt-1 text-xs text-slate-500">{leagueName} · {homeTeam} VS {awayTeam}</p></div>
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-200">模板化赛前分析</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {probabilityItems.map((item) => <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm text-slate-400">{item.label}</span><span className={`text-2xl font-semibold ${item.text}`}>{percent(item.value)}</span></div>{probabilityBar(item.value, item.tone)}</div>)}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-violet-500/20 bg-[#111827] p-4"><p className="text-xs text-slate-500">AI评分</p><p className="mt-2 text-2xl font-bold text-violet-200">{percent(aiScore)}</p><p className="mt-1 text-xs text-slate-500">当前比赛字段</p></div>
        <div className="rounded-2xl border border-blue-500/20 bg-[#111827] p-4"><p className="text-xs text-slate-500">AI模型观点</p><p className="mt-2 break-words text-lg font-semibold text-blue-200">{aiPick}</p></div>
        <div className="rounded-2xl border border-amber-500/20 bg-[#111827] p-4"><p className="text-xs text-slate-500">风险提示</p><p className="mt-2 break-words text-lg font-semibold text-amber-200">{riskLevel}</p></div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#111827] to-[#111d3a] p-4 sm:p-6"><div className="mb-3 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-300" /><h3 className="text-lg font-semibold text-white">Athena AI 综合观点</h3></div><p className="text-sm leading-7 text-slate-300">{summary}</p><p className="mt-4 text-xs leading-5 text-slate-500">模型分析仅作为赛事信息参考，不代表比赛结果。</p></div>
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4 sm:p-6"><div className="mb-4 flex items-center gap-2"><Gauge className="h-5 w-5 text-cyan-300" /><h3 className="text-lg font-semibold text-white">数据可靠性</h3></div><div className="space-y-4"><div><div className="flex justify-between text-sm"><span className="text-slate-400">数据完整度</span><span className="font-semibold text-cyan-200">{dataCompleteness}%</span></div>{probabilityBar(dataCompleteness, "bg-cyan-500")}</div><div className="flex items-center justify-between border-t border-slate-800 pt-4 text-sm"><span className="text-slate-400">AI一致性</span><span className="font-semibold text-blue-200">{aiScore === null ? "数据同步中" : `${aiScore}%`}</span></div><div className="flex items-start gap-2 border-t border-slate-800 pt-4 text-xs leading-5 text-slate-500"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />概率与AI字段来自当前比赛记录；缺失字段不会被虚构。</div></div></div>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-6"><div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-300" /><h3 className="text-lg font-semibold text-white">风险提示</h3></div><p className="text-sm leading-7 text-slate-300">{riskLevel === "数据同步中" ? "当前风险字段仍在同步，请结合比赛时间、阵容变化和最新赛事信息进行判断。" : `当前记录标注为“${riskLevel}”。比赛结果仍会受到临场阵容、比赛节奏和偶发事件影响，模型观点不构成确定性结论。`}</p></div>
    </section>
  );
}
