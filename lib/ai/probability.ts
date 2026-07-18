import type { FootballMatch, FootballTeamStats } from "@/lib/football/types";

export type OutcomeProbabilities = { homeWin: number; draw: number; awayWin: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function recentFormScore(stats: FootballTeamStats): number {
  if (!stats.recentMatches.length) return stats.form;
  const points = stats.recentMatches.reduce((total, match) => total + (match.result === "win" ? 3 : match.result === "draw" ? 1 : 0), 0);
  return (points / (stats.recentMatches.length * 3)) * 100;
}

function teamStrength(stats: FootballTeamStats, opponent: FootballTeamStats, isHome: boolean): number {
  const form = recentFormScore(stats) * 0.7 + stats.form * 0.3;
  const xGScore = clamp((stats.xG / 3) * 100, 0, 100);
  const goalOutput = clamp((stats.goalsFor / 15) * 100, 0, 100);
  const attack = stats.attack * 0.5 + xGScore * 0.3 + goalOutput * 0.2;
  const concessionScore = clamp(100 - (stats.goalsAgainst / 15) * 100, 0, 100);
  const defense = stats.defense * 0.65 + concessionScore * 0.35;
  const rankScore = clamp(100 - (stats.rank - 1) * 4, 20, 100);
  const venueScore = isHome ? stats.homeAdvantage : stats.homeAdvantage * 0.65;
  const opponentAdjustment = opponent.xG > stats.xG ? -2 : 2;

  return form * 0.28 + attack * 0.27 + defense * 0.22 + rankScore * 0.13 + venueScore * 0.1 + opponentAdjustment;
}

export function calculateProbabilities(match: FootballMatch): OutcomeProbabilities {
  const homeStrength = teamStrength(match.stats.home, match.stats.away, true);
  const awayStrength = teamStrength(match.stats.away, match.stats.home, false);
  const modelGap = homeStrength - awayStrength;
  const marketTotal = match.odds.homeWin + match.odds.draw + match.odds.awayWin || 100;
  const marketGap = ((match.odds.homeWin - match.odds.awayWin) / marketTotal) * 100;
  const combinedGap = modelGap * 0.8 + marketGap * 0.2;
  const draw = clamp(Math.round(28 - Math.abs(combinedGap) * 0.1), 16, 30);
  const remaining = 100 - draw;
  const homeWin = Math.round(remaining * clamp(0.5 + combinedGap / 120, 0.12, 0.88));

  return { homeWin, draw, awayWin: remaining - homeWin };
}
