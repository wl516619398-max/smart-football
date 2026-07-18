import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecentMatchTracker } from "@/components/common/RecentMatchTracker";
import { AIReport } from "@/components/match/AIReport";
import { AIRadar } from "@/components/match/AIRadar";
import { MatchHeader } from "@/components/match/MatchHeader";
import { OddsTrend } from "@/components/match/OddsTrend";
import { PlayerCard } from "@/components/match/PlayerCard";
import { PredictionCard } from "@/components/match/PredictionCard";
import { TeamComparison } from "@/components/match/TeamComparison";
import { UpsetRisk } from "@/components/match/UpsetRisk";
import { VIPLock } from "@/components/match/VIPLock";
import { getCommercialMatchBySlug, matchDetails } from "@/data/matches";
import { generatePrediction } from "@/lib/ai/prediction-engine";
import { generateAIReport } from "@/lib/ai/report-generator";
import { calculateRisk } from "@/lib/ai/risk-model";

export function generateStaticParams() {
  return matchDetails.map((match) => ({ slug: match.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = getCommercialMatchBySlug(slug);
  if (!result) return { title: "比赛详情 | Project Athena" };
  return { title: `${result.match.home.name} VS ${result.match.away.name} | Project Athena`, description: "Athena AI足球比赛商业版分析，包含胜率、球队实力、球员状态、盘口趋势与AI深度报告。" };
}

export default async function MatchDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = getCommercialMatchBySlug(slug);
  if (!result) notFound();
  const { match, commercial } = result;
  const prediction = generatePrediction({
    homeTeam: match.home.name,
    awayTeam: match.away.name,
    homeStats: match.homeStats,
    awayStats: match.awayStats,
  });
  const risk = calculateRisk({
    homeTeam: match.home.name,
    awayTeam: match.away.name,
    homeStats: match.homeStats,
    awayStats: match.awayStats,
  });
  const report = generateAIReport({
    homeTeam: match.home.name,
    awayTeam: match.away.name,
    homeStats: match.homeStats,
    awayStats: match.awayStats,
    prediction,
    risk,
  });

  const aiLean = prediction.homeWin >= prediction.awayWin ? "偏向主胜" : "偏向客胜";
  const recommendation = prediction.homeWin >= prediction.awayWin ? "主胜方向，关注小比分赛果。" : "客胜方向，关注客队转换效率。";

  return <div className="min-h-screen bg-[#0F172A] text-slate-100"><RecentMatchTracker matchId={match.id} /><main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"><MatchHeader match={match} /><PredictionCard match={match} prediction={{ ...prediction, score: prediction.predictedScore }} /><div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"><AIRadar homeTeam={match.home.name} awayTeam={match.away.name} home={match.aiAnalysis.home} away={match.aiAnalysis.away} /><UpsetRisk riskLevel={risk.riskLevel} riskReason={risk.riskReason} /></div><TeamComparison teams={commercial.teams} /><section><div className="mb-4"><p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400">Player intelligence</p><h2 className="mt-1 text-xl font-bold text-white">球员状态分析</h2></div><div className="grid gap-4 md:grid-cols-2">{commercial.players.map((player) => <PlayerCard key={player.name} player={player} />)}</div></section><OddsTrend odds={commercial.odds} aiLean={aiLean} /><AIReport report={{ ...commercial.report, summary: report, risk: `${risk.riskReason} 风险指数 ${risk.riskLevel}%` }} recommendation={recommendation} /><VIPLock features={commercial.vipFeatures} /><p className="pb-4 text-center text-xs text-slate-600">以上内容由 Athena Mock AI 模型生成，仅供数据分析参考。</p></main></div>;
}
