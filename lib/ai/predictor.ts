import type { FootballMatch } from "@/lib/football/types";
import { calculateProbabilities } from "@/lib/ai/probability";
import { assessRisk } from "@/lib/ai/risk-engine";
import { predictScores } from "@/lib/ai/score-model";

export type MatchPrediction = {
  homeWin: number;
  draw: number;
  awayWin: number;
  confidence: number;
  score: string[];
  risk: string;
  recommendation: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function predictMatch(match: FootballMatch): MatchPrediction {
  const probabilities = calculateProbabilities(match);
  const risk = assessRisk(match, probabilities);
  const score = predictScores(match, probabilities);
  const sortedProbabilities = [probabilities.homeWin, probabilities.draw, probabilities.awayWin].sort((a, b) => b - a);
  const confidence = clamp(Math.round(58 + (sortedProbabilities[0] - sortedProbabilities[1]) * 1.4 - risk.riskScore * 0.12), 52, 93);
  const recommendation = probabilities.homeWin >= probabilities.awayWin && probabilities.homeWin >= probabilities.draw ? "主胜" : probabilities.awayWin >= probabilities.draw ? "客胜" : "平局";

  return { ...probabilities, confidence, score, risk: risk.riskLevel, recommendation };
}
