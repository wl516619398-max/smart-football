export type Team = {
  name: string;
  shortName: string;
  logo: string;
  color: string;
};

export type Player = {
  name: string;
  position: string;
  team: string;
  rating: number;
  goals: number;
  assists: number;
  avatar: string;
};

export type Match = {
  id: string;
  league: string;
  date: string;
  time: string;
  status: "upcoming" | "live" | "finished";
  home: Team;
  away: Team;
  homeWin: number;
  draw: number;
  awayWin: number;
  prediction: string;
  confidence: number;
  aiPick: string;
  venue: string;
  form: { home: string[]; away: string[] };
};

export type Insight = {
  title: string;
  description: string;
  tone: "blue" | "green" | "amber";
};
