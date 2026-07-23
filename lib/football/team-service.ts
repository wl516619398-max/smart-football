import { getFootballDataProvider } from "@/lib/football/data-provider";
import type { FootballTeamStats } from "@/lib/football/types";
import { getFootballTeamStatsFallback } from "@/data/matches";
import type { FootballTeamReference } from "@/lib/football/team-id";
import { decodeUnicodeDeep } from "@/lib/utils/decode-unicode";
import { createMockDataProvider } from "@/lib/data-provider/mock-provider";
import type { MatchTeamData, MatchTeamStats } from "@/lib/data-provider/types";
import { mockFootballApiClient } from "@/lib/football/api-client";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export async function getTeamStats(team: FootballTeamReference): Promise<FootballTeamStats> {
  const teamId = typeof team === "string"
    ? team.trim()
    : String(team.football_data_id || team.api_football_id || team.thesportsdb_id || team.id || "").trim();
  const fallback = getFootballTeamStatsFallback(teamId);
  if (!teamId) return decodeUnicodeDeep(fallback);

  try {
    const provider = getFootballDataProvider();
    const form = await provider.getForm(teamId, { teamId });
    const recentMatches = form.matches.slice(0, 10);
    if (recentMatches.length) {
      const scored = recentMatches.reduce((sum, item) => sum + item.goalsFor, 0);
      const conceded = recentMatches.reduce((sum, item) => sum + item.goalsAgainst, 0);
      const averageScored = scored / recentMatches.length;
      const averageConceded = conceded / recentMatches.length;
      const form = recentMatches.reduce((sum, item) => sum + (item.result === "win" ? 3 : item.result === "draw" ? 1 : 0), 0) / (recentMatches.length * 3) * 100;
      return decodeUnicodeDeep({
        ...fallback,
        teamId,
        attack: clamp(averageScored / 3 * 100, 0, 100),
        defense: clamp(100 - averageConceded / 3 * 100, 0, 100),
        form: clamp(form, 0, 100),
        recentMatches,
        goalsFor: scored,
        goalsAgainst: conceded,
        xG: averageScored,
      });
    }
  } catch {
    // Keep the existing static Mock fallback.
  }

  return decodeUnicodeDeep(fallback);
}

export async function getMockTeamInfo(teamId?: string): Promise<MatchTeamData[]> {
  const matches = await createMockDataProvider().getMatches();
  const teams = matches.flatMap((match) => [match.home_team, match.away_team]);
  const uniqueTeams = [...new Map(teams.map((team) => [team.id, team])).values()];
  return mockFootballApiClient.request(teamId ? uniqueTeams.filter((team) => team.id === teamId) : uniqueTeams);
}

export async function getMockTeamStats(teamId: string): Promise<MatchTeamStats | null> {
  const matches = await createMockDataProvider().getMatches();
  const match = matches.find((item) => item.home_team.id === teamId || item.away_team.id === teamId);
  if (!match) return null;
  const stats = match.home_team.id === teamId ? match.home_team_stats : match.away_team_stats;
  return mockFootballApiClient.request(stats);
}
