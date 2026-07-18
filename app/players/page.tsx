import type { Metadata } from "next";
import { Sparkles, Users } from "lucide-react";
import { players } from "@/data/mock-data";
import { PlayerCard } from "@/components/player-card";

export const metadata: Metadata = { title: "足球球员分析 | Project Athena", description: "查看 Athena Mock 数据中的球员状态与表现分析。" };

export default function PlayersPage() {
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="flex items-center gap-2 text-xs font-medium text-blue-400"><Users className="h-3.5 w-3.5" />PLAYER INTELLIGENCE</div><h1 className="mt-2 text-3xl font-semibold text-white">球员分析</h1><p className="mt-2 text-sm text-slate-400">聚合状态评分、进球助攻与近期表现，快速定位关键球员。</p><div className="mt-8 grid gap-4 md:grid-cols-2">{players.map((player) => <PlayerCard key={player.name} player={player} />)}</div><div className="mt-8 flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-slate-400"><Sparkles className="h-4 w-4 shrink-0 text-amber-400" />当前球员内容使用 Mock Data，后续可接入实时阵容与球员事件流。</div></div>;
}
