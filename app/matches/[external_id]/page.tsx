import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, CalendarDays, Clock3, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getFixtureDetail } from "@/lib/football/fixture-service";
import { footballMatchToMatchCenterRow } from "@/lib/football/match-center";
import { AIAnalysisPending } from "@/components/match/AIAnalysisPending";
import { AIFocusFactors } from "@/components/match/AIFocusFactors";
import { AIMetrics } from "@/components/match/AIMetrics";
import { HeadToHeadOverview } from "@/components/match/HeadToHeadOverview";
import { RecentFormOverview } from "@/components/match/RecentFormOverview";
import { getMatchAnalysisData } from "@/lib/match-analysis";
import { calculateFootballStrengthRating } from "@/lib/football/rating";
import { getTeamRecentStats } from "@/lib/football/stats";
import { predictMatch as predictFromTeamStats } from "@/lib/prediction/engine";
import type { PredictionTeamStats } from "@/lib/prediction/types";
import { PredictionEngineCard } from "@/components/match/PredictionEngineCard";
import { AthenaReportCard } from "@/components/match/AthenaReportCard";
import { getFixtureOdds } from "@/lib/football/odds";
import { calculateOddsValue } from "@/lib/odds/value-engine";
import { savePredictionHistory } from "@/lib/history/prediction-history";
import { MatchOverview } from "@/components/match/MatchOverview";
import { ProbabilityChart } from "@/components/match/ProbabilityChart";
import { TeamComparison } from "@/components/match/TeamComparison";
import { OddsValueCard } from "@/components/match/OddsValueCard";
import { Disclaimer } from "@/components/common/Disclaimer";
import { CopyAnalysisButton } from "@/components/common/CopyAnalysisButton";
import { MatchResearchInsights } from "@/components/match/MatchResearchInsights";
import { DataSourceCard } from "@/components/match/DataSourceCard";
import { getTeamDisplayName } from "@/lib/football/team-name-map";
import { getAiMatchAnalysis } from "@/lib/db/ai-match-analysis";

export const metadata: Metadata = {
  title: "比赛详情 | Project Athena",
  description: "查看比赛模型估算概率、AI判断可信度、赛前趋势与智能分析。",
};

type MatchRow = {
  [key: string]: unknown;
  external_id: string;
  league: string | null;
  home_team: string | null;
  away_team: string | null;
  match_time: string | null;
  home_logo?: string | null;
  away_logo?: string | null;
  home_win: number | null;
  draw: number | null;
  away_win: number | null;
  ai_score: number | null;
  ai_pick?: string | null;
  ai_analysis?: string | null;
  home_team_id?: string | number | null;
  away_team_id?: string | number | null;
};

async function getMatchByExternalId(externalId: string): Promise<MatchRow | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("external_id", externalId)
      .maybeSingle();

    if (!error && data) {
      const row = data as MatchRow;
      return {
        ...row,
        home_team_raw: row.home_team,
        away_team_raw: row.away_team,
        home_team: getTeamDisplayName(row.home_team),
        away_team: getTeamDisplayName(row.away_team),
      };
    }
    if (error) console.error("Failed to load match detail, using football API fallback:", error);
  }

  const fixture = await getFixtureDetail(externalId);
  if (!fixture) return null;
  const row = footballMatchToMatchCenterRow(fixture) as MatchRow;
  return {
    ...row,
    home_team_raw: row.home_team,
    away_team_raw: row.away_team,
    home_team: getTeamDisplayName(row.home_team),
    away_team: getTeamDisplayName(row.away_team),
  };
}

function formatMatchTime(value: string | null) {
  if (!value) return "待定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date).replaceAll("/", "-");
}

function probability(value: number | null) {
  return value === null || !Number.isFinite(value) ? "--" : `${Math.round(value)}%`;
}

function teamInitial(name: string) {
  return name.trim().slice(0, 1) || "?";
}

function toPredictionStats(attack: number, defense: number, form: number, homeAdvantage: number): PredictionTeamStats {
  return { attack, defense, form, homeAdvantage };
}

