import type { MatchData, MatchTeamStats } from "@/lib/data-provider/types";
import type { SkillSnapshot, SkillTeam } from "@/lib/analysis-engine/skill/types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function overallScore(stats: MatchTeamStats) {
  return stats.attack * 0.35 + stats.defense * 0.25 + stats.form * 0.25 + stats.homeAdvantage * 0.15;
}

function toSkillTeam(id: string, name: string, stats: MatchTeamStats): SkillTeam {
  const recentMatches = 5;
  const goalsFor = safeNumber(stats.goalsFor);
  const goalsAgainst = safeNumber(stats.goalsAgainst);
  const score = overallScore(stats);

  return {
    id,
    name,
    ratingValue: 1500 + clamp(score - 50, -50, 50) * 5,
    formScore: clamp(safeNumber(stats.form, 50), 0, 100),
    attackStrength: clamp(safeNumber(stats.attack, 50) / 50, 0.45, 2.2),
    defenseStrength: clamp(safeNumber(stats.defense, 50) / 50, 0.45, 2.2),
    goalsPerMatch: goalsFor > 0 ? goalsFor / recentMatches : safeNumber(stats.xG, 1.1),
    goalsAgainstPerMatch: goalsAgainst > 0 ? goalsAgainst / recentMatches : 1.1,
  };
}

/** Converts Athena's provider-neutral MatchData into the Skill snapshot shape. */
export function matchDataToSkillSnapshot(match: MatchData): SkillSnapshot {
  const status = "scheduled" as const;
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      dataVersion: "athena-match-data-v1",
      modelVersion: "xiaowo-worldcup-model-v1",
    },
    teams: [
      toSkillTeam(match.home_team.id, match.home_team.name, match.home_team_stats),
      toSkillTeam(match.away_team.id, match.away_team.name, match.away_team_stats),
    ],
    matchStates: [{
      matchId: match.match_id,
      homeTeamId: match.home_team.id,
      awayTeamId: match.away_team.id,
      stage: match.league,
      status,
    }],
    evidence: {
      recentForm: match.recent_form,
      headToHead: match.head_to_head,
      injuries: match.injuries,
    },
  };
}
