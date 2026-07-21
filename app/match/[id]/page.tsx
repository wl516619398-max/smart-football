import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComplianceDisclaimer } from "@/components/common/ComplianceDisclaimer";
import { RecentMatchTracker } from "@/components/common/RecentMatchTracker";
import { MatchAccess } from "@/components/match/MatchAccess";
import { MatchHeader } from "@/components/match/MatchHeader";
import { PredictionCard } from "@/components/match/PredictionCard";
import { getCommercialMatchBySlug, getFootballMatchFallback, matchDetails } from "@/data/matches";
import { analyzeOdds } from "@/lib/ai/odds-engine";
import { generateAthenaPrediction } from "@/lib/ai/prediction-engine";
import { predictMatch } from "@/lib/ai/predictor";
import { assessRisk } from "@/lib/ai/risk-engine";
import { detectUpset } from "@/lib/ai/upset-engine";

export function generateStaticParams() {
  return matchDetails.map((match) => ({ id: match.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = getCommercialMatchBySlug(id);
  if (!result) return { title: "比赛详情 | Project Athena" };
  return { title: `${result.match.home.name} VS ${result.match.away.name} | Project Athena`, description: "Athena AI 足球赛事数据分析，包含模型估算概率、球队实力、球员状态、市场数据变化与深度报告。" };
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = getCommercialMatchBySlug(id);
  if (!result) notFound();
  const { match, commercial } = result;
  const footballMatch = getFootballMatchFallback(match.id);
  if (!footballMatch) notFound();

  const prediction = predictMatch(footballMatch);
  const athenaPrediction = generateAthenaPrediction({
    matchId: match.id,
    homeTeam: { rank: footballMatch.stats.home.rank, recentForm: footballMatch.stats.home.recentMatches.map((item) => item.result === "win" ? "W" : item.result === "draw" ? "D" : "L"), attackStrength: footballMatch.stats.home.attack, defenseStrength: footballMatch.stats.home.defense },
    awayTeam: { rank: footballMatch.stats.away.rank, recentForm: footballMatch.stats.away.recentMatches.map((item) => item.result === "win" ? "W" : item.result === "draw" ? "D" : "L"), attackStrength: footballMatch.stats.away.attack, defenseStrength: footballMatch.stats.away.defense },
    h2h: { homeWins: match.headToHeadSummary.homeWins, draws: match.headToHeadSummary.draws, awayWins: match.headToHeadSummary.awayWins },
  });
  const risk = assessRisk(footballMatch, prediction);
  const oddsAnalysis = analyzeOdds(footballMatch, prediction);
  const upsetAnalysis = detectUpset(footballMatch, prediction);
  const report = `根据最近比赛、主客场表现、进球失球、xG、排名与市场数据综合分析，模型观点为${prediction.recommendation}，模型预测比分为 ${prediction.score[0]}。数据样本存在局限性，比赛结果仍具有不确定性。`;
  const aiLean = prediction.recommendation === "主胜" ? "偏向主胜" : prediction.recommendation === "客胜" ? "偏向客胜" : "防范平局";
  const recommendation = `${prediction.recommendation}方向，关注${prediction.score[0]}等候选比分，仅供赛事研究参考。`;

  return <div className="min-h-screen bg-[#0F172A] text-slate-100"><RecentMatchTracker matchId={match.id} /><main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"><MatchHeader match={match} /><PredictionCard match={match} prediction={athenaPrediction} /><MatchAccess match={match} commercial={commercial} prediction={prediction} athenaPrediction={athenaPrediction} risk={risk} report={report} aiLean={aiLean} recommendation={recommendation} oddsAnalysis={oddsAnalysis} upsetAnalysis={upsetAnalysis} /><ComplianceDisclaimer className="pb-4 text-center" /></main></div>;
}