async function getEnginePrediction() {
  try {
    const [homeStats, awayStats] = await Promise.all([
      getTeamRecentStats("33"),
      getTeamRecentStats("40"),
    ]);
    const homeRating = calculateFootballStrengthRating(homeStats);
    const awayRating = calculateFootballStrengthRating(awayStats);
    const homeTeamStats = toPredictionStats(homeRating.attackScore, homeRating.defenseScore, homeRating.formScore, 90);
    const awayTeamStats = toPredictionStats(awayRating.attackScore, awayRating.defenseScore, awayRating.formScore, 50);
    return {
      homeTeamStats,
      awayTeamStats,
      homeRating,
      awayRating,
      prediction: predictFromTeamStats(homeTeamStats, awayTeamStats),
    };
  } catch (error) {
    console.error("Failed to build team prediction:", error instanceof Error ? error.message : String(error));
    const homeTeamStats = toPredictionStats(50, 50, 50, 90);
    const awayTeamStats = toPredictionStats(50, 50, 50, 50);
    const homeRating = { attackScore: 50, defenseScore: 50, formScore: 50, overallScore: 50, dataAvailable: false };
    const awayRating = { attackScore: 50, defenseScore: 50, formScore: 50, overallScore: 50, dataAvailable: false };
    return {
      homeTeamStats,
      awayTeamStats,
      homeRating,
      awayRating,
      prediction: predictFromTeamStats(homeTeamStats, awayTeamStats),
    };
  }
}

