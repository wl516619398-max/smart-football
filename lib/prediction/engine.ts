import type { MatchPrediction, PredictionTeamStats } from "@/lib/prediction/types";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 0) => Number(value.toFixed(digits));

function weightedStrength(stats: PredictionTeamStats, isHome: boolean) {
  const homeAdvantage = isHome ? stats.homeAdvantage : 100 - stats.homeAdvantage;
  return (
    stats.attack * 0.35
    + stats.defense * 0.25
    + stats.form * 0.25
    + homeAdvantage * 0.15
  );
}

function buildRecommendations(difference: number, confidence: number): string[] {
  if (difference >= 8) {
    return ["主队模型观点占优", "关注主队进攻效率", `模型一致性 ${confidence}%`];
  }
  if (difference <= -8) {
    return ["客队模型观点占优", "关注客队转换效率", `模型一致性 ${confidence}%`];
  }
  return ["双方数据接近", "关注比赛走势变化", `模型一致性 ${confidence}%`];
}

export function predictMatch(
  homeTeamStats: PredictionTeamStats,
  awayTeamStats: PredictionTeamStats,
): MatchPrediction {
  const homeStrength = weightedStrength(homeTeamStats, true);
  const awayStrength = weightedStrength(awayTeamStats, false);
  const difference = homeStrength - awayStrength;

  const draw = clamp(29 - Math.abs(difference) * 0.12, 16, 34);
  const homeShare = clamp(50 + difference * 0.42, 15, 85);
  const nonDraw = 100 - draw;
  const homeWin = nonDraw * (homeShare / 100);
  const awayWin = nonDraw - homeWin;
  const confidence = clamp(55 + Math.abs(difference) * 0.35, 55, 95);

  const expectedHome = clamp(
    1.2 + (homeTeamStats.attack - awayTeamStats.defense) * 0.012 + (homeTeamStats.form - awayTeamStats.form) * 0.003 + homeTeamStats.homeAdvantage * 0.003,
    0.2,
    3.5,
  );
  const expectedAway = clamp(
    1 + (awayTeamStats.attack - homeTeamStats.defense) * 0.012 + (awayTeamStats.form - homeTeamStats.form) * 0.003,
    0.2,
    3.5,
  );

  const roundedDraw = round(draw);
  const roundedHomeWin = round(homeWin);
  const roundedConfidence = round(confidence);
  return {
    homeWin: roundedHomeWin,
    draw: roundedDraw,
    awayWin: 100 - roundedHomeWin - roundedDraw,
    confidence: roundedConfidence,
    expectedGoals: {
      home: round(expectedHome, 2),
      away: round(expectedAway, 2),
    },
    recommendation: buildRecommendations(difference, roundedConfidence),
  };
}
