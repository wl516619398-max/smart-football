import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, Shield, Sparkles, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplianceDisclaimer } from "@/components/common/ComplianceDisclaimer";
import { teamProvider } from "@/lib/football/team-provider";
import type { TeamRecentMatch, TeamStats } from "@/types/team";

export const metadata: Metadata = {
  title: "球队详情 | Project Athena",
  description: "查看球队排名、积分、近期比赛与 Athena 数据指标。",
};

function formatDate(value: string) {
  if (!value) return "日期待定";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("zh-CN");
}

function teamInitial(name: string) {
  return name.trim().slice(0, 1) || "?";
}

function resultLabel(result: TeamRecentMatch["result"]) {
  if (result === "win") return { label: "胜", className: "bg-emerald-500/15 text-emerald-300" };
  if (result === "draw") return { label: "平", className: "bg-amber-500/15 text-amber-300" };
  return { label: "负", className: "bg-red-500/15 text-red-300" };
}

function StatTile({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Trophy }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-4"><Icon className="h-4 w-4 text-blue-400" /><p className="mt-3 text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold text-white">{value}</p></div>;
}

function IndexBar({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div><div className="mb-2 flex items-center justify-between text-sm"><span className="text-slate-300">{label}</span><span className="font-semibold text-white">{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} /></div></div>;
}

function RecentMatchRow({ item }: { item: TeamRecentMatch }) {
  const result = resultLabel(item.result);
  return <div className="flex items-center gap-3 border-b border-slate-800/80 py-3 last:border-b-0"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${result.className}`}>{result.label}</span><div className="min-w-0 flex-1"><p className="truncate text-sm text-slate-200">{item.opponent}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><CalendarDays className="h-3 w-3" />{formatDate(item.date)} · {item.venue === "home" ? "主场" : "客场"}</p></div><span className="text-sm font-semibold text-white">{item.score}</span></div>;
}

function TeamOverview({ stats }: { stats: TeamStats }) {
  return <Card className="border-blue-500/20 bg-gradient-to-br from-[#111d3a] to-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><Sparkles className="h-4 w-4 text-blue-400" />Athena 数据指标</CardTitle></CardHeader><CardContent className="space-y-5"><IndexBar label="进攻指数" value={stats.attackIndex} tone="bg-blue-500" /><IndexBar label="防守指数" value={stats.defenseIndex} tone="bg-emerald-500" /><IndexBar label="Athena 状态指数" value={stats.athenaStatusIndex} tone="bg-violet-500" /></CardContent></Card>;
}

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const [team, stats, recentMatches] = await Promise.all([teamProvider.getTeam(id), teamProvider.getTeamStats(id), teamProvider.getRecentMatches(id)]);
  if (!team) {
    return <main className="mx-auto min-h-[calc(100vh-140px)] w-full max-w-6xl px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <Link href="/matches" className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" />返回比赛列表</Link>
      <section className="mt-6 rounded-2xl border border-slate-800 bg-[#111827] p-8 text-center shadow-xl shadow-slate-950/20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-300">Team profile</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">球队资料暂不可用</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">当前数据源尚未同步该球队的完整资料，球队详情将在数据同步后显示。</p>
      </section>
      <ComplianceDisclaimer className="mt-5 border-t border-slate-800 pt-5" />
    </main>;
  }

  return <main className="mx-auto min-h-[calc(100vh-140px)] w-full max-w-6xl px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
    <Link href="/matches" className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" />返回比赛列表</Link>

    <section className="relative mt-6 overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#111d3a] via-[#111827] to-[#0f172a] p-5 shadow-xl shadow-blue-950/20 sm:p-8"><div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/15 blur-[90px]" /><div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/15 text-3xl font-bold text-blue-200">{teamInitial(team.name)}</div><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-300">Team profile</p><h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{team.name}</h1><p className="mt-2 text-sm text-slate-400">{team.league || "联赛信息待定"}</p></div></div><div className="flex items-center gap-2 text-xs text-slate-500"><ArrowUpRight className="h-4 w-4 text-blue-400" />数据源：{process.env.FOOTBALL_API_PROVIDER === "thesportsdb" ? "TheSportsDB" : "Athena Mock fallback"}</div></div></section>

    <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StatTile label="联赛排名" value={`第 ${team.rank} 名`} icon={Trophy} /><StatTile label="积分" value={team.points} icon={Sparkles} /><StatTile label="已赛场次" value={team.played} icon={CalendarDays} /><StatTile label="战绩" value={`${team.wins}胜 ${team.draws}平 ${team.losses}负`} icon={Shield} /></section>

    <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"><Card><CardHeader><CardTitle className="text-base text-white">最近10场比赛</CardTitle></CardHeader><CardContent>{recentMatches.length ? recentMatches.slice(0, 10).map((item) => <RecentMatchRow key={item.id} item={item} />) : <p className="py-8 text-center text-sm text-slate-500">暂无近期比赛数据。</p>}</CardContent></Card><TeamOverview stats={stats} /></section>

    <p className="mt-6 text-xs text-slate-500">进球 {team.goalsFor} · 失球 {team.goalsAgainst} · 数据会随可用赛事信息更新。</p><ComplianceDisclaimer className="mt-5 border-t border-slate-800 pt-5" />
  </main>;
}
