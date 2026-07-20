import {
  getFootballMatchesFallback,
  getFootballTeamStatsFallback,
} from "@/data/matches";
import type { FootballDataQuery, FootballProviderKind } from "@/lib/football/data-provider";
import type { FootballApiAdapter } from "@/lib/football/adapters/types";
import type {
  FootballMatch,
  FootballStanding,
  FootballTeam,
} from "@/lib/football/types";

function getMockTeams(matches: FootballMatch[]): FootballTeam[] {
  const teams = new Map<string, FootballTeam>();

  for (const match of matches) {
    teams.set(match.homeTeam.id, match.homeTeam);
    teams.set(match.awayTeam.id, match.awayTeam);
  }

  return [...teams.values()];
}

function getMockStandings(matches: FootballMatch[], query?: FootballDataQuery): FootballStanding[] {
  const teams = getMockTeams(matches);
  const standings = teams.map((team) => {
    const teamMatch = matches.find(
      ({ homeTeam, awayTeam }) => homeTeam.id === team.id || awayTeam.id === team.id,
    );
    const stats = teamMatch?.homeTeam.id === team.id ? teamMatch.stats.home : teamMatch?.stats.away;
    const played = stats?.recentMatches.length || 0;
    const wins = stats?.recentMatches.filter(({ result }) => result === "win").length || 0;
    const draws = stats?.recentMatches.filter(({ result }) => result === "draw").length || 0;
    const losses = stats?.recentMatches.filter(({ result }) => result === "loss").length || 0;

    return {
      teamId: team.id,
      teamName: team.name,
      league: teamMatch?.league ?? "",
      rank: stats?.rank ?? 20,
      played,
      points: wins * 3 + draws,
      wins,
      draws,
      losses,
      goalsFor: Math.round(stats?.goalsFor ?? 0),
      goalsAgainst: Math.round(stats?.goalsAgainst ?? 0),
    } satisfies FootballStanding;
  });

  return standings
    .filter((standing) => !query?.league || standing.league === query.league)
    .sort((left, right) => left.rank - right.rank);
}

export function createMockFootballAdapter(
  provider: FootballProviderKind = "mock",
): FootballApiAdapter {
  return {
    provider,
    async getUpcomingMatches(query) {
      const matches = getFootballMatchesFallback();
      return query?.league ? matches.filter((match) => match.league === query.league) : matches;
    },
    async getTeamInfo(teamId, query) {
      const matches = getFootballMatchesFallback();
      const teams = getMockTeams(query?.league ? matches.filter((match) => match.league === query.league) : matches);
      return teamId ? teams.filter((team) => team.id === teamId) : teams;
    },
    async getTeamForm(teamId) {
      const stats = getFootballTeamStatsFallback(teamId);
      return { teamId, matches: stats.recentMatches };
    },
    async getStandings(query) {
      return getMockStandings(getFootballMatchesFallback(), query);
    },
  };
}
