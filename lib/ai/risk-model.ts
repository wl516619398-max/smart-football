import type { AITeamStats } from "@/types/match";

export type RiskModelInput = {
  homeTeam: string;
  awayTeam: string;
  homeStats: AITeamStats;
  awayStats: AITeamStats;
};

export type RiskModelResult = {
  riskLevel: number;
  riskReason: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const weightedStrength = (stats: AITeamStats) =>
  stats.form * 0.3 + stats.attack * 0.25 + stats.defense * 0.25 + stats.homeAdvantage * 0.2;

export function calculateRisk({ homeTeam, awayTeam, homeStats, awayStats }: RiskModelInput): RiskModelResult {
  const strengthGap = Math.abs(weightedStrength(homeStats) - weightedStrength(awayStats));
  const formVolatility = 100 - (homeStats.form + awayStats.form) / 2;
  const defensiveInstability = 100 - (homeStats.defense + awayStats.defense) / 2;
  const riskLevel = clamp(Math.round((100 - strengthGap) * 0.35 + formVolatility * 0.3 + defensiveInstability * 0.35), 0, 100);

  const reasons = [
    strengthGap < 10 ? `${homeTeam}与${awayTeam}实力接近` : "双方实力差距相对明显",
    formVolatility > 24 ? "近期状态波动较大" : "近期状态整体稳定",
    defensiveInstability > 25 ? "防守稳定性仍有波动" : "防守端相对稳定",
  ];

  return { riskLevel, riskReason: reasons.join("，") + "。" };
}
