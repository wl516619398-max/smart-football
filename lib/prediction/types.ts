import type { FootballTeamStats } from "@/lib/football/types";

export type PredictionTeamStats = Pick<
  FootballTeamStats,
  "attack" | "defense" | "form" | "homeAdvantage"
>;

export type MatchPrediction = {
  homeWin: number;
  draw: number;
  awayWin: number;
  confidence: number;
  expectedGoals: {
    home: number;
    away: number;
  };
  recommendation: string[];
};
