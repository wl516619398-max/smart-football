"use client";

import { useEffect } from "react";
import { AIAnalysis } from "@/components/match/AIAnalysis";
import { AIReport } from "@/components/match/AIReport";
import { AIFocusFactors } from "@/components/match/AIFocusFactors";
import { AIMetrics } from "@/components/match/AIMetrics";
import { AIRadar } from "@/components/match/AIRadar";
import { FundsDirection } from "@/components/match/FundsDirection";
import { HeadToHeadOverview } from "@/components/match/HeadToHeadOverview";
import { OddsTrend } from "@/components/match/OddsTrend";
import { PlayerCard } from "@/components/match/PlayerCard";
import { RecentFormOverview } from "@/components/match/RecentFormOverview";
import { TeamComparison } from "@/components/match/TeamComparison";
import { UpsetRisk } from "@/components/match/UpsetRisk";
import { VipGuard } from "@/components/vip/VipGuard";
import type { OddsAnalysis } from "@/lib/ai/odds-engine";
import type { MatchPrediction } from "@/lib/ai/predictor";
import type { RiskAssessment } from "@/lib/ai/risk-engine";
import type { UpsetAnalysis } from "@/lib/ai/upset-engine";
import { savePrediction } from "@/lib/supabase/auth";
import type { CommercialMatchData, MatchDetailData } from "@/types/match";
import type { Prediction } from "@/types/prediction";

function summarizeRecent(items: MatchDetailData["recentForm"]["home"]) {
  return items.reduce((summary, item) => {
    const [goalsFor, goalsAgainst] = item.score.split(":").map(Number);
    summary.matches.push(item);
    summary.wins += item.result === "win" ? 1 : 0;
    summary.draws += item.result === "draw" ? 1 : 0;
    summary.losses += item.result === "loss" ? 1 : 0;
    summary.goalsFor += Number.isFinite(goalsFor) ? goalsFor : 0;
    summary.goalsAgainst += Number.isFinite(goalsAgainst) ? goalsAgainst : 0;
    return summary;
  }, { matches: [] as MatchDetailData["recentForm"]["home"], wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 });
}

function createLegacyAnalysis(match: MatchDetailData) {
  const recent = { home: summarizeRecent(match.recentForm.home), away: summarizeRecent(match.recentForm.away) };
  const headToHead = { matches: match.headToHead.slice(0, 10), ...match.headToHeadSummary, latestScore: match.headToHead[0]?.score ?? "暂无数据" };
  const metrics = [
    { label: "攻击指数", home: match.homeStats.attack, away: match.awayStats.attack },
    { label: "防守指数", home: match.homeStats.defense, away: match.awayStats.defense },
    { label: "状态指数", home: match.homeStats.form, away: match.awayStats.form },
    { label: "稳定性指数", home: 100 - match.aiAnalysis.home.upsetRisk, away: 100 - match.aiAnalysis.away.upsetRisk },
  ];
  const focusFactors = [
    { label: "主场优势", value: `${match.homeStats.homeAdvantage} 分`, tone: "blue" as const },
    { label: "最近状态", value: match.homeStats.form >= match.awayStats.form ? "主队领先" : "客队领先", tone: "green" as const },
    { label: "历史交锋", value: `${headToHead.homeWins}-${headToHead.draws}-${headToHead.awayWins}`, tone: "violet" as const },
    { label: "伤病影响", value: "赛前确认", tone: "amber" as const },
    { label: "比赛密度", value: "近5场样本", tone: "amber" as const },
    { label: "数据一致性", value: `${match.prediction.confidence}%`, tone: "blue" as const },
  ];
  return { recent, headToHead, metrics, focusFactors };
}

type MatchAccessProps = {
  match: MatchDetailData;
  commercial: CommercialMatchData;
  prediction: MatchPrediction;
  athenaPrediction: Prediction;
  risk: RiskAssessment;
  report: string;
  aiLean: string;
  recommendation: string;
  oddsAnalysis: OddsAnalysis;
  upsetAnalysis: UpsetAnalysis;
};

export function MatchAccess({ match, commercial, prediction, athenaPrediction, risk, report, aiLean, recommendation, oddsAnalysis, upsetAnalysis }: MatchAccessProps) {
  const analysisData = createLegacyAnalysis(match);

  useEffect(() => {
    void savePrediction({ matchId: match.id, prediction: prediction.recommendation, confidence: prediction.confidence, score: prediction.score[0] });
  }, [match.id, prediction.confidence, prediction.recommendation, prediction.score]);

  return <>
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"><AIRadar homeTeam={match.home.name} awayTeam={match.away.name} home={match.aiAnalysis.home} away={match.aiAnalysis.away} /><TeamComparison teams={commercial.teams} /></div>
    <div className="grid gap-6 lg:grid-cols-2"><AIMetrics homeTeam={match.home.name} awayTeam={match.away.name} metrics={analysisData.metrics} /><AIFocusFactors factors={analysisData.focusFactors} /></div>
    <RecentFormOverview homeTeam={match.home.name} awayTeam={match.away.name} home={analysisData.recent.home} away={analysisData.recent.away} />
    <HeadToHeadOverview homeTeam={match.home.name} awayTeam={match.away.name} data={analysisData.headToHead} />
    <AIAnalysis match={match} prediction={athenaPrediction} />
    <section><div className="mb-4"><p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400">Player intelligence</p><h2 className="mt-1 text-xl font-bold text-white">球员状态分析</h2></div><div className="grid gap-4 md:grid-cols-2">{commercial.players.map((player) => <PlayerCard key={player.name} player={player} />)}</div></section>
    <VipGuard features={commercial.vipFeatures}><div className="grid gap-6 lg:grid-cols-2"><UpsetRisk riskLevel={upsetAnalysis.upsetProbability} riskReason={upsetAnalysis.reason} /><OddsTrend odds={commercial.odds} aiLean={aiLean} /></div><FundsDirection /><AIReport report={{ ...commercial.report, summary: report, lean: prediction.recommendation, risk: `${risk.riskReason} 数据不确定性指数 ${risk.riskScore}%` }} recommendation={recommendation} oddsAnalysis={oddsAnalysis} upsetAnalysis={upsetAnalysis} /></VipGuard>
  </>;
}
