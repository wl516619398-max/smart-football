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
import { decodeUnicode, decodeUnicodeDeep } from "@/lib/utils/decode-unicode";
import { analyzeMatch } from "@/lib/analysis-engine";
import type { MatchData } from "@/lib/data-provider/types";
import { MatchAnalysisOverview } from "@/components/match/MatchAnalysisOverview";
import { ShareButton } from "@/components/common/ShareButton";

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
      return decodeUnicodeDeep({
        ...row,
        league: decodeUnicode(row.league),
        home_team_raw: decodeUnicode(row.home_team),
        away_team_raw: decodeUnicode(row.away_team),
        home_team: getTeamDisplayName(row.home_team),
        away_team: getTeamDisplayName(row.away_team),
        ai_pick: decodeUnicode(row.ai_pick),
      });
    }
    if (error) console.error("Failed to load match detail, using football API fallback:", error);
  }

  const fixture = await getFixtureDetail(externalId);
  if (!fixture) return null;
  const row = footballMatchToMatchCenterRow(fixture) as MatchRow;
  return decodeUnicodeDeep({
    ...row,
    league: decodeUnicode(row.league),
    home_team_raw: decodeUnicode(row.home_team),
    away_team_raw: decodeUnicode(row.away_team),
    home_team: getTeamDisplayName(row.home_team),
    away_team: getTeamDisplayName(row.away_team),
    ai_pick: decodeUnicode(row.ai_pick),
  });
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

function confidenceLevel(value: number) {
  if (value >= 75) return "\u9ad8";
  if (value >= 50) return "\u4e2d";
  return "\u4f4e";
}

function teamInitial(name: string) {
  return name.trim().slice(0, 1) || "?";
}

function toPredictionStats(attack: number, defense: number, form: number, homeAdvantage: number): PredictionTeamStats {
  return { attack, defense, form, homeAdvantage };
}

