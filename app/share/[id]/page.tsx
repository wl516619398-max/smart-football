import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Share2 } from "lucide-react";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ComplianceDisclaimer } from "@/components/common/ComplianceDisclaimer";
import { getFixtureDetail } from "@/lib/football/fixture-service";
import { getTeamDisplayName } from "@/lib/football/team-name-map";
import { formatMatchDateTime } from "@/lib/football/date-format";
import { decodeUnicode } from "@/lib/utils/decode-unicode";

type SharePageProps = { params: Promise<{ id: string }> };

function statusLabel(status: string | undefined) {
  const value = (status ?? "").toUpperCase();
  if (["FT", "AET", "PEN", "FINISHED"].includes(value)) return "已结束";
  if (["LIVE", "1H", "2H", "HT", "ET"].includes(value)) return "进行中";
  return "未开始";
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  const match = await getFixtureDetail(decodeURIComponent(id));
  if (!match) return { title: "比赛分享 | Project Athena" };
  const home = getTeamDisplayName(decodeUnicode(match.homeTeam.name));
  const away = getTeamDisplayName(decodeUnicode(match.awayTeam.name));
  return { title: `${home} VS ${away} | Project Athena`, description: `${home} VS ${away} 的赛事信息与 AI 分析摘要。` };
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  const match = await getFixtureDetail(decodeURIComponent(id));
  if (!match) notFound();

  const home = getTeamDisplayName(decodeUnicode(match.homeTeam.name));
  const away = getTeamDisplayName(decodeUnicode(match.awayTeam.name));
  const date = formatMatchDateTime(match.date);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-blue-300"><Share2 className="h-4 w-4" />Project Athena 分享摘要</div>
      <Card className="overflow-hidden border-blue-500/20 bg-gradient-to-br from-[#111827] via-[#111d3a] to-[#111827] shadow-xl shadow-blue-950/20"><div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-violet-500" /><CardContent className="p-5 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400"><span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-blue-300">{decodeUnicode(match.league)}</span><span className="rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1 text-slate-300">{statusLabel(match.status)}</span></div><div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center"><div className="min-w-0"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/25 bg-blue-500/15 text-2xl font-bold text-blue-200">{home.slice(0, 1)}</div><p className="mt-3 truncate text-base font-semibold text-white">{home}</p></div><p className="text-xl font-semibold tracking-[0.16em] text-slate-400">VS</p><div className="min-w-0"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/15 text-2xl font-bold text-emerald-200">{away.slice(0, 1)}</div><p className="mt-3 truncate text-base font-semibold text-white">{away}</p></div></div><p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400"><CalendarDays className="h-4 w-4 text-blue-400" />{date.label}</p><Link href={`/matches/${encodeURIComponent(match.id)}`} className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500">查看完整赛事分析 <ArrowRight className="h-4 w-4" /></Link></CardContent></Card><ComplianceDisclaimer className="mt-6" /></div>
  );
}
