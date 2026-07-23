import { createClient } from "@supabase/supabase-js";
import { buildAnalysisPrompt, getAnalysisDataset } from "../../lib/analysis-engine/analysis_prompt_builder.ts";
import type { AnalysisDataset } from "../../lib/analysis-engine/feature-builder.ts";
import { callDeepSeek } from "./deepseek-client.ts";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const requestedMatchId = process.argv.find((argument) => argument.startsWith("--match-id="))?.slice("--match-id=".length);

type AnalysisOutput = Record<string, unknown> & {
  home_win_probability: number;
  draw_probability: number;
  away_win_probability: number;
  recommended_bet: string;
  confidence_score: number;
  risk_level: string;
  key_factors: string[];
};

const STRUCTURED_OUTPUT_INSTRUCTION = [
  "严格只返回一个有效 JSON 对象，不要 Markdown 代码块，不要解释文字。",
  "JSON 必须包含以下字段：home_win_probability:number、draw_probability:number、away_win_probability:number、recommended_bet:string、confidence_score:number、risk_level:string、key_factors:string[]。",
  "三个概率和 confidence_score 必须是 0 到 100 的数字；key_factors 必须是字符串数组。",
  "recommended_bet 仅表示模型关注方向，不包含金额、购买、下注或收益承诺。",
].join("\n");

function cleanJson(content: string) {
  const cleaned = content.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("DeepSeek returned no JSON object");
  return cleaned.slice(start, end + 1);
}

function requiredNumber(value: unknown, field: string) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/%/g, "")) : NaN;
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a number`);
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

function requiredText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must be a non-empty string`);
  return value.trim();
}

function parseAnalysis(content: string): AnalysisOutput {
  try {
    const parsed = JSON.parse(cleanJson(content)) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("result is not an object");

    const result = parsed as Record<string, unknown>;
    if (!Array.isArray(result.key_factors) || result.key_factors.some((factor) => typeof factor !== "string")) {
      throw new Error("key_factors must be a string array");
    }

    return {
      ...result,
      home_win_probability: requiredNumber(result.home_win_probability, "home_win_probability"),
      draw_probability: requiredNumber(result.draw_probability, "draw_probability"),
      away_win_probability: requiredNumber(result.away_win_probability, "away_win_probability"),
      recommended_bet: requiredText(result.recommended_bet, "recommended_bet"),
      confidence_score: requiredNumber(result.confidence_score, "confidence_score"),
      risk_level: requiredText(result.risk_level, "risk_level"),
      key_factors: result.key_factors as string[],
    };
  } catch (error) {
    throw new Error(`DeepSeek analysis JSON parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function compactOutput(output: AnalysisOutput, dataset: AnalysisDataset) {
  const factors = output.key_factors.length ? output.key_factors.join("；") : "暂无关键因素数据";
  const predictionSummary = `模型关注方向：${output.recommended_bet}`;
  const summary = text(output.summary, predictionSummary);
  const matchTrend = text(output.match_trend ?? output.matchTrend, summary);
  const homeAnalysis = text(output.home_analysis ?? output.homeAnalysis, `主胜模型估算概率：${output.home_win_probability}%`);
  const awayAnalysis = text(output.away_analysis ?? output.awayAnalysis, `客胜模型估算概率：${output.away_win_probability}%`);
  const halfPrediction = text(output.half_prediction ?? output.halfPrediction, "半场数据不足。");
  const scorePrediction = text(output.score_prediction ?? output.scorePrediction, "比分数据不足。");
  const goalPrediction = text(output.goal_prediction ?? output.goalPrediction, "总进球数据不足。");
  const riskWarning = text(output.risk_warning ?? output.riskWarning, `数据不确定性等级：${output.risk_level}`);
  return {
    summary,
    match_trend: matchTrend,
    home_analysis: homeAnalysis,
    away_analysis: awayAnalysis,
    half_prediction: halfPrediction,
    score_prediction: scorePrediction,
    goal_prediction: goalPrediction,
    risk_warning: riskWarning,
    home_win_probability: output.home_win_probability,
    draw_probability: output.draw_probability,
    away_win_probability: output.away_win_probability,
    recommended_bet: output.recommended_bet,
    confidence_score: output.confidence_score,
    risk_level: output.risk_level,
    key_factors: output.key_factors,
    factors,
    raw: output,
    data_limitations: dataset.data_quality.missing_fields,
  };
}

async function saveAnalysis(dataset: AnalysisDataset) {
  const prompt = buildAnalysisPrompt(dataset);
  const result = await callDeepSeek([
    { role: "system", content: `${prompt.system_prompt}\n${STRUCTURED_OUTPUT_INSTRUCTION}` },
    { role: "user", content: prompt.user_prompt },
  ]);
  const output = compactOutput(parseAnalysis(result.content), dataset);
  const now = new Date().toISOString();
  const row = {
    match_id: dataset.match_id,
    analysis_version: "v1",
    summary: output.summary,
    match_trend: output.match_trend,
    home_analysis: output.home_analysis,
    away_analysis: output.away_analysis,
    half_prediction: output.half_prediction,
    score_prediction: output.score_prediction,
    goal_prediction: output.goal_prediction,
    risk_warning: output.risk_warning,
    home_win_probability: output.home_win_probability,
    draw_probability: output.draw_probability,
    away_win_probability: output.away_win_probability,
    recommended_bet: output.recommended_bet,
    confidence_score: output.confidence_score,
    risk_level: output.risk_level,
    key_factors: output.key_factors,
    analysis: { ...output.raw, data_limitations: output.data_limitations, generated_at: now },
    status: "completed",
    version: "v1",
    updated_at: now,
  };
  const saved = await supabase.from("ai_match_analysis").upsert(row, { onConflict: "match_id" });
  if (saved.error) throw new Error(`ai_match_analysis write failed: ${saved.error.message}`);
  return { matchId: dataset.match_id, model: result.model, confidence_score: output.confidence_score };
}

async function main() {
  const datasets = await getAnalysisDataset(requestedMatchId);
  if (!datasets.length) {
    console.info(`[analysis-runner] no analysis_dataset rows${requestedMatchId ? ` for ${requestedMatchId}` : ""}`);
    return;
  }

  let completed = 0;
  for (const dataset of datasets) {
    const saved = await saveAnalysis(dataset);
    completed += 1;
    console.info(`[analysis-runner] saved match_id=${saved.matchId} model=${saved.model} confidence_score=${saved.confidence_score}`);
  }
  console.info(`[analysis-runner] completed=${completed}/${datasets.length}`);
}

main().catch((error) => {
  console.error("[analysis-runner] failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
