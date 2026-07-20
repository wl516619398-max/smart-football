import { requestAI, type AIMessage } from "@/lib/ai/provider";
import type { MatchPrediction, PredictionTeamStats } from "@/lib/prediction/types";

export type FootballAnalyzerInput = {
  homeTeam: string;
  awayTeam: string;
  homeTeamStats: PredictionTeamStats;
  awayTeamStats: PredictionTeamStats;
  prediction: MatchPrediction;
};

export type FootballAnalysisResult = {
  analysis: string[];
  recommendation: {
    safe: string;
    risk: string;
    goals: string;
  };
  predictedScores: string[];
  confidence: number;
};

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

function fallbackAnalysis(input: FootballAnalyzerInput): FootballAnalysisResult {
  const { homeTeam, awayTeam, homeTeamStats, awayTeamStats, prediction } = input;
  const predictedScore = `${Math.round(prediction.expectedGoals.home)}-${Math.round(prediction.expectedGoals.away)}`;
  const alternateScore = prediction.draw >= Math.max(prediction.homeWin, prediction.awayWin) ? "1-1" : "2-1";
  const advantage = prediction.homeWin >= prediction.awayWin ? homeTeam : awayTeam;

  return {
    analysis: [
      `${homeTeam}与${awayTeam}的模型概率显示，${advantage}当前占据相对优势。`,
      `攻防指标与近期状态综合后，${homeTeam}评分为${Math.round((homeTeamStats.attack + homeTeamStats.defense + homeTeamStats.form) / 3)}，${awayTeam}评分为${Math.round((awayTeamStats.attack + awayTeamStats.defense + awayTeamStats.form) / 3)}。`,
      "现有数据维度有限，结论仅用于赛事信息参考，比赛结果仍具有不确定性。",
    ],
    recommendation: {
      safe: prediction.recommendation[0] ?? "双方数据需要结合临场信息观察",
      risk: "近期状态、阵容信息与比赛进程可能带来数据偏差",
      goals: `模型预期进球为${prediction.expectedGoals.home.toFixed(2)}-${prediction.expectedGoals.away.toFixed(2)}，关注总进球走势变化`,
    },
    predictedScores: [...new Set([predictedScore, alternateScore])],
    confidence: prediction.confidence,
  };
}

function textList(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, limit);
}

function parseNumber(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? clamp(parsed) : fallback;
}

function parseAnalysis(content: string, fallback: FootballAnalysisResult): FootballAnalysisResult | null {
  const cleaned = content.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    const recommendation = typeof parsed.recommendation === "object" && parsed.recommendation !== null
      ? parsed.recommendation as Record<string, unknown>
      : {};
    const analysis = textList(parsed.analysis, 5);
    const predictedScores = textList(parsed.predictedScores, 3);
    if (!analysis.length || !predictedScores.length) return null;

    return {
      analysis,
      recommendation: {
        safe: typeof recommendation.safe === "string" ? recommendation.safe : fallback.recommendation.safe,
        risk: typeof recommendation.risk === "string" ? recommendation.risk : fallback.recommendation.risk,
        goals: typeof recommendation.goals === "string" ? recommendation.goals : fallback.recommendation.goals,
      },
      predictedScores,
      confidence: parseNumber(parsed.confidence, fallback.confidence),
    };
  } catch {
    return null;
  }
}

function buildMessages(input: FootballAnalyzerInput): AIMessage[] {
  return [
    {
      role: "system",
      content: [
        "你是一名专业足球数据分析师，也是 Project Athena 的赛事信息分析引擎。",
        "请根据传入的球队近期数据、攻防数据和模型预测结果，输出客观、可解释的比赛分析。",
        "只使用传入信息，不编造伤停、阵容、天气、新闻或其他外部事实。",
        "只输出 JSON，不要 Markdown、隐藏推理过程或供应商说明。",
        "不要输出资金、购买、下注、收益承诺或确定性结论；必须说明数据局限性和比赛不确定性。",
        '{"analysis":[""],"recommendation":{"safe":"","risk":"","goals":""},"predictedScores":[""],"confidence":0}',
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({
        match: { homeTeam: input.homeTeam, awayTeam: input.awayTeam },
        homeTeamStats: input.homeTeamStats,
        awayTeamStats: input.awayTeamStats,
        prediction: input.prediction,
      }),
    },
  ];
}

export async function analyzeFootballMatch(input: FootballAnalyzerInput): Promise<FootballAnalysisResult> {
  const fallback = fallbackAnalysis(input);
  try {
    const result = await requestAI(buildMessages(input), { maxTokens: 1400, timeoutMs: 20_000 });
    if (!result.success) return fallback;

    return parseAnalysis(result.content, fallback) ?? fallback;
  } catch (error) {
    console.error("Football analyzer failed:", error instanceof Error ? error.message : String(error));
    return fallback;
  }
}
