import { NextResponse } from "next/server";
import { runAnalysis } from "@/lib/analysis-engine/engine";
import type { TeamFormSummary } from "@/lib/football/team-form-service";

export const dynamic = "force-dynamic";

type MatchPrediction = { homeWin: number; draw: number; awayWin: number };

type AnalyzeMatchInput = {
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  homeForm: TeamFormSummary;
  awayForm: TeamFormSummary;
  prediction: MatchPrediction;
};

type MatchAnalysis = {
  summary: string;
  recommendation: string;
  confidence: string;
  reasons: string[];
  risks: string[];
  goalsPrediction: string;
  betDirection: string;
};

const SYSTEM_PROMPT = [
  "You are Project Athena's professional football match analysis engine.",
  "Generate a professional pre-match report in Chinese from the supplied team form and rule-model prediction only.",
  "Explain the match trend, the evidence behind the model viewpoint, goal outlook, and data uncertainty. Do not invent injuries, lineups, news, weather, tactics, or facts not supplied.",
  "Return valid JSON only. Do not return Markdown, hidden reasoning, provider commentary, or explanations outside JSON.",
  "Use neutral research language. The betDirection field is a compatibility field and must contain an information-focused attention direction, never a betting, purchase, amount, profit, or guarantee instruction.",
  "confidence must be a human-readable percentage string such as 78%. reasons and risks must contain concise but specific points. goalsPrediction must describe the expected scoring trend using only the supplied data.",
  '{"summary":"","recommendation":"","confidence":"","reasons":[],"risks":[],"goalsPrediction":"","betDirection":""}',
].join("\n");

function stringList(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim().slice(0, 180))
    .slice(0, limit);
}

function textValue(value: unknown, fallback: string, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function normalizeConfidence(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return `${Math.min(100, Math.max(0, Math.round(value)))}%`;
  if (typeof value !== "string") return "数据待补充";
  const cleaned = value.trim();
  const numeric = Number(cleaned.replace(/%/g, ""));
  return Number.isFinite(numeric) ? `${Math.min(100, Math.max(0, Math.round(numeric)))}%` : cleaned.slice(0, 24) || "数据待补充";
}

function parseAnalysis(content: string): MatchAnalysis | null {
  const cleaned = content.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    const value = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    const summary = typeof value.summary === "string" ? value.summary.trim().slice(0, 1000) : "";
    const reasons = stringList(value.reasons, 4);
    const risks = stringList(value.risks, 4);
    if (!summary || !reasons.length || !risks.length) return null;

    const recommendation = textValue(value.recommendation, "模型观点：结合当前数据继续关注比赛走势", 240);
    return {
      summary,
      recommendation,
      confidence: normalizeConfidence(value.confidence),
      reasons,
      risks,
      goalsPrediction: textValue(value.goalsPrediction, "当前进球趋势数据不足，建议结合临场信息观察", 240),
      betDirection: textValue(value.betDirection, recommendation, 240),
    };
  } catch {
    return null;
  }
}

function isAnalyzeMatchInput(value: unknown): value is AnalyzeMatchInput {
  if (typeof value !== "object" || value === null) return false;
  const body = value as Partial<AnalyzeMatchInput>;
  return Boolean(body.homeTeam?.name && body.awayTeam?.name && body.homeForm && body.awayForm && body.prediction);
}

function friendlyStatus(status: number) {
  if (status === 429) return 429;
  if (status === 404 || status === 503) return 503;
  return 502;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "请求参数无效" }, { status: 400 });
  }

  if (!isAnalyzeMatchInput(body)) {
    return NextResponse.json({ success: false, error: "缺少比赛球队、近期数据或预测结果" }, { status: 400 });
  }

  const result = await runAnalysis([
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: JSON.stringify({
        homeTeam: body.homeTeam,
        awayTeam: body.awayTeam,
        homeForm: body.homeForm,
        awayForm: body.awayForm,
        prediction: body.prediction,
      }),
    },
  ], { maxTokens: 1600, timeoutMs: 20_000 });

  if (!result.success) {
    console.error(`[AI analyze-match] DeepSeek failed status=${result.status} code=${result.code}`);
    return NextResponse.json({ success: false, error: "AI分析暂不可用，请稍后重试" }, { status: friendlyStatus(result.status) });
  }

  const analysis = parseAnalysis(result.content);
  if (!analysis) {
    console.error(`[AI analyze-match] invalid JSON model=${result.model}`);
    return NextResponse.json({ success: false, error: "AI分析暂不可用，请稍后重试" }, { status: 502 });
  }

  return NextResponse.json({ success: true, data: analysis, model: result.model });
}
