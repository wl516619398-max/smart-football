export type PredictionRiskLevel = "低" | "中" | "高";

export type Prediction = {
  matchId: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  athenaScore: number;
  riskLevel: PredictionRiskLevel;
  recommendation: string;
  factors: string[];
};

