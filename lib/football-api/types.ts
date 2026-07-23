export type FootballApiEnvelope<T> = {
  get?: string;
  errors?: Record<string, unknown> | string[];
  results?: number;
  response?: T;
};

export type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    venue?: { name?: string | null };
    status?: { short?: string | null; long?: string | null };
  };
  league: { id: number; name: string; season: number };
  teams: {
    home: { id: number; name: string; logo?: string | null };
    away: { id: number; name: string; logo?: string | null };
  };
  goals?: { home?: number | null; away?: number | null };
};

export type ApiTeam = {
  team: { id: number; name: string; logo?: string | null };
};

export type ApiTeamStatistics = {
  team?: { id?: number; name?: string; logo?: string | null };
  fixtures?: { played?: { total?: number | null }; wins?: { total?: number | null }; draws?: { total?: number | null }; loses?: { total?: number | null } };
  goals?: {
    for?: { total?: number | null; average?: { total?: string | null } };
    against?: { total?: number | null; average?: { total?: string | null } };
  };
  form?: string | null;
};

export type UpcomingMatch = {
  external_id: string;
  fixture_id: number;
  league_id: string;
  league: string;
  season: number;
  home_team_id: string;
  home_team: string;
  home_logo?: string;
  away_team_id: string;
  away_team: string;
  away_logo?: string;
  match_time: string;
  status: string;
  venue?: string;
};

export type FootballApiTeam = {
  football_data_id: string;
  name: string;
  canonical_name: string;
  league: string;
  logo?: string;
};

export type FootballApiTeamStatistics = {
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

export type FootballApiOdds = {
  match_id: string;
  home_odds: number | null;
  draw_odds: number | null;
  away_odds: number | null;
  source: "api-football" | "mock";
};

export type FootballApiHistory = {
  external_id: string;
  provider: "api-football" | "mock";
  league: string;
  match_time: string;
  status: string;
  home_team_id: string;
  home_team: string;
  away_team_id: string;
  away_team: string;
  home_score: number;
  away_score: number;
  venue?: string;
};
