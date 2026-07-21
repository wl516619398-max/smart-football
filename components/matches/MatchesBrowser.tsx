"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { Button } from "@/components/ui/button";
import { formatMatchDateTime } from "@/lib/football/date-format";
import { getUpcomingDateWindow } from "@/lib/football/date-window";
import { getTeamDisplayName } from "@/lib/football/team-name-map";
import type { MatchCenterRow } from "@/lib/football/match-center";
import type { FeaturedMatch, MatchRisk, MatchTeam } from "@/types/match";

export type SyncedMatch = MatchCenterRow;
export type MatchesResponse = { success: boolean; data: SyncedMatch[]; total: number; page: number; pageSize: number; totalPages: number };

const leagueOptions = ["Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "UEFA Champions League"];
const colors = ["#2563EB", "#22C55E", "#A855F7", "#F59E0B"];

function shortName(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 3).toUpperCase() || name.slice(0, 3).toUpperCase(); }

function toFeaturedMatch(match: SyncedMatch, index: number): FeaturedMatch {
  const formattedDate = formatMatchDateTime(match.match_time);
  const homeTeamName = getTeamDisplayName(match.home_team);
  const awayTeamName = getTeamDisplayName(match.away_team);
  const homeTeam: MatchTeam = { id: match.home_team_id ?? undefined, name: homeTeamName, englishName: match.home_team, shortName: shortName(homeTeamName), color: colors[index % colors.length], secondaryColor: colors[(index + 1) % colors.length] };
  const awayTeam: MatchTeam = { id: match.away_team_id ?? undefined, name: awayTeamName, englishName: match.away_team, shortName: shortName(awayTeamName), color: colors[(index + 2) % colors.length], secondaryColor: colors[(index + 3) % colors.length] };
  return { id: match.external_id, league: match.league, date: formattedDate.date, time: formattedDate.time, homeTeam, awayTeam, aiScore: match.ai_score, prediction: match.ai_pick || "\u6570\u636e\u540c\u6b65\u4e2d", score: "\u5f85\u751f\u6210", risk: (match.risk_level || "\u4e2d") as MatchRisk, homeWin: match.home_win, draw: match.draw, awayWin: match.away_win };
}

export function MatchesBrowser({ initialResult }: { initialResult: MatchesResponse }) {
  const dateWindow = getUpcomingDateWindow();
  const [date, setDate] = useState(dateWindow.startKey);
  const [league, setLeague] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<MatchesResponse>(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const skipInitialRequest = useRef(initialResult.data.length > 0);

  useEffect(() => {
    if (skipInitialRequest.current && page === 1 && date === dateWindow.startKey && !league && !search) { skipInitialRequest.current = false; return; }
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (date) params.set("date", date);
    if (league) params.set("league", league);
    if (search) params.set("search", search);
    setLoading(true); setError("");
    fetch(`/api/matches?${params.toString()}`, { signal: controller.signal }).then(async (response) => {
      const payload = (await response.json()) as Partial<MatchesResponse> & { items?: unknown; matches?: unknown };
      if (!response.ok || payload.success !== true) throw new Error("\u6bd4\u8d5b\u6570\u636e\u6682\u65f6\u65e0\u6cd5\u52a0\u8f7d");
      const rows = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.items) ? payload.items : Array.isArray(payload.matches) ? payload.matches : [];
      const total = typeof payload.total === "number" ? payload.total : rows.length;
      const currentPage = typeof payload.page === "number" ? payload.page : page;
      const currentPageSize = typeof payload.pageSize === "number" ? payload.pageSize : 20;
      setResult({ success: true, data: rows as SyncedMatch[], total, page: currentPage, pageSize: currentPageSize, totalPages: typeof payload.totalPages === "number" ? payload.totalPages : Math.ceil(total / currentPageSize) });
    }).catch((requestError: Error) => { if (requestError.name !== "AbortError") setError(requestError.message); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [date, dateWindow.startKey, league, page, search]);

  function handleSearch(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }
  function clearFilters() { setDate(dateWindow.startKey); setLeague(""); setSearchInput(""); setSearch(""); setPage(1); }
  const matches = result.data.map(toFeaturedMatch);

  return <div><form onSubmit={handleSearch} className="rounded-2xl border border-slate-800 bg-[#111827] p-4"><div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto] md:items-end"><label className="block"><span className="mb-2 block text-xs text-slate-500">\u7403\u961f\u641c\u7d22</span><div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3"><Search className="h-4 w-4 text-slate-500" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="\u641c\u7d22\u7403\u961f\u540d\u79f0" className="h-10 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" /></div></label><label className="block"><span className="mb-2 block text-xs text-slate-500">\u6bd4\u8d5b\u65e5\u671f</span><div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3"><CalendarDays className="h-4 w-4 text-slate-500" /><input type="date" min={dateWindow.startKey} max={dateWindow.endKey} value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }} className="h-10 w-full bg-transparent text-sm text-white outline-none" /></div><span className="mt-1 block text-[10px] text-slate-600">\u53ef\u9009\u62e9\u4eca\u5929\u81f3\u672a\u6765 30 \u5929</span></label><label className="block"><span className="mb-2 block text-xs text-slate-500">\u8054\u8d5b</span><select value={league} onChange={(event) => { setLeague(event.target.value); setPage(1); }} className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none"><option value="">\u5168\u90e8\u8054\u8d5b</option>{leagueOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label><div className="flex gap-2"><Button type="submit"><Filter className="mr-2 h-4 w-4" />\u67e5\u8be2</Button><Button type="button" variant="outline" onClick={clearFilters}>\u6e05\u9664</Button></div></div></form><div className="mt-6 flex items-center justify-between"><p className="text-sm text-slate-300">\u5168\u90e8\u6bd4\u8d5b <span className="ml-1 text-slate-500">{result.total} \u573a</span></p><p className="text-xs text-slate-500">\u9ed8\u8ba4\u663e\u793a\u4eca\u5929\u53ca\u672a\u6765\u6700\u8fd1\u8d5b\u4e8b</p></div>{loading ? <div className="mt-4 grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-xl border border-slate-800 bg-[#111827]" />)}</div> : error ? <div className="mt-4 rounded-xl border border-dashed border-red-500/30 bg-red-500/5 p-10 text-center text-sm text-red-300">{error}</div> : matches.length ? <div className="mt-4 grid gap-4 lg:grid-cols-3">{matches.map((match) => <MatchCard key={match.id} match={match} />)}</div> : <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-12 text-center"><p className="text-sm font-medium text-slate-300">\u6682\u65e0\u672a\u6765 30 \u5929\u5185\u7684\u8d5b\u4e8b</p><p className="mt-2 text-xs text-slate-500">\u5f53\u524d\u65e5\u671f\u8303\u56f4\u5185\u6682\u65e0\u5339\u914d\u6bd4\u8d5b\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002</p></div>}<div className="mt-8 flex items-center justify-center gap-4"><Button type="button" variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="mr-1 h-4 w-4" />\u4e0a\u4e00\u9875</Button><span className="text-xs text-slate-500">\u7b2c {result.page} / {Math.max(result.totalPages, 1)} \u9875</span><Button type="button" variant="outline" size="sm" disabled={page >= result.totalPages || loading || result.totalPages === 0} onClick={() => setPage((value) => value + 1)}>\u4e0b\u4e00\u9875 <ChevronRight className="ml-1 h-4 w-4" /></Button></div></div>;
}
