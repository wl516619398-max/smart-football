import type { Metadata } from "next";
import { MatchesBrowser, type MatchesResponse, type SyncedMatch } from "@/components/matches/MatchesBrowser";
import { getUpcomingFixturesWithSource } from "@/lib/football/fixture-service";
import { footballMatchesToMatchCenterRows } from "@/lib/football/match-center";
import { getUpcomingDateWindow, isTodayOrFuture } from "@/lib/football/date-window";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "比赛中心 | Project Athena",
  description: "浏览 Project Athena 已同步的全部足球比赛，并使用日期、联赛和球队筛选。",
};

export const dynamic = "force-dynamic";

async function getInitialMatches(): Promise<MatchesResponse> {
  const emptyResult: MatchesResponse = { success: false, data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  const liveResult = await getUpcomingFixturesWithSource();
  const liveRows = footballMatchesToMatchCenterRows(liveResult.matches).filter((row) => isTodayOrFuture(row.match_time));
  if (liveResult.source === "football-api" && liveRows.length) {
    return { success: true, data: liveRows.slice(0, 20), total: liveRows.length, page: 1, pageSize: 20, totalPages: Math.ceil(liveRows.length / 20) };
  }

  const supabase = getSupabaseServerClient();
  if (supabase) {
    const window = getUpcomingDateWindow();
    const { data, count, error } = await supabase
      .from("matches")
      .select("external_id,league,home_team,away_team,match_time,home_win,draw,away_win,ai_score", { count: "exact" })
      .gte("match_time", window.start.toISOString())
      .order("match_time", { ascending: true })
      .range(0, 19);

    if (!error && data?.length) {
      const matches = data as SyncedMatch[];
      const total = count ?? matches.length;
      return { success: true, data: matches, total, page: 1, pageSize: 20, totalPages: Math.ceil(total / 20) };
    }

    if (error) console.error("Failed to load initial matches:", error);
  }

  try {
    const fallbackRows = liveRows.slice(0, 20);
    return { success: fallbackRows.length > 0, data: fallbackRows, total: fallbackRows.length, page: 1, pageSize: 20, totalPages: fallbackRows.length ? 1 : 0 };
  } catch (error) {
    console.error("Failed to load football API fallback:", error);
    return emptyResult;
  }
}

export default async function MatchesPage() {
  const initialResult = await getInitialMatches();
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div><p className="text-xs font-medium tracking-[0.2em] text-blue-400">MATCH CENTER</p><h1 className="mt-3 text-3xl font-semibold text-white">全部比赛</h1><p className="mt-2 text-sm text-slate-400">浏览已同步赛程，进入每场比赛的 Athena AI 分析。</p></div><div className="mt-8"><MatchesBrowser initialResult={initialResult} /></div></main>;
}
