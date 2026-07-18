import { BrainCircuit, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MatchDetailData } from "@/types/match";
import { SectionHeader } from "@/components/match/SectionHeader";

const copy = { title: "Athena AI \u6df1\u5ea6\u5206\u6790", description: "\u5c06\u8fd1\u671f\u72b6\u6001\u3001\u6218\u672f\u5bf9\u4f4d\u4e0e\u5173\u952e\u7403\u5458\u5f71\u54cd\u62c6\u5206\u4e3a\u53ef\u8bfb\u7684\u6570\u636e\u7ed3\u8bba\u3002", reference: "\u4ee5\u4e0a\u5185\u5bb9\u4e3a Mock \u6570\u636e\u5206\u6790\uff0c\u4ec5\u4f9b\u6570\u636e\u5206\u6790\u53c2\u8003\u3002", tags: ["\u4e3b\u573a\u4f18\u52bf", "xG \u5360\u4f18", "\u5173\u952e\u7403\u5458\u72b6\u6001", "\u5ba2\u961f\u9632\u7ebf\u6ce2\u52a8", "\u5f3a\u5f3a\u5bf9\u8bdd\u98ce\u9669"] };

export function AIAnalysis({ match }: { match: MatchDetailData }) {
  return <section id="ai-analysis" className="scroll-mt-24"><SectionHeader icon={BrainCircuit} eyebrow="AI ANALYSIS" title={copy.title} description={copy.description} /><Card><CardContent className="p-5 sm:p-6"><div className="space-y-5">{match.analysis.map((item, index) => <article key={item.title} className="grid gap-3 sm:grid-cols-[150px_1fr]"><div className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[11px] font-semibold text-blue-300">{index + 1}</span><h3 className="pt-1 text-sm font-semibold text-white">{item.title}</h3></div><p className="text-sm leading-7 text-slate-400">{item.content}</p></article>)}</div><div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800 pt-5">{copy.tags.map((tag) => <span key={tag} className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/50 px-2.5 py-1 text-[11px] text-slate-400"><Tag className="h-3 w-3 text-blue-400" />{tag}</span>)}</div><p className="mt-4 text-[11px] text-slate-500">{copy.reference}</p></CardContent></Card></section>;
}
