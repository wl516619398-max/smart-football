import { Info, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchDetailData } from "@/types/match";

const copy = {
  title: "\u80dc\u5e73\u8d1f\u6a21\u578b\u4f30\u7b97\u6982\u7387",
  description: "Athena \u6a21\u578b\u4e0e\u5e02\u573a\u53c2\u8003\u7684\u6982\u7387\u89c6\u56fe",
  model: "\u6a21\u578b\u4f30\u7b97\u4e3b\u80dc",
  reference: "\u53c2\u8003\u9690\u542b\u6982\u7387",
  difference: "\u6982\u7387\u5dee",
  hint: "\u5f53\u524d\u6982\u7387\u5408\u8ba1",
  note: "\uff0c\u6a21\u578b\u6982\u7387\u5e76\u4e0d\u7b49\u540c\u4e8e\u6bd4\u8d5b\u7ed3\u679c\u3002",
};

export function ProbabilitySection({ match }: { match: MatchDetailData }) {
  const total = match.probabilities.reduce((sum, item) => sum + item.value, 0);
  return <Card id="probability" className="scroll-mt-24">
    <CardHeader className="pb-3"><div className="flex items-center gap-2"><Target className="h-4 w-4 text-blue-400" /><CardTitle>{copy.title}</CardTitle></div><p className="text-xs text-slate-500">{copy.description}</p></CardHeader>
    <CardContent>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-800">{match.probabilities.map((item) => <div key={item.label} className="h-full transition-all" style={{ width: item.value + "%", backgroundColor: item.color }} title={item.label + " " + item.value + "%"} />)}</div>
      <div className="mt-4 grid grid-cols-3 gap-2">{match.probabilities.map((item, index) => <div key={item.label} className={["rounded-lg border p-3", index === 0 ? "border-blue-500/30 bg-blue-500/10" : "border-slate-800 bg-slate-900/40"].join(" ")}><div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</div><p className={["mt-1 text-xl font-semibold", index === 0 ? "text-blue-300" : "text-white"].join(" ")}>{item.value}%</p></div>)}</div>
      <div className="mt-5 grid gap-3 rounded-lg border border-slate-800 bg-slate-900/35 p-4 sm:grid-cols-3"><div><p className="text-[11px] text-slate-500">{copy.model}</p><p className="mt-1 font-semibold text-white">{match.prediction.modelProbability}%</p></div><div><p className="text-[11px] text-slate-500">{copy.reference}</p><p className="mt-1 font-semibold text-white">{match.prediction.referenceProbability}%</p></div><div><p className="text-[11px] text-slate-500">{copy.difference}</p><p className="mt-1 font-semibold text-green-400">+{match.prediction.modelProbability - match.prediction.referenceProbability}%</p></div></div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500"><Info className="h-3.5 w-3.5" />{copy.hint} {total}%{copy.note}</p>
    </CardContent>
  </Card>;
}
