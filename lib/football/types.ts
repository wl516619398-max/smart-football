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
  venue: string;
  odds: FootballOdds;
  stats: FootballMatchStats;
  injuries: FootballInjury[];
};
