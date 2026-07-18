import type { AITeamStats } from "@/types/match";

export type PredictionEngineInput = {
  homeTeam: string;
  awayTeam: string;
  homeStats: AITeamStats;
  awayStats: AITeamStats;
};

export type PredictionResult = {
  homeWin: number;
  draw: number;
  awayWin: number;
  confidence: number;
  predictedScore: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const weightedStrength = (stats: AITeamStats) =>
  stats.form * 0.3 + stats.attack * 0.25 + stats.defense * 0.25 + stats.homeAdvantage * 0.2;

export function generatePrediction({ homeStats, awayStats }: PredictionEngineInput): PredictionResult {
  const strengthGap = weightedStrength(homeStats) - weightedStrength(awayStats);
  const draw = clamp(Math.round(30 - Math.abs(strengthGap) * 0.12), 18, 30);
  const remaining = 100 - draw;
  const homeShare = clamp(0.5 + strengthGap / 50, 0.12, 0.88);
  const homeWin = Math.round(remaining * homeShare);
  const awayWin = remaining - homeWin;

  const homeGoals = Math.round(clamp(
    0.5 + homeStats.attack / 100 * 1.6 + homeStats.form / 100 * 0.25 + homeStats.homeAdvantage / 100 * 0.3 - awayStats.defense / 100 * 0.45,
    0,
    4,
  ));
  const awayGoals = Math.round(clamp(
    0.35 + awayStats.attack / 100 * 1.5 + awayStats.form / 100 * 0.2 - homeStats.defense / 100 * 0.4 - homeStats.homeAdvantage / 100 * 0.2,
    0,
    4,
  ));

  return {
    homeWin,
    draw,
    awayWin,
    confidence: clamp(Math.round(58 + Math.abs(strengthGap) * 2 + (100 - draw) * 0.15), 55, 92),
    predictedScore: `${homeGoals}-${awayGoals}`,
  };
}
