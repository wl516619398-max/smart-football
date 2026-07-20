import type { AITeamStats } from "@/types/match";
import type { PredictionResult } from "@/lib/ai/prediction-engine";
import type { RiskModelResult } from "@/lib/ai/risk-model";
import { AI_ANALYSIS_REFERENCE } from "@/lib/ai/prompt-guidance";

export type ReportGeneratorInput = {
  homeTeam: string;
  awayTeam: string;
  homeStats: AITeamStats;
  awayStats: AITeamStats;
  prediction: PredictionResult;
  risk: RiskModelResult;
};

export function generateAIReport({ homeTeam, awayTeam, homeStats, awayStats, prediction, risk }: ReportGeneratorInput): string {
  const attackLeader = homeStats.attack >= awayStats.attack ? homeTeam : awayTeam;
  const defenseLeader = homeStats.defense >= awayStats.defense ? homeTeam : awayTeam;
  const lean = prediction.homeWin >= prediction.awayWin ? "主队小胜" : "客队小胜";

  return `根据双方近期表现，${attackLeader}的进攻能力更具威胁，${defenseLeader}的防守稳定性相对更好。结合主客场因素与模型概率，模型观点倾向${lean}，模型预测比分为 ${prediction.predictedScore}。${risk.riskReason}${AI_ANALYSIS_REFERENCE}`;
}
