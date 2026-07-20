import type { AITeamStats } from "@/types/match";
import type { Prediction, PredictionRiskLevel } from "@/types/prediction";

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

export type AthenaPredictionTeamInput = {
  rank: number;
  recentForm: Array<"W" | "D" | "L"> | number;
  attackStrength: number;
  defenseStrength: number;
};

export type AthenaPredictionInput = {
  matchId: string;
  homeTeam: AthenaPredictionTeamInput;
  awayTeam: AthenaPredictionTeamInput;
  h2h?: { homeWins: number; draws: number; awayWins: number };
};

function formScore(form: AthenaPredictionTeamInput["recentForm"]) {
  if (typeof form === "number") return clamp(form, 0, 100);
  if (!form.length) return 50;
  const points = form.reduce((sum, result) => sum + (result === "W" ? 3 : result === "D" ? 1 : 0), 0);
  return (points / (form.length * 3)) * 100;
}

function rankScore(rank: number) {
  return clamp(100 - (Math.max(rank, 1) - 1) * 4, 20, 100);
}

function teamStrength(team: AthenaPredictionTeamInput, homeAdvantage = 0) {
  return rankScore(team.rank) * 0.25 + formScore(team.recentForm) * 0.3 + clamp(team.attackStrength, 0, 100) * 0.25 + clamp(team.defenseStrength, 0, 100) * 0.2 + homeAdvantage;
}

function riskFor(input: AthenaPredictionInput, gap: number): PredictionRiskLevel {
  const homeForm = formScore(input.homeTeam.recentForm);
  const awayForm = formScore(input.awayTeam.recentForm);
  const volatility = Math.abs(homeForm - 50) < 12 || Math.abs(awayForm - 50) < 12 ? 18 : 0;
  const h2h = input.h2h ?? { homeWins: 0, draws: 0, awayWins: 0 };
  const h2hTotal = h2h.homeWins + h2h.draws + h2h.awayWins;
  const closeHistory = h2hTotal > 0 && Math.abs(h2h.homeWins - h2h.awayWins) <= 1 ? 12 : 0;
  const riskScore = clamp(58 - Math.abs(gap) * 0.8 + volatility + closeHistory, 0, 100);
  return riskScore >= 68 ? "高" : riskScore >= 42 ? "中" : "低";
}

export function generateAthenaPrediction(input: AthenaPredictionInput): Prediction {
  const homeStrength = teamStrength(input.homeTeam, 6);
  const awayStrength = teamStrength(input.awayTeam);
  const gap = homeStrength - awayStrength;
  const h2h = input.h2h ?? { homeWins: 0, draws: 0, awayWins: 0 };
  const h2hTotal = h2h.homeWins + h2h.draws + h2h.awayWins;
  const h2hAdjustment = h2hTotal ? (h2h.homeWins - h2h.awayWins) * 0.8 : 0;
  const adjustedGap = gap + h2hAdjustment;
  const drawProbability = clamp(Math.round(29 - Math.abs(adjustedGap) * 0.1), 18, 30);
  const remaining = 100 - drawProbability;
  const homeShare = clamp(0.5 + adjustedGap / 110, 0.15, 0.85);
  const homeWinProbability = Math.round(remaining * homeShare);
  const awayWinProbability = remaining - homeWinProbability;
  const top = Math.max(homeWinProbability, drawProbability, awayWinProbability);
  const second = [homeWinProbability, drawProbability, awayWinProbability].sort((a, b) => b - a)[1];
  const athenaScore = clamp(Math.round(58 + (top - second) * 1.25 - (riskFor(input, adjustedGap) === "高" ? 8 : riskFor(input, adjustedGap) === "中" ? 3 : 0)), 50, 94);
  const riskLevel = riskFor(input, adjustedGap);
  const recommendation = homeWinProbability >= awayWinProbability && homeWinProbability >= drawProbability ? "模型观点：主队方向" : awayWinProbability >= drawProbability ? "模型观点：客队方向" : "模型观点：平局观察";
  const factors = [
    `排名维度：主队第${input.homeTeam.rank}名，客队第${input.awayTeam.rank}名`,
    `近期状态：主队${Math.round(formScore(input.homeTeam.recentForm))}，客队${Math.round(formScore(input.awayTeam.recentForm))}`,
    `攻防对比：主队攻击${Math.round(input.homeTeam.attackStrength)} / 防守${Math.round(input.homeTeam.defenseStrength)}，客队攻击${Math.round(input.awayTeam.attackStrength)} / 防守${Math.round(input.awayTeam.defenseStrength)}`,
  ];
  if (h2hTotal) factors.push(`历史交锋样本：主队${h2h.homeWins}胜、${h2h.draws}平、客队${h2h.awayWins}胜`);

  return { matchId: input.matchId, homeWinProbability, drawProbability, awayWinProbability, athenaScore, riskLevel, recommendation, factors };
}
