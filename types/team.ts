export type Team = {
  id: string;
  name: string;
  logo?: string;
  league: string;
  rank: number;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type TeamRecentMatch = {
  id: string;
  opponent: string;
  date: string;
  score: string;
  result: "win" | "draw" | "loss";
  venue: "home" | "away";
};

export type TeamStats = {
  attackIndex: number;
  defenseIndex: number;
  athenaStatusIndex: number;
};
