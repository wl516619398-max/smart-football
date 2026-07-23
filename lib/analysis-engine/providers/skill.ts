import type { AnalysisProvider, AnalysisProviderResult, AnalysisRunOptions } from "@/lib/analysis-engine/types";
import { predictSkillMatch } from "@/lib/analysis-engine/skill/model";

type SkillRecord = Record<string, unknown>;

export type AthenaProbability = {
  homeWin: number;
  draw: number;
  awayWin: number;
};

export type AthenaSkillAnalysis = {
  summary: string;
  recommendation: string;
  confidence: string;
  reasons: string[];
  risks: string[];
  goalsPrediction: string;
  betDirection: string;
  prediction: AthenaProbability;
  halfTimePrediction: AthenaProbability;
  goalRangePrediction: {
    zeroToOne: number;
    twoToThree: number;
    fourPlus: number;
  };
  scoreProbabilities: Array<{ score: string; probability: number }>;
  riskLevel: "low" | "medium" | "high";
};

const FORBIDDEN_TERMS = /盘口|欧赔|赔率|投注|下注|购买|盈利|收益|跟单|梭哈|内幕/;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeText(value: unknown, fallback: string, maxLength = 500) {
  const candidate = text(value);
  return (FORBIDDEN_TERMS.test(candidate) ? fallback : candidate || fallback).slice(0, maxLength);
}

function list(value: unknown, maxItems = 4) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => safeText(item, "", 180)).filter(Boolean).slice(0, maxItems);
}

function record(value: unknown): SkillRecord {
  return typeof value === "object" && value !== null ? value as SkillRecord : {};
}

function firstText(source: SkillRecord, keys: string[]) {
  for (const key of keys) {
    const value = text(source[key]);
    if (value) return value;
  }
  return "";
}

function formatValues(value: unknown) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((item) => text(item) || JSON.stringify(item)).filter(Boolean).slice(0, 3).join("、");
}

function percent(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.round((value <= 1 ? value * 100 : value) * 10) / 10;
}

function probabilityBundle(value: unknown): AthenaProbability {
  const source = record(value);
  return {
    homeWin: percent(source.homeWin ?? source.home_win ?? source.homeWin90Prob ?? source.home),
    draw: percent(source.draw ?? source.draw90Prob),
    awayWin: percent(source.awayWin ?? source.away_win ?? source.awayWin90Prob ?? source.away),
  };
}

function scoreList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 5).flatMap((item) => {
    if (typeof item === "string") return [{ score: item, probability: 0 }];
    const source = record(item);
    const score = text(source.score ?? source.label ?? source.result);
    return score ? [{ score, probability: percent(source.probability ?? source.prob ?? source.value) }] : [];
  });
}

function normalizeRisk(value: unknown): "low" | "medium" | "high" {
  const candidate = text(value).toLowerCase();
  if (candidate.includes("high") || candidate.includes("高")) return "high";
  if (candidate.includes("low") || candidate.includes("低")) return "low";
  return "medium";
}

