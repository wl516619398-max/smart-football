import { footballApiRequest } from "./client.ts";
import type { ApiFixture, FootballApiHistory } from "./types.ts";

export async function getHeadToHead(homeTeamId: string, awayTeamId: string): Promise<FootballApiHistory[]> {
  const fixtures = await footballApiRequest<ApiFixture[]>("fixtures/headtohead", { h2h: `${homeTeamId}-${awayTeamId}` });
  return fixtures
    .filter((fixture) => Number.isFinite(fixture.goals?.home) && Number.isFinite(fixture.goals?.away))
    .sort((left, right) => Date.parse(right.fixture.date) - Date.parse(left.fixture.date))
    .slice(0, 10)
    .map((fixture) => ({
      external_id: String(fixture.fixture.id),
      provider: "api-football",
      league: fixture.league.name,
      match_time: fixture.fixture.date,
      status: fixture.fixture.status?.short ?? "FT",
      home_team_id: String(fixture.teams.home.id),
      home_team: fixture.teams.home.name,
      away_team_id: String(fixture.teams.away.id),
      away_team: fixture.teams.away.name,
      home_score: fixture.goals?.home ?? 0,
      away_score: fixture.goals?.away ?? 0,
      venue: fixture.fixture.venue?.name ?? undefined,
    }));
}
