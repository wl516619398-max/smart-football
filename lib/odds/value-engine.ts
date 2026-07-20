export type OddsValueInput = {
  prediction: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  odds: {
    home: number;
    draw: number;
    away: number;
  };
};

export type OddsValueOutput = {
  impliedProbability: {
    home: number;
    draw: number;
    away: number;
  };
  value: {
    home: number;
    draw: number;
    away: number;
  };
  recommendation: string;
  confidence: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function normalizeProbability(value: number) {
  const probability = Number.isFinite(value) ? value : 0;
  return clamp(probability > 1 ? probability / 100 : probability, 0, 1);
}

function impliedProbability(odd: number) {
  return Number.isFinite(odd) && odd > 1 ? 1 / odd : 0;
}

function round(value: number) {
  return Number(value.toFixed(4));
}

export function calculateOddsValue(input: OddsValueInput): OddsValueOutput {
  const modelProbability = {
    home: normalizeProbability(input.prediction.homeWin),
    draw: normalizeProbability(input.prediction.draw),
    away: normalizeProbability(input.prediction.awayWin),
  };
  const implied = {
    home: impliedProbability(input.odds.home),
    draw: impliedProbability(input.odds.draw),
    away: impliedProbability(input.odds.away),
  };
  const value = {
    home: modelProbability.home - implied.home,
    draw: modelProbability.draw - implied.draw,
    away: modelProbability.away - implied.away,
  };

  const entries = Object.entries(value) as Array<["home" | "draw" | "away", number]>;
  const [bestKey, bestValue] = entries.reduce((best, current) => current[1] > best[1] ? current : best);
  const labels = { home: "主胜", draw: "平局", away: "客胜" };
  let recommendation: string;
  if (bestValue >= 0.05) {
    recommendation = `高价值关注方向：${labels[bestKey]}`;
  } else if (bestValue >= -0.05) {
    recommendation = "正常：模型概率与赔率隐含概率接近";
  } else {
    recommendation = "低价值：赔率隐含概率高于模型估算";
  }

  return {
    impliedProbability: {
      home: round(implied.home),
      draw: round(implied.draw),
      away: round(implied.away),
    },
    value: {
      home: round(value.home),
      draw: round(value.draw),
      away: round(value.away),
    },
    recommendation,
    confidence: Math.round(clamp(50 + Math.abs(bestValue) * 250, 50, 90)),
  };
}
