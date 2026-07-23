export type CollectionMatch = {
  external_id: string;
  league: string;
  home_team_id: string;
  home_team: string;
  away_team_id: string;
  away_team: string;
  match_time: string;
  status: string;
  venue?: string;
};

export type CollectionTeam = {
  id?: string;
  name: string;
  canonical_name: string;
  league: string;
  logo?: string;
};

export type CollectionTeamStatistics = {
  team_id: string;
  team_name: string;
  league: string;
  attack: number;
  defense: number;
  form: number;
  home_advantage: number;
  possession: number;
  goals_for: number;
  goals_against: number;
  xg: number;
  rank: number;
  points: number;
  recent_form: unknown[];
};

export type CollectionOdds = {
  match_id: string;
  home_odds: number;
  draw_odds: number;
  away_odds: number;
  source: "mock";
};

export type CollectionHistory = {
  external_id: string;
  league: string;
  home_team_id: string;
  home_team: string;
  away_team_id: string;
  away_team: string;
  home_score: number;
  away_score: number;
  match_time: string;
  status: "finished";
};

export type CollectionLog = {
  provider: "mock";
  entity: string;
  status: "success" | "error";
  fetched_count: number;
  inserted_count: number;
  error_message?: string;
};

export type FootballMockBundle = {
  matches: CollectionMatch[];
  teams: CollectionTeam[];
  team_statistics: CollectionTeamStatistics[];
  odds: CollectionOdds[];
  match_history: CollectionHistory[];
};
