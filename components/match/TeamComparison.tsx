import { ArrowLeftRight, Goal, ShieldCheck } from "lucide-react";
import type { CommercialMatchData } from "@/types/match";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function TeamPanel({ team }: { team: CommercialMatchData["teams"]["home"] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: `${team.color}33` }}>{team.shortName}</div><div><p className="font-semibold text-white">{team.name}</p><p className="text-xs text-slate-500">{team.venueLabel}</p></div></div>
      <div className="mt-5"><p className="text-xs text-slate-500">近期战绩</p><div className="mt-2 flex gap-1.5">{team.form.map((result, index) => <span key={`${result}-${index}`} className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${result === "W" ? "bg-emerald-500/15 text-emerald-300" : result === "D" ? "bg-amber-500/15 text-amber-300" : "bg-red-500/15 text-red-300"}`}>{result === "W" ? "胜" : result === "D" ? "平" : "负"}</span>)}</div></div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center"><div><Goal className="mx-auto h-4 w-4 text-blue-400" /><p className="mt-1 text-lg font-bold text-white">{team.goalsFor}</p><p className="text-[11px] text-slate-500">进球</p></div><div><ShieldCheck className="mx-auto h-4 w-4 text-emerald-400" /><p className="mt-1 text-lg font-bold text-white">{team.goalsAgainst}</p><p className="text-[11px] text-slate-500">失球</p></div><div><p className="text-lg font-bold text-white">{team.venueWinRate}%</p><p className="mt-2 text-[11px] text-slate-500">胜率</p></div></div>
    </div>
  );
}

export function TeamComparison({ teams }: { teams: CommercialMatchData["teams"] }) {
  return <Card className="border-white/10 bg-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><ArrowLeftRight className="h-5 w-5 text-blue-400" />球队实力对比</CardTitle></CardHeader><CardContent><div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]"><TeamPanel team={teams.home} /><div className="hidden h-11 w-11 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-bold text-blue-300 lg:flex">VS</div><TeamPanel team={teams.away} /></div></CardContent></Card>;
}

