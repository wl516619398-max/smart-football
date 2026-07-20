import { AlertTriangle, BrainCircuit, Gauge, Lightbulb, ShieldCheck, TrendingUp, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FootballAnalysisResult } from "@/lib/ai/football-analyzer";
import type { OddsValueOutput } from "@/lib/odds/value-engine";
import type { MatchPrediction, PredictionTeamStats } from "@/lib/prediction/types";

type AthenaReportCardProps = { homeTeam: string; awayTeam: string; homeStats: PredictionTeamStats; awayStats: PredictionTeamStats; prediction: MatchPrediction; oddsValue: OddsValueOutput; analysis?: FootballAnalysisResult };
type ReportCopy = { trend: string; logic: string; factors: string[]; risks: string[]; direction: string; confidence: number };
const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

function buildFallbackCopy({ homeTeam, awayTeam, homeStats, awayStats, prediction, oddsValue }: AthenaReportCardProps): ReportCopy {
  const homeScore = homeStats.attack * 0.35 + homeStats.defense * 0.25 + homeStats.form * 0.25 + homeStats.homeAdvantage * 0.15;
  const awayScore = awayStats.attack * 0.35 + awayStats.defense * 0.25 + awayStats.form * 0.25 + (100 - awayStats.homeAdvantage) * 0.15;
  const leader = prediction.homeWin >= prediction.awayWin ? homeTeam : awayTeam;
  const closeGame = Math.abs(prediction.homeWin - prediction.awayWin) < 8;
  return {
    trend: `${leader}在当前模型综合评分中暂时占优，比赛节奏预计${closeGame ? "相对接近" : "更具主动性"}，模型预计进球数约为 ${prediction.expectedGoals.home.toFixed(1)} : ${prediction.expectedGoals.away.toFixed(1)}。`,
    logic: `${homeTeam}与${awayTeam}的攻防和近期状态经过加权后，综合强度分别约为 ${Math.round(homeScore)} 与 ${Math.round(awayScore)}，主客场因素会进一步影响比赛走势。`,
    factors: [`${homeTeam}攻击指数 ${Math.round(homeStats.attack)}，${awayTeam}攻击指数 ${Math.round(awayStats.attack)}`, `${homeTeam}防守指数 ${Math.round(homeStats.defense)}，${awayTeam}防守指数 ${Math.round(awayStats.defense)}`, `近期状态指数为 ${Math.round(homeStats.form)} - ${Math.round(awayStats.form)}`, `市场数据与模型估算的最大差异约为 ${(Math.max(Math.abs(oddsValue.value.home), Math.abs(oddsValue.value.draw), Math.abs(oddsValue.value.away)) * 100).toFixed(1)}%`],
    risks: [closeGame ? "双方模型概率接近，比赛走势存在较大不确定性。" : "单场比赛可能受临场表现影响，模型优势不等于确定结果。", "当前分析未纳入完整的临场阵容、伤停和天气信息。", "现有数据维度有限，结论仅用于赛事信息参考。"],
    direction: prediction.recommendation[0] ?? `关注${leader}的比赛表现`,
    confidence: clamp(prediction.confidence),
  };
}

function buildReportCopy(props: AthenaReportCardProps): ReportCopy {
  const fallback = buildFallbackCopy(props);
  if (!props.analysis) return fallback;
  return { trend: props.analysis.analysis[0] ?? fallback.trend, logic: props.analysis.analysis[1] ?? fallback.logic, factors: props.analysis.analysis.slice(0, 4).length ? props.analysis.analysis.slice(0, 4) : fallback.factors, risks: [props.analysis.recommendation.risk, ...fallback.risks.slice(1)].filter(Boolean).slice(0, 3), direction: props.analysis.recommendation.safe || fallback.direction, confidence: clamp(props.analysis.confidence || fallback.confidence) };
}

function ReportSection({ icon: Icon, label, children, tone }: { icon: LucideIcon; label: string; children: ReactNode; tone: string }) {
  return <div className={`rounded-xl border p-4 ${tone}`}><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300"><Icon className="h-4 w-4 text-blue-300" />{label}</p><div className="mt-3 text-sm leading-6 text-slate-300">{children}</div></div>;
}

export function AthenaReportCard(props: AthenaReportCardProps) {
  const report = buildReportCopy(props);
  return <Card className="overflow-hidden border-blue-500/20 bg-gradient-to-br from-[#111827] via-[#111d3a] to-[#111827] shadow-xl shadow-blue-950/20"><CardHeader className="border-b border-white/10"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-medium text-blue-300"><BrainCircuit className="h-4 w-4" />ATHENA AI REPORT</div><CardTitle className="mt-2 text-xl text-white">Athena AI 分析报告</CardTitle><p className="mt-2 text-sm text-slate-400">基于球队能力、模型概率与市场数据生成的赛事信息解读。</p></div><div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300"><Gauge className="h-4 w-4" />模型一致性 {report.confidence}%</div></div></CardHeader><CardContent className="space-y-4 pt-5"><div className="grid gap-4 lg:grid-cols-2"><ReportSection icon={TrendingUp} label="比赛趋势" tone="border-blue-500/20 bg-blue-500/5"><p>{report.trend}</p></ReportSection><ReportSection icon={Lightbulb} label="胜负逻辑" tone="border-violet-500/20 bg-violet-500/5"><p>{report.logic}</p></ReportSection></div><div className="grid gap-4 lg:grid-cols-2"><ReportSection icon={ShieldCheck} label="关键因素" tone="border-emerald-500/20 bg-emerald-500/5"><ul className="space-y-2">{report.factors.map((factor) => <li key={factor} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{factor}</li>)}</ul></ReportSection><ReportSection icon={AlertTriangle} label="风险提醒" tone="border-amber-500/20 bg-amber-500/5"><ul className="space-y-2">{report.risks.map((risk) => <li key={risk} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{risk}</li>)}</ul></ReportSection></div><div className="flex flex-col gap-3 rounded-xl border border-blue-400/20 bg-blue-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-200">AI模型倾向</p><p className="mt-2 text-sm leading-6 text-slate-200">{report.direction}</p></div><div className="shrink-0 text-left sm:text-right"><p className="text-xs text-slate-400">模型一致性指数</p><p className="mt-1 text-2xl font-bold text-blue-300">{report.confidence}%</p></div></div><p className="text-xs leading-5 text-slate-500">本报告基于当前可用数据生成，信息维度有限，赛事结果具有不确定性，仅供赛事研究参考。</p></CardContent></Card>;
}
