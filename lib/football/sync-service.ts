import { footballApiRequest } from "@/lib/football/api";
import type { ApiFixture } from "@/lib/football-api/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const SYNC_DAYS = 30;
const MAX_MATCHES = 500;
const TIME_ZONE = "Asia/Shanghai";

type ExistingMatchFields = {
  external_id: string;
  home_win: number | null;
  draw: number | null;
  away_win: number | null;
  ai_score: number | null;
  ai_pick: string | null;
  risk_level: string | null;
};

export type FootballSyncResult = {
  fetched: number;
  inserted: number;
  updated: number;
  insertedOrUpdated: number;
  dates: { from: string; to: string };
  warnings: string[];
};

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getDateKeys() {
  return Array.from(
    { length: SYNC_DAYS },
    (_, offset) => dateKey(new Date(Date.now() + offset * 24 * 60 * 60 * 1000)),
  );
}

function normalizeFixture(fixture: ApiFixture) {
  const id = String(fixture.fixture?.id ?? "");
  const homeTeam = fixture.teams?.home;
  const awayTeam = fixture.teams?.away;
  if (!id || !homeTeam?.id || !awayTeam?.id || !fixture.fixture?.date) return null;

  return {
    external_id: id,
    league: fixture.league?.name ?? "",
    home_team: homeTeam.name,
    away_team: awayTeam.name,
    match_time: fixture.fixture.date,
    status: fixture.fixture.status?.short ?? "NS",
    home_logo: homeTeam.logo ?? null,
    away_logo: awayTeam.logo ?? null,
  };
}

async function fetchFixtures(dates: string[]) {
  const rows = new Map<string, ReturnType<typeof normalizeFixture>>();
  const warnings: string[] = [];

  for (const date of dates) {
    try {
      const fixtures = await footballApiRequest<ApiFixture[]>("fixtures", { date });
      for (const fixture of fixtures ?? []) {
        const row = normalizeFixture(fixture);
        if (row) rows.set(row.external_id, row);
      }
    } catch (error) {
      warnings.push(`${date}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    rows: Array.from(rows.values()).filter((row): row is NonNullable<typeof row> => Boolean(row)).sort((left, right) => left.match_time.localeCompare(right.match_time)).slice(0, MAX_MATCHES),
    warnings,
  };
}

export async function syncUpcomingFootballMatches(): Promise<FootballSyncResult> {
  const dates = getDateKeys();
  const { rows, warnings } = await fetchFixtures(dates);
  const supabase = getSupabaseServerClient();

  if (!supabase) throw new Error("Supabase is not configured");
  if (!rows.length) {
    if (warnings.length === dates.length) throw new Error(warnings.join("; "));
    return { fetched: 0, inserted: 0, updated: 0, insertedOrUpdated: 0, dates: { from: dates[0], to: dates[dates.length - 1] }, warnings };
  }

  const ids = rows.map((row) => row.external_id);
  const { data: existingData, error: existingError } = await supabase
    .from("matches")
    .select("external_id,home_win,draw,away_win,ai_score,ai_pick,risk_level")
    .in("external_id", ids);

  if (existingError) throw new Error(`读取已有比赛失败: ${existingError.message}`);

  const existing = new Map(
    ((existingData ?? []) as ExistingMatchFields[]).map((row) => [row.external_id, row]),
  );
  const now = new Date().toISOString();
  const upsertRows = rows.map((row) => {
    const previous = existing.get(row.external_id);
    return {
      ...row,
      home_win: previous?.home_win ?? null,
      draw: previous?.draw ?? null,
      away_win: previous?.away_win ?? null,
      ai_score: previous?.ai_score ?? null,
      ai_pick: previous?.ai_pick ?? null,
      risk_level: previous?.risk_level ?? null,
      updated_at: now,
    };
  });

  const { data, error } = await supabase
    .from("matches")
    .upsert(upsertRows, { onConflict: "external_id" })
    .select("external_id");

  if (error) throw new Error(`写入比赛失败: ${error.message}`);

  const inserted = rows.filter((row) => !existing.has(row.external_id)).length;
  const updated = rows.length - inserted;
  return {
    fetched: rows.length,
    inserted,
    updated,
    insertedOrUpdated: data?.length ?? rows.length,
    dates: { from: dates[0], to: dates[dates.length - 1] },
    warnings,
  };
}
