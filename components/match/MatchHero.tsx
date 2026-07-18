import { CalendarDays, Cloud, Clock3, MapPin, ShieldCheck, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TeamBadge } from "@/components/team-badge";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { ShareButton } from "@/components/common/ShareButton";
import type { MatchDetailData } from "@/types/match";

const copy = { countdown: "2\u5c0f\u65f618\u5206\u949f", updated: "\u6570\u636e\u66f4\u65b0" };

function FormMark({ value }: { value: "W" | "D" | "L" }) {
  const tone = value === "W" ? "bg-green-500/15 text-green-400" : value === "D" ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400";
  return <span className={["flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold", tone].join(" ")}>{value}</span>;
}

function TeamColumn({ team, side, form }: { team: MatchDetailData["home"]; side: "home" | "away"; form: ("W" | "D" | "L")[] }) {
  return <div className={["flex min-w-0 flex-1 flex-col items-center gap-2", side === "home" ? "md:items-end" : "md:items-start"].join(" ")}><TeamBadge {...team} size="lg" /><h1 className="max-w-full truncate text-center text-xl font-semibold text-white sm:text-2xl">{team.name}</h1><p className="max-w-full truncate text-center text-xs text-slate-500">{team.englishName} · {team.shortName}</p><div className="mt-1 flex gap-1.5">{form.map((item, index) => <FormMark key={index} value={item} />)}</div></div>;
}

export function MatchHero({ match }: { match: MatchDetailData }) {
  return <Card className="relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-[#111827] via-[#111d3a] to-[#111827] p-5 shadow-glow sm:p-8"><div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/15 blur-[90px]" /><div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-cyan-500/5 blur-[80px]" /><div className="relative"><div className="flex flex-col gap-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start"><span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-1 text-blue-300">{match.league} · {match.round}</span><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{match.date} {match.time}</span><span className="rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-slate-300">{match.status}</span></div><div className="flex justify-center gap-2 sm:justify-end"><FavoriteButton matchId={match.id} /><ShareButton /></div></div><div className="mt-8 flex items-center gap-3 sm:gap-8"><TeamColumn team={match.home} side="home" form={["W", "W", "D", "L", "W"]} /><div className="flex shrink-0 flex-col items-center"><span className="text-2xl font-semibold tracking-[0.2em] text-white sm:text-3xl">VS</span><span className="mt-2 flex items-center gap-1.5 whitespace-nowrap text-[11px] text-blue-300"><Timer className="h-3.5 w-3.5" />{copy.countdown}</span></div><TeamColumn team={match.away} side="away" form={["D", "W", "L", "W", "D"]} /></div><div className="mt-8 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-4 text-xs text-slate-500 sm:grid-cols-4"><span className="flex items-center justify-center gap-1.5"><Cloud className="h-3.5 w-3.5 text-slate-400" />{match.weather}</span><span className="flex items-center justify-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-slate-400" />{match.referee}</span><span className="flex items-center justify-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{match.city}</span><span className="flex items-center justify-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-slate-400" />{copy.updated} {match.updatedAt}</span></div></div></Card>;
}
