"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, CircleDot } from "lucide-react";
import { FeaturedMatch } from "@/components/home/FeaturedMatch";
import { HeroAI } from "@/components/home/HeroAI";
import { featured as mockFeatured } from "@/data/matches";
import { predictMatch } from "@/lib/ai/predictor";
import type { FootballMatch } from "@/lib/football/types";
import type { FeaturedMatch as FeaturedMatchData, MatchRisk, MatchTeam } from "@/types/match";

type FootballApiResponse = { success: boolean; data: FootballMatch[] };

const teamColors = ["#2563EB", "#22C55E", "#A855F7", "#F59E0B"];

function toTeam(matchTeam: FootballMatch["homeTeam"], index: number, fallback?: MatchTeam): MatchTeam {
  return {
    name: matchTeam.name,
    englishName: matchTeam.name,
    shortName: matchTeam.shortName || matchTeam.name.slice(0, 3).toUpperCase(),
    color: fallback?.color ?? teamColors[index % teamColors.length],
    secondaryColor: fallback?.secondaryColor ?? teamColors[(index + 1) % teamColors.length],
  };
}

function toFeaturedMatch(match: FootballMatch, index: number): FeaturedMatchData {
  const fallback = mockFeatured.find((item) => item.id === match.id);
  const prediction = predictMatch(match);
  const date = new Date(match.date);
  const validDate = !Number.isNaN(date.getTime());
  return {
    id: match.id,
    league: match.league,
    date: validDate ? date.toISOString().slice(0, 10) : match.date.slice(0, 10),
    time: validDate ? date.toISOString().slice(11, 16) : "待定",
    homeTeam: toTeam(match.homeTeam, index, fallback?.homeTeam),
    awayTeam: toTeam(match.awayTeam, index + 1, fallback?.awayTeam),
    aiScore: prediction.confidence,
    prediction: prediction.recommendation,
    score: prediction.score[0].replace("-", ":"),
    risk: prediction.risk as MatchRisk,
    homeWin: prediction.homeWin,
    draw: prediction.draw,
    awayWin: prediction.awayWin,
  };
}

export function LiveHomeMatches() {
  const [matches, setMatches] = useState<FeaturedMatchData[]>(mockFeatured);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMatches() {
      try {
        const response = await fetch("/api/football", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Football API request failed");
        const payload = (await response.json()) as FootballApiResponse;
        if (!payload.success || !payload.data.length) throw new Error("No football data returned");
        setMatches(payload.data.map((match, index) => toFeaturedMatch(match, index)));
      } catch {
        if (!controller.signal.aborted) setMatches(mockFeatured);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadMatches();
    return () => controller.abort();
  }, []);

  const highlight = matches[0] ?? mockFeatured[0];

  return <><HeroAI match={highlight} /><section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"><div className="mb-5 flex items-end justify-between"><div><div className="flex items-center gap-2 text-xs font-medium text-blue-400"><CircleDot className="h-3.5 w-3.5" />TODAY&apos;S FOCUS</div><h2 className="mt-2 text-2xl font-semibold text-white">焦点比赛</h2><p className="mt-1 text-sm text-slate-500">AI 已为你筛选今天最值得分析的对决</p></div><Link href="/matches" className="hidden items-center gap-1 text-sm text-blue-400 hover:text-blue-300 sm:flex">全部比赛 <ChevronRight className="h-4 w-4" /></Link></div><div className="grid gap-5 lg:grid-cols-3">{loading ? [0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-xl border border-slate-800 bg-[#111827]" />) : matches.map((match) => <FeaturedMatch key={match.id} match={match} />)}</div><Link href="/matches" className="mt-4 flex items-center justify-center gap-1 text-sm text-blue-400 sm:hidden">查看全部比赛 <ChevronRight className="h-4 w-4" /></Link></section></>;
}
