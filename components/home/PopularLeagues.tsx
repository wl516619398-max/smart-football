import Link from "next/link";
import { ArrowRight, Globe2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HomeLeagueSummary } from "@/data/home";
import { featured } from "@/data/matches";
import { DailyPicks } from "@/components/home/DailyPicks";

function PopularLeaguesContent({ leagues }: { leagues: HomeLeagueSummary[] }) {
  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="mb-5 flex items-end justify-between"><div><div className="flex items-center gap-2 text-xs font-medium text-blue-400"><Globe2 className="h-3.5 w-3.5" />LEAGUE RADAR</div><h2 className="mt-2 text-2xl font-semibold text-white">热门联赛</h2><p className="mt-1 text-sm text-slate-500">快速查看今日重点赛事分布</p></div><Link href="/leagues" className="hidden items-center gap-1 text-sm text-blue-400 hover:text-blue-300 sm:flex">查看联赛 <ArrowRight className="h-3.5 w-3.5" /></Link></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{leagues.map((league) => <Link key={league.name} href={`/matches?league=${encodeURIComponent(league.name)}`}><Card className="h-full border-slate-800/90 transition-colors hover:border-blue-500/40"><CardHeader className="flex-row items-center justify-between space-y-0 pb-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold" style={{ borderColor: `${league.accent}55`, backgroundColor: `${league.accent}15`, color: league.accent }}>{league.logo}</div><ArrowRight className="h-4 w-4 text-slate-600 transition-colors group-hover:text-blue-400" /></CardHeader><CardContent><CardTitle className="text-base text-white">{league.name}</CardTitle><p className="mt-2 text-xs text-slate-500"><span className="text-lg font-semibold text-slate-200">{league.matchesToday}</span> 场今日比赛</p></CardContent></Card></Link>)}</div></section>;
}

export function PopularLeagues({ leagues }: { leagues: HomeLeagueSummary[] }) {
  return <><PopularLeaguesContent leagues={leagues} /><DailyPicks fallbackMatches={featured.slice(0, 3)} /></>;
}
