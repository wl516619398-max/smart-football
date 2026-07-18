import type { Metadata } from "next";
import { BrainCircuit, Gauge, Lightbulb, Lock, Radar, Sparkles } from "lucide-react";
import Link from "next/link";
import { featured } from "@/data/matches";
import { players } from "@/data/mock-data";
import { AIRecommendationCard } from "@/components/ai-recommendation-card";
import { PlayerCard } from "@/components/player-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "AI足球赛事推荐 | Project Athena",
  description: "Athena AI 基于球队状态、数据模型和历史表现生成足球赛事推荐。",
};

export default function AIPage() {
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><section className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#111827] via-[#111d3a] to-[#111827] p-6 sm:p-10"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/15 blur-[80px]" /><div className="relative max-w-2xl"><div className="flex items-center gap-2 text-xs font-medium text-blue-300"><BrainCircuit className="h-4 w-4" />ATHENA AI LAB</div><h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">今日AI精选</h1><p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">基于球队状态、数据模型和历史表现生成。所有推荐均为 Mock 数据下的分析参考。</p><div className="mt-6 flex flex-wrap gap-3"><div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-300"><Radar className="h-4 w-4 text-blue-400" />42 项特征</div><div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-300"><Gauge className="h-4 w-4 text-green-400" />78.6% 昨日分析</div><div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-300"><Lightbulb className="h-4 w-4 text-amber-400" />每日更新</div></div></div></section><div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]"><div><div className="mb-4 flex items-end justify-between"><div><p className="text-xs text-blue-400">RECOMMENDATION FEED</p><h2 className="mt-1 text-xl font-semibold text-white">推荐列表</h2></div><span className="text-xs text-slate-500">{featured.length} 场精选</span></div><div className="space-y-4">{featured.map((match) => <AIRecommendationCard key={match.id} match={match} />)}</div></div><div><div className="mb-4 flex items-end justify-between"><div><p className="text-xs text-blue-400">PLAYER INTELLIGENCE</p><h2 className="mt-1 text-xl font-semibold text-white">球员状态雷达</h2></div><span className="text-xs text-slate-500">近 6 场数据</span></div><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-amber-400" />本周状态最佳</CardTitle></CardHeader><CardContent className="space-y-3">{players.map((player) => <PlayerCard key={player.name} player={player} />)}</CardContent></Card><Card className="mt-4 border-amber-500/20 bg-amber-500/5"><CardContent className="flex items-center gap-4 p-5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400"><Lock className="h-4 w-4" /></div><div><p className="text-sm font-medium text-white">解锁完整球员报告</p><p className="mt-1 text-xs leading-5 text-slate-400">查看热区、对位优势和赛季趋势。</p></div><Button asChild size="sm" variant="premium" className="ml-auto"><Link href="/vip">查看权益</Link></Button></CardContent></Card></div></div></div>;
}
