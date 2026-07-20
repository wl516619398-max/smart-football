import type { TeamRecentStats } from "@/lib/football/stats";

export type FootballStrengthRating = {
  attackScore: number;
  defenseScore: number;
  formScore: number;
  overallScore: number;
  dataAvailable: boolean;
};

const clampScore = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

export function calculateFootballStrengthRating(stats: TeamRecentStats): FootballStrengthRating {
  const played = stats.last10.win + stats.last10.draw + stats.last10.loss;
  if (played === 0) {
    return { attackScore: 50, defenseScore: 50, formScore: 50, overallScore: 50, dataAvailable: false };
  }

  const averageScored = stats.goals.scored / played;
  const averageConceded = stats.goals.conceded / played;
  const attackScore = clampScore((averageScored / 3) * 100);
  const defenseScore = clampScore(100 - (averageConceded / 3) * 100);
  const formPoints = stats.last10.win * 3 + stats.last10.draw;
  const formScore = clampScore((formPoints / (played * 3)) * 100);
  const overallScore = clampScore(attackScore * 0.35 + defenseScore * 0.35 + formScore * 0.3);

  return { attackScore, defenseScore, formScore, overallScore, dataAvailable: stats.source === "api" };
}
