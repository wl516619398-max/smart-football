import { requestFootballApi } from "@/lib/football/api-client";
import type { ApiFootballTeamStatistics, FootballTeamStats } from "@/lib/football/types";
import { getFootballTeamStatsFallback } from "@/data/matches";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function parseAverage(value: string | null | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formScore(form: string | null): number {
  if (!form) return 50;
  const values: number[] = [...form].map((result) => result === "W" ? 3 : result === "D" ? 1 : 0);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / (values.length * 3) * 100 : 50;
}

function normalizeTeamStats(stats: ApiFootballTeamStatistics): FootballTeamStats {
  const goalsForAverage = parseAverage(stats.goals.for.average.total, 1.5);
  const goalsAgainstAverage = parseAverage(stats.goals.against.average.total, 1.2);
  const possession = 50;
  return {
    teamId: String(stats.team.id),
    attack: clamp(goalsForAverage / 3 * 100, 0, 100),
    defense: clamp(100 - goalsAgainstAverage / 3 * 100, 0, 100),
    form: formScore(stats.form),
    homeAdvantage: 65,
    possession,
    recentMatches: [],
    goalsFor: stats.goals.for.total ?? 0,
    goalsAgainst: stats.goals.against.total ?? 0,
    xG: goalsForAverage,
    rank: 20,
  };
}

export async function getTeamStats(teamId: string): Promise<FootballTeamStats> {
  const league = process.env.FOOTBALL_LEAGUE_ID || "39";
  const season = process.env.FOOTBALL_SEASON || "2025";
  const remoteStats = await requestFootballApi<ApiFootballTeamStatistics>("teams/statistics", { team: teamId, league, season });
  return remoteStats ? normalizeTeamStats(remoteStats) : getFootballTeamStatsFallback(teamId);
}
