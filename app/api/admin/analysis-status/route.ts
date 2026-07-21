import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MatchStatus = {
  match_id: string;
  status: "generated" | "pending" | "error";
  created_at: string;
  updated_at: string;
  confidence: number | null;
  version: string;
};

function authorizationError(request: Request) {
  const secret = process.env.ANALYSIS_ADMIN_SECRET?.trim();
  if (!secret) return NextResponse.json({ success: false, error: "ANALYSIS_ADMIN_SECRET is not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

function statusFor(matchId: string, analysis: { analysis_version?: string | null; version?: string | null; created_at?: string | null; updated_at?: string | null; confidence?: number | null } | null, error = false): MatchStatus {
  return {
    match_id: matchId,
    status: error ? "error" : analysis ? "generated" : "pending",
    created_at: analysis?.created_at ?? "",
    updated_at: analysis?.updated_at ?? "",
    confidence: typeof analysis?.confidence === "number" ? analysis.confidence : null,
    version: analysis?.version ?? analysis?.analysis_version ?? "",
  };
}

function startOfTodayInShanghai() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T00:00:00+08:00`;
}

export async function GET(request: Request) {
  const authError = authorizationError(request);
  if (authError) return authError;

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ success: false, error: "Supabase is not configured" }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("match_id")?.trim() ?? "";

  try {
    if (matchId) {
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("external_id")
        .eq("external_id", matchId)
        .maybeSingle();
      if (matchError) throw new Error(matchError.message);
      if (!match) return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });

      const { data: analysis, error: analysisError } = await supabase
        .from("ai_match_analysis")
        .select("analysis_version, version, created_at, updated_at, confidence")
        .eq("match_id", matchId)
        .maybeSingle();
      const status = statusFor(matchId, analysis, Boolean(analysisError));
      if (analysisError) console.error("[admin/analysis-status] analysis read failed:", analysisError.message);
      return NextResponse.json(status, { status: 200 });
    }

    const start = startOfTodayInShanghai();
    const startDate = new Date(start);
    const tomorrow = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    const { data: todayMatches, error: todayMatchesError } = await supabase
      .from("matches")
      .select("external_id, league, home_team, away_team, match_time")
      .gte("match_time", start)
      .lt("match_time", tomorrow.toISOString())
      .order("match_time", { ascending: true })
      .limit(100);
    if (todayMatchesError) throw new Error(todayMatchesError.message);

    let matches = todayMatches ?? [];
    let scope: "today" | "upcoming_7_days" = "today";
    if (!matches.length) {
      const upcomingEnd = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const { data: upcomingMatches, error: upcomingMatchesError } = await supabase
        .from("matches")
        .select("external_id, league, home_team, away_team, match_time")
        .gte("match_time", start)
        .lt("match_time", upcomingEnd.toISOString())
        .order("match_time", { ascending: true })
        .limit(100);
      if (upcomingMatchesError) throw new Error(upcomingMatchesError.message);
      matches = upcomingMatches ?? [];
      scope = "upcoming_7_days";
    }

    const ids = (matches ?? []).map((match) => String(match.external_id));
    const { data: analyses, error: analysesError } = ids.length
      ? await supabase.from("ai_match_analysis").select("match_id, analysis_version, version, created_at, updated_at, confidence").in("match_id", ids)
      : { data: [], error: null };
    if (analysesError) console.error("[admin/analysis-status] analysis list failed:", analysesError.message);

    const analysisByMatch = new Map((analyses ?? []).map((analysis) => [String(analysis.match_id), analysis]));
    const data = (matches ?? []).map((match) => {
      const analysis = analysisByMatch.get(String(match.external_id));
      return {
        ...statusFor(String(match.external_id), analysis ?? null, Boolean(analysesError)),
        league: String(match.league ?? ""),
        home_team: String(match.home_team ?? ""),
        away_team: String(match.away_team ?? ""),
        match_time: String(match.match_time ?? ""),
      };
    });

    return NextResponse.json({ success: true, data, scope }, { status: 200 });
  } catch (error) {
    console.error("[admin/analysis-status] failed:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, error: "Analysis status unavailable" }, { status: 500 });
  }
}
