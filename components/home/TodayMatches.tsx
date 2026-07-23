"use client";

import { useMemo, useState } from "react";
import { MatchCard } from "@/components/home/MatchCard";
import type { FeaturedMatch } from "@/types/match";
import { decodeUnicode } from "@/lib/utils/decode-unicode";
import { isHotLeague } from "@/lib/football/hot-leagues";

type Filter = "all" | "hot" | "premier" | "la-liga" | "champions" | "analyzed";

const filters: Array<{ key: Filter; label: string }> = [
  { key: "all", label: decodeUnicode("\\u5168\\u90e8") },
  { key: "hot", label: decodeUnicode("\\u70ed\\u95e8") },
  { key: "premier", label: decodeUnicode("\\u82f1\\u8d85") },
  { key: "la-liga", label: decodeUnicode("\\u897f\\u7532") },
  { key: "champions", label: decodeUnicode("\\u6b27\\u51a0") },
  { key: "analyzed", label: decodeUnicode("\\u5df2\\u5206\\u6790") },
];

const leagueAliases: Record<Exclude<Filter, "all" | "hot" | "analyzed">, string[]> = {
  premier: ["premier league", "english premier league", "\\u82f1\\u8d85"],
  "la-liga": ["la liga", "primera division", "\\u897f\\u7532"],
  champions: ["champions league", "uefa champions league", "\\u6b27\\u51a0"],
};

function matchesLeague(match: FeaturedMatch, filter: Exclude<Filter, "all" | "hot" | "analyzed">) {
  const league = decodeUnicode(match.league).toLowerCase();
  return leagueAliases[filter].some((alias) => {
    const normalizedAlias = decodeUnicode(alias).toLowerCase();
    return league.includes(normalizedAlias);
  });
}

function isAnalyzed(match: FeaturedMatch) {
  return match.aiScore !== null || decodeUnicode(match.analysisStatus) === decodeUnicode("\\u5df2\\u5206\\u6790");
}

export function TodayMatches({ matches }: { matches: FeaturedMatch[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const filteredMatches = useMemo(() => matches.filter((match) => {
    if (filter === "hot") return isHotLeague(decodeUnicode(match.league));
    if (filter === "analyzed") return isAnalyzed(match);
    if (filter !== "all") return matchesLeague(match, filter);
    return true;
  }), [filter, matches]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-blue-400">TODAY&apos;S MATCH CENTER</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">{decodeUnicode("\\u4eca\\u65e5\\u8d5b\\u4e8b\\u4e2d\\u5fc3")}</h2>
          <p className="mt-1 text-sm text-slate-500">{decodeUnicode("\\u9009\\u62e9\\u8d5b\\u4e8b\\u540e\\u67e5\\u770b\\u5b8c\\u6574 AI \\u5206\\u6790")}</p>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label={decodeUnicode("\\u8d5b\\u4e8b\\u7b5b\\u9009")}>
          {filters.map((item) => <button key={item.key} type="button" role="tab" aria-selected={filter === item.key} onClick={() => setFilter(item.key)} className={`shrink-0 whitespace-nowrap rounded-lg border px-3 py-2 text-xs transition-colors ${filter === item.key ? "border-blue-400/40 bg-blue-500/15 text-blue-200" : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200"}`}>{item.label}</button>)}
        </div>
      </div>
      {filteredMatches.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredMatches.map((match) => <MatchCard key={match.id} match={match} />)}</div> : <div className="rounded-xl border border-slate-800 bg-[#111827] px-5 py-12 text-center"><p className="text-sm text-slate-300">{decodeUnicode("\\u5f53\\u524d\\u7b5b\\u9009\\u6682\\u65e0\\u6bd4\\u8d5b")}</p><p className="mt-2 text-xs text-slate-500">{decodeUnicode("\\u8bf7\\u5207\\u6362\\u5176\\u4ed6\\u8d5b\\u4e8b\\u7b5b\\u9009\\u67e5\\u770b")}</p></div>}
    </div>
  );
}
