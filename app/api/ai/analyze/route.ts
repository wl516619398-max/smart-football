import { NextResponse } from "next/server";
import { OPENROUTER_DEFAULT_MODEL } from "@/lib/ai/openrouter";
import { requestAI } from "@/lib/ai/provider";
import { canUseAIAnalysis, getDailyAnalysisLimit, getMembershipLevel } from "@/lib/auth/permissions";
import { getCachedAIAnalysis, upsertCachedAIAnalysis } from "@/lib/db/ai-analyses";
import { getDailyAnalysisUsage, incrementDailyAnalysisUsage } from "@/lib/db/analysis-usage";
import { getProfileById } from "@/lib/db/profiles";
import { getUserProfile } from "@/lib/db/users";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AIAnalysisRequest, AIErrorCode, AthenaAIAnalysis, MatchAnalysisInput } from "@/types/ai";

const UNAVAILABLE_MESSAGE = "AI分析暂不可用，请稍后重试";
const DATA_LIMITATION = "现有数据维度有限，结论仅用于赛事信息参考。";
const SYSTEM_PROMPT = [
  "You are the Project Athena football data analysis engine.",
  "Project Athena is a football data analysis and information interpretation platform.",
  "Return valid JSON only, without Markdown, hidden reasoning, or provider commentary.",
  "Analyze only the supplied MatchAnalysisInput and the optional Athena Prediction. Explain form, head-to-head, standings, attack, defense, injuries, match time, and data uncertainty objectively.",
  "Do not invent injuries, lineups, weather, news, or any other information not supplied.",
  "Do not provide betting amounts, purchase instructions, following or fund advice, profit promises, or guaranteed conclusions.",
  "Use the expressions model viewpoint, attention direction, and for match research reference.",
  `If data is incomplete, include: ${DATA_LIMITATION}`,
  '{"summary":"","prediction":{"homeWin":"","draw":"","awayWin":""},"scorePrediction":[],"riskLevel":"","confidence":0,"score":0,"strengths":[],"risks":[],"recommendation":"","keyFactors":[],"dataLimitations":[]}',
  "summary must be 120 to 250 Chinese characters; strengths max 4; risks max 4; keyFactors max 5; dataLimitations at least 1; scorePrediction max 3; riskLevel must describe data uncertainty; confidence and score are integers from 0 to 100; prediction values are percentage strings.",
].join("\n");

type AnalysisRequest = Partial<AIAnalysisRequest> & {
  force?: boolean;
  time?: string;
  date?: string;
  h2h?: unknown;
  standings?: unknown;
  attackStrength?: unknown;
  defenseStrength?: unknown;
  injuries?: unknown;
};

type AIResponseProvider = "deepseek" | "openrouter" | "mock";

function providerFromModel(model: string | null | undefined): AIResponseProvider {
  const normalized = model?.toLowerCase() ?? "";
  if (normalized === "mock-fallback") return "mock";
  if (normalized.includes("openrouter") || normalized.includes("/")) return "openrouter";
  return "deepseek";
}

function isLegacyFreeModel(model: string | null | undefined) {
  const normalized = model?.trim().toLowerCase() ?? "";
  return normalized.endsWith("/free") && normalized !== OPENROUTER_DEFAULT_MODEL.toLowerCase();
}

function cachedFallbackReason(provider: AIResponseProvider) {
  return provider === "mock" ? "cached_mock_fallback" : null;
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  const sensitiveTerms = [
    "\u5fc5\u4e2d", "\u7a33\u8d62", "\u7a33\u8d5a", "\u5185\u5e55", "\u91cd\u6ce8", "\u68ad\u54c8", "\u8ddf\u5355", "\u4e0b\u6ce8", "\u4ee3\u8d2d", "\u8d2d\u4e70\u91d1\u989d", "\u9884\u671f\u6536\u76ca", "\u76c8\u5229\u7387", "\u56de\u62a5\u7387",
  ];
  return value
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .replace(new RegExp(sensitiveTerms.join("|"), "g"), "数据观点")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanList(value: unknown, maxItems: number) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item, 180)).filter(Boolean).slice(0, maxItems);
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function teamLabel(value: unknown) {
  if (typeof value === "string") return value.trim();
  const name = asRecord(value).name;
  return typeof name === "string" ? name.trim() : "";
}

function normalizePercentage(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return `${clamp(value)}%`;
  if (typeof value !== "string") return "—";
  const cleaned = value.trim();
  const numeric = Number(cleaned.replace(/%/g, ""));
  return Number.isFinite(numeric) ? `${clamp(numeric)}%` : cleanText(cleaned, 12) || "—";
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/%/g, "").trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function fallbackRiskLevel(homeWin: number, draw: number, awayWin: number) {
  const values = [homeWin, draw, awayWin].sort((left, right) => right - left);
  const gap = values[0] - values[1];
  return gap >= 20 ? "低" : gap >= 10 ? "中" : "高";
}

