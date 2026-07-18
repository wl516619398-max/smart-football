import { BrainCircuit } from "lucide-react";
import type { MatchAIAnalysis } from "@/types/match";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AIRadarProps = {
  homeTeam: string;
  awayTeam: string;
  home: MatchAIAnalysis;
  away: MatchAIAnalysis;
};

const dimensions: { label: string; key: keyof Pick<MatchAIAnalysis, "attackScore" | "defenseScore" | "formScore" | "homeAwayScore" | "possessionScore"> }[] = [
  { label: "攻击能力", key: "attackScore" },
  { label: "防守能力", key: "defenseScore" },
  { label: "近期状态", key: "formScore" },
  { label: "主客场", key: "homeAwayScore" },
  { label: "控球能力", key: "possessionScore" },
];

export function AIRadar({ homeTeam, awayTeam, home, away }: AIRadarProps) {
  return <Card className="border-blue-500/25 bg-gradient-to-br from-[#111d3a] to-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><BrainCircuit className="h-5 w-5 text-blue-400" />Athena AI 综合评分</CardTitle><div className="flex flex-wrap gap-4 text-xs text-slate-400"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-blue-400" />{homeTeam}</span><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-violet-400" />{awayTeam}</span></div></CardHeader><CardContent className="space-y-4">{dimensions.map(({ label, key }) => { const homeValue = home[key]; const awayValue = away[key]; return <div key={label} className="grid grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] items-center gap-3"><div><div className="mb-1 flex items-center justify-between text-xs"><span className="font-semibold text-blue-200">{homeValue}</span><span className="text-slate-500">{homeTeam}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${homeValue}%` }} /></div></div><p className="text-center text-xs font-medium text-slate-400">{label}</p><div><div className="mb-1 flex items-center justify-between text-xs"><span className="text-slate-500">{awayTeam}</span><span className="font-semibold text-violet-200">{awayValue}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="ml-auto h-full rounded-full bg-violet-500" style={{ width: `${awayValue}%` }} /></div></div></div>; })}</CardContent></Card>;
}
