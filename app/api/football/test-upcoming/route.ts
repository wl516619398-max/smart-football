import { NextResponse } from "next/server";
import { footballApiRequest } from "@/lib/football/api";
import type { ApiFixture } from "@/lib/football-api/types";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  const configured = Boolean(process.env.FOOTBALL_API_KEY?.trim());
  const dates = Array.from({ length: 7 }, (_, offset) => dateKey(new Date(Date.now() + offset * 24 * 60 * 60 * 1000)));
  const from = dates[0];
  const to = dates[dates.length - 1];

  if (!configured) {
    return NextResponse.json({
      success: false,
      provider: "api-football",
      configured: false,
      from,
      to,
      count: 0,
      data: [],
      error: "FOOTBALL_API_KEY 未配置",
    }, { status: 503 });
  }

  const matches: Array<Record<string, unknown>> = [];
  const errors: string[] = [];

  for (const date of dates) {
    try {
      const fixtures = await footballApiRequest<ApiFixture[]>("fixtures", { date });
      for (const fixture of fixtures ?? []) {
        matches.push({
          external_id: String(fixture.fixture.id),
          fixture_id: fixture.fixture.id,
          league: fixture.league.name,
          home_team: fixture.teams.home.name,
          away_team: fixture.teams.away.name,
          match_time: fixture.fixture.date,
          status: fixture.fixture.status?.short ?? "NS",
          venue: fixture.fixture.venue?.name ?? null,
        });
      }
    } catch (error) {
      errors.push(`${date}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (matches.length || !errors.length) {
    return NextResponse.json({
      success: true,
      provider: "api-football",
      configured: true,
      from,
      to,
      count: matches.length,
      data: matches.slice(0, 50),
      ...(errors.length ? { warnings: errors } : {}),
    });
  }

  const message = errors.join("; ");
  console.error("[api/football/test-upcoming] request failed", { status: 502, message });
  return NextResponse.json({ success: false, provider: "api-football", configured: true, from, to, count: 0, data: [], error: message }, { status: 502 });
}
