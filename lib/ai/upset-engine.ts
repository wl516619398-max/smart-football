import type { FootballMatch } from "@/lib/football/types";
import type { OutcomeProbabilities } from "@/lib/ai/probability";

export type UpsetAnalysis = {
  upsetProbability: number;
  level: "低" | "中" | "高";
  underdog: string;
  favorite: string;
  opportunity: boolean;
  reason: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function detectUpset(match: FootballMatch, probabilities: OutcomeProbabilities): UpsetAnalysis {
  const homeIsFavorite = probabilities.homeWin >= probabilities.awayWin;
  const favorite = homeIsFavorite ? match.homeTeam : match.awayTeam;
  const underdog = homeIsFavorite ? match.awayTeam : match.homeTeam;
  const favoriteStats = homeIsFavorite ? match.stats.home : match.stats.away;
  const underdogStats = homeIsFavorite ? match.stats.away : match.stats.home;
  const underdogProbability = homeIsFavorite ? probabilities.awayWin : probabilities.homeWin;
  const attackEdge = underdogStats.attack - favoriteStats.attack;
  const formEdge = underdogStats.form - favoriteStats.form;
  const rankRisk = Math.max(0, 8 - Math.abs(underdogStats.rank - favoriteStats.rank));
  const marketDisagreement = Math.abs(underdogProbability - (homeIsFavorite ? match.odds.awayWin : match.odds.homeWin));
  const upsetProbability = clamp(Math.round(18 + underdogProbability * 0.25 + attackEdge * 0.25 + formEdge * 0.12 + rankRisk * 1.5 + marketDisagreement * 0.12), 5, 75);
  const level = upsetProbability >= 50 ? "高" : upsetProbability >= 32 ? "中" : "低";
  const reason = `${underdog.name}近期攻击效率${attackEdge >= 0 ? "较高" : "仍有威胁"}，结合状态、排名与市场数据偏差，存在${level === "低" ? "一定" : "较明显的"}非主流结果可能性。`;

  return { upsetProbability, level, underdog: underdog.name, favorite: favorite.name, opportunity: upsetProbability >= 32, reason };
}
