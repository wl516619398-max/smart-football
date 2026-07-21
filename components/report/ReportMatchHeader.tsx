import { Activity, CalendarDays, ShieldAlert, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ConfidenceMeter } from "@/components/report/ConfidenceMeter";

type ReportMatchHeaderProps = {
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  league: string;
  matchTime: string | null;
  status: string;
  confidence: number;
  riskLabel: string;
};

function formatTime(value: string | null) {
  if (!value) return "时间待定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function TeamBadge({ name, logo, tone }: { name: string; logo?: string | null; tone: string }) {
  return (
    <div className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border ${tone} bg-slate-950/60 shadow-lg sm:h-24 sm:w-24`}>
      {logo ? <span role="img" aria-label={`${name} logo`} className="h-full w-full bg-contain bg-center bg-no-repeat p-3" style={{ backgroundImage: `url(${logo})` }} /> : <span className="text-3xl font-bold text-white">{name.trim().slice(0, 1) || "⚽"}</span>}
    </div>
  );
}

export function ReportMatchHeader({ homeTeam, awayTeam, homeLogo, awayLogo, league, matchTime, status, confidence, riskLabel }: ReportMatchHeaderProps) {
  const rating = (confidence / 20).toFixed(1);

  return (
    <Card className="overflow-hidden border-blue-500/25 bg-gradient-to-br from-[#172554] via-[#111827] to-[#111827] shadow-2xl shadow-blue-950/30">
      <CardContent className="relative p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1.5 text-blue-200"><Trophy className="h-3.5 w-3.5" />{league || "赛事信息待定"}</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-200"><Activity className="h-3.5 w-3.5" />{status}</span>
        </div>

        <div className="relative mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
          <div className="flex min-w-0 flex-col items-center gap-3 text-center">
            <TeamBadge name={homeTeam} logo={homeLogo} tone="border-blue-400/35" />
            <h1 className="max-w-full break-words text-lg font-bold text-white sm:text-2xl">{homeTeam}</h1>
            <span className="text-xs text-blue-300">主队</span>
          </div>
          <div className="text-center"><p className="text-2xl font-black tracking-[0.18em] text-white sm:text-4xl">VS</p><p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">Scout report</p></div>
          <div className="flex min-w-0 flex-col items-center gap-3 text-center">
            <TeamBadge name={awayTeam} logo={awayLogo} tone="border-emerald-400/35" />
            <h2 className="max-w-full break-words text-lg font-bold text-white sm:text-2xl">{awayTeam}</h2>
            <span className="text-xs text-emerald-300">客队</span>
          </div>
        </div>

        <div className="relative mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-white/10 pt-5 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-blue-300" />{formatTime(matchTime)}</span>
          <span className="inline-flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5 text-amber-300" />风险等级：{riskLabel}</span>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-center"><p className="text-xs text-slate-400">AI综合评级</p><p className="mt-2 text-xl tracking-[0.16em] text-violet-200">★★★★★ <span className="tracking-normal">{rating}/5</span></p></div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4"><ConfidenceMeter value={confidence} compact /></div>
        </div>
      </CardContent>
    </Card>
  );
}
