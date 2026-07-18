import Link from "next/link";
import { ArrowRight, Clock3, List, LockKeyhole, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MatchDetailData } from "@/types/match";

const copy = {
  summary: "\u7ed3\u8bba\u6458\u8981",
  nav: "\u5feb\u901f\u5bfc\u822a",
  updated: "\u6570\u636e\u66f4\u65b0",
  vipTitle: "\u89e3\u9501\u66f4\u591a\u5206\u6790",
  vipText: "\u83b7\u53d6\u9996\u53d1\u540e\u66f4\u65b0\u3001\u591a\u6a21\u578b\u5bf9\u6bd4\u4e0e\u66f4\u5b8c\u6574\u7684\u7403\u5458\u5f71\u54cd\u8bc4\u4f30\u3002",
  vipButton: "\u67e5\u770b\u4f1a\u5458\u6743\u76ca",
  confidence: "\u7f6e\u4fe1\u5ea6",
};

const navItems = [
  { id: "ai-conclusion", label: "AI\u7ed3\u8bba" },
  { id: "lottery-analysis", label: "\u4f53\u5f69\u5206\u6790" },
  { id: "score-prediction", label: "\u6bd4\u5206\u9884\u6d4b" },
  { id: "players", label: "\u7403\u5458\u5206\u6790" },
  { id: "ai-analysis", label: "\u6df1\u5ea6\u5206\u6790" },
  { id: "comparison", label: "\u6570\u636e\u5bf9\u6bd4" },
  { id: "head-to-head", label: "\u5386\u53f2\u4ea4\u950b" },
  { id: "risk-alert", label: "\u98ce\u9669\u63d0\u793a" },
];

export function MatchSidebar({ match }: { match: MatchDetailData }) {
  return <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start"><Card className="border-blue-500/20 bg-gradient-to-br from-[#111827] to-[#111d3a]"><CardContent className="p-5"><div className="flex items-center gap-2 text-xs font-medium text-blue-300"><Sparkles className="h-3.5 w-3.5" />{copy.summary}</div><p className="mt-3 text-xl font-semibold text-white">{match.prediction.lean}</p><p className="mt-2 text-sm leading-6 text-slate-400">{match.prediction.summary}</p><div className="mt-4 flex items-center justify-between rounded-lg bg-slate-900/50 p-3"><span className="text-xs text-slate-500">{copy.confidence}</span><span className="text-lg font-semibold text-green-300">{match.prediction.confidence}%</span></div></CardContent></Card><Card><CardContent className="p-5"><div className="flex items-center gap-2 text-xs font-medium text-slate-300"><List className="h-3.5 w-3.5 text-blue-400" />{copy.nav}</div><nav className="mt-3 space-y-1">{navItems.map((item) => <Link key={item.id} href={"#" + item.id} className="flex items-center justify-between rounded-md px-2.5 py-2 text-xs text-slate-500 transition-colors hover:bg-slate-800 hover:text-white">{item.label}<ArrowRight className="h-3 w-3 opacity-50" /></Link>)}</nav></CardContent></Card><Card><CardContent className="p-5"><div className="flex items-center gap-2 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" />{copy.updated}<span className="ml-auto text-slate-300">{match.updatedAt}</span></div></CardContent></Card><Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-[#111827]"><CardContent className="p-5"><LockKeyhole className="h-5 w-5 text-amber-400" /><p className="mt-4 text-sm font-semibold text-white">{copy.vipTitle}</p><p className="mt-2 text-xs leading-5 text-slate-400">{copy.vipText}</p><Button asChild variant="premium" size="sm" className="mt-4 w-full"><Link href="/vip">{copy.vipButton}</Link></Button></CardContent></Card></aside>;
}
