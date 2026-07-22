export type FootballTeam = {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
};

export type FootballOdds = {
  homeWin: number;
  draw: number;
  awayWin: number;
  asianHandicap?: { initial: string; current: string };
};

export type FootballRecentMatch = {
  result: "win" | "draw" | "loss";
  goalsFor: number;
  goalsAgainst: number;
  venue: "home" | "away";
  matchId?: string;
  opponent?: string;
  date?: string;
  score?: string;
};

export type FootballTeamForm = {
  teamId: string;
  matches: FootballRecentMatch[];
};

export type FootballStanding = {
  teamId: string;
  teamName: string;
  league: string;
  rank: number;
  played: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type FootballTeamStats = {
  teamId: string;
  attack: number;
  defense: number;
  form: number;
  homeAdvantage: number;
  possession: number;
  recentMatches: FootballRecentMatch[];
  goalsFor: number;
  goalsAgainst: number;
  xG: number;
  rank: number;
};

export type FootballMatchStats = {
  home: FootballTeamStats;
  away: FootballTeamStats;
};

export type FootballInjury = {
  playerId: string;
  playerName: string;
  teamId: string;
  status: "out" | "doubtful" | "available";
  reason?: string;
};

export type FootballMatch = {
  id: string;
  league: string;
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
  date: string;
  status?: string;
  venue: string;
  odds: FootballOdds;
  stats: FootballMatchStats;
  injuries: FootballInjury[];
};

export type ApiFootballEnvelope<T> = {
  get: string;
  errors: Record<string, string | string[]> | string[];
  results: number;
  response: T;
};

export type ApiFootballFixture = {
  fixture: {
    id: number;
    date: string;
    venue: { name: string | null };
    status?: { short?: string | null; long?: string | null };
  };
  league: { id: number; name: string; season: number };
  teams: {
    home: { id: number; name: string; logo: string | null };
    away: { id: number; name: string; logo: string | null };
  };
  goals: { home: number | null; away: number | null };
};

export type ApiFootballTeamStatistics = {
  team: { id: number; name: string; logo: string | null };
  league: { id: number; name: string; season: number; standings?: boolean };
  fixtures: {
    played: { total: number | null };
    wins: { total: number | null };
    draws: { total: number | null };
    loses: { total: number | null };
  };
  goals: {
    for: { total: number | null; average: { total: string | null } };
    against: { total: number | null; average: { total: string | null } };
  };
  form: string | null;
  biggest?: { wins?: { home: string | null; away: string | null } };
  lineups?: Array<{ formation: string; played: number }>;
};
