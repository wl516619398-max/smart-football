import { NextResponse } from "next/server";
import { getUpcomingFixtures } from "@/lib/football/fixture-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { predictMatch } from "@/lib/ai/predictor";

function isAuthorized(request: Request) {
  const secret = process.env.MATCH_SYNC_SECRET;
  const authorization = request.headers.get("authorization");
  return Boolean(secret && authorization === `Bearer ${secret}`);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ success: false, error: "Supabase is not configured" }, { status: 503 });

  try {
    const fixtures = await getUpcomingFixtures();
    const rows = fixtures.map((fixture) => ({
      ...(() => {
        const prediction = predictMatch(fixture);
        return {
          home_win: prediction.homeWin,
          draw: prediction.draw,
          away_win: prediction.awayWin,
          ai_score: prediction.confidence,
          ai_pick: prediction.recommendation,
          risk_level: prediction.risk,
        };
      })(),
      external_id: fixture.id,
      league: fixture.league,
      home_team: fixture.homeTeam.name,
      away_team: fixture.awayTeam.name,
      match_time: fixture.date,
      home_logo: fixture.homeTeam.logo ?? null,
      away_logo: fixture.awayTeam.logo ?? null,
    }));

    if (!rows.length) return NextResponse.json({ success: true, fetched: 0, insertedOrUpdated: 0 });

    const { data, error } = await supabase.from("matches").upsert(rows, { onConflict: "external_id" }).select("external_id");
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, fetched: fixtures.length, insertedOrUpdated: data?.length ?? rows.length });
  } catch (error: unknown) {
    console.error("Match sync failed:", error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
