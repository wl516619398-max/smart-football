"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { Button } from "@/components/ui/button";
import { getUpcomingDateWindow } from "@/lib/football/date-window";
import type { MatchCenterRow } from "@/lib/football/match-center";
import type { FeaturedMatch, MatchRisk, MatchTeam } from "@/types/match";

export type SyncedMatch = MatchCenterRow;

export type MatchesResponse = {
  success: boolean;
  data: SyncedMatch[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const leagueOptions = ["Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "UEFA Champions League", "英格兰超级联赛", "西甲", "德甲"];
const colors = ["#2563EB", "#22C55E", "#A855F7", "#F59E0B"];

function shortName(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 3).toUpperCase() || name.slice(0, 3).toUpperCase();
}

function toFeaturedMatch(match: SyncedMatch, index: number): FeaturedMatch {
  const date = new Date(match.match_time);
  const validDate = !Number.isNaN(date.getTime());
  const homeWin = match.home_win ?? 40 + (index % 5) * 3;
  const draw = match.draw ?? 27;
  const awayWin = match.away_win ?? Math.max(0, 100 - homeWin - draw);
  const homeTeam: MatchTeam = { name: match.home_team, englishName: match.home_team, shortName: shortName(match.home_team), color: colors[index % colors.length], secondaryColor: colors[(index + 1) % colors.length] };
  const awayTeam: MatchTeam = { name: match.away_team, englishName: match.away_team, shortName: shortName(match.away_team), color: colors[(index + 2) % colors.length], secondaryColor: colors[(index + 3) % colors.length] };
  const risk = (match.risk_level || (homeWin >= 47 ? "低" : homeWin <= 41 ? "高" : "中")) as MatchRisk;

  return {
    id: match.external_id,
    league: match.league,
    date: validDate ? date.toISOString().slice(0, 10) : match.match_time.slice(0, 10),
    time: validDate ? date.toISOString().slice(11, 16) : "待定",
    homeTeam,
    awayTeam,
    aiScore: match.ai_score ?? Math.max(homeWin, awayWin) + 20,
    prediction: match.ai_pick || (homeWin >= awayWin ? "主胜" : "客胜"),
    score: homeWin >= awayWin ? "2:1" : "1:2",
    risk,
    homeWin,
    draw,
    awayWin,
  };
}

export function MatchesBrowser({ initialResult }: { initialResult: MatchesResponse }) {
  const [date, setDate] = useState("");
  const [league, setLeague] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<MatchesResponse>(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const skipInitialRequest = useRef(initialResult.data.length > 0);
  const dateWindow = getUpcomingDateWindow();

  useEffect(() => {
    if (skipInitialRequest.current && page === 1 && !date && !league && !search) {
      skipInitialRequest.current = false;
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (date) params.set("date", date);
    if (league) params.set("league", league);
    if (search) params.set("search", search);

    setLoading(true);
    setError("");
    fetch(`/api/matches?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as Partial<MatchesResponse> & { items?: unknown; matches?: unknown };
        if (!response.ok || payload.success !== true) throw new Error("比赛数据暂时无法加载");

        const rows = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.items) ? payload.items : Array.isArray(payload.matches) ? payload.matches : [];
        const total = typeof payload.total === "number" ? payload.total : rows.length;
        const currentPage = typeof payload.page === "number" ? payload.page : page;
        const currentPageSize = typeof payload.pageSize === "number" ? payload.pageSize : 20;
        const totalPages = typeof payload.totalPages === "number" ? payload.totalPages : Math.ceil(total / currentPageSize);
        setResult({ success: true, data: rows as SyncedMatch[], total, page: currentPage, pageSize: currentPageSize, totalPages });
      })
      .catch((requestError: Error) => { if (requestError.name !== "AbortError") setError(requestError.message); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [date, league, page, search]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function clearFilters() {
    setDate("");
    setLeague("");
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  const matches = result.data.map(toFeaturedMatch);

  return (
    <div>
      <form onSubmit={handleSearch} className="rounded-2xl border border-slate-800 bg-[#111827] p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
          <label className="block"><span className="mb-2 block text-xs text-slate-500">球队搜索</span><div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3"><Search className="h-4 w-4 text-slate-500" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="搜索球队名称" className="h-10 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" /></div></label>
          <label className="block"><span className="mb-2 block text-xs text-slate-500">比赛日期</span><div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3"><CalendarDays className="h-4 w-4 text-slate-500" /><input type="date" min={dateWindow.startKey} max={dateWindow.endKey} value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }} className="h-10 w-full bg-transparent text-sm text-white outline-none" /></div><span className="mt-1 block text-[10px] text-slate-600">可选择今天至未来30天</span></label>
          <label className="block"><span className="mb-2 block text-xs text-slate-500">联赛</span><select value={league} onChange={(event) => { setLeague(event.target.value); setPage(1); }} className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none"><option value="">全部联赛</option>{leagueOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <div className="flex gap-2"><Button type="submit"><Filter className="mr-2 h-4 w-4" />查询</Button><Button type="button" variant="outline" onClick={clearFilters}>清除</Button></div>
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between"><p className="text-sm text-slate-300">全部比赛 <span className="ml-1 text-slate-500">{result.total} 场</span></p><p className="text-xs text-slate-500">默认显示今天及未来最近赛事</p></div>
      {loading ? <div className="mt-4 grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-xl border border-slate-800 bg-[#111827]" />)}</div> : error ? <div className="mt-4 rounded-xl border border-dashed border-red-500/30 bg-red-500/5 p-10 text-center text-sm text-red-300">{error}</div> : matches.length ? <div className="mt-4 grid gap-4 lg:grid-cols-3">{matches.map((match) => <MatchCard key={match.id} match={match} />)}</div> : <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-12 text-center"><p className="text-sm font-medium text-slate-300">暂无未来30天内的赛事</p><p className="mt-2 text-xs text-slate-500">当前日期范围内暂无匹配比赛，请稍后再试。</p></div>}

      <div className="mt-8 flex items-center justify-center gap-4"><Button type="button" variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="mr-1 h-4 w-4" />上一页</Button><span className="text-xs text-slate-500">第 {result.page} / {Math.max(result.totalPages, 1)} 页</span><Button type="button" variant="outline" size="sm" disabled={page >= result.totalPages || loading || result.totalPages === 0} onClick={() => setPage((value) => value + 1)}>下一页<ChevronRight className="ml-1 h-4 w-4" /></Button></div>
    </div>
  );
}
