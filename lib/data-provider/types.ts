import type { FootballInjury, FootballRecentMatch } from "@/lib/football/types";

export type MatchTeamData = {
  id: string;
  name: string;
  logo?: string;
  rank?: number;
  points?: number;
};

export type MatchTeamStats = {
  attack: number;
  defense: number;
  form: number;
  homeAdvantage: number;
  possession: number;
  goalsFor: number;
  goalsAgainst: number;
  xG: number;
  rank: number;
  points?: number;
};

export type HeadToHeadData = {
  matches: Array<{
    home: string;
    away: string;
    score: string;
    date: string;
  }>;
  home_wins: number;
  draws: number;
  away_wins: number;
};

export type MatchData = {
  match_id: string;
  league: string;
  home_team: MatchTeamData;
  away_team: MatchTeamData;
  match_time: string;
  home_team_stats: MatchTeamStats;
  away_team_stats: MatchTeamStats;
  recent_form: {
    home: FootballRecentMatch[];
    away: FootballRecentMatch[];
  };
  head_to_head: HeadToHeadData;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  injuries: FootballInjury[];
};

export type MatchDataQuery = {
  matchId?: string;
  league?: string;
  from?: string;
  to?: string;
};

export type MatchDataProvider = {
  name: "football-api" | "mock";
  getMatches(query?: MatchDataQuery): Promise<MatchData[]>;
  getMatch(matchId: string): Promise<MatchData | null>;
};
