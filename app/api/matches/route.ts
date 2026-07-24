import { NextResponse } from "next/server";
import { getUpcomingDateWindow } from "@/lib/football/date-window";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = positiveInteger(url.searchParams.get("page"), 1);
  const pageSize = Math.min(positiveInteger(url.searchParams.get("pageSize"), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const date = url.searchParams.get("date")?.trim() ?? "";
  const league = url.searchParams.get("league")?.trim() ?? "";
  const search = url.searchParams.get("search")?.trim() ?? "";
  const hasNextPublicSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  console.log("[api/matches] Supabase environment", {
    hasNextPublicSupabaseUrl,
    hasSupabaseUrl,
    hasSupabaseServiceRoleKey,
  });

  const supabase = getSupabaseServerClient();

  console.info("[api/matches] query", { date, league, search, page, pageSize });

  if (!supabase) {
    console.error("[api/matches] Supabase is not configured");
    return NextResponse.json(
      { success: false, data: [], total: 0, page, pageSize, totalPages: 0, source: "supabase", error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  try {
    let query = supabase
      .from("matches")
      .select("id,external_id,league,home_team,away_team,match_time,home_logo,away_logo,home_win,draw,away_win,ai_score,ai_pick,risk_level", { count: "exact" })
      .order("match_time", { ascending: true });

    if (date) {
      const start = new Date(`${date}T00:00:00.000+08:00`);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      if (!Number.isNaN(start.getTime())) query = query.gte("match_time", start.toISOString()).lt("match_time", end.toISOString());
    } else {
      const window = getUpcomingDateWindow();
      query = query.gte("match_time", window.start.toISOString()).lt("match_time", window.end.toISOString());
    }
    if (league) query = query.eq("league", league);
    if (search) {
      const safeSearch = search.replace(/[(),]/g, " ");
      query = query.or(`home_team.ilike.%${safeSearch}%,away_team.ilike.%${safeSearch}%`);
    }

    const from = (page - 1) * pageSize;
    const { data, count, error } = await query.range(from, from + pageSize - 1);
    if (error) {
      console.error("[api/matches] Supabase query error", error.message, error);
      throw new Error(error.message);
    }

    const rows = (data ?? []).map((row) => ({
      id: row.id ?? row.external_id,
      league: row.league,
      home_team: row.home_team,
      away_team: row.away_team,
      match_time: row.match_time,
      home_logo: row.home_logo ?? null,
      away_logo: row.away_logo ?? null,
      home_win: row.home_win ?? null,
      draw: row.draw ?? null,
      away_win: row.away_win ?? null,
      home_win_probability: row.home_win ?? null,
      draw_probability: row.draw ?? null,
      away_win_probability: row.away_win ?? null,
      ai_consistency: null,
      ai_score: row.ai_score ?? null,
      ai_pick: row.ai_pick ?? null,
      risk_level: row.risk_level ?? null,
    }));
    const total = count ?? rows.length;
    console.info("[api/matches] result", { count: rows.length, total });

    return NextResponse.json({ success: true, data: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize), source: "supabase" });
  } catch (error) {
    console.error("[api/matches] request failed", error instanceof Error ? error.message : String(error), error);
    return NextResponse.json(
      { success: false, data: [], total: 0, page, pageSize, totalPages: 0, source: "supabase", error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
