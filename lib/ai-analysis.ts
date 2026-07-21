import { requestAI, type AIMessage } from "@/lib/ai/provider";
import type { AiMatchAnalysisInput, AiReportLevel } from "@/types/ai-match-analysis";

export type AiMatchAnalysisDraft = {
  summary: string;
  match_background: string;
  strength_analysis: string;
  recent_form_analysis: string;
  head_to_head_analysis: string;
  key_player_analysis: string;
  tactical_analysis: string;
  result_reasoning: string;
  match_trend: string;
  home_analysis: string;
  away_analysis: string;
  half_prediction: string;
  score_prediction: string;
  goal_prediction: string;
  risk_warning: string;
  odds_value_analysis: string;
  confidence: number;
  report_level: AiReportLevel;
};

export type AiAnalysisServiceResult =
  | { success: true; data: AiMatchAnalysisDraft; model: string; provider: string }
  | { success: false; error: string; model?: string; provider?: string };

const DATA_LIMITATION = "现有数据维度有限，结论仅用于赛事信息参考，比赛结果仍具有不确定性。";
const STANDARD_MIN = 800;
const VIP_MIN = 2000;

function reportMinLength(level: AiReportLevel | undefined) {
  return level === "vip" ? VIP_MIN : STANDARD_MIN;
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function readText(value: unknown, fallback = DATA_LIMITATION) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 2400) : fallback;
}

function readSummary(value: unknown) {
  const content = readText(value);
  const normalized = content.length >= 300 ? content : `${content} ${DATA_LIMITATION}`;
  return normalized.slice(0, 500);
}

function readNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/%/g, "")) : NaN;
  return Number.isFinite(parsed) ? clamp(parsed) : 0;
}

function reportLength(data: AiMatchAnalysisDraft) {
  return [
    data.summary,
    data.match_background,
    data.strength_analysis,
    data.recent_form_analysis,
    data.head_to_head_analysis,
    data.key_player_analysis,
    data.tactical_analysis,
    data.result_reasoning,
    data.half_prediction,
    data.score_prediction,
    data.goal_prediction,
    data.risk_warning,
    data.odds_value_analysis,
  ].join("").length;
}

function needsExpansion(data: AiMatchAnalysisDraft, level: AiReportLevel) {
  return reportLength(data) < reportMinLength(level) || data.summary.length < 300;
}

function parseDraft(content: string): AiMatchAnalysisDraft | null {
  const cleaned = content.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    const draft: AiMatchAnalysisDraft = {
      summary: readSummary(parsed.summary),
      match_background: readText(parsed.match_background, readText(parsed.match_trend)),
      strength_analysis: readText(parsed.strength_analysis, readText(parsed.home_analysis)),
      recent_form_analysis: readText(parsed.recent_form_analysis, readText(parsed.match_trend)),
      head_to_head_analysis: readText(parsed.head_to_head_analysis),
      key_player_analysis: readText(parsed.key_player_analysis),
      tactical_analysis: readText(parsed.tactical_analysis, readText(parsed.home_analysis)),
      result_reasoning: readText(parsed.result_reasoning, readText(parsed.match_trend)),
      match_trend: readText(parsed.match_trend),
      home_analysis: readText(parsed.home_analysis),
      away_analysis: readText(parsed.away_analysis),
      half_prediction: readText(parsed.half_prediction),
      score_prediction: readText(parsed.score_prediction),
      goal_prediction: readText(parsed.goal_prediction),
      risk_warning: readText(parsed.risk_warning),
      odds_value_analysis: readText(parsed.odds_value_analysis, readText(parsed.goal_prediction)),
      confidence: readNumber(parsed.confidence),
      report_level: parsed.report_level === "vip" ? "vip" : "standard",
    };

    if (reportLength(draft) < reportMinLength(draft.report_level)) {
      console.warn(`[AI match analysis] report is shorter than target: ${reportLength(draft)} chars`);
    }

    return draft;
  } catch {
    return null;
  }
}

function buildMessages(input: AiMatchAnalysisInput, expansionPass = false): AIMessage[] {
  const level = input.reportLevel === "vip" ? "vip" : "standard";
  const label = level === "vip" ? "VIP深度报告" : "普通报告";
  const target = level === "vip" ? "2000-3000" : "800-1500";
  const expansion = expansionPass
    ? `This is an expansion pass. The previous report was too short. Rewrite it with distinct paragraphs and a total length of ${target} Chinese characters.`
    : "";

  return [
    {
      role: "system",
      content: [
        "You are Athena AI Engine, a football data analysis and match information assistant.",
        "Write the report in natural, professional Chinese. Use only facts present in the supplied JSON. Never invent injuries, lineups, players, historical matches, odds movements, tactics, weather, news, or statistics.",
        `This is a ${label}. Keep the total report length within ${target} Chinese characters. The summary must be 300-500 Chinese characters.`,
        "The report must contain concrete, separate sections for: match background, both teams' recent form, head-to-head history, attacking and defensive data, tactical analysis, key player factors, odds/value analysis, AI prediction, and risk warnings.",
        "When a data dimension is missing, explicitly say that the data is unavailable or incomplete. Do not infer a fact from a missing field.",
        "Use objective language such as model view, focus factor, and data uncertainty. Do not provide purchase, betting, staking, financial, or guaranteed-result advice.",
        "Return JSON only, with no Markdown and no explanation of hidden reasoning.",
        "Required JSON keys: summary, match_background, strength_analysis, recent_form_analysis, head_to_head_analysis, key_player_analysis, tactical_analysis, result_reasoning, match_trend, home_analysis, away_analysis, half_prediction, score_prediction, goal_prediction, risk_warning, odds_value_analysis, confidence, report_level.",
        `Set report_level to ${level}. confidence must be an integer from 0 to 100. ${expansion}`,
      ].join("\n"),
    },
    { role: "user", content: JSON.stringify(input) },
  ];
}

export async function generateAiMatchAnalysis(input: AiMatchAnalysisInput): Promise<AiAnalysisServiceResult> {
  try {
    const level = input.reportLevel === "vip" ? "vip" : "standard";
    const options = { maxTokens: level === "vip" ? 9000 : 6000, timeoutMs: 30_000 };
    let result = await requestAI(buildMessages(input), options);
    if (!result.success) {
      console.error(`[AI match analysis] provider failed status=${result.status} model=${result.model}`);
      return { success: false, error: "AI分析生成失败", model: result.model, provider: result.provider };
    }

    let data = parseDraft(result.content);
    if (!data) {
      console.error(`[AI match analysis] invalid JSON model=${result.model}`);
      return { success: false, error: "AI分析结果格式无效", model: result.model, provider: result.provider };
    }

    if (needsExpansion(data, level)) {
      const retry = await requestAI(buildMessages(input, true), options);
      if (retry.success) {
        const retryData = parseDraft(retry.content);
        if (retryData && reportLength(retryData) > reportLength(data)) {
          result = retry;
          data = retryData;
        }
      }
    }

    return { success: true, data, model: result.model, provider: result.provider ?? "unknown" };
  } catch (error) {
    console.error("[AI match analysis] request failed:", error instanceof Error ? error.message : String(error));
    return { success: false, error: "AI分析服务暂不可用" };
  }
}
