import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  const supabase = getSupabaseServerClient();
  const url = new URL(request.url);
  const page = positiveInteger(url.searchParams.get("page"), 1);
  const pageSize = Math.min(positiveInteger(url.searchParams.get("pageSize"), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const date = url.searchParams.get("date")?.trim() ?? "";
  const league = url.searchParams.get("league")?.trim() ?? "";
  const search = url.searchParams.get("search")?.trim() ?? "";

  if (!supabase) return NextResponse.json({ success: false, data: [], total: 0, page, pageSize, totalPages: 0, error: "Supabase is not configured" }, { status: 503 });

  try {
    let query = supabase.from("matches").select("external_id,league,home_team,away_team,match_time,home_win,draw,away_win,ai_score", { count: "exact" }).order("match_time", { ascending: true });

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      if (!Number.isNaN(start.getTime())) query = query.gte("match_time", start.toISOString()).lt("match_time", end.toISOString());
    }
    if (league) query = query.eq("league", league);
    if (search) {
      const safeSearch = search.replace(/[(),]/g, " ");
      query = query.or(`home_team.ilike.%${safeSearch}%,away_team.ilike.%${safeSearch}%`);
    }

    const from = (page - 1) * pageSize;
    const { data, count, error } = await query.range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);

    const total = count ?? 0;
    return NextResponse.json({ success: true, data: data ?? [], total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch {
    return NextResponse.json({ success: false, data: [], total: 0, page, pageSize, totalPages: 0 }, { status: 503 });
  }
}
