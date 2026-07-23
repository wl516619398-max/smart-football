import type { SkillModelPrediction, SkillProbabilityBundle, SkillSnapshot, SkillTeam } from "@/lib/analysis-engine/skill/types";

const MAX_GOALS = 7;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 4) => Number(value.toFixed(digits));

function poisson(lambda: number, goals: number) {
  let factorial = 1;
  for (let index = 2; index <= goals; index += 1) factorial *= index;
  return Math.exp(-lambda) * Math.pow(lambda, goals) / factorial;
}

function teamRating(team: SkillTeam) {
  if (typeof team.ratingValue === "number") return clamp(team.ratingValue, 1300, 2050);
  if (typeof team.eloRating === "number") return clamp(team.eloRating, 1300, 2050);
  if (typeof team.fifaRank === "number" && team.fifaRank > 0) return clamp(2050 - team.fifaRank * 6, 1300, 2050);
  return 1500;
}

function expectedGoals(home: SkillTeam, away: SkillTeam) {
  const homeAttack = clamp(home.attackStrength ?? 1, 0.45, 2.2);
  const awayAttack = clamp(away.attackStrength ?? 1, 0.45, 2.2);
  const homeDefense = clamp(home.defenseStrength ?? 1, 0.45, 2.2);
  const awayDefense = clamp(away.defenseStrength ?? 1, 0.45, 2.2);
  const homeForm = clamp((home.formScore ?? 50) / 100, 0, 1);
  const awayForm = clamp((away.formScore ?? 50) / 100, 0, 1);
  const ratingGap = (teamRating(home) - teamRating(away)) / 400;

  return {
    home: clamp(1.15 + homeAttack * 0.55 - awayDefense * 0.28 + homeForm * 0.22 - awayForm * 0.08 + ratingGap * 0.2, 0.15, 3.8),
    away: clamp(0.95 + awayAttack * 0.5 - homeDefense * 0.22 + awayForm * 0.2 - homeForm * 0.05 - ratingGap * 0.14, 0.15, 3.5),
  };
}

function matrix(homeExpected: number, awayExpected: number, half = false) {
  const home = half ? homeExpected * 0.45 : homeExpected;
  const away = half ? awayExpected * 0.45 : awayExpected;
  const values: Array<{ home: number; away: number; probability: number }> = [];
  for (let homeGoals = 0; homeGoals <= MAX_GOALS; homeGoals += 1) {
    for (let awayGoals = 0; awayGoals <= MAX_GOALS; awayGoals += 1) {
      let probability = poisson(home, homeGoals) * poisson(away, awayGoals);
      if (homeGoals === 0 && awayGoals === 0) probability *= 1.08;
      if (homeGoals === 1 && awayGoals === 1) probability *= 1.04;
      values.push({ home: homeGoals, away: awayGoals, probability });
    }
  }
  const total = values.reduce((sum, item) => sum + item.probability, 0) || 1;
  return values.map((item) => ({ ...item, probability: item.probability / total }));
}

function aggregate(values: ReturnType<typeof matrix>): SkillProbabilityBundle {
  const result = values.reduce((output, item) => {
    if (item.home > item.away) output.homeWin += item.probability;
    else if (item.home === item.away) output.draw += item.probability;
    else output.awayWin += item.probability;
    return output;
  }, { homeWin: 0, draw: 0, awayWin: 0 });
  return {
    homeWin: round(result.homeWin * 100, 1),
    draw: round(result.draw * 100, 1),
    awayWin: round(result.awayWin * 100, 1),
  };
}

function scoreProbabilities(values: ReturnType<typeof matrix>) {
  return values
    .slice()
    .sort((left, right) => right.probability - left.probability)
    .slice(0, 5)
    .map((item) => ({ score: `${item.home}-${item.away}`, probability: round(item.probability * 100, 1) }));
}

function riskLevel(probability: SkillProbabilityBundle, snapshot: SkillSnapshot): "low" | "medium" | "high" {
  const home = snapshot.teams.find((team) => team.id === snapshot.matchStates[0]?.homeTeamId);
  const away = snapshot.teams.find((team) => team.id === snapshot.matchStates[0]?.awayTeamId);
  const dataComplete = home?.formScore !== undefined && away?.formScore !== undefined;
  const top = Math.max(probability.homeWin, probability.draw, probability.awayWin);
  if (!dataComplete || top < 45) return "high";
  if (top < 58) return "medium";
  return "low";
}

export function predictSkillMatch(snapshot: SkillSnapshot): SkillModelPrediction {
  const match = snapshot.matchStates[0];
  if (!match) throw new Error("Skill snapshot does not contain a match");
  const home = snapshot.teams.find((team) => team.id === match.homeTeamId);
  const away = snapshot.teams.find((team) => team.id === match.awayTeamId);
  if (!home || !away) throw new Error("Skill snapshot is missing match teams");

  const goals = expectedGoals(home, away);
  const fullMatrix = matrix(goals.home, goals.away);
  const probability = aggregate(fullMatrix);
  const halfTimeProbability = aggregate(matrix(goals.home, goals.away, true));
  const ranges = fullMatrix.reduce((result, item) => {
    const total = item.home + item.away;
    if (total <= 1) result.zeroToOne += item.probability;
    else if (total <= 3) result.twoToThree += item.probability;
    else result.fourPlus += item.probability;
    return result;
  }, { zeroToOne: 0, twoToThree: 0, fourPlus: 0 });
  const sortedProbability = Math.max(probability.homeWin, probability.draw, probability.awayWin);
  const recommendation = probability.homeWin >= probability.awayWin && probability.homeWin >= probability.draw
    ? "主队方向"
    : probability.awayWin >= probability.draw ? "客队方向" : "平局方向";
  const gap = Math.abs(teamRating(home) - teamRating(away));

  return {
    matchId: match.matchId,
    modelVersion: snapshot.metadata.modelVersion,
    probability,
    halfTimeProbability,
    goalRangeProbability: {
      zeroToOne: round(ranges.zeroToOne * 100, 1),
      twoToThree: round(ranges.twoToThree * 100, 1),
      fourPlus: round(ranges.fourPlus * 100, 1),
    },
    scoreProbabilities: scoreProbabilities(fullMatrix),
    expectedGoals: { home: round(goals.home, 2), away: round(goals.away, 2) },
    recommendation,
    confidence: round(clamp(54 + (sortedProbability - 33) * 1.15 + gap / 35, 0, 96), 1),
    riskLevel: riskLevel(probability, snapshot),
    keyFactors: ["球队评分与近期状态", "攻防效率", "主客场环境"],
  };
}