/** Convert the third-party Skill's flexible output into Athena's stable JSON. */
export function normalizeSkillOutput(raw: unknown): AthenaSkillAnalysis {
  const source = record(raw);
  const report = record(source.report);
  const prediction = record(source.prediction);
  const factors = list(source.keyFactors ?? source.factors ?? report.factors, 4);
  const reasons = list(source.reasons ?? source.strengths ?? report.reasons, 4);
  const halfPredictionText = firstText(source, ["halfPrediction", "halfTimePrediction", "halftime"]);
  const goals = firstText(source, ["goalsPrediction", "goalPrediction", "goals", "totalGoals"]);
  const score = formatValues(source.scorePrediction ?? source.predictedScores ?? source.scoreProbabilities);
  const riskList = list(source.risks ?? source.riskWarning ?? report.risks, 4);
  const combinedReasons = [...reasons, ...factors].slice(0, 4);
  const probability = probabilityBundle(source.prediction ?? source.probabilities ?? source.resultProbabilities);
  const halfTimePrediction = probabilityBundle(source.halfTimePrediction ?? source.halfTime ?? source.halfPrediction);
  const goalRange = record(source.goalRangePrediction ?? source.goalRanges ?? source.goalPrediction);

  return {
    summary: safeText(source.summary ?? report.summary, "现有数据维度有限，结论仅用于赛事信息参考。", 1000),
    recommendation: safeText(source.recommendation ?? prediction.recommendation, "模型观点：继续关注比赛走势与数据变化。", 240),
    confidence: safeText(source.confidence ?? prediction.confidence, "数据待补充", 24),
    reasons: combinedReasons.length ? combinedReasons : ["近期状态与攻防数据将作为主要分析依据"],
    risks: riskList.length ? riskList : ["当前数据样本有限，比赛结果存在不确定性"],
    goalsPrediction: safeText(
      [goals && `进球趋势：${goals}`, halfPredictionText && `半场走势：${halfPredictionText}`, score && `比分参考：${score}`].filter(Boolean).join("；"),
      "当前进球与比分数据不足，建议结合临场信息观察",
      300,
    ),
    betDirection: safeText(source.betDirection ?? source.attentionDirection ?? source.recommendation ?? prediction.recommendation, "关注方向：结合当前数据观察比赛走势", 240),
    prediction: probability,
    halfTimePrediction,
    goalRangePrediction: {
      zeroToOne: percent(goalRange.zeroToOne ?? goalRange["0-1"]),
      twoToThree: percent(goalRange.twoToThree ?? goalRange["2-3"]),
      fourPlus: percent(goalRange.fourPlus ?? goalRange["4+"] ?? goalRange.overFour),
    },
    scoreProbabilities: scoreList(source.scoreProbabilities ?? source.topScorelines ?? source.scorePrediction),
    riskLevel: normalizeRisk(source.riskLevel ?? source.risk),
  };
}

export type SkillInvoker = (
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: AnalysisRunOptions,
) => Promise<unknown>;

/**
 * Adapter boundary for the external Skill. When no runtime invoker is wired,
 * the ported TypeScript model can still produce structured output from a
 * provider-neutral SkillSnapshot. Without a snapshot it intentionally fails
 * so the configured analysis fallback can take over.
 */
export function createSkillProvider(invoker?: SkillInvoker): AnalysisProvider {
  return {
    name: "skill",
    async analyze(messages, options): Promise<AnalysisProviderResult> {
      if (!invoker && options?.skillSnapshot) {
        try {
          const prediction = predictSkillMatch(options.skillSnapshot);
          const normalized: AthenaSkillAnalysis = {
            summary: "Athena模型根据球队评分、攻防表现和近期状态生成结构化赛事观点。",
            recommendation: prediction.recommendation,
            confidence: `${prediction.confidence}%`,
            reasons: prediction.keyFactors,
            risks: [prediction.riskLevel === "high" ? "双方数据差异不足以形成单一倾向" : "比赛存在临场状态变化可能"],
            goalsPrediction: `预计进球 ${prediction.expectedGoals.home.toFixed(1)}-${prediction.expectedGoals.away.toFixed(1)}`,
            betDirection: prediction.recommendation,
            prediction: prediction.probability,
            halfTimePrediction: prediction.halfTimeProbability,
            goalRangePrediction: prediction.goalRangeProbability,
            scoreProbabilities: prediction.scoreProbabilities,
            riskLevel: prediction.riskLevel,
          };
          return { success: true, content: JSON.stringify(normalized), model: prediction.modelVersion, provider: "skill" };
        } catch (error) {
          console.error(`[Analysis skill] local model failed error=${error instanceof Error ? error.message : "prediction failed"}`);
        }
      }

      if (!invoker) {
        console.info("[Analysis skill] adapter mock is not configured; falling back to DeepSeek");
        return { success: false, code: "SKILL_NOT_CONFIGURED", status: 503, retryAfter: 0, model: "skill-mock", provider: "skill" };
      }

      try {
        const normalized = normalizeSkillOutput(await invoker(messages, options));
        return { success: true, content: JSON.stringify(normalized), model: "worldcup-prediction-skill-xiaowo", provider: "skill" };
      } catch (error) {
        console.error(`[Analysis skill] adapter failed error=${error instanceof Error ? error.message : "request failed"}`);
        return { success: false, code: "SKILL_REQUEST_FAILED", status: 503, retryAfter: 0, model: "worldcup-prediction-skill-xiaowo", provider: "skill" };
      }
    },
  };
}
