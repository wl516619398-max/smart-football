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

type ScoreValue = number | null;

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
    dataAvailable: true,
  };
}

function MetricBar({ value, color }: { value: ScoreValue; color: "blue" | "emerald" }) {
  if (value === null) {
    return (
      <div className="flex h-2 items-center overflow-hidden rounded-full bg-slate-800" title="数据同步中">
        <div className="h-full w-1/3 rounded-full bg-slate-700" />
      </div>
    );
  }

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
      <div
        className={`h-full rounded-full ${color === "blue" ? "bg-blue-500" : "bg-emerald-500"}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function TeamComparison(props: TeamComparisonProps) {
  const isLegacy = "teams" in props;
  const homeTeam = isLegacy ? props.teams.home.name : props.homeTeam;
  const awayTeam = isLegacy ? props.teams.away.name : props.awayTeam;
  const homeRating = isLegacy ? legacyRating(props.teams.home) : props.homeRating;
  const awayRating = isLegacy ? legacyRating(props.teams.away) : props.awayRating;
  const homeAvailable = homeRating.dataAvailable;
  const awayAvailable = awayRating.dataAvailable;
  const rows: { label: string; icon: typeof Target; home: ScoreValue; away: ScoreValue }[] = [
    { label: "攻击评分", icon: Target, home: homeAvailable ? homeRating.attackScore : null, away: awayAvailable ? awayRating.attackScore : null },
    { label: "防守评分", icon: Shield, home: homeAvailable ? homeRating.defenseScore : null, away: awayAvailable ? awayRating.defenseScore : null },
    { label: "近期状态", icon: Activity, home: homeAvailable ? homeRating.formScore : null, away: awayAvailable ? awayRating.formScore : null },
    { label: "综合评分", icon: Sparkles, home: homeAvailable ? homeRating.overallScore : null, away: awayAvailable ? awayRating.overallScore : null },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-white">球队能力对比</CardTitle>
        <div className="flex justify-between text-xs text-slate-500">
          <span className="text-blue-300">{homeTeam}</span>
          <span className="text-emerald-300">{awayTeam}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => {
          const Icon = row.icon;
          const hasBothValues = row.home !== null && row.away !== null;
          return (
            <div key={row.label}>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Icon className="h-3.5 w-3.5 text-blue-400" />
                  {row.label}
                </span>
                {hasBothValues ? (
                  <span className="font-semibold text-white">{row.home} - {row.away}</span>
                ) : (
                  <span className="text-xs font-normal text-slate-500">数据同步中</span>
                )}
              </div>
              <div className="flex gap-1.5">
                <div className="flex-1"><MetricBar value={row.home} color="blue" /></div>
                <div className="flex-1"><MetricBar value={row.away} color="emerald" /></div>
              </div>
            </div>
          );
        })}
        {(!homeAvailable || !awayAvailable) && (
          <p className="border-t border-white/5 pt-3 text-xs text-slate-500">球队评分数据同步中，完整数据到达后将显示评分和进度条。</p>
        )}
      </CardContent>
    </Card>
  );
}
