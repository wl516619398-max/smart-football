import { footballApiRequest } from "@/lib/football/api";
import type { ApiFootballFixture, FootballMatch, FootballTeamStats } from "@/lib/football/types";
import { getFootballMatchFallback, getFootballMatchesFallback } from "@/data/matches";
import { getUpcomingDateWindow } from "@/lib/football/date-window";
import { getFootballApiAdapter } from "@/lib/football/adapters";

const emptyStats = (teamId: string): FootballTeamStats => ({ teamId, attack: 50, defense: 50, form: 50, homeAdvantage: 50, possession: 50, recentMatches: [], goalsFor: 0, goalsAgainst: 0, xG: 1.5, rank: 20 });

export type UpcomingFixturesResult = {
  matches: FootballMatch[];
  source: "football-api" | "mock";
};

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
  return (await getUpcomingFixturesWithSource()).matches;
}

export async function getUpcomingFixturesWithSource(): Promise<UpcomingFixturesResult> {
  const window = getUpcomingDateWindow();
  const fixtures = await footballApiRequest<ApiFootballFixture[]>("fixtures", { from: window.startKey, to: window.endKey });
  if (fixtures?.length) return { matches: fixtures.map(normalizeFixture), source: "football-api" };

  const nearestFixtures = await footballApiRequest<ApiFootballFixture[]>("fixtures", { next: 10 });
  if (nearestFixtures?.length) return { matches: nearestFixtures.map(normalizeFixture), source: "football-api" };

  try {
    const sportsDbMatches = await getFootballApiAdapter("api", "thesportsdb").getUpcomingMatches();
    if (sportsDbMatches.length) return { matches: sportsDbMatches, source: "football-api" };
  } catch {
    // Continue to the static fallback only after all real providers fail.
  }

  return { matches: getFootballMatchesFallback(), source: "mock" };
}

export async function getFixtureDetail(id: string): Promise<FootballMatch | undefined> {
  const fixtures = await footballApiRequest<ApiFootballFixture[]>("fixtures", { id });
  if (fixtures?.[0]) return normalizeFixture(fixtures[0]);

  try {
    const sportsDbMatches = await getFootballApiAdapter("api", "thesportsdb").getUpcomingMatches();
    const match = sportsDbMatches.find((item) => item.id === id);
    if (match) return match;
  } catch {
    // Fall through to the static match fallback.
  }

  return getFootballMatchFallback(id);
}
