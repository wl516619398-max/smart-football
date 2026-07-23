export type SkillTeam = {
  id: string;
  code?: string;
  name: string;
  ratingValue?: number;
  eloRating?: number;
  fifaRank?: number;
  formScore?: number;
  attackStrength?: number;
  defenseStrength?: number;
  goalsPerMatch?: number;
  goalsAgainstPerMatch?: number;
  countryCode?: string;
};

export type SkillMatch = {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  stage?: string;
  venueCountryCode?: string;
  status: "scheduled" | "live" | "finished";
};

export type SkillSnapshot = {
  metadata: {
    generatedAt: string;
    dataVersion: string;
    modelVersion: string;
  };
  teams: SkillTeam[];
  matchStates: SkillMatch[];
  contextAdjustments?: Array<{
    id: string;
    teamId?: string;
    formScoreDelta?: number;
    attackMultiplier?: number;
    defenseMultiplier?: number;
  }>;
  evidence?: {
    recentForm: unknown;
    headToHead: unknown;
    injuries: unknown;
  };
};

export type SkillProbabilityBundle = {
  homeWin: number;
  draw: number;
  awayWin: number;
};

export type SkillScoreProbability = {
  score: string;
  probability: number;
};

export type SkillModelPrediction = {
  matchId: string;
  modelVersion: string;
  probability: SkillProbabilityBundle;
  halfTimeProbability: SkillProbabilityBundle;
  goalRangeProbability: {
    zeroToOne: number;
    twoToThree: number;
    fourPlus: number;
  };
  scoreProbabilities: SkillScoreProbability[];
  expectedGoals: {
    home: number;
    away: number;
  };
  recommendation: string;
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  keyFactors: string[];
};
