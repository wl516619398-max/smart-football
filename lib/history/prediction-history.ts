import fallbackHistory from "@/data/prediction-history.json";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ScoreProbabilityRecord = { score: string; probability: number };

export type PredictionHistoryRecord = {
  match_id: string;
  home_team: string;
  away_team: string;
  prediction: string;
  confidence: number;
  odds_value: number;
  match_time: string | null;
  home_win_probability: number | null;
  draw_probability: number | null;
  away_win_probability: number | null;
  score_probabilities: ScoreProbabilityRecord[];
  goals_prediction: string | null;
  risk_level: string | null;
  final_result: string | null;
  actual_score: string | null;
  actual_result: string | null;
  prediction_hit: boolean | null;
  goals_prediction_hit: boolean | null;
  score_top3_hit: boolean | null;
  created_at: string;
};

type OptionalHistoryFields =
  | "created_at"
  | "match_time"
  | "home_win_probability"
  | "draw_probability"
  | "away_win_probability"
  | "score_probabilities"
  | "goals_prediction"
  | "risk_level"
  | "final_result"
  | "actual_score"
  | "actual_result"
  | "prediction_hit"
  | "goals_prediction_hit"
  | "score_top3_hit";

export type PredictionHistoryInput = Omit<PredictionHistoryRecord, OptionalHistoryFields> &
  Partial<Pick<PredictionHistoryRecord, OptionalHistoryFields>>;

export type PredictionHistorySummary = {
  totalPredictions: number;
  hitCount: number;
  hitRate: number;
  directionHitRate: number;
  goalsHitRate: number;
  scoreTop3HitRate: number;
  recent30: { total: number; hitCount: number; hitRate: number };
};

type StoredHistoryRow = Partial<PredictionHistoryRecord> & {
  external_id?: string | null;
  analysis?: unknown;
  result?: string | null;
};

function numberValue(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function numberValueOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function analysisMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const history = (value as Record<string, unknown>).predictionHistory;
  return history && typeof history === "object" && !Array.isArray(history) ? history as Record<string, unknown> : {};
}

function isScoreProbability(value: unknown): value is ScoreProbabilityRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.score === "string" && Number.isFinite(Number(item.probability));
}

