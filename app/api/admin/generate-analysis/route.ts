import { NextResponse } from "next/server";
import { getAiReportTestFixture } from "@/data/ai-report-test";
import { generateAiMatchAnalysis } from "@/lib/ai-analysis";
import { upsertAiMatchAnalysis } from "@/lib/db/ai-match-analysis";
import { getFixtureOdds } from "@/lib/football/odds";
import { getTeamRecentStats } from "@/lib/football/stats";
import { getMatchAnalysisData } from "@/lib/match-analysis";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.ANALYSIS_ADMIN_SECRET?.trim();
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

function teamId(name: string, fallback: string) {
  const normalized = name.trim().toLowerCase();
  const ids: Record<string, string> = {
    "manchester united": "33",
    "曼联": "33",
    "manchester city": "50",
    "曼城": "50",
    liverpool: "40",
    "利物浦": "40",
    arsenal: "42",
    "阿森纳": "42",
    "real madrid": "541",
    "皇家马德里": "541",
    barcelona: "529",
    "fc barcelona": "529",
    "巴塞罗那": "529",
    "bayern munich": "157",
    "拜仁慕尼黑": "157",
    "borussia dortmund": "165",
    "多特蒙德": "165",
  };
  return ids[normalized] ?? fallback;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!process.env.ANALYSIS_ADMIN_SECRET?.trim()) return NextResponse.json({ success: false, error: "ANALYSIS_ADMIN_SECRET is not configured" }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 }); }
  const matchId = typeof body === "object" && body !== null && typeof (body as { match_id?: unknown }).match_id === "string" ? (body as { match_id: string }).match_id.trim() : "";
  const reportLevel = typeof body === "object" && body !== null && (body as { report_level?: unknown }).report_level === "vip" ? "vip" : "standard";
  if (!matchId) return NextResponse.json({ success: false, error: "match_id is required" }, { status: 400 });

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ success: false, error: "Supabase is not configured" }, { status: 503 });

  try {
    const { data: row, error } = await supabase.from("matches").select("*").eq("external_id", matchId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });

    const homeTeam = String(row.home_team ?? "主队");
    const awayTeam = String(row.away_team ?? "客队");
    const testFixture = getAiReportTestFixture(matchId);
    const [homeStats, awayStats, odds] = testFixture ? [testFixture.homeStats, testFixture.awayStats, testFixture.odds] : await Promise.all([
      getTeamRecentStats(String(row.home_team_id ?? teamId(homeTeam, "33"))),
      getTeamRecentStats(String(row.away_team_id ?? teamId(awayTeam, "40"))),
      getFixtureOdds(matchId),
    ]);
    const analysisData = testFixture?.analysisData ?? await getMatchAnalysisData(matchId, row as Record<string, unknown>);
    const matchData = testFixture?.matchData ?? {
      recentForm: analysisData.recent,
      homeAwayPerformance: { home: "未提供", away: "未提供" },
      metrics: analysisData.metrics,
      xG: "未提供",
      headToHead: analysisData.headToHead,
      oddsMovement: "当前仅有单点赔率，暂无完整变化序列。",
      injuries: row.injuries ?? "暂无传入伤停数据",
    };
    const result = await generateAiMatchAnalysis({
      match: { id: matchId, league: String(row.league ?? ""), homeTeam, awayTeam, matchTime: String(row.match_time ?? "") },
      matchData,
      homeTeamData: { stats: homeStats, recentForm: analysisData.recent.home, metrics: analysisData.metrics.filter((metric) => metric.home !== null) },
      awayTeamData: { stats: awayStats, recentForm: analysisData.recent.away, metrics: analysisData.metrics.filter((metric) => metric.away !== null) },
      odds,
      reportLevel,
    });

    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 502 });

    const saved = await upsertAiMatchAnalysis({
      match_id: matchId,
      analysis_version: "v1",
      analysis: result.data,
      status: "completed",
      version: "v1",
      summary: result.data.summary,
      match_background: result.data.match_background,
      strength_analysis: result.data.strength_analysis,
      recent_form_analysis: result.data.recent_form_analysis,
      tactical_analysis: result.data.tactical_analysis,
      result_reasoning: result.data.result_reasoning,
      match_trend: result.data.match_trend,
      home_analysis: result.data.home_analysis,
      away_analysis: result.data.away_analysis,
      half_prediction: result.data.half_prediction,
      score_prediction: result.data.score_prediction,
      goal_prediction: result.data.goal_prediction,
      risk_warning: result.data.risk_warning,
      odds_value_analysis: result.data.odds_value_analysis,
      confidence: result.data.confidence,
    });
    return NextResponse.json({ success: true, data: saved, generated: true }, { status: 200 });
  } catch (error) {
    console.error("[admin/generate-analysis] failed:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, error: "Analysis generation failed" }, { status: 500 });
  }
}