function ProbabilityBar({ label, value, tone }: { label: string; value: number | null; tone: string }) {
  const width = value === null || !Number.isFinite(value) ? 0 : Math.min(Math.max(value, 0), 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-white">{probability(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default async function MatchDatabaseDetailPage({ params }: { params: Promise<{ external_id: string }> }) {
  const { external_id: externalId } = await params;
  const match = await getMatchByExternalId(externalId);
  if (!match) notFound();
  const analysisHomeTeam = match.home_team || "涓婚槦";
  const analysisAwayTeam = match.away_team || "瀹㈤槦";
  const analysisData = await getMatchAnalysisData(externalId, match);
  console.info("[match-detail] analysis response fields", {
    externalId,
    recentHomeKeys: Object.keys(analysisData.recent.home),
    recentAwayKeys: Object.keys(analysisData.recent.away),
    recentHomeMatches: analysisData.recent.home.matches.length,
    recentAwayMatches: analysisData.recent.away.matches.length,
    headToHeadKeys: Object.keys(analysisData.headToHead),
    headToHeadMatches: analysisData.headToHead.matches.length,
  });
  const [engineContext, fixtureOdds, storedAiAnalysis] = await Promise.all([
    getEnginePrediction(),
    getFixtureOdds(externalId),
    getAiMatchAnalysis(externalId),
  ]);
  const oddsValue = calculateOddsValue({
    prediction: {
      homeWin: engineContext.prediction.homeWin,
      draw: engineContext.prediction.draw,
      awayWin: engineContext.prediction.awayWin,
    },
    odds: {
      home: fixtureOdds.home.odds,
      draw: fixtureOdds.draw.odds,
      away: fixtureOdds.away.odds,
    },
  });
  await savePredictionHistory({
    match_id: externalId,
    home_team: analysisHomeTeam,
    away_team: analysisAwayTeam,
    prediction: engineContext.prediction.recommendation[0] ?? "双方数据接近",
    confidence: engineContext.prediction.confidence,
    odds_value: Math.max(oddsValue.value.home, oddsValue.value.draw, oddsValue.value.away),
  });
  const expertAnalysis = { recommendation: { risk: storedAiAnalysis?.risk_warning ?? "AI分析将在赛前生成" } };
  const homeTeam = match.home_team || "主队";
  const awayTeam = match.away_team || "客队";
  const bestValue = Math.max(oddsValue.value.home, oddsValue.value.draw, oddsValue.value.away);
  const analysisCopy = [
    `比赛：${homeTeam} vs ${awayTeam}`,
    `AI预测：主胜 ${engineContext.prediction.homeWin}% / 平局 ${engineContext.prediction.draw}% / 客胜 ${engineContext.prediction.awayWin}%`,
    `Value价值：${(bestValue * 100).toFixed(1)}%`,
    `关注方向：${engineContext.prediction.recommendation[0] ?? "双方数据接近"}`,
    `风险提示：${expertAnalysis.recommendation.risk}`,
    `AI判断可信度：${engineContext.prediction.confidence}%`,
  ].join("\n");
  return (
    <main className="mx-auto min-h-[calc(100vh-140px)] w-full max-w-6xl px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <Link href="/matches" className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" /> 返回比赛列表
      </Link>

      <section className="relative mt-6 overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#111827] via-[#111d3a] to-[#111827] p-5 shadow-xl shadow-blue-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/15 blur-[90px]" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-blue-300">{match.league || "待定联赛"}</span>
            <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{formatMatchTime(match.match_time)}</span>
          </div>
          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
            <div className="flex min-w-0 flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/15 text-2xl font-bold text-blue-200 sm:h-20 sm:w-20">{teamInitial(homeTeam)}</div>
              <h1 className="max-w-full truncate text-lg font-semibold text-white sm:text-2xl">{homeTeam}</h1>
              <span className="text-xs text-slate-500">主队</span>
            </div>
            <div className="text-center"><p className="text-xl font-semibold tracking-[0.18em] text-white sm:text-3xl">VS</p><p className="mt-2 flex items-center gap-1 text-[11px] text-blue-300"><Clock3 className="h-3.5 w-3.5" />赛前分析</p></div>
            <div className="flex min-w-0 flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15 text-2xl font-bold text-emerald-200 sm:h-20 sm:w-20">{teamInitial(awayTeam)}</div>
              <h2 className="max-w-full truncate text-lg font-semibold text-white sm:text-2xl">{awayTeam}</h2>
              <span className="text-xs text-slate-500">客队</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <MatchOverview
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          league={match.league || ""}
          matchTime={match.match_time}
        />
      </div>

      <div className="mt-6 space-y-6">
        <PredictionEngineCard homeTeam={homeTeam} awayTeam={awayTeam} prediction={engineContext.prediction} dataAvailable={engineContext.homeRating.dataAvailable && engineContext.awayRating.dataAvailable} />
        <div className="grid gap-6 lg:grid-cols-2">
          <ProbabilityChart prediction={engineContext.prediction} />
          <TeamComparison
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeRating={engineContext.homeRating}
            awayRating={engineContext.awayRating}
          />
        </div>
        <OddsValueCard odds={fixtureOdds} value={oddsValue} />
        {storedAiAnalysis ? <AthenaReportCard
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeStats={engineContext.homeTeamStats}
          awayStats={engineContext.awayTeamStats}
          prediction={engineContext.prediction}
          oddsValue={oddsValue}
          preGeneratedAnalysis={storedAiAnalysis}
        /> : <AIAnalysisPending />}
        <MatchResearchInsights
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeStats={engineContext.homeTeamStats}
          awayStats={engineContext.awayTeamStats}
          prediction={engineContext.prediction}
        />
        <div className="flex justify-end"><CopyAnalysisButton content={analysisCopy} /></div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-blue-500/20 bg-gradient-to-br from-[#111827] to-[#111d3a]">
          <CardHeader><div className="flex items-center gap-2 text-xs font-medium text-blue-300"><Sparkles className="h-4 w-4" />ATHENA AI PREDICTION</div><CardTitle className="mt-2 text-xl text-white">AI预测</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <ProbabilityBar label="主胜模型估算概率" value={engineContext.prediction.homeWin} tone="bg-blue-500" />
            <ProbabilityBar label="平局率" value={match.draw} tone="bg-slate-400" />
            <ProbabilityBar label="客胜模型估算概率" value={engineContext.prediction.awayWin} tone="bg-emerald-500" />
            <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-5 text-center"><div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"><p className="text-xs text-slate-500">模型观点</p><p className="mt-2 text-lg font-semibold text-blue-300">{match.ai_pick || "分析生成中"}</p></div><div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"><p className="text-xs text-slate-500">AI判断可信度</p><p className="mt-2 text-lg font-semibold text-emerald-400">{probability(match.ai_score)}</p><p className="mt-2 text-xs leading-5 text-slate-500">AI根据球队实力、近期表现、攻防数据综合计算，数据越完整，判断越可靠。</p></div></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2 text-xs font-medium text-amber-300"><BarChart3 className="h-4 w-4" />MATCH SNAPSHOT</div><CardTitle className="mt-2 text-xl text-white">比赛信息</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm"><div className="flex items-center justify-between border-b border-slate-800 pb-3"><span className="text-slate-500">联赛</span><span className="text-right text-slate-200">{match.league || "待定"}</span></div><div className="flex items-center justify-between border-b border-slate-800 pb-3"><span className="text-slate-500">比赛时间</span><span className="text-right text-slate-200">{formatMatchTime(match.match_time)}</span></div><div className="flex items-center justify-between"><span className="text-slate-500">比赛编号</span><span className="max-w-[60%] truncate text-right text-xs text-slate-400">{match.external_id}</span></div></CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AIMetrics homeTeam={homeTeam} awayTeam={awayTeam} metrics={analysisData.metrics} />
        <AIFocusFactors factors={analysisData.focusFactors} />
      </div>

      <div className="mt-6 space-y-6">
        <RecentFormOverview homeTeam={homeTeam} awayTeam={awayTeam} home={analysisData.recent.home} away={analysisData.recent.away} />
        <HeadToHeadOverview homeTeam={homeTeam} awayTeam={awayTeam} data={analysisData.headToHead} />
      </div>

      <div className="mt-6"><DataSourceCard generatedAt={new Date().toISOString()} /></div>
      <Disclaimer className="mt-8" />
    </main>
  );
}
