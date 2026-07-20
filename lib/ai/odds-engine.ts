import type { FootballMatch } from "@/lib/football/types";
import type { OutcomeProbabilities } from "@/lib/ai/probability";

export type OddsAnalysis = {
  impliedHomeWin: number;
  impliedDraw: number;
  impliedAwayWin: number;
  homeEdge: number;
  awayEdge: number;
  recommendation: string;
  signal: string;
};

const round = (value: number) => Math.round(value * 10) / 10;

export function analyzeOdds(match: FootballMatch, probabilities: OutcomeProbabilities): OddsAnalysis {
  const total = match.odds.homeWin + match.odds.draw + match.odds.awayWin || 100;
  const impliedHomeWin = match.odds.homeWin / total * 100;
  const impliedDraw = match.odds.draw / total * 100;
  const impliedAwayWin = match.odds.awayWin / total * 100;
  const homeEdge = round(probabilities.homeWin - impliedHomeWin);
  const awayEdge = round(probabilities.awayWin - impliedAwayWin);
  const recommendation = homeEdge >= awayEdge && homeEdge > 1 ? "模型观点偏向主队方向" : awayEdge > homeEdge && awayEdge > 1 ? "模型观点偏向客队方向" : "市场数据与模型估算基本一致";
  const signal = homeEdge >= awayEdge ? `主队模型概率较市场高 ${Math.abs(homeEdge)}%` : `客队模型概率较市场高 ${Math.abs(awayEdge)}%`;

  return { impliedHomeWin: round(impliedHomeWin), impliedDraw: round(impliedDraw), impliedAwayWin: round(impliedAwayWin), homeEdge, awayEdge, recommendation, signal };
}
