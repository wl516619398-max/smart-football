import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getFootballHistoryProvider,
  getHistoricalHeadToHead,
  getHistoricalTeamMatches,
  resolveFootballTeamId,
  type HistoricalMatch,
} from "@/lib/football/history";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const configuredSecret = process.env.MATCH_SYNC_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  return Boolean(configuredSecret && request.headers.get("authorization") === `Bearer ${configuredSecret}`);
}

function uniqueMatches(matches: HistoricalMatch[]) {
  return Array.from(new Map(matches.map((match) => [match.externalId, match])).values());
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const provider = getFootballHistoryProvider();
  if (!provider) {
    return NextResponse.json({ success: false, error: "No real football history provider is configured" }, { status: 503 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ success: false, error: "Supabase is not configured" }, { status: 503 });

  const params = new URL(request.url).searchParams;
  const requestedExternalId = params.get("external_id")?.trim();
  const requestedTeamId = params.get("team_id")?.trim();

  try {
    let query = supabase.from("matches").select("*").order("match_time", { ascending: true }).limit(50);
    if (requestedExternalId) query = query.eq("external_id", requestedExternalId);
    const { data: matchRows, error: matchError } = await query;
    if (matchError) throw new Error(matchError.message);

    const rows = (matchRows || []) as Array<Record<string, unknown>>;
    if (!rows.length && requestedExternalId) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
    }

    const collected: HistoricalMatch[] = [];
    let teamsProcessed = 0;
    let h2hProcessed = 0;

    for (const row of rows) {
      const homeName = typeof row.home_team === "string" ? row.home_team : "";
      const awayName = typeof row.away_team === "string" ? row.away_team : "";
      if (!homeName || !awayName) continue;
      const homeId = await resolveFootballTeamId(homeName, typeof row.home_team_id === "string" ? row.home_team_id : requestedTeamId);
      const awayId = await resolveFootballTeamId(awayName, typeof row.away_team_id === "string" ? row.away_team_id : null);
      if (!homeId || !awayId) continue;

      const [homeHistory, awayHistory, h2h] = await Promise.all([
        getHistoricalTeamMatches(homeId),
        getHistoricalTeamMatches(awayId),
        getHistoricalHeadToHead(homeId, awayId),
      ]);
      collected.push(...homeHistory, ...awayHistory, ...h2h);
      teamsProcessed += 2;
      h2hProcessed += h2h.length ? 1 : 0;
    }

    const historyRows = uniqueMatches(collected).map((match) => ({
      external_id: match.externalId,
      provider: match.provider,
      league: match.league || null,
      match_time: match.matchTime,
      status: match.status || "finished",
      home_team_id: match.homeTeamId,
      home_team: match.homeTeam,
      away_team_id: match.awayTeamId,
      away_team: match.awayTeam,
      home_score: match.homeScore,
      away_score: match.awayScore,
      venue: match.venue || null,
    }));

    if (historyRows.length) {
      const { error } = await supabase.from("football_match_history").upsert(historyRows, { onConflict: "external_id" });
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      provider,
      matchesProcessed: rows.length,
      teamsProcessed,
      h2hProcessed,
      fetched: historyRows.length,
      insertedOrUpdated: historyRows.length,
    });
  } catch (error) {
    console.error("Football history sync failed:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
