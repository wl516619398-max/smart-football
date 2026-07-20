import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldAlert, Sparkles } from "lucide-react";
import type { FeaturedMatch, MatchRisk } from "@/types/match";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMatchDateTime } from "@/lib/football/date-format";

const riskTone: Record<MatchRisk, string> = { 低: "text-green-400", 中: "text-amber-400", 高: "text-red-400" };

export function AIRecommendationCard({ match, locked = false }: { match: FeaturedMatch; locked?: boolean }) {
  const formattedMatchTime = formatMatchDateTime(`${match.date}T${match.time}:00+08:00`).label;
  return <Card className="relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-[#111827] to-[#111d3a] p-5"><div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl" /><div className="relative"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-medium text-blue-300"><Sparkles className="h-3.5 w-3.5" />ATHENA AI 模型观点</div><h3 className="mt-2 font-semibold text-white">{match.homeTeam.name} vs {match.awayTeam.name}</h3><p className="mt-1 text-xs text-slate-500">{match.league} · {formattedMatchTime}</p></div><span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-medium text-blue-300">一致性 {match.aiScore}%</span></div><div className="mt-5 grid grid-cols-3 gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-center"><div><p className="text-[10px] text-slate-500">关注方向</p><p className="mt-1 text-sm font-semibold text-white">{locked ? "会员解锁" : match.prediction}</p></div><div><p className="text-[10px] text-slate-500">模型预测比分</p><p className="mt-1 text-sm font-semibold text-white">{locked ? "--" : match.score}</p></div><div><p className="text-[10px] text-slate-500">数据不确定性</p><p className={cn("mt-1 flex items-center justify-center gap-1 text-sm font-semibold", riskTone[match.risk])}><ShieldAlert className="h-3.5 w-3.5" />{match.risk}</p></div></div>{locked ? <><p className="mt-3 text-xs text-slate-500">升级 VIP 会员，查看完整模型观点。</p><Button asChild className="mt-4 w-full" variant="premium"><Link href="/vip">查看会员权益 <LockKeyhole className="ml-2 h-3.5 w-3.5" /></Link></Button></> : <Link href={`/matches/${match.id}`} className="mt-4 flex items-center justify-between text-xs text-blue-400 hover:text-blue-300"><span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-400" />查看完整分析</span><ArrowRight className="h-3.5 w-3.5" /></Link>}</div></Card>;
}
