import { NextResponse } from "next/server";
import { predictMatch } from "@/lib/ai/predictor";
import { getFootballDataProvider } from "@/lib/football/data-provider";
import type { FootballMatch, FootballStanding } from "@/lib/football/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SYNC_WINDOW_DAYS = 7;
const SHANGHAI_TIME_ZONE = "Asia/Shanghai";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  return Boolean(secret && authorization === `Bearer ${secret}`);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getSyncWindow() {
  const from = new Date();
  const to = new Date(from);
  to.setDate(to.getDate() + SYNC_WINDOW_DAYS);

  return { from: formatDate(from), to: formatDate(to) };
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

function toMatchRow(match: FootballMatch) {
  const prediction = predictMatch(match);

  return {
    external_id: match.id,
    league: match.league,
    home_team: match.homeTeam.name,
    away_team: match.awayTeam.name,
    home_team_id: match.homeTeam.id,
    away_team_id: match.awayTeam.id,
    match_time: match.date,
    home_win: prediction.homeWin,
    draw: prediction.draw,
    away_win: prediction.awayWin,
    ai_score: prediction.confidence,
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
    const matches = await configuredProvider.getMatches(query);
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
  const matches = await mockProvider.getMatches(query);

  return { matches, provider: configuredSource, usedMockFallback: true };
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

  try {
    const query = getSyncWindow();
    const { matches, provider, usedMockFallback } = await getMatchesWithFallback(query);
    const rows = Array.from(
      new Map(matches.map((match) => [match.id, toMatchRow(match)])).values(),
    );

    let standings: FootballStanding[] = [];
    try {
      standings = await getFootballDataProvider().getStandings();
    } catch (error) {
      console.error("[cron/sync-matches] standings sync failed:", error);
    }

    const leagues = uniqueLeagueNames(matches, standings);

    if (!rows.length) {
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
      });
    }

    const { data, error } = await supabase
      .from("matches")
      .upsert(rows, { onConflict: "external_id" })
      .select("external_id");

    if (error) throw new Error(error.message);

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
      insertedOrUpdated: data?.length ?? rows.length,
    });
  } catch (error: unknown) {
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