async function getEnginePrediction(match: MatchRow) {
  try {
    const homeTeamId = String(match.home_team_id ?? "33");
    const awayTeamId = String(match.away_team_id ?? "40");
    const [homeStats, awayStats] = await Promise.all([
      getTeamRecentStats(homeTeamId),
      getTeamRecentStats(awayTeamId),
    ]);
    const homeRating = calculateFootballStrengthRating(homeStats);
    const awayRating = calculateFootballStrengthRating(awayStats);
    const homeTeamStats = toPredictionStats(homeRating.attackScore, homeRating.defenseScore, homeRating.formScore, 90);
    const awayTeamStats = toPredictionStats(awayRating.attackScore, awayRating.defenseScore, awayRating.formScore, 50);
    const matchData: MatchData = {
      match_id: match.external_id,
      league: match.league ?? "",
      home_team: { id: homeTeamId, name: match.home_team ?? "主队" },
      away_team: { id: awayTeamId, name: match.away_team ?? "客队" },
      match_time: match.match_time ?? "",
      home_team_stats: { attack: homeRating.attackScore, defense: homeRating.defenseScore, form: homeRating.formScore, homeAdvantage: 90, possession: 50, goalsFor: homeStats.goals.scored, goalsAgainst: homeStats.goals.conceded, xG: homeStats.goals.scored / Math.max(1, homeStats.recentMatches.length), rank: 20 },
      away_team_stats: { attack: awayRating.attackScore, defense: awayRating.defenseScore, form: awayRating.formScore, homeAdvantage: 50, possession: 50, goalsFor: awayStats.goals.scored, goalsAgainst: awayStats.goals.conceded, xG: awayStats.goals.scored / Math.max(1, awayStats.recentMatches.length), rank: 20 },
      recent_form: { home: homeStats.recentMatches, away: awayStats.recentMatches },
      head_to_head: { matches: [], home_wins: 0, draws: 0, away_wins: 0 },
      odds: { home: 0, draw: 0, away: 0 },
      injuries: [],
    };
    const unifiedPrediction = analyzeMatch(matchData);
    const [expectedHome, expectedAway] = unifiedPrediction.expected_score.split("-").map((value) => Number(value) || 0);
    return {
      homeTeamStats,
      awayTeamStats,
      homeRating,
      awayRating,
      prediction: {
        homeWin: unifiedPrediction.home_win_probability,
        draw: unifiedPrediction.draw_probability,
        awayWin: unifiedPrediction.away_win_probability,
        confidence: unifiedPrediction.confidence,
        expectedGoals: { home: expectedHome, away: expectedAway },
        recommendation: [unifiedPrediction.recommended_pick, ...unifiedPrediction.key_factors],
      },
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
  const analysisData = decodeUnicodeDeep(await getMatchAnalysisData(externalId, match));
  console.info("[match-detail] analysis response fields", {
    externalId,
    recentHomeKeys: Object.keys(analysisData.recent.home),
    recentAwayKeys: Object.keys(analysisData.recent.away),
    recentHomeMatches: analysisData.recent.home.matches.length,
    recentAwayMatches: analysisData.recent.away.matches.length,
    headToHeadKeys: Object.keys(analysisData.headToHead),
    headToHeadMatches: analysisData.headToHead.matches.length,
  });
  const [engineContext, fixtureOdds, rawStoredAiAnalysis] = await Promise.all([
    getEnginePrediction(match),
    getFixtureOdds(externalId),
    getAiMatchAnalysis(externalId),
  ]);
  const storedAiAnalysis = decodeUnicodeDeep(rawStoredAiAnalysis);
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
  const storedContent = (storedAiAnalysis?.analysis ?? {}) as Record<string, unknown>;
  const storedScoreProbabilities = Array.isArray(storedContent.scoreProbabilities)
    ? storedContent.scoreProbabilities.filter((item): item is { score: string; probability: number } => Boolean(item && typeof item === "object" && typeof (item as Record<string, unknown>).score === "string" && typeof (item as Record<string, unknown>).probability === "number"))
    : [];
  await savePredictionHistory({
    match_id: externalId,
    home_team: analysisHomeTeam,
    away_team: analysisAwayTeam,
    prediction: engineContext.prediction.recommendation[0] ?? "双方数据接近",
    confidence: engineContext.prediction.confidence,
    odds_value: Math.max(oddsValue.value.home, oddsValue.value.draw, oddsValue.value.away),
    match_time: match.match_time,
    home_win_probability: engineContext.prediction.homeWin,
    draw_probability: engineContext.prediction.draw,
    away_win_probability: engineContext.prediction.awayWin,
    score_probabilities: storedScoreProbabilities,
    goals_prediction: typeof storedAiAnalysis?.goal_prediction === "string" ? storedAiAnalysis.goal_prediction : typeof storedContent.goal_prediction === "string" ? storedContent.goal_prediction : `预计进球 ${engineContext.prediction.expectedGoals.home.toFixed(1)} - ${engineContext.prediction.expectedGoals.away.toFixed(1)}`,
    risk_level: typeof storedContent.risk_level === "string" ? storedContent.risk_level : null,
    actual_score: null,
    actual_result: null,
    prediction_hit: null,
    goals_prediction_hit: null,
    score_top3_hit: null,
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
  const recommendationReasons = [
    `${homeTeam} \u4e3b\u80dc\u6982\u7387 ${probability(engineContext.prediction.homeWin)}，${homeTeam} \u4e3b\u573a\u6761\u4ef6\u5df2\u7eb3\u5165\u6a21\u578b\u8bc4\u4f30。`,
    `\u9884\u671f\u8fdb\u7403 ${engineContext.prediction.expectedGoals.home.toFixed(2)} : ${engineContext.prediction.expectedGoals.away.toFixed(2)}，\u653b\u9632\u5dee\u5f02\u652f\u6301\u5f53\u524d\u6a21\u578b\u89c2\u70b9\u3002`,
    engineContext.prediction.recommendation[1] || "\u8fd1\u671f\u72b6\u6001\u3001\u653b\u9632\u6307\u6807\u4e0e\u4e3b\u5ba2\u573a\u56e0\u7d20\u7efc\u5408\u53c2\u8003\u3002",
  ];
  const riskFactors = [
    `\u5e73\u5c40\u6982\u7387 ${probability(engineContext.prediction.draw)}，\u53cc\u65b9\u4ecd\u5b58\u5728\u76f8\u6301\u65f6\u6bb5\u3002`,
    Math.abs(engineContext.prediction.expectedGoals.home - engineContext.prediction.expectedGoals.away) < 0.35 ? "\u53cc\u65b9\u9884\u671f\u8fdb\u7403\u63a5\u8fd1，\u6bd4\u8d5b\u8d70\u52bf\u53ef\u80fd\u53d7\u4e34\u573a\u7ec6\u8282\u5f71\u54cd\u3002" : "\u6bd4\u8d5b\u8fdb\u7a0b\u4e0e\u4e34\u573a\u9635\u5bb9\u53ef\u80fd\u6539\u53d8\u653b\u9632\u5e73\u8861\u3002",
    "\u7ed3\u8bba\u57fa\u4e8e\u5f53\u524d\u53ef\u83b7\u6570\u636e，\u9996\u53d1\u3001\u4f24\u505c\u4e0e\u4e34\u573a\u4fe1\u606f\u4ecd\u9700\u8d5b\u524d\u6838\u5bf9\u3002",
  ];
  return (
    <main className="mx-auto min-h-[calc(100vh-140px)] w-full max-w-6xl px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
      <Link href="/matches" className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" /> 返回比赛列表
      </Link>
      <ShareButton matchId={externalId} />
      </div>

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
          <div className="mt-7 grid gap-3 border-t border-blue-400/15 pt-5 sm:grid-cols-[1.4fr_1fr_1fr]">
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-blue-400/15 bg-slate-950/30 p-3 text-center">
              <div><p className="text-[10px] text-slate-500">{`\u4e3b\u80dc`}</p><p className="mt-1 text-lg font-semibold text-blue-300">{probability(engineContext.prediction.homeWin)}</p></div>
              <div><p className="text-[10px] text-slate-500">{`\u5e73\u5c40`}</p><p className="mt-1 text-lg font-semibold text-slate-200">{probability(engineContext.prediction.draw)}</p></div>
              <div><p className="text-[10px] text-slate-500">{`\u5ba2\u80dc`}</p><p className="mt-1 text-lg font-semibold text-emerald-300">{probability(engineContext.prediction.awayWin)}</p></div>
            </div>
            <div className="rounded-xl border border-blue-400/15 bg-blue-500/5 p-3 text-center">
              <p className="text-[10px] text-slate-500">{`AI\u6a21\u578b\u89c2\u70b9`}</p>
              <p className="mt-1 truncate text-sm font-semibold text-blue-200">{engineContext.prediction.recommendation[0] || `\u6570\u636e\u540c\u6b65\u4e2d`}</p>
            </div>
            <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/5 p-3 text-center">
              <p className="text-[10px] text-slate-500">{`AI\u5224\u65ad\u53ef\u4fe1\u5ea6`}</p>
              <p className="mt-1 text-sm font-semibold text-emerald-200">{engineContext.prediction.confidence}% · {confidenceLevel(engineContext.prediction.confidence)}</p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 border-t border-blue-400/15 pt-4 sm:grid-cols-2">
            <div className="rounded-xl border border-blue-400/15 bg-blue-500/5 p-4">
              <p className="text-xs font-semibold text-blue-200">AI推荐理由</p>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-300">{recommendationReasons.map((reason, index) => <li key={`${reason}-${index}`} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />{reason}</li>)}</ul>
            </div>
            <div className="rounded-xl border border-amber-400/15 bg-amber-500/5 p-4">
              <p className="text-xs font-semibold text-amber-200">风险因素</p>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-300">{riskFactors.map((risk, index) => <li key={`${risk}-${index}`} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{risk}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <MatchAnalysisOverview
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          prediction={engineContext.prediction}
          analysis={storedAiAnalysis}
        />
      </div>

      <div className="hidden">
      <div className="mt-6">
        <MatchOverview
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          league={match.league || ""}
          matchTime={match.match_time}
        />
      </div>

      <div className="mt-6 space-y-6">
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
      </div>

      <div className="mt-6"><DataSourceCard generatedAt={new Date().toISOString()} /></div>
      <Disclaimer className="mt-8" />
    </main>
  );
}
