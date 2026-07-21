import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer } from "@/components/common/Disclaimer";
import { ReportAccessPanel } from "@/components/report/ReportAccessPanel";
import { ReportBasisCard } from "@/components/report/ReportBasisCard";
import { ReportConfidenceDetails } from "@/components/report/ReportConfidenceDetails";
import { ReportDataSources } from "@/components/report/ReportDataSources";
import { ReportGenerationTimeline } from "@/components/report/ReportGenerationTimeline";
import { ReportMatchHeader } from "@/components/report/ReportMatchHeader";
import { getAiMatchAnalysis } from "@/lib/db/ai-match-analysis";
import { getFixtureDetail } from "@/lib/football/fixture-service";
import { getFixtureOdds } from "@/lib/football/odds";
import { calculateFootballStrengthRating } from "@/lib/football/rating";
import { footballMatchToMatchCenterRow } from "@/lib/football/match-center";
import { getTeamDisplayName } from "@/lib/football/team-name-map";
import { getTeamRecentStats, type TeamRecentStats } from "@/lib/football/stats";
import { calculateOddsValue } from "@/lib/odds/value-engine";
import { predictMatch } from "@/lib/prediction/engine";
import type { PredictionTeamStats } from "@/lib/prediction/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AiMatchAnalysisRow } from "@/types/ai-match-analysis";
import type { MatchRecentStats } from "@/types/match";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `AI球探报告 | ${id} | Project Athena`, description: "Project Athena 专业足球数据与 AI 赛前球探报告。" };
}

type MatchRow = {
  [key: string]: unknown;
  external_id: string;
  league: string | null;
  home_team: string | null;
  away_team: string | null;
  match_time: string | null;
  home_logo?: string | null;
  away_logo?: string | null;
  home_team_id?: string | number | null;
  away_team_id?: string | number | null;
  status?: string | null;
};

type ScoreOption = { score: string; probability: number };

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function teamId(name: string, fallback: string) {
  const ids: Record<string, string> = {
    "manchester united": "33",
    "曼彻斯特联": "33",
    "曼联": "33",
    liverpool: "40",
    "利物浦": "40",
    "manchester city": "50",
    "曼城": "50",
    arsenal: "42",
    "阿森纳": "42",
    chelsea: "49",
    "切尔西": "49",
    "real madrid": "541",
    "皇家马德里": "541",
    barcelona: "529",
    "巴塞罗那": "529",
    "bayern munich": "157",
    "拜仁慕尼黑": "157",
    "borussia dortmund": "165",
    "多特蒙德": "165",
  };
  return ids[name.trim().toLocaleLowerCase()] ?? fallback;
}

async function getMatch(id: string): Promise<MatchRow | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("matches").select("*").eq("external_id", id).maybeSingle();
    if (!error && data) return data as MatchRow;
  }

  const fixture = await getFixtureDetail(id);
  return fixture ? footballMatchToMatchCenterRow(fixture) as MatchRow : null;
}

function emptyStats(team: string): TeamRecentStats {
  return { team, source: "fallback", recentMatches: [], last10: { win: 0, draw: 0, loss: 0 }, goals: { scored: 0, conceded: 0 } };
}

function toPredictionStats(rating: ReturnType<typeof calculateFootballStrengthRating>, homeAdvantage: number): PredictionTeamStats {
  return { attack: rating.attackScore, defense: rating.defenseScore, form: rating.formScore, homeAdvantage };
}

function normalizeRecent(stats: TeamRecentStats): MatchRecentStats {
  return {
    matches: stats.recentMatches.slice(0, 5).map((match) => ({
      opponent: getTeamDisplayName(match.opponent),
      score: (match.score ?? "0-0").replace("-", ":"),
      result: match.result,
      venue: match.venue,
    })),
    wins: stats.last10.win,
    draws: stats.last10.draw,
    losses: stats.last10.loss,
    goalsFor: stats.goals.scored,
    goalsAgainst: stats.goals.conceded,
    trend: stats.recentMatches.slice(0, 5).map((match) => match.result),
  };
}

function storedText(analysis: AiMatchAnalysisRow | null, key: keyof NonNullable<AiMatchAnalysisRow["analysis"]>, fallback: string) {
  return text(analysis?.analysis?.[key] ?? analysis?.[key], fallback);
}

function scoreOptions(stored: AiMatchAnalysisRow | null, prediction: ReturnType<typeof predictMatch>): ScoreOption[] {
  const parsed = [...storedText(stored, "score_prediction", "").matchAll(/(\d+)\s*[-:]\s*(\d+)/g)].map((match) => `${match[1]}-${match[2]}`);
  const defaults = [`${Math.round(prediction.expectedGoals.home)}-${Math.round(prediction.expectedGoals.away)}`, "1-1", prediction.homeWin >= prediction.awayWin ? "2-1" : "1-2"];
  return [...new Set([...parsed, ...defaults])].slice(0, 3).map((score, index) => ({ score, probability: [36, 22, 15][index] ?? 12 }));
}

