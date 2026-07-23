import type { SupabaseClient } from "@supabase/supabase-js";
import { requestAI, type AIMessage } from "@/lib/ai/provider";
import type { FootballMatch } from "@/lib/football/types";
import { decodeUnicodeDeep } from "@/lib/utils/decode-unicode";

export type SyncedMatchAnalysisInput = {
  matchId: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  recentForm: {
    home: unknown[];
    away: unknown[];
  };
  stats: {
    home: unknown;
    away: unknown;
  };
};

export type SyncedMatchAnalysisResult = {
  prediction: {
    homeWin: number;
    draw: number;
    awayWin: number;
    recommendation: string;
  };
  confidence: number;
  summary: string;
  key_factors: string[];
  risk_factors: string[];
  provider: string;
  model: string;
  fallback: boolean;
};

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return typeof value === "object" && value !== null ? value as RecordValue : null;
}

function clamp(value: number, fallback = 0) {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/%/g, "")) : NaN;
  return clamp(parsed, fallback);
}

function readText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const list = value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, 5);
  return list.length ? list : fallback;
}

function normalizeProbabilities(probabilities: SyncedMatchAnalysisInput["probabilities"]) {
  const values = [probabilities.homeWin, probabilities.draw, probabilities.awayWin].map((value) => Math.max(0, Number(value) || 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return { homeWin: 33, draw: 34, awayWin: 33 };
  const rounded = values.map((value) => Math.round((value / total) * 100));
  rounded[2] += 100 - rounded.reduce((sum, value) => sum + value, 0);
  return { homeWin: rounded[0], draw: rounded[1], awayWin: rounded[2] };
}

function recommendation(probabilities: SyncedMatchAnalysisInput["probabilities"]) {
  const normalized = normalizeProbabilities(probabilities);
  if (normalized.homeWin >= normalized.draw && normalized.homeWin >= normalized.awayWin) return "主队方向";
  if (normalized.awayWin >= normalized.homeWin && normalized.awayWin >= normalized.draw) return "客队方向";
  return "平局方向";
}

function fallbackResult(input: SyncedMatchAnalysisInput, reason = "AI服务暂不可用") : SyncedMatchAnalysisResult {
  const probabilities = normalizeProbabilities(input.probabilities);
  const recommendationText = recommendation(probabilities);
  return {
    prediction: { ...probabilities, recommendation: recommendationText },
    confidence: clamp(Math.max(probabilities.homeWin, probabilities.draw, probabilities.awayWin), 50),
    summary: `${input.league}的${input.homeTeam}对阵${input.awayTeam}，当前模型基于已同步的胜平负概率、近期状态和基础攻防统计生成赛前观点。${recommendationText}的概率相对更高，但现有数据维度和比赛临场信息仍可能不完整，结论仅作为赛事信息参考。`,
    key_factors: [
      `胜平负概率：主队${probabilities.homeWin}%、平局${probabilities.draw}%、客队${probabilities.awayWin}%`,
      "近期状态与基础攻防数据已纳入当前判断",
      "主客场环境可能影响比赛节奏",
    ],
    risk_factors: [reason, "首发、伤停和临场战术信息可能不完整", "足球比赛结果具有不确定性"],
    provider: "mock",
    model: "sync-fallback",
    fallback: true,
  };
}

function buildMessages(input: SyncedMatchAnalysisInput): AIMessage[] {
  return [
    {
      role: "system",
      content: [
        "你是 Athena AI 足球赛事数据分析助手。",
        "只根据用户提供的 JSON 进行客观赛事信息分析，不编造伤停、阵容、新闻、赔率或历史数据。",
        "必须返回 JSON，不要 Markdown 代码块，不要输出解释过程。",
        "prediction.homeWin、prediction.draw、prediction.awayWin 使用 0-100 整数；confidence 使用 0-100 整数。",
        "summary 使用中文，控制在 120-250 字；key_factors 最多5条；risk_factors 最多5条。",
        "不得提供购买、下注、资金或收益建议，必须说明数据局限性和比赛不确定性。",
        "JSON格式：{prediction:{homeWin:number,draw:number,awayWin:number,recommendation:string},confidence:number,summary:string,key_factors:string[],risk_factors:string[]}",
      ].join("\n"),
    },
    { role: "user", content: JSON.stringify(input) },
  ];
}

function parseResult(content: string, input: SyncedMatchAnalysisInput, provider: string, model: string): SyncedMatchAnalysisResult | null {
  const cleaned = content.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    const parsed = asRecord(JSON.parse(cleaned.slice(start, end + 1)));
    const prediction = asRecord(parsed?.prediction);
    if (!parsed || !prediction) return null;
    const probabilities = normalizeProbabilities({
      homeWin: readNumber(prediction.homeWin, input.probabilities.homeWin),
      draw: readNumber(prediction.draw, input.probabilities.draw),
      awayWin: readNumber(prediction.awayWin, input.probabilities.awayWin),
    });
    return {
      prediction: {
        ...probabilities,
        recommendation: readText(prediction.recommendation, recommendation(probabilities)),
      },
      confidence: readNumber(parsed.confidence, Math.max(probabilities.homeWin, probabilities.draw, probabilities.awayWin)),
      summary: readText(parsed.summary, fallbackResult(input).summary),
      key_factors: readList(parsed.key_factors, fallbackResult(input).key_factors),
      risk_factors: readList(parsed.risk_factors, fallbackResult(input).risk_factors),
      provider,
      model,
      fallback: false,
    };
  } catch {
    return null;
  }
}

export async function generateSyncedMatchAnalysis(input: SyncedMatchAnalysisInput) {
  const normalizedInput = decodeUnicodeDeep(input);
  try {
    const result = await requestAI(buildMessages(normalizedInput), { maxTokens: 1400, timeoutMs: 25_000 });
    if (result.success) {
      const parsed = parseResult(result.content, normalizedInput, result.provider ?? "unknown", result.model);
      if (parsed) return parsed;
      console.error(`[sync-analysis] invalid AI JSON model=${result.model}`);
    } else {
      console.error(`[sync-analysis] provider failed status=${result.status} model=${result.model}`);
    }
  } catch (error) {
    console.error("[sync-analysis] generation failed:", error instanceof Error ? error.message : String(error));
  }
  return fallbackResult(normalizedInput);
}

export async function generateAndSaveSyncedMatchAnalysis(
  supabase: SupabaseClient,
  match: FootballMatch,
  row: { home_win: number | null; draw: number | null; away_win: number | null; ai_score: number | null },
) {
  const input: SyncedMatchAnalysisInput = {
    matchId: match.id,
    league: match.league,
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    probabilities: {
      homeWin: row.home_win ?? match.odds.homeWin,
      draw: row.draw ?? match.odds.draw,
      awayWin: row.away_win ?? match.odds.awayWin,
    },
    recentForm: {
      home: match.stats.home.recentMatches,
      away: match.stats.away.recentMatches,
    },
    stats: { home: match.stats.home, away: match.stats.away },
  };
  const result = await generateSyncedMatchAnalysis(input);
  const now = new Date().toISOString();
  const analysis = decodeUnicodeDeep({ ...result, generatedAt: now });
  const { data, error } = await supabase
    .from("ai_match_analysis")
    .upsert({
      match_id: match.id,
      analysis_version: "v1",
      version: "v1",
      status: result.fallback ? "fallback" : "completed",
      summary: result.summary,
      match_trend: result.summary,
      home_analysis: `${match.homeTeam.name}：已纳入当前同步的近期状态和基础统计。`,
      away_analysis: `${match.awayTeam.name}：已纳入当前同步的近期状态和基础统计。`,
      half_prediction: "半场走势需结合更完整的比赛阶段数据判断。",
      score_prediction: "当前同步流程暂保存胜平负模型观点，比分数据待后续补充。",
      goal_prediction: "进球趋势需结合更完整的xG和技术统计。",
      risk_warning: result.risk_factors.join("；"),
      confidence: result.confidence,
      confidence_score: result.confidence,
      prediction: result.prediction,
      key_factors: result.key_factors,
      risk_factors: result.risk_factors,
      analysis,
      updated_at: now,
    }, { onConflict: "match_id" })
    .select("match_id,status,version,confidence_score,updated_at")
    .single();
  if (error) throw new Error(error.message);
  return { row: data, result };
}

type SyncedMatchRow = {
  external_id: string;
  home_win: number | null;
  draw: number | null;
  away_win: number | null;
  ai_score: number | null;
};

export async function generateAndSaveFeaturedMatchAnalyses(
  supabase: SupabaseClient,
  matches: FootballMatch[],
  rows: SyncedMatchRow[],
) {
  const rowById = new Map(rows.map((row) => [row.external_id, row]));
  const results = await Promise.allSettled(
    matches.slice(0, 3).map((match) => {
      const row = rowById.get(match.id);
      if (!row) return Promise.reject(new Error(`Missing synced row for ${match.id}`));
      return generateAndSaveSyncedMatchAnalysis(supabase, match, row);
    }),
  );
  const failed = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
  failed.forEach((result) => console.error("[sync-analysis] save failed:", result.reason instanceof Error ? result.reason.message : String(result.reason)));
  return { generated: results.length - failed.length, failed: failed.length };
}
