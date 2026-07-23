import { getHeadToHead } from "../../football-api/history.ts";
import { getMatchOdds } from "../../football-api/odds.ts";
import { getUpcomingMatches } from "../../football-api/matches.ts";
import { getTeamStatistics, getTeamsFromMatches } from "../../football-api/teams.ts";
import type { FootballDataProvider } from "../provider.ts";
import type { FootballApiHistory, FootballApiOdds, FootballApiTeamStatistics } from "../../football-api/types.ts";

export function createApiFootballProvider(): FootballDataProvider {
  return {
    name: "api-football",
    async getMatches() {
      return getUpcomingMatches();
    },
    async getTeams(matches = []) {
      return getTeamsFromMatches(matches);
    },
    async getTeamStats(matches = [], teams = []) {
      const result: FootballApiTeamStatistics[] = [];
      for (const team of teams) {
        const match = matches.find((item) => item.home_team_id === team.football_data_id || item.away_team_id === team.football_data_id);
        if (!match) continue;
        const stats = await getTeamStatistics(team, match.league_id, match.season);
        if (stats) result.push(stats);
      }
      return result;
    },
    async getOdds(matches = []) {
      const result: FootballApiOdds[] = [];
      for (const match of matches) result.push(await getMatchOdds(match.fixture_id));
      return result;
    },
    async getHistory(matches = []) {
      const pairs = new Map<string, { home: string; away: string }>();
      for (const match of matches) pairs.set(`${match.home_team_id}-${match.away_team_id}`, { home: match.home_team_id, away: match.away_team_id });
      const result: FootballApiHistory[] = [];
      for (const pair of pairs.values()) result.push(...await getHeadToHead(pair.home, pair.away));
      return result;
    },
  };
}