function riskLabel(confidence: number) {
  return confidence >= 75 ? "低风险" : confidence >= 55 ? "中风险" : "高风险";
}

export default async function MatchReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();

  const homeTeam = getTeamDisplayName(text(match.home_team, "主队"));
  const awayTeam = getTeamDisplayName(text(match.away_team, "客队"));
  const homeId = text(match.home_team_id, teamId(homeTeam, "33"));
  const awayId = text(match.away_team_id, teamId(awayTeam, "40"));
  const [homeRaw, awayRaw, storedAnalysis, fixtureOdds] = await Promise.all([
    getTeamRecentStats(homeId).catch(() => emptyStats(homeTeam)),
    getTeamRecentStats(awayId).catch(() => emptyStats(awayTeam)),
    getAiMatchAnalysis(id),
    getFixtureOdds(id),
  ]);

  const homeRatingRaw = calculateFootballStrengthRating(homeRaw);
  const awayRatingRaw = calculateFootballStrengthRating(awayRaw);
  const prediction = predictMatch(toPredictionStats(homeRatingRaw, 90), toPredictionStats(awayRatingRaw, 50));
  const oddsValue = calculateOddsValue({ prediction: { homeWin: prediction.homeWin, draw: prediction.draw, awayWin: prediction.awayWin }, odds: { home: fixtureOdds.home.odds, draw: fixtureOdds.draw.odds, away: fixtureOdds.away.odds } });
  const confidence = number(storedAnalysis?.confidence, prediction.confidence);
  const dataComplete = homeRatingRaw.dataAvailable && awayRatingRaw.dataAvailable;
  const summary = storedText(storedAnalysis, "summary", "该比赛AI分析将在赛前生成");
  const sections = [
    { title: "比赛背景分析", icon: "trend" as const, content: storedText(storedAnalysis, "match_background", "该比赛的赛前背景信息正在整理，报告将在赛前生成。") },
    { title: "双方实力分析", icon: "strength" as const, content: storedText(storedAnalysis, "strength_analysis", `${homeTeam}与${awayTeam}的攻防能力对比将在完整报告生成后展示。`) },
    { title: "近期状态分析", icon: "trend" as const, content: storedText(storedAnalysis, "recent_form_analysis", "当前正在同步双方最近5场比赛、进失球和对手强度数据。") },
    { title: "战术特点分析", icon: "tactical" as const, content: storedText(storedAnalysis, "tactical_analysis", "双方可能的推进、转换和防守变化将在完整 AI 报告中展示。") },
    { title: "胜平负原因", icon: "strength" as const, content: storedText(storedAnalysis, "result_reasoning", "模型会结合主客场、近期状态与攻防指标解释胜平负概率。") },
  ];
  const basisItems = [
    { label: "近期状态", weight: 30, value: dataComplete ? Math.round((homeRatingRaw.formScore + awayRatingRaw.formScore) / 2) : null, description: "参考最近比赛结果、进失球与样本连续性。", icon: "form" as const },
    { label: "进攻能力", weight: 25, value: dataComplete ? Math.round((homeRatingRaw.attackScore + awayRatingRaw.attackScore) / 2) : null, description: "参考进球效率、机会创造和预期进球相关指标。", icon: "attack" as const },
    { label: "防守能力", weight: 25, value: dataComplete ? Math.round((homeRatingRaw.defenseScore + awayRatingRaw.defenseScore) / 2) : null, description: "参考失球、限制对手机会和防守稳定性。", icon: "defense" as const },
    { label: "主客场因素", weight: 20, value: dataComplete ? 70 : null, description: "主队主场环境与客队客场表现会影响基础概率。", icon: "home" as const },
  ];
  const phases = [
    { label: "0-15分钟", detail: "双方可能先观察节奏，主队主场推进与客队防守站位是重点。", intensity: 42 },
    { label: "15-30分钟", detail: "中场争夺和边路转换可能增加，机会质量取决于推进效率。", intensity: 58 },
    { label: "30-60分钟", detail: "比赛进入策略调整阶段，领先方的控节奏能力值得关注。", intensity: 68 },
    { label: "60-90分钟", detail: "体能、替补和比分状态可能放大攻防转换的影响。", intensity: 76 },
  ];
  const oddsRows = [
    { label: "主胜", odds: fixtureOdds.home.odds, market: Math.round(oddsValue.impliedProbability.home * 100), model: prediction.homeWin, value: oddsValue.value.home > 0.05 ? "★★★★☆" : oddsValue.value.home < -0.05 ? "★★☆☆☆" : "★★★☆☆" },
    { label: "平局", odds: fixtureOdds.draw.odds, market: Math.round(oddsValue.impliedProbability.draw * 100), model: prediction.draw, value: oddsValue.value.draw > 0.05 ? "★★★★☆" : "★★★☆☆" },
    { label: "客胜", odds: fixtureOdds.away.odds, market: Math.round(oddsValue.impliedProbability.away * 100), model: prediction.awayWin, value: oddsValue.value.away > 0.05 ? "★★★★☆" : oddsValue.value.away < -0.05 ? "★★☆☆☆" : "★★★☆☆" },
  ];
  const risks = [storedText(storedAnalysis, "risk_warning", "当前报告尚未生成，暂无法提供完整风险提示。"), "主力伤停与首发信息可能影响临场表现。", "单场比赛存在随机性，数据样本不能覆盖全部变量。"];
  const rating = (confidence / 20).toFixed(1);

  return <main className="mx-auto w-full max-w-7xl px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
    <Link href={`/matches/${id}`} className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"><ArrowLeft className="h-4 w-4" />返回比赛详情</Link>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-blue-300"><BrainCircuit className="h-4 w-4" />ATHENA SCOUT REPORT</div><h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">AI 球探报告</h1><p className="mt-2 text-sm text-slate-500">专业足球数据、模型观点与赛前信息解读</p></div><span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400">报告版本：{storedAnalysis?.version ?? storedAnalysis?.analysis_version ?? "待生成"}</span></div>
    <ReportMatchHeader homeTeam={homeTeam} awayTeam={awayTeam} homeLogo={text(match.home_logo) || null} awayLogo={text(match.away_logo) || null} league={text(match.league, "赛事信息待定")} matchTime={match.match_time} status={text(match.status, "赛前分析")} confidence={confidence} riskLabel={riskLabel(confidence)} />
    <div className="mt-6 grid gap-6 lg:grid-cols-2"><ReportBasisCard items={basisItems} /><ReportConfidenceDetails value={confidence} dataComplete={dataComplete} factors={["球队状态与攻防指标", "主客场环境因素", "胜平负概率一致性", "数据来源更新时间"]} /></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2"><ReportDataSources generatedAt={new Date().toISOString()} hasAnalysis={Boolean(storedAnalysis)} /><ReportGenerationTimeline hasAnalysis={Boolean(storedAnalysis)} /></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"><ReportAccessPanel summary={summary} sections={sections} homeTeam={homeTeam} awayTeam={awayTeam} homeStats={normalizeRecent(homeRaw)} awayStats={normalizeRecent(awayRaw)} ratings={{ home: { attack: homeRatingRaw.dataAvailable ? homeRatingRaw.attackScore : null, defense: homeRatingRaw.dataAvailable ? homeRatingRaw.defenseScore : null, form: homeRatingRaw.dataAvailable ? homeRatingRaw.formScore : null, overall: homeRatingRaw.dataAvailable ? homeRatingRaw.overallScore : null }, away: { attack: awayRatingRaw.dataAvailable ? awayRatingRaw.attackScore : null, defense: awayRatingRaw.dataAvailable ? awayRatingRaw.defenseScore : null, form: awayRatingRaw.dataAvailable ? awayRatingRaw.formScore : null, overall: awayRatingRaw.dataAvailable ? awayRatingRaw.overallScore : null } }} keyPlayers={{ home: "关键球员数据同步中", away: "关键球员数据同步中" }} phases={phases} scoreOptions={scoreOptions(storedAnalysis, prediction)} probabilities={{ home: prediction.homeWin, draw: prediction.draw, away: prediction.awayWin }} oddsRows={oddsRows} risks={risks} /><Card className="h-fit border-slate-800 bg-[#111827]"><CardHeader><CardTitle className="text-base text-white">报告索引</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-slate-400"><p>本页包含比赛概览、分析依据、可信度解释、近期状态、战术分析、走势预测和市场数据变化分析。</p><div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-3"><p className="text-xs text-blue-200">公开内容</p><p className="mt-2 text-xs leading-6">AI综合观点预览、胜平负概率、基础数据来源</p></div><div className="rounded-xl border border-violet-500/15 bg-violet-500/5 p-3"><p className="text-xs text-violet-200">VIP 内容</p><p className="mt-2 text-xs leading-6">完整实力对比、战术段落、比分参考、赔率价值与风险提示</p></div><p className="border-t border-slate-800 pt-3 text-xs text-slate-500">当前评级 {rating}/5 · 报告状态 {storedAnalysis ? "已生成" : "待生成"}</p></CardContent></Card></div>
    <Disclaimer className="mt-8" />
  </main>;
}
