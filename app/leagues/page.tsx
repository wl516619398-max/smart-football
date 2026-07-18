import type { Metadata } from "next";
import { Globe2, TrendingUp } from "lucide-react";
import { featured } from "@/data/matches";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "足球联赛数据 | Project Athena", description: "查看 Athena 覆盖的足球联赛与精选比赛数据。" };

export default function LeaguesPage() {
  const leagues = Array.from(new Set(featured.map((match) => match.league)));
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="flex items-center gap-2 text-xs font-medium text-blue-400"><Globe2 className="h-3.5 w-3.5" />LEAGUE INTELLIGENCE</div><h1 className="mt-2 text-3xl font-semibold text-white">联赛数据</h1><p className="mt-2 text-sm text-slate-400">按联赛浏览 AI 覆盖的精选比赛和数据分析。</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{leagues.map((league) => <Card key={league} className="transition-colors hover:border-blue-500/30"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm font-medium text-white">{league}</p><p className="mt-1 text-xs text-slate-500">{featured.filter((match) => match.league === league).length} 场精选比赛</p></div><TrendingUp className="h-5 w-5 text-blue-400" /></CardContent></Card>)}</div></div>;
}
