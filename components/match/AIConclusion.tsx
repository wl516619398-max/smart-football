import Link from "next/link";
import { ArrowDown, CheckCircle2, CircleHelp, ShieldAlert, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MatchDetailData } from "@/types/match";
import { decodeUnicode } from "@/lib/utils/decode-unicode";

const copy = {
  heading: "Athena AI \u6838\u5fc3\u7ed3\u8bba",
  confidence: "\u6a21\u578b\u4e00\u81f4\u6027",
  first: "\u6a21\u578b\u89c2\u70b9",
  cover: "\u5173\u6ce8\u65b9\u5411",
  score: "\u6a21\u578b\u9884\u6d4b\u6bd4\u5206",
  goals: "\u6a21\u578b\u9884\u6d4b\u603b\u8fdb\u7403",
  risk: "\u6570\u636e\u4e0d\u786e\u5b9a\u6027",
  medium: "\u4e2d\u7b49",
  rating: "\u89c2\u70b9\u8bc4\u5206",
  why: "\u4e3a\u4ec0\u4e48\u8fd9\u6837\u5224\u65ad\uff1f",
  reference: "\u4ec5\u4f9b\u6570\u636e\u5206\u6790\u53c2\u8003\uff0c\u6a21\u578b\u7ed3\u679c\u5e76\u4e0d\u7b49\u540c\u4e8e\u6bd4\u8d5b\u7ed3\u679c\u3002",
};

export function AIConclusion({ match }: { match: MatchDetailData }) {
  const prediction = {
    ...match.prediction,
    lean: decodeUnicode(match.prediction.lean),
    firstChoice: decodeUnicode(match.prediction.firstChoice),
    cover: decodeUnicode(match.prediction.cover),
    score: decodeUnicode(match.prediction.score),
    totalGoals: decodeUnicode(match.prediction.totalGoals),
    summary: decodeUnicode(match.prediction.summary),
  };
  const ringStyle = { background: "conic-gradient(#22C55E " + prediction.confidence * 3.6 + "deg, #1e293b 0deg)" };
  const stats = [
    { label: copy.first, value: prediction.firstChoice, tone: "border-green-500/15 bg-green-500/5 text-green-300" },
    { label: copy.cover, value: prediction.cover, tone: "border-slate-800 bg-slate-900/40 text-white" },
    { label: copy.score, value: prediction.score, tone: "border-slate-800 bg-slate-900/40 text-white" },
    { label: copy.goals, value: prediction.totalGoals, tone: "border-slate-800 bg-slate-900/40 text-white" },
  ];

  return <Card id="ai-conclusion" className="scroll-mt-24 overflow-hidden border-green-500/20 bg-gradient-to-br from-[#111827] to-[#10251e]">
    <CardContent className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-green-400"><Sparkles className="h-3.5 w-3.5" />{copy.heading}</div>
          <h2 className="mt-3 text-2xl font-semibold text-white">{prediction.lean}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{prediction.summary}</p>
        </div>
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full p-1" style={ringStyle}>
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#111827]"><span className="text-lg font-semibold text-white">{prediction.confidence}%</span><span className="text-[9px] text-slate-500">{copy.confidence}</span></div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => <div key={stat.label} className={["rounded-lg border p-3", stat.tone].join(" ")}><p className="text-[10px] text-slate-500">{stat.label}</p><p className="mt-1 text-sm font-semibold">{stat.value}</p></div>)}
        <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 p-3"><p className="text-[10px] text-slate-500">{copy.risk}</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-amber-300"><ShieldAlert className="h-3.5 w-3.5" />{copy.medium}</p></div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/70 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="h-4 w-4 text-green-400" />{copy.rating} <span className="font-semibold text-white">{prediction.rating} / 5</span></div>
        <Button asChild variant="outline" size="sm"><Link href="#ai-analysis"><CircleHelp className="mr-1.5 h-3.5 w-3.5" />{copy.why}<ArrowDown className="ml-1 h-3 w-3" /></Link></Button>
      </div>
      <p className="mt-4 text-[11px] text-slate-500">{copy.reference}</p>
    </CardContent>
  </Card>;
}
