import type { Prediction } from "@/types/prediction";

export type MatchAnalysisInput = {
  homeTeam: unknown;
  awayTeam: unknown;
  league: string;
  recentForm: unknown;
  h2h: unknown;
  standings: unknown;
  attackStrength: unknown;
  defenseStrength: unknown;
  injuries: unknown;
  matchTime: string;
};

export type AIAnalysisRequest = MatchAnalysisInput & {
  external_id?: string;
  matchId?: string;
  homeWin?: number | null;
  draw?: number | null;
  awayWin?: number | null;
  /** Legacy fields remain accepted while callers migrate to MatchAnalysisInput. */
  probabilities?: {
    homeWin: number | null;
    draw: number | null;
    awayWin: number | null;
  };
  metrics?: unknown;
  headToHead?: unknown;
  focusFactors?: unknown;
  dataMetrics?: unknown;
  factors?: unknown;
  force?: boolean;
  prediction?: Prediction;
};

export type AthenaPrediction = {
  homeWin: string;
  draw: string;
  awayWin: string;
};

export type AthenaAIAnalysis = {
  summary: string;
  prediction: AthenaPrediction;
  strengths: string[];
  risks: string[];
  recommendation: string;
  keyFactors: string[];
  dataLimitations: string[];
  scorePrediction: string[];
  riskLevel: string;
  confidence: number;
  score: number;
  generatedAt: string;
};

export type AIErrorCode = "AI_RATE_LIMITED" | "AI_MODEL_UNAVAILABLE" | "AI_REQUEST_FAILED";

export type AIErrorResponse = {
  success: false;
  error: {
    code: AIErrorCode;
    message: string;
    retryAfter: number;
  };
};
