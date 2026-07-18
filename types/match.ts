export type MatchTeam = {
  name: string;
  englishName: string;
  shortName: string;
  color: string;
  secondaryColor: string;
};

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
