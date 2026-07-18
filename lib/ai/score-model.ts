import type { FootballMatch } from "@/lib/football/types";
import type { OutcomeProbabilities } from "@/lib/ai/probability";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function predictScores(match: FootballMatch, probabilities: OutcomeProbabilities): string[] {
  const home = match.stats.home;
  const away = match.stats.away;
  const homeExpected = clamp(home.xG * 0.65 + (away.goalsAgainst / 5) * 0.35 + home.homeAdvantage / 100 * 0.2, 0.2, 3.5);
  const awayExpected = clamp(away.xG * 0.65 + (home.goalsAgainst / 5) * 0.35 - home.homeAdvantage / 100 * 0.12, 0.2, 3.5);
  const winnerBias = probabilities.homeWin >= probabilities.awayWin ? 0.08 : -0.08;
  const candidates = Array.from({ length: 25 }, (_, index) => {
    const homeGoals = Math.floor(index / 5);
    const awayGoals = index % 5;
    const distance = Math.abs(homeGoals - (homeExpected + winnerBias)) + Math.abs(awayGoals - awayExpected);
    return { score: `${homeGoals}-${awayGoals}`, distance };
  });

  return candidates.sort((left, right) => left.distance - right.distance).slice(0, 3).map((candidate) => candidate.score);
}
