import { predictMatch } from "@/lib/ai/predictor";
import type { FootballMatch } from "@/lib/football/types";

export type MatchCenterRow = {
  external_id: string;
  league: string;
  home_team: string;
  away_team: string;
  match_time: string;
  home_logo?: string | null;
  away_logo?: string | null;
  home_win: number | null;
  draw: number | null;
  away_win: number | null;
  ai_score: number | null;
  ai_pick?: string | null;
  risk_level?: string | null;
};

export function footballMatchToMatchCenterRow(match: FootballMatch): MatchCenterRow {
  const prediction = predictMatch(match);

  return {
    external_id: match.id,
    league: match.league,
    home_team: match.homeTeam.name,
    away_team: match.awayTeam.name,
    match_time: match.date,
    home_logo: match.homeTeam.logo ?? null,
    away_logo: match.awayTeam.logo ?? null,
    home_win: prediction.homeWin,
    draw: prediction.draw,
    away_win: prediction.awayWin,
    ai_score: prediction.confidence,
    ai_pick: prediction.recommendation,
    risk_level: prediction.risk,
  };
}

export function footballMatchesToMatchCenterRows(matches: FootballMatch[]) {
  return matches.map(footballMatchToMatchCenterRow);
}
