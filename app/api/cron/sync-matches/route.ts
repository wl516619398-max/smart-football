import { NextResponse } from "next/server";
import { getFootballDataProvider } from "@/lib/football/data-provider";
import { getDynamicMatchPrediction } from "@/lib/football/dynamic-prediction";
import type { FootballMatch, FootballStanding } from "@/lib/football/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getUpcomingDateWindow } from "@/lib/football/date-window";
import { generateAndSaveFeaturedMatchAnalyses } from "@/lib/ai/match-analysis-generator";

export const dynamic = "force-dynamic";

const SYNC_WINDOW_DAYS = 30;
const SHANGHAI_TIME_ZONE = "Asia/Shanghai";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  return Boolean(secret && authorization === `Bearer ${secret}`);
}

function getSyncWindow() {
  const window = getUpcomingDateWindow(SYNC_WINDOW_DAYS);
  return { from: window.startKey, to: window.endKey };
}

function filterUpcomingMatches(matches: FootballMatch[], from: string, to: string, limit = 500) {
  const start = Date.parse(`${from}T00:00:00+08:00`);
  const end = Date.parse(`${to}T23:59:59+08:00`);
  const seen = new Set<string>();

  return matches
    .filter((match) => {
      const timestamp = Date.parse(match.date);
      if (!Number.isFinite(timestamp) || timestamp < start || timestamp > end || seen.has(match.id)) return false;
      seen.add(match.id);
      return true;
    })
    .sort((left, right) => Date.parse(left.date) - Date.parse(right.date))
    .slice(0, limit);
}

function getShanghaiDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function toMatchRow(match: FootballMatch) {
  const prediction = await getDynamicMatchPrediction(match);

  return {
    external_id: match.id,
    league: match.league,
    home_team: match.homeTeam.name,
    away_team: match.awayTeam.name,
    home_team_id: match.homeTeam.id,
    away_team_id: match.awayTeam.id,
    match_time: match.date,
    home_win: prediction?.homeWin ?? null,
    draw: prediction?.draw ?? null,
    away_win: prediction?.awayWin ?? null,
    ai_score: prediction?.confidence ?? null,
  };
}

function hasExternalTeamIds(match: FootballMatch) {
  return /^\d+$/.test(match.id)
    && /^\d+$/.test(match.homeTeam.id)
    && /^\d+$/.test(match.awayTeam.id);
}

function uniqueLeagueNames(matches: FootballMatch[], standings: FootballStanding[]) {
  return Array.from(
    new Set(
      [...matches.map((match) => match.league), ...standings.map((standing) => standing.league)]
        .map((league) => league.trim())
        .filter(Boolean),
    ),
  );
}

async function getMatchesWithFallback(query: { from: string; to: string }) {
  const configuredProvider = getFootballDataProvider();
  const configuredSource = process.env.FOOTBALL_API_PROVIDER?.trim().toLowerCase() || configuredProvider.kind;

  try {
    const matches = filterUpcomingMatches(await configuredProvider.getMatches(query), query.from, query.to);
    if (matches.length > 0) {
      return {
        matches,
        provider: configuredSource,
        usedMockFallback: configuredProvider.kind === "mock" || !matches.every(hasExternalTeamIds),
      };
    }
  } catch (error) {
    console.error("[cron/sync-matches] football provider failed:", error);
  }

  const mockProvider = getFootballDataProvider("mock");
  const matches = filterUpcomingMatches(await mockProvider.getMatches(query), query.from, query.to);

  return { matches, provider: configuredSource, usedMockFallback: true };
}

async function startSyncLog(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, query: { from: string; to: string }, provider: string) {
  const { data, error } = await supabase
    .from("api_sync_logs")
    .insert({
      provider,
      sync_type: "matches",
      status: "running",
      window_start: `${query.from}T00:00:00+08:00`,
      window_end: `${query.to}T23:59:59+08:00`,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[cron/sync] api_sync_logs start failed:", error.message);
    return null;
  }

  return typeof data?.id === "string" ? data.id : null;
}

async function finishSyncLog(
  supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>,
  id: string | null,
  values: { status: "success" | "error"; fetchedCount: number; upsertedCount: number; errorMessage?: string },
) {
  if (!id) return;
  const { error } = await supabase
    .from("api_sync_logs")
    .update({
      status: values.status,
      fetched_count: values.fetchedCount,
      upserted_count: values.upsertedCount,
      error_message: values.errorMessage ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) console.error("[cron/sync] api_sync_logs completion failed:", error.message);
}

async function syncMatches(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const query = getSyncWindow();
  const configuredProvider = process.env.FOOTBALL_API_PROVIDER?.trim().toLowerCase() || getFootballDataProvider().kind;
  const syncLogId = await startSyncLog(supabase, query, configuredProvider);
  let fetchedCount = 0;
  let upsertedCount = 0;

  try {
    const { matches, provider, usedMockFallback } = await getMatchesWithFallback(query);
    fetchedCount = matches.length;
    const rows = Array.from(
      new Map((await Promise.all(matches.map(toMatchRow))).map((row) => [row.external_id, row])).values(),
    );

    const leagues = uniqueLeagueNames(matches, []);

    if (!rows.length) {
      await finishSyncLog(supabase, syncLogId, { status: "success", fetchedCount, upsertedCount: 0 });
      return NextResponse.json({
        success: true,
        provider,
        usedMockFallback,
        fetched: 0,
        todayMatches: 0,
        upcomingMatches: 0,
        leagues,
        leagueCount: leagues.length,
        insertedOrUpdated: 0,
        analysisGenerated: 0,
      });
    }

    const { data, error } = await supabase
      .from("matches")
      .upsert(rows, { onConflict: "external_id" })
      .select("external_id");

    if (error) throw new Error(error.message);
    upsertedCount = data?.length ?? rows.length;
    const analysis = await generateAndSaveFeaturedMatchAnalyses(supabase, matches, rows);

    const todayKey = getShanghaiDateKey(new Date().toISOString());
    const now = Date.now();
    const todayMatches = matches.filter((match) => getShanghaiDateKey(match.date) === todayKey).length;
    const upcomingMatches = matches.filter((match) => {
      const timestamp = new Date(match.date).getTime();
      return Number.isFinite(timestamp) && timestamp >= now;
    }).length;

    return NextResponse.json({
      success: true,
      provider,
      usedMockFallback,
      fetched: matches.length,
      todayMatches,
      upcomingMatches,
      leagues,
      leagueCount: leagues.length,
      insertedOrUpdated: upsertedCount,
      analysisGenerated: analysis.generated,
      analysisFailed: analysis.failed,
    });
  } catch (error: unknown) {
    await finishSyncLog(supabase, syncLogId, {
      status: "error",
      fetchedCount,
      upsertedCount,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    console.error("Cron match sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return syncMatches(request);
}

export async function POST(request: Request) {
  return syncMatches(request);
}