function normalizeRow(row: StoredHistoryRow): PredictionHistoryRecord | null {
  if (!row.match_id && !row.external_id) return null;
  const metadata = analysisMetadata(row.analysis);
  return {
    match_id: String(row.match_id ?? row.external_id),
    home_team: String(row.home_team ?? metadata.home_team ?? "主队"),
    away_team: String(row.away_team ?? metadata.away_team ?? "客队"),
    prediction: String(row.prediction ?? "数据观点"),
    confidence: numberValue(row.confidence),
    odds_value: numberValue(row.odds_value ?? metadata.odds_value),
    match_time: typeof row.match_time === "string" ? row.match_time : null,
    home_win_probability: numberValueOrNull(row.home_win_probability),
    draw_probability: numberValueOrNull(row.draw_probability),
    away_win_probability: numberValueOrNull(row.away_win_probability),
    score_probabilities: Array.isArray(row.score_probabilities) ? row.score_probabilities.filter(isScoreProbability) : [],
    goals_prediction: typeof row.goals_prediction === "string" ? row.goals_prediction : null,
    risk_level: typeof row.risk_level === "string" ? row.risk_level : null,
    final_result: row.final_result ?? row.result ?? null,
    actual_score: typeof row.actual_score === "string" ? row.actual_score : null,
    actual_result: typeof row.actual_result === "string" ? row.actual_result : null,
    prediction_hit: typeof row.prediction_hit === "boolean" ? row.prediction_hit : null,
    goals_prediction_hit: typeof row.goals_prediction_hit === "boolean" ? row.goals_prediction_hit : null,
    score_top3_hit: typeof row.score_top3_hit === "boolean" ? row.score_top3_hit : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

let localHistory: PredictionHistoryRecord[] = (fallbackHistory as unknown[])
  .map((row) => normalizeRow(row as StoredHistoryRow))
  .filter((row): row is PredictionHistoryRecord => Boolean(row));

function isHit(value: string | null | undefined) {
  return ["hit", "correct", "win", "命中", "正确"].includes((value ?? "").trim().toLowerCase());
}

function sortByCreatedAt(records: PredictionHistoryRecord[]) {
  return [...records].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function getPredictionHistory(limit = 100): Promise<PredictionHistoryRecord[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const expanded = await supabase
        .from("prediction_history")
        .select("match_id,home_team,away_team,prediction,confidence,odds_value,match_time,home_win_probability,draw_probability,away_win_probability,score_probabilities,goals_prediction,risk_level,final_result,actual_score,actual_result,prediction_hit,goals_prediction_hit,score_top3_hit,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      const result = expanded.error
        ? await supabase.from("prediction_history").select("match_id,home_team,away_team,prediction,confidence,created_at").order("created_at", { ascending: false }).limit(limit)
        : expanded;
      if (!result.error && result.data?.length) {
        return result.data.map((row) => normalizeRow(row as StoredHistoryRow)).filter((row): row is PredictionHistoryRecord => Boolean(row));
      }
      if (result.error) console.error("Prediction history read failed:", result.error.message);
    } catch (error) {
      console.error("Prediction history read failed:", error instanceof Error ? error.message : String(error));
    }
  }
  return sortByCreatedAt(localHistory).slice(0, limit);
}

export async function savePredictionHistory(input: PredictionHistoryInput) {
  const supabase = getSupabaseServerClient();
  const existing = localHistory.find((item) => item.match_id === input.match_id);
  const record: PredictionHistoryRecord = {
    ...input,
    match_time: input.match_time ?? existing?.match_time ?? null,
    home_win_probability: input.home_win_probability ?? existing?.home_win_probability ?? null,
    draw_probability: input.draw_probability ?? existing?.draw_probability ?? null,
    away_win_probability: input.away_win_probability ?? existing?.away_win_probability ?? null,
    score_probabilities: input.score_probabilities ?? existing?.score_probabilities ?? [],
    goals_prediction: input.goals_prediction ?? existing?.goals_prediction ?? null,
    risk_level: input.risk_level ?? existing?.risk_level ?? null,
    final_result: input.final_result ?? existing?.final_result ?? null,
    actual_score: input.actual_score ?? existing?.actual_score ?? null,
    actual_result: input.actual_result ?? existing?.actual_result ?? null,
    prediction_hit: input.prediction_hit ?? existing?.prediction_hit ?? null,
    goals_prediction_hit: input.goals_prediction_hit ?? existing?.goals_prediction_hit ?? null,
    score_top3_hit: input.score_top3_hit ?? existing?.score_top3_hit ?? null,
    created_at: input.created_at ?? existing?.created_at ?? new Date().toISOString(),
  };

  if (supabase) {
    try {
      const databaseRecord = { ...record };
      const expanded = await supabase.from("prediction_history").upsert(databaseRecord, { onConflict: "match_id" });
      const result = expanded.error
        ? await supabase.from("prediction_history").upsert({ match_id: record.match_id, home_team: record.home_team, away_team: record.away_team, prediction: record.prediction, confidence: record.confidence, created_at: record.created_at }, { onConflict: "match_id" })
        : expanded;
      if (result.error) console.error("Prediction history save failed:", result.error.message);
      else {
        localHistory = sortByCreatedAt([record, ...localHistory.filter((item) => item.match_id !== record.match_id)]);
        return record;
      }
    } catch (error) {
      console.error("Prediction history save failed:", error instanceof Error ? error.message : String(error));
    }
  }

  localHistory = sortByCreatedAt([record, ...localHistory.filter((item) => item.match_id !== record.match_id)]);
  return record;
}

export async function updatePredictionHistoryResult(input: { match_id: string; actual_score: string; actual_result: string; prediction_hit: boolean; goals_prediction_hit?: boolean; score_top3_hit?: boolean }) {
  const updates = { actual_score: input.actual_score, actual_result: input.actual_result, final_result: input.prediction_hit ? "hit" : "miss", prediction_hit: input.prediction_hit, goals_prediction_hit: input.goals_prediction_hit ?? null, score_top3_hit: input.score_top3_hit ?? null };
  const current = localHistory.find((record) => record.match_id === input.match_id);
  if (current) localHistory = localHistory.map((record) => record.match_id === input.match_id ? { ...record, ...updates } : record);
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from("prediction_history").update(updates).eq("match_id", input.match_id);
    if (error) console.error("Prediction history result update failed:", error.message);
  }
}

function hitRate(values: boolean[]) {
  return values.length ? Number(((values.filter(Boolean).length / values.length) * 100).toFixed(1)) : 0;
}

export function summarizePredictionHistory(records: PredictionHistoryRecord[]): PredictionHistorySummary {
  const recent = records.slice(0, 30);
  const hitCount = records.filter((record) => isHit(record.final_result) || record.prediction_hit === true).length;
  const recentHitCount = recent.filter((record) => isHit(record.final_result) || record.prediction_hit === true).length;
  const directionRecords = records.filter((record) => record.prediction_hit !== null || record.final_result !== null);
  const goalsRecords = records.filter((record) => record.goals_prediction_hit !== null);
  const scoreRecords = records.filter((record) => record.score_top3_hit !== null);
  return {
    totalPredictions: records.length,
    hitCount,
    hitRate: hitRate(directionRecords.map((record) => record.prediction_hit ?? isHit(record.final_result))),
    directionHitRate: hitRate(directionRecords.map((record) => record.prediction_hit ?? isHit(record.final_result))),
    goalsHitRate: hitRate(goalsRecords.map((record) => record.goals_prediction_hit === true)),
    scoreTop3HitRate: hitRate(scoreRecords.map((record) => record.score_top3_hit === true)),
    recent30: { total: recent.length, hitCount: recentHitCount, hitRate: hitRate(recent.filter((record) => record.prediction_hit !== null || record.final_result !== null).map((record) => record.prediction_hit ?? isHit(record.final_result))) },
  };
}

export async function getPredictionHistorySummary() {
  return summarizePredictionHistory(await getPredictionHistory());
}
