import { Activity, Shield, Sparkles, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FootballStrengthRating } from "@/lib/football/rating";

type LegacyTeam = {
  name: string;
  form: ("W" | "D" | "L")[];
  goalsFor: number;
  goalsAgainst: number;
  venueWinRate: number;
};

type TeamComparisonProps = {
  homeTeam: string;
  awayTeam: string;
  homeRating: FootballStrengthRating;
  awayRating: FootballStrengthRating;
} | {
  teams: {
    home: LegacyTeam;
    away: LegacyTeam;
  };
};

function clamp(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function legacyRating(team: LegacyTeam): FootballStrengthRating {
  const formScore = team.form.length
    ? team.form.reduce((score, result) => score + (result === "W" ? 100 : result === "D" ? 55 : 25), 0) / team.form.length
    : 50;
  const attackScore = clamp(45 + team.goalsFor * 3);
  const defenseScore = clamp(75 - team.goalsAgainst * 3);
  return {
    attackScore,
    defenseScore,
    formScore: clamp(formScore),
    overallScore: clamp((attackScore + defenseScore + formScore) / 3),
  };
}

export function TeamComparison(props: TeamComparisonProps) {
  const isLegacy = "teams" in props;
  const homeTeam = isLegacy ? props.teams.home.name : props.homeTeam;
  const awayTeam = isLegacy ? props.teams.away.name : props.awayTeam;
  const homeRating = isLegacy ? legacyRating(props.teams.home) : props.homeRating;
  const awayRating = isLegacy ? legacyRating(props.teams.away) : props.awayRating;
  const rows = [
    { label: "攻击评分", icon: Target, home: homeRating.attackScore, away: awayRating.attackScore },
    { label: "防守评分", icon: Shield, home: homeRating.defenseScore, away: awayRating.defenseScore },
    { label: "近期状态", icon: Activity, home: homeRating.formScore, away: awayRating.formScore },
    { label: "综合评分", icon: Sparkles, home: homeRating.overallScore, away: awayRating.overallScore },
  ];

  return <Card><CardHeader><CardTitle className="text-base text-white">球队能力对比</CardTitle><div className="flex justify-between text-xs text-slate-500"><span className="text-blue-300">{homeTeam}</span><span className="text-emerald-300">{awayTeam}</span></div></CardHeader><CardContent className="space-y-4">{rows.map((row) => { const Icon = row.icon; return <div key={row.label}><div className="mb-2 flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 text-slate-400"><Icon className="h-3.5 w-3.5 text-blue-400" />{row.label}</span><span className="font-semibold text-white">{row.home} - {row.away}</span></div><div className="flex gap-1.5"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${row.home}%` }} /></div><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"><div className="ml-auto h-full rounded-full bg-emerald-500" style={{ width: `${row.away}%` }} /></div></div></div>; })}</CardContent></Card>;
}