function normalizeAnalysis(value: unknown, generatedAt = new Date().toISOString()): AthenaAIAnalysis | null {
  if (typeof value !== "object" || value === null) return null;
  const parsed = value as Record<string, unknown>;
  let summary = cleanText(parsed.summary, 250);
  if (!summary) return null;
  if (summary.length < 120) summary = `${summary} ${DATA_LIMITATION} 比赛结果仍具有不确定性，请结合后续公开信息理解本次模型观点。`;

  const prediction = asRecord(parsed.prediction);
  const recommendation = cleanText(parsed.recommendation, 180) || "模型观点：结合数据变化持续关注比赛信息。";
  const limitations = cleanList(parsed.dataLimitations, 4);
  if (!limitations.length) limitations.push(DATA_LIMITATION);
  const homeWin = numberValue(prediction.homeWin) ?? 0;
  const draw = numberValue(prediction.draw) ?? 0;
  const awayWin = numberValue(prediction.awayWin) ?? 0;
  const scorePrediction = cleanList(parsed.scorePrediction ?? (Array.isArray(parsed.score) ? parsed.score : []), 3);
  if (!scorePrediction.length) scorePrediction.push("1-1");

  return {
    summary: summary.slice(0, 250),
    prediction: {
      homeWin: normalizePercentage(prediction.homeWin),
      draw: normalizePercentage(prediction.draw),
      awayWin: normalizePercentage(prediction.awayWin),
    },
    strengths: cleanList(parsed.strengths, 4),
    risks: cleanList(parsed.risks, 4),
    recommendation,
    keyFactors: cleanList(parsed.keyFactors, 5),
    dataLimitations: limitations,
    scorePrediction,
    riskLevel: cleanText(parsed.riskLevel, 40) || fallbackRiskLevel(homeWin, draw, awayWin),
    confidence: clamp(numberValue(parsed.confidence) ?? 0),
    score: clamp(numberValue(parsed.score) ?? 0),
    generatedAt,
  };
}

function parseModelResponse(content: string) {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return normalizeAnalysis(JSON.parse(content.slice(start, end + 1)));
  } catch {
    return null;
  }
}

function parseCachedResponse(record: Awaited<ReturnType<typeof getCachedAIAnalysis>>) {
  if (!record) return null;
  let analysis = record.analysis;
  if (typeof analysis === "string") {
    try {
      analysis = JSON.parse(analysis) as unknown;
    } catch {
      return null;
    }
  }
  const generatedAt = record.updated_at || record.created_at;
  const normalized = normalizeAnalysis(analysis, generatedAt);
  if (normalized) return normalized;
  return normalizeAnalysis({
    ...(typeof analysis === "object" && analysis !== null ? analysis : {}),
    summary: record.prediction,
    confidence: record.confidence,
    score: Number(record.score),
  }, generatedAt);
}

function isRequestBody(value: unknown): value is AnalysisRequest {
  return typeof value === "object" && value !== null;
}

function buildMatchAnalysisInput(body: AnalysisRequest): MatchAnalysisInput {
  const metrics = asRecord(body.metrics ?? body.dataMetrics);
  const homeMetrics = asRecord(metrics.home);
  const awayMetrics = asRecord(metrics.away);
  return {
    homeTeam: body.homeTeam ?? {},
    awayTeam: body.awayTeam ?? {},
    league: typeof body.league === "string" ? body.league : "",
    recentForm: body.recentForm ?? {},
    h2h: body.h2h ?? body.headToHead ?? {},
    standings: body.standings ?? {},
    attackStrength: body.attackStrength ?? { home: homeMetrics.attack ?? null, away: awayMetrics.attack ?? null },
    defenseStrength: body.defenseStrength ?? { home: homeMetrics.defense ?? null, away: awayMetrics.defense ?? null },
    injuries: body.injuries ?? [],
    matchTime: body.matchTime ?? body.time ?? body.date ?? "",
  };
}

