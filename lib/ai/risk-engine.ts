import type { FootballMatch, FootballTeamStats } from "@/lib/football/types";
import type { OutcomeProbabilities } from "@/lib/ai/probability";

export type RiskAssessment = { riskScore: number; riskLevel: "低" | "中" | "高"; riskReason: string };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function formVolatility(stats: FootballTeamStats): number {
  if (!stats.recentMatches.length) return 35;
  const results: number[] = stats.recentMatches.map((match) => (match.result === "win" ? 3 : match.result === "draw" ? 1 : 0));
  const average = results.reduce((sum, value) => sum + value, 0) / results.length;
  return results.reduce((sum, value) => sum + Math.abs(value - average), 0) / results.length / 3 * 100;
}

export function assessRisk(match: FootballMatch, probabilities: OutcomeProbabilities): RiskAssessment {
  const home = match.stats.home;
  const away = match.stats.away;
  const rankGap = Math.abs(home.rank - away.rank);
  const formRisk = (formVolatility(home) + formVolatility(away)) / 2;
  const defenseRisk = ((100 - home.defense) + (100 - away.defense)) / 2;
  const marketDisagreement = Math.abs(probabilities.homeWin - match.odds.homeWin) + Math.abs(probabilities.awayWin - match.odds.awayWin);
  const closeGameRisk = clamp(42 - rankGap * 2, 12, 42);
  const riskScore = clamp(Math.round(closeGameRisk + formRisk * 0.28 + defenseRisk * 0.22 + marketDisagreement * 0.35), 0, 100);
  const riskLevel = riskScore >= 65 ? "高" : riskScore >= 40 ? "中" : "低";
  const attackLeader = home.attack >= away.attack ? match.homeTeam.name : match.awayTeam.name;
  const riskReason = `${attackLeader}近期攻击效率较高，结合双方状态波动与防守稳定性，存在比赛走势偏离模型预期的可能。`;

  return { riskScore, riskLevel, riskReason };
}
