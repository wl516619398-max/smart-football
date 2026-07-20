import { NextResponse } from "next/server";
import { getUpcomingFixturesWithSource } from "@/lib/football/fixture-service";
import { footballMatchesToMatchCenterRows, type MatchCenterRow } from "@/lib/football/match-center";
import { getUpcomingDateWindow, isTodayOrFuture, toShanghaiDateKey } from "@/lib/football/date-window";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function filterAndPageFallback(rows: MatchCenterRow[], url: URL, page: number, pageSize: number) {
  const date = url.searchParams.get("date")?.trim() ?? "";
  const league = url.searchParams.get("league")?.trim() ?? "";
  const search = url.searchParams.get("search")?.trim().toLowerCase() ?? "";
  const eligibleRows = rows
    .filter((row) => !league || row.league === league)
    .filter((row) => !search || `${row.home_team} ${row.away_team}`.toLowerCase().includes(search));
  const exactDateRows = date ? eligibleRows.filter((row) => toShanghaiDateKey(row.match_time) === date) : [];
  const filtered = (date && exactDateRows.length ? exactDateRows : eligibleRows.filter((row) => isTodayOrFuture(row.match_time)))
    .sort((left, right) => new Date(left.match_time).getTime() - new Date(right.match_time).getTime());
  const from = (page - 1) * pageSize;
  const data = filtered.slice(from, from + pageSize);
  const total = filtered.length;

  return { success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize), source: "football-api" };
}

async function getFootballApiFallback(url: URL, page: number, pageSize: number) {
  try {
    const result = await getUpcomingFixturesWithSource();
    return { ...filterAndPageFallback(footballMatchesToMatchCenterRows(result.matches), url, page, pageSize), source: result.source };
  } catch (error) {
    console.error("Failed to load football API fallback:", error);
    return { success: false, data: [], total: 0, page, pageSize, totalPages: 0, source: "football-api" };
  }
}

export async function GET(request: Request) {
  const supabase = getSupabaseServerClient();
  const url = new URL(request.url);
  const page = positiveInteger(url.searchParams.get("page"), 1);
  const pageSize = Math.min(positiveInteger(url.searchParams.get("pageSize"), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const date = url.searchParams.get("date")?.trim() ?? "";
  const league = url.searchParams.get("league")?.trim() ?? "";
  const search = url.searchParams.get("search")?.trim() ?? "";

  const liveResult = await getUpcomingFixturesWithSource();
  const liveResponse = filterAndPageFallback(footballMatchesToMatchCenterRows(liveResult.matches), url, page, pageSize);
  if (liveResult.source === "football-api") return NextResponse.json({ ...liveResponse, source: "football-api" });

  if (!supabase) return NextResponse.json({ ...liveResponse, source: "mock" });

  try {
    let query = supabase.from("matches").select("external_id,league,home_team,away_team,match_time,home_win,draw,away_win,ai_score", { count: "exact" }).order("match_time", { ascending: true });

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      if (!Number.isNaN(start.getTime())) query = query.gte("match_time", start.toISOString()).lt("match_time", end.toISOString());
    } else {
      const window = getUpcomingDateWindow();
      query = query.gte("match_time", window.start.toISOString());
    }
    if (league) query = query.eq("league", league);
    if (search) {
      const safeSearch = search.replace(/[(),]/g, " ");
      query = query.or(`home_team.ilike.%${safeSearch}%,away_team.ilike.%${safeSearch}%`);
    }

    const from = (page - 1) * pageSize;
    const { data, count, error } = await query.range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);

    const rows = data ?? [];
    if (!rows.length) return NextResponse.json({ ...liveResponse, source: "mock" });

    const total = count ?? rows.length;
    return NextResponse.json({ success: true, data: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize), source: "supabase" });
  } catch (error) {
    console.error("Failed to load matches from Supabase, using football API fallback:", error);
    return NextResponse.json(await getFootballApiFallback(url, page, pageSize));
  }
}