function createMockAnalysis(body: AnalysisRequest, input: MatchAnalysisInput): AthenaAIAnalysis {
  const homeTeam = teamLabel(input.homeTeam) || "主队";
  const awayTeam = teamLabel(input.awayTeam) || "客队";
  const homeWin = clamp(numberValue(body.homeWin ?? body.probabilities?.homeWin) ?? 40);
  const draw = clamp(numberValue(body.draw ?? body.probabilities?.draw) ?? 28);
  const awayWin = clamp(numberValue(body.awayWin ?? body.probabilities?.awayWin) ?? Math.max(0, 100 - homeWin - draw));
  const leader = homeWin >= awayWin && homeWin >= draw ? homeTeam : awayTeam;
  const riskLevel = fallbackRiskLevel(homeWin, draw, awayWin);

  return {
    summary: `${homeTeam}与${awayTeam}的模型估算显示，${leader}在当前输入数据下略占优势。分析综合参考联赛、近期状态、攻防指标和已有概率数据，暂未纳入未传入的阵容、伤停与临场信息。现有数据维度有限，结论仅用于赛事信息参考，比赛结果仍具有不确定性。`,
    prediction: { homeWin: `${homeWin}%`, draw: `${draw}%`, awayWin: `${awayWin}%` },
    scorePrediction: homeWin >= awayWin ? ["2-1", "1-1"] : ["1-2", "1-1"],
    riskLevel,
    confidence: Math.max(homeWin, draw, awayWin),
    score: Math.round((homeWin + awayWin + (100 - Math.abs(homeWin - awayWin))) / 3),
    strengths: [`${leader}的当前模型概率相对更高`, "已有比赛概率数据可用于基础对比"],
    risks: ["临场阵容和伤停信息未完整提供", "单场比赛存在较大结果波动"],
    recommendation: `模型观点：关注${leader}的比赛表现，仅供赛事研究参考。`,
    keyFactors: ["近期状态", "攻防指标", "联赛环境", "数据一致性"],
    dataLimitations: [DATA_LIMITATION, "未提供完整的实时阵容与临场信息。"],
    generatedAt: new Date().toISOString(),
  };
}

function errorResponse(code: AIErrorCode, status: number, retryAfter = 0) {
  return NextResponse.json({ success: false, error: { code, message: UNAVAILABLE_MESSAGE, retryAfter } }, { status });
}

async function getRefreshInput(externalId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("matches")
    .select("external_id,league,home_team,away_team,match_time,home_win,draw,away_win")
    .eq("external_id", externalId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    external_id: data.external_id,
    matchId: data.external_id,
    homeTeam: { name: data.home_team },
    awayTeam: { name: data.away_team },
    league: data.league ?? "",
    matchTime: data.match_time ?? "",
    homeWin: data.home_win,
    draw: data.draw,
    awayWin: data.away_win,
    probabilities: { homeWin: data.home_win, draw: data.draw, awayWin: data.away_win },
  };
}

type PermissionContext = { userId: string | null; membershipLevel: ReturnType<typeof getMembershipLevel> };
type UsageView = { limit: number | null; used: number; remaining: number | null };

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

async function getPermissionContext(request: Request): Promise<PermissionContext> {
  const supabase = getSupabaseServerClient();
  const token = getBearerToken(request);
  if (!supabase || !token) return { userId: null, membershipLevel: "free" };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { userId: null, membershipLevel: "free" };

  try {
    const profile = await getProfileById(data.user.id);
    if (profile) return { userId: data.user.id, membershipLevel: getMembershipLevel(profile) };
  } catch {
    // Fall through to the legacy profile table for existing users.
  }

  try {
    const profile = await getUserProfile(data.user.id);
    return { userId: data.user.id, membershipLevel: getMembershipLevel(profile) };
  } catch {
    return { userId: data.user.id, membershipLevel: "free" };
  }
}

async function getUsageView(context: PermissionContext): Promise<UsageView> {
  const limit = getDailyAnalysisLimit({ membership_level: context.membershipLevel });
  if (limit === null || !context.userId) return { limit, used: 0, remaining: null };
  const usage = await getDailyAnalysisUsage(context.userId);
  return { limit, used: usage.count, remaining: Math.max(limit - usage.count, 0) };
}

