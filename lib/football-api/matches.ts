import { footballApiRequest } from "./client.ts";
import type { ApiFixture, UpcomingMatch } from "./types.ts";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export type MatchDateRange = {
  from?: string;
  to?: string;
};

function normalizeFixture(fixture: ApiFixture): UpcomingMatch {
  const status = fixture.fixture.status?.short || "NS";
  return {
    external_id: String(fixture.fixture.id),
    fixture_id: fixture.fixture.id,
    league_id: String(fixture.league.id),
    league: fixture.league.name,
    season: fixture.league.season,
    home_team_id: String(fixture.teams.home.id),
    home_team: fixture.teams.home.name,
    home_logo: fixture.teams.home.logo ?? undefined,
    away_team_id: String(fixture.teams.away.id),
    away_team: fixture.teams.away.name,
    away_logo: fixture.teams.away.logo ?? undefined,
    match_time: fixture.fixture.date,
    status,
    venue: fixture.fixture.venue?.name ?? undefined,
  };
}

export async function getUpcomingMatches(range?: MatchDateRange): Promise<UpcomingMatch[]> {
  const start = range?.from ? new Date(`${range.from}T00:00:00Z`) : new Date();
  const end = range?.to ? new Date(`${range.to}T00:00:00Z`) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fixtures = await footballApiRequest<ApiFixture[]>("fixtures", { from: formatDate(start), to: formatDate(end) });
  return fixtures.map(normalizeFixture);
}
