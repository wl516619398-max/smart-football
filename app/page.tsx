import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronRight, CircleDot, ShieldCheck } from "lucide-react";
import { featured } from "@/data/matches";
import { players } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeaturedMatch } from "@/components/home/FeaturedMatch";
import { HeroAI } from "@/components/home/HeroAI";
import { StatsOverview } from "@/components/home/StatsOverview";
import { VIPBanner } from "@/components/home/VIPBanner";
import { PerformanceChart } from "@/components/performance-chart";
import { PlayerCard } from "@/components/player-card";

export const metadata: Metadata = {
  title: "Project Athena - AI足球比赛分析平台",
  description: "AI足球数据分析平台，提供赛事预测、球员分析、xG数据、中国体彩玩法分析参考。",
};

export default function HomePage() {
  const highlight = featured[0];

  return <div className="grid-glow"><HeroAI match={highlight} /><StatsOverview /><section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"><div className="mb-5 flex items-end justify-between"><div><div className="flex items-center gap-2 text-xs font-medium text-blue-400"><CircleDot className="h-3.5 w-3.5" />TODAY&apos;S FOCUS</div><h2 className="mt-2 text-2xl font-semibold text-white">焦点比赛</h2><p className="mt-1 text-sm text-slate-500">AI 已为你筛选今天最值得分析的对决</p></div><Link href="/matches" className="hidden items-center gap-1 text-sm text-blue-400 hover:text-blue-300 sm:flex">全部比赛 <ChevronRight className="h-4 w-4" /></Link></div><div className="grid gap-5 lg:grid-cols-3">{featured.map((match) => <FeaturedMatch key={match.id} match={match} />)}</div><Link href="/matches" className="mt-4 flex items-center justify-center gap-1 text-sm text-blue-400 sm:hidden">查看全部比赛 <ChevronRight className="h-4 w-4" /></Link></section><section className="border-y border-slate-800/70 bg-[#0C1426]/70"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8"><div><div className="mb-5 flex items-end justify-between"><div><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><CalendarDays className="h-3.5 w-3.5" />FORM INDEX</div><h2 className="mt-2 text-xl font-semibold text-white">球队状态指数</h2></div><div className="flex gap-3 text-[11px] text-slate-500"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-blue-500" />主队</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-green-500" />客队</span></div></div><Card><CardContent className="p-4"><PerformanceChart /></CardContent></Card></div><Card className="h-fit"><CardHeader><div className="flex items-center justify-between"><div><p className="text-xs text-amber-400">ATHENA RADAR</p><CardTitle className="mt-1 text-xl">本周关注球员</CardTitle></div><ShieldCheck className="h-5 w-5 text-blue-400" /></div></CardHeader><CardContent className="space-y-3">{players.slice(0, 3).map((player) => <PlayerCard key={player.name} player={player} />)}<Button asChild variant="ghost" className="w-full text-slate-400"><Link href="/ai">进入 AI 球员中心 <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link></Button></CardContent></Card></div></section><section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><VIPBanner /></section></div>;
}