export async function GET(request: Request) {
  const externalId = new URL(request.url).searchParams.get("external_id")?.trim();
  if (!externalId) return errorResponse("AI_REQUEST_FAILED", 400);
  const refresh = new URL(request.url).searchParams.get("refresh") === "true";
  if (refresh) {
    const input = await getRefreshInput(externalId);
    if (!input) return errorResponse("AI_REQUEST_FAILED", 404);

    const headers = new Headers(request.headers);
    headers.set("content-type", "application/json");
    return POST(new Request(request.url, { method: "POST", headers, body: JSON.stringify({ ...input, force: true }) }));
  }

  const cached = await getCachedAIAnalysis(externalId);
  const cacheToRead = isLegacyFreeModel(cached?.model) ? null : cached;
  const data = parseCachedResponse(cacheToRead);
  const usage = await getUsageView(await getPermissionContext(request));
  const provider = data ? providerFromModel(cacheToRead?.model) : "mock";
  console.info(`AI Provider: ${data ? `${provider} cache` : "Mock fallback"}`);
  return NextResponse.json({ success: true, data, model: data ? cacheToRead?.model ?? "" : "", provider, fallbackReason: cachedFallbackReason(provider), usage }, { status: 200 });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("AI_REQUEST_FAILED", 400);
  }

  if (!isRequestBody(body)
    || (typeof body.external_id !== "string" && typeof body.matchId !== "string")
    || !(body.external_id ?? body.matchId)?.trim()
    || !teamLabel(body.homeTeam)
    || !teamLabel(body.awayTeam)) {
    return errorResponse("AI_REQUEST_FAILED", 400);
  }

  const externalId = (body.external_id ?? body.matchId)!.trim();
  const refresh = new URL(request.url).searchParams.get("refresh") === "true";
  const bypassCache = refresh || body.force === true;

  if (!bypassCache) {
    const cached = await getCachedAIAnalysis(externalId);
    const cacheToRead = isLegacyFreeModel(cached?.model) ? null : cached;
    const cachedData = parseCachedResponse(cacheToRead);
    if (cachedData) {
      const usage = await getUsageView(await getPermissionContext(request));
      const provider = providerFromModel(cacheToRead?.model);
      console.info(`AI Provider: ${provider} cache`);
      return NextResponse.json({ success: true, data: cachedData, model: cacheToRead?.model ?? "", provider, fallbackReason: cachedFallbackReason(provider), usage }, { status: 200 });
    }
  }

  if (refresh) console.info(`AI Provider: refresh requested external_id=${externalId}`);

  try {
    const permissionContext = await getPermissionContext(request);
    const usageBefore = await getUsageView(permissionContext);
    if (!canUseAIAnalysis({ membership_level: permissionContext.membershipLevel }, usageBefore.used)) {
      return NextResponse.json({ error: "今日免费分析次数已用完", upgrade: true, usage: usageBefore }, { status: 429 });
    }

    const analysisInput = buildMatchAnalysisInput(body);
    console.info(`[Athena AI config] AI_PROVIDER: ${process.env.AI_PROVIDER?.trim() || "deepseek"} hasDeepSeekKey: ${Boolean(process.env.DEEPSEEK_API_KEY?.trim())} deepSeekModel: ${process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat"} hasOpenRouterKey: ${Boolean(process.env.OPENROUTER_API_KEY?.trim())}`);
    const result = await requestAI([
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          matchId: externalId,
          external_id: externalId,
          homeWin: body.homeWin ?? body.probabilities?.homeWin ?? null,
          draw: body.draw ?? body.probabilities?.draw ?? null,
          awayWin: body.awayWin ?? body.probabilities?.awayWin ?? null,
          ...analysisInput,
          prediction: body.prediction ?? null,
        }),
      },
    ], { maxTokens: 3000, timeoutMs: 30_000 });

    if (!result.success) {
      console.info("AI Provider: DeepSeek fallback");
      console.error(`[Athena AI] provider failed model=${result.model} status=${result.status}; using mock fallback`);
      return NextResponse.json({ success: true, data: createMockAnalysis(body, analysisInput), model: "mock-fallback", provider: "mock", fallbackReason: `provider_failed_${result.code.toLowerCase()}`, usage: usageBefore }, { status: 200 });
    }
    console.info(result.provider === "deepseek" ? "AI Provider: DeepSeek success" : "AI Provider: OpenRouter fallback success");
    const data = parseModelResponse(result.content);
    if (!data) {
      console.info("AI Provider: DeepSeek fallback");
      console.error(`[Athena AI] invalid provider JSON model=${result.model}; using mock fallback`);
      return NextResponse.json({ success: true, data: createMockAnalysis(body, analysisInput), model: "mock-fallback", provider: "mock", fallbackReason: "provider_invalid_json", usage: usageBefore }, { status: 200 });
    }

    try {
      await upsertCachedAIAnalysis({ externalId, data, model: result.model });
    } catch (error) {
      console.error(`[AI cache] write failed error=${error instanceof Error ? error.message : "database write failed"}`);
    }

    let usage = usageBefore;
    if (permissionContext.userId && usageBefore.limit !== null) {
      try {
        const updatedUsage = await incrementDailyAnalysisUsage(permissionContext.userId);
        usage = { ...usageBefore, used: updatedUsage.count, remaining: Math.max(usageBefore.limit - updatedUsage.count, 0) };
      } catch (error) {
        console.error(`[AI usage] write failed error=${error instanceof Error ? error.message : "database write failed"}`);
      }
    }

    const provider = result.provider ?? "deepseek";
    return NextResponse.json({ success: true, data, model: result.model, provider, fallbackReason: result.fallback ? "deepseek_provider_failed" : null, usage }, { status: 200 });
  } catch (error) {
    console.error(`[Athena AI] status=internal-error error=${error instanceof Error ? error.message : "request failed"}`);
    return errorResponse("AI_REQUEST_FAILED", 500);
  }
}
