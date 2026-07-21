export type MatchTeam = {
  id?: string;
  name: string;
  englishName: string;
  shortName: string;
  color: string;
  secondaryColor: string;
};

export type AITeamStats = {
  attack: number;
  defense: number;
  form: number;
  homeAdvantage: number;
};

export interface MatchAIAnalysis {
  attackScore: number;
  defenseScore: number;
  formScore: number;
  homeAwayScore: number;
  possessionScore: number;
  upsetRisk: number;
}

export type MatchRisk = "低" | "中" | "高";

export type FeaturedMatch = {
  id: string;
  league: string;
  date: string;
  time: string;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  aiScore: number;
  prediction: string;
  score: string;
  risk: MatchRisk;
  homeWin: number;
  draw: number;
  awayWin: number;
};

export type CommercialTeamStats = {
  name: string;
  shortName: string;
  color: string;
  form: ("W" | "D" | "L")[];
  goalsFor: number;
  goalsAgainst: number;
  venueWinRate: number;
  venueLabel: string;
};

export type CommercialPlayer = {
  name: string;
  team: string;
  avatar: string;
  rating: number;
  goals: number;
  assists: number;
};

export type OddsTrendData = {
  market: string;
  initial: string;
  current: string;
  trend: string;
};

export type CommercialMatchData = {
  prediction: {
    homeWin: number;
    draw: number;
    awayWin: number;
    score: string;
    confidence: number;
  };
  teams: {
    home: CommercialTeamStats;
    away: CommercialTeamStats;
  };
  players: CommercialPlayer[];
  odds: OddsTrendData;
  report: {
    summary: string;
    lean: string;
    risk: string;
  };
  vipFeatures: string[];
};

export type MatchPrediction = {
  lean: string;
  firstChoice: string;
  cover: string;
  confidence: number;
  rating: number;
  score: string;
  totalGoals: string;
  upsetRisk: "low" | "medium" | "high";
  summary: string;
  modelProbability: number;
  referenceProbability: number;
};

export type LotteryRecommendation = {
  market: string;
  recommendation: string;
  alternative: string;
  confidence: number;
  explanation: string;
  handicap?: string;
  note?: string;
};

export type ScoreProbability = {
  score: string;
  probability: number;
};

export type GoalDistribution = {
  label: string;
  home: number;
  away: number;
};

export type PlayerAnalysis = {
  name: string;
  englishName: string;
  team: string;
  position: string;
  avatar: string;
  rating: number;
  stats: { label: string; value: string }[];
  formIndex: number;
  impact: string;
  note: string;
};

export type AnalysisSection = {
  title: string;
  content: string;
};

export type TeamStat = {
  label: string;
  home: number;
  away: number;
  unit?: string;
  higherIsBetter?: boolean;
};

export type RecentMatch = {
  opponent: string;
  score: string;
  result: "win" | "draw" | "loss";
  venue: "home" | "away";
};

export type HeadToHeadMatch = {
  home: string;
  away: string;
  score: string;
  date: string;
};

export type MatchRecentStats = {
  matches: RecentMatch[];
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  trend: RecentMatch["result"][];
};

export type MatchMetric = {
  label: string;
  home: number;
  away: number;
};

export type MatchFocusFactor = {
  label: string;
  value: string;
  tone: "blue" | "green" | "amber" | "violet";
};

export type MatchAnalysisData = {
  recent: {
    home: MatchRecentStats;
    away: MatchRecentStats;
  };
  headToHead: {
    matches: HeadToHeadMatch[];
    homeWins: number;
    draws: number;
    awayWins: number;
    latestScore: string;
  };
  metrics: MatchMetric[];
  focusFactors: MatchFocusFactor[];
};

export type RiskItem = {
  title: string;
  description: string;
};

export type MatchDetailData = {
  id: string;
  league: string;
  round: string;
  date: string;
  time: string;
  status: string;
  venue: string;
  city: string;
  weather: string;
  referee: string;
  updatedAt: string;
  home: MatchTeam;
  away: MatchTeam;
  homeStats: AITeamStats;
  awayStats: AITeamStats;
  aiAnalysis: { home: MatchAIAnalysis; away: MatchAIAnalysis };
  prediction: MatchPrediction;
  probabilities: { label: string; value: number; color: string }[];
  lottery: LotteryRecommendation[];
  scoreProbabilities: ScoreProbability[];
  goalDistribution: GoalDistribution[];
  players: PlayerAnalysis[];
  analysis: AnalysisSection[];
  teamStats: TeamStat[];
  recentForm: { home: RecentMatch[]; away: RecentMatch[] };
  homeVenueSummary: string;
  awayVenueSummary: string;
  headToHead: HeadToHeadMatch[];
  headToHeadSummary: { homeWins: number; draws: number; awayWins: number; averageGoals: number; bothScored: number };
  risks: RiskItem[];
};
