import { Info, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LotteryRecommendation, MatchDetailData } from "@/types/match";
import { SectionHeader } from "@/components/match/SectionHeader";

const copy = {
  title: "\u4e2d\u56fd\u4f53\u5f69\u73a9\u6cd5\u5206\u6790",
  description: "\u6839\u636e\u7403\u961f\u72b6\u6001\u3001xG\u3001\u9635\u5bb9\u4e0e\u5386\u53f2\u6570\u636e\u751f\u6210\uff0c\u4ec5\u4f9b\u5206\u6790\u53c2\u8003\u3002",
  recommend: "\u63a8\u8350",
  alternative: "\u5907\u9009",
  confidence: "\u4fe1\u5fc3",
  reference: "\u4ec5\u4f9b\u6570\u636e\u5206\u6790\u53c2\u8003",
};

function Rating({ value }: { value: number }) {
  return <div className="flex items-center gap-0.5" aria-label={copy.confidence + " " + value + " / 5"}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={star <= Math.round(value) ? "h-3.5 w-3.5 fill-amber-400 text-amber-400" : "h-3.5 w-3.5 text-slate-700"} />)}</div>;
}

function LotteryCard({ item }: { item: LotteryRecommendation }) {
  return <Card className="h-full border-slate-800/90 bg-[#111827] transition-colors hover:border-blue-500/25"><CardHeader className="pb-3"><div className="flex items-center justify-between gap-2"><CardTitle className="text-sm">{item.market}</CardTitle>{item.handicap && <span className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-400">{item.handicap}</span>}</div></CardHeader><CardContent><div className="rounded-lg border border-blue-500/15 bg-blue-500/5 p-3"><p className="text-[10px] text-slate-500">{copy.recommend}</p><p className="mt-1 text-lg font-semibold text-blue-300">{item.recommendation}</p></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><p className="text-[10px] text-slate-500">{copy.alternative}</p><p className="mt-1 font-medium text-slate-300">{item.alternative}</p></div><div><p className="text-[10px] text-slate-500">{copy.confidence}</p><div className="mt-1"><Rating value={item.confidence} /></div></div></div><p className="mt-4 text-xs leading-5 text-slate-400">{item.explanation}</p>{item.note && <div className="mt-4 flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] leading-5 text-amber-200/80"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />{item.note}</div>}</CardContent></Card>;
}

export function LotteryAnalysis({ match }: { match: MatchDetailData }) {
  return <section id="lottery-analysis" className="scroll-mt-24"><SectionHeader icon={Info} title={copy.title} description={copy.description} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{match.lottery.map((item) => <LotteryCard key={item.market} item={item} />)}</div><p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500"><Info className="h-3.5 w-3.5" />{copy.reference}</p></section>;
}
