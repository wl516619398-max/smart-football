import { generateMockFootballData } from "../../football/mock-generator.ts";
import { getTeamsFromMatches } from "../../football-api/teams.ts";
import type { FootballDataProvider } from "../provider.ts";
import type { UpcomingMatch } from "../../football-api/types.ts";

function toMatches(): UpcomingMatch[] {
  return generateMockFootballData().matches.map((match, index) => ({
    external_id: match.external_id,
    fixture_id: 990000 + index,
    league_id: "mock",
    league: match.league,
    season: 2026,
    home_team_id: match.home_team_id,
    home_team: match.home_team,
    away_team_id: match.away_team_id,
    away_team: match.away_team,
    match_time: match.match_time,
    status: match.status,
    venue: match.venue,
  }));
}

export function createMockFootballProvider(): FootballDataProvider {
  return {
    name: "mock",
    async getMatches() {
      return toMatches();
    },
    async getTeams(matches = toMatches()) {
      return getTeamsFromMatches(matches);
    },
    async getTeamStats() {
      return generateMockFootballData().team_statistics;
    },
    async getOdds() {
      return generateMockFootballData().odds.map((odd) => ({ ...odd, source: "mock" as const }));
    },
    async getHistory() {
      return generateMockFootballData().match_history.map((row) => ({ ...row, provider: "mock" as const }));
    },
  };
}
