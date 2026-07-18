import { CalendarDays, Check, Minus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MatchDetailData, RecentMatch } from "@/types/match";
import { SectionHeader } from "@/components/match/SectionHeader";

const copy = { title: "\u8fd1\u671f\u72b6\u6001", description: "\u6700\u8fd1\u6bd4\u8d5b\u6392\u5728\u524d\u9762\uff0c\u7ed3\u5408\u80dc\u5e73\u8d1f\u3001\u5bf9\u624b\u548c\u6bd4\u5206\u89c2\u5bdf\u72b6\u6001\u8d70\u52bf\u3002", home: "\u4e3b\u961f\u8fd1 5 \u573a", away: "\u5ba2\u961f\u8fd1 5 \u573a" };

function ResultIcon({ result }: { result: RecentMatch["result"] }) {
  const config = result === "win" ? { icon: Check, tone: "bg-green-500/15 text-green-400", label: "\u80dc" } : result === "draw" ? { icon: Minus, tone: "bg-amber-500/15 text-amber-400", label: "\u5e73" } : { icon: X, tone: "bg-red-500/15 text-red-400", label: "\u8d1f" };
  const Icon = config.icon;
  return <span className={["flex h-7 w-7 items-center justify-center rounded-full", config.tone].join(" ")} title={config.label}><Icon className="h-3.5 w-3.5" /></span>;
}

function FormList({ title, items, summary }: { title: string; items: RecentMatch[]; summary: string }) {
  return <div><div className="mb-3 flex items-center justify-between gap-2"><p className="text-sm font-medium text-white">{title}</p><span className="text-[11px] text-slate-500">{summary}</span></div><div className="space-y-2">{items.map((item, index) => <div key={item.opponent + index} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/35 p-3"><ResultIcon result={item.result} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-300">{item.opponent}</p><p className="mt-1 text-[10px] text-slate-600">{item.venue === "home" ? "\u4e3b\u573a" : "\u5ba2\u573a"}</p></div><span className="text-sm font-semibold text-white">{item.score}</span></div>)}</div></div>;
}

export function RecentForm({ match }: { match: MatchDetailData }) {
  return <section id="recent-form" className="scroll-mt-24"><SectionHeader icon={CalendarDays} title={copy.title} description={copy.description} /><Card><CardContent className="grid gap-6 p-5 sm:p-6 md:grid-cols-2"><FormList title={copy.home} items={match.recentForm.home} summary={match.homeVenueSummary} /><FormList title={copy.away} items={match.recentForm.away} summary={match.awayVenueSummary} /></CardContent></Card></section>;
}
