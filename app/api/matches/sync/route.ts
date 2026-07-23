import { NextResponse } from "next/server";
import { getTodayHotFixturesWithSource } from "@/lib/football/fixture-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDynamicMatchPrediction } from "@/lib/football/dynamic-prediction";
import { generateAndSaveFeaturedMatchAnalyses } from "@/lib/ai/match-analysis-generator";

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
    const fixtureResult = await getTodayHotFixturesWithSource();
    const fixtures = fixtureResult.matches.slice(0, 50);
    const rows = await Promise.all(fixtures.map(async (fixture) => {
      const prediction = await getDynamicMatchPrediction(fixture);
      return {
        home_win: prediction?.homeWin ?? null,
        draw: prediction?.draw ?? null,
        away_win: prediction?.awayWin ?? null,
        ai_score: prediction?.confidence ?? null,
        ai_pick: prediction?.recommendation ?? null,
        risk_level: prediction?.risk ?? null,
        external_id: fixture.id,
        league: fixture.league,
        home_team: fixture.homeTeam.name,
        away_team: fixture.awayTeam.name,
        home_team_id: fixture.homeTeam.id,
        away_team_id: fixture.awayTeam.id,
        match_time: fixture.date,
        home_logo: fixture.homeTeam.logo ?? null,
        away_logo: fixture.awayTeam.logo ?? null,
      };
    }));

    if (!rows.length) return NextResponse.json({ success: true, fetched: 0, insertedOrUpdated: 0, analysisGenerated: 0 });

    const { data, error } = await supabase.from("matches").upsert(rows, { onConflict: "external_id" }).select("external_id");
    if (error) throw new Error(error.message);
    const analysis = await generateAndSaveFeaturedMatchAnalyses(supabase, fixtures, rows);

    return NextResponse.json({
      success: true,
      provider: fixtureResult.source,
      fetched: fixtures.length,
      insertedOrUpdated: data?.length ?? rows.length,
      analysisGenerated: analysis.generated,
      analysisFailed: analysis.failed,
    });
  } catch (error: unknown) {
    console.error("Match sync failed:", error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
