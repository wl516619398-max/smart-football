import { footballApiRequest } from "@/lib/football/api";
import type { ApiFootballFixture, FootballMatch, FootballTeamStats } from "@/lib/football/types";
import { getFootballMatchFallback, getFootballMatchesFallback } from "@/data/matches";

const emptyStats = (teamId: string): FootballTeamStats => ({ teamId, attack: 50, defense: 50, form: 50, homeAdvantage: 50, possession: 50, recentMatches: [], goalsFor: 0, goalsAgainst: 0, xG: 1.5, rank: 20 });

function normalizeFixture(fixture: ApiFootballFixture): FootballMatch {
  const homeId = String(fixture.teams.home.id);
  const awayId = String(fixture.teams.away.id);
  return {
    id: String(fixture.fixture.id),
    league: fixture.league.name,
    homeTeam: { id: homeId, name: fixture.teams.home.name, shortName: fixture.teams.home.name, logo: fixture.teams.home.logo ?? undefined },
    awayTeam: { id: awayId, name: fixture.teams.away.name, shortName: fixture.teams.away.name, logo: fixture.teams.away.logo ?? undefined },
    date: fixture.fixture.date,
    venue: fixture.fixture.venue.name ?? "待确认",
    odds: { homeWin: 33, draw: 34, awayWin: 33 },
    stats: { home: emptyStats(homeId), away: emptyStats(awayId) },
    injuries: [],
  };
}

export async function getUpcomingFixtures(): Promise<FootballMatch[]> {
  const fixtures = await footballApiRequest<ApiFootballFixture[]>("fixtures", { next: 10 });
  return fixtures?.length ? fixtures.map(normalizeFixture) : getFootballMatchesFallback();
}

export async function getFixtureDetail(id: string): Promise<FootballMatch | undefined> {
  const fixtures = await footballApiRequest<ApiFootballFixture[]>("fixtures", { id });
  return fixtures?.[0] ? normalizeFixture(fixtures[0]) : getFootballMatchFallback(id);
}
