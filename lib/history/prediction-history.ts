import fallbackHistory from "@/data/prediction-history.json";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type PredictionHistoryRecord = {
  match_id: string;
  home_team: string;
  away_team: string;
  prediction: string;
  confidence: number;
  odds_value: number;
  final_result: string | null;
  created_at: string;
};

export type PredictionHistorySummary = {
  totalPredictions: number;
  hitCount: number;
  hitRate: number;
  recent30: {
    total: number;
    hitCount: number;
    hitRate: number;
  };
};

type StoredHistoryRow = Partial<PredictionHistoryRecord> & {
  external_id?: string | null;
  analysis?: unknown;
  result?: string | null;
};

let localHistory: PredictionHistoryRecord[] = fallbackHistory as PredictionHistoryRecord[];

function isHit(value: string | null | undefined) {
  return ["hit", "correct", "win", "命中", "正确"].includes((value ?? "").trim().toLowerCase());
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function analysisMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const history = record.predictionHistory;
  return history && typeof history === "object" && !Array.isArray(history) ? history as Record<string, unknown> : {};
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
    final_result: row.final_result ?? row.result ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function sortByCreatedAt(records: PredictionHistoryRecord[]) {
  return [...records].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function getPredictionHistory(limit = 100): Promise<PredictionHistoryRecord[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("prediction_history")
        .select("match_id,home_team,away_team,prediction,confidence,odds_value,final_result,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data?.length) return data as PredictionHistoryRecord[];
      if (error) console.error("Prediction history read failed:", error.message);
    } catch (error) {
      console.error("Prediction history read failed:", error instanceof Error ? error.message : String(error));
    }
  }

  return sortByCreatedAt(localHistory).slice(0, limit);
}

export async function savePredictionHistory(input: Omit<PredictionHistoryRecord, "created_at" | "final_result"> & { final_result?: string | null; created_at?: string }) {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from("prediction_history")
        .select("final_result")
        .eq("match_id", input.match_id)
        .maybeSingle();
      const record: PredictionHistoryRecord = {
        ...input,
        final_result: input.final_result ?? existing?.final_result ?? null,
        created_at: input.created_at ?? new Date().toISOString(),
      };
      const { error } = await supabase
        .from("prediction_history")
        .upsert(record, { onConflict: "match_id" });
      if (!error) {
        localHistory = sortByCreatedAt([record, ...localHistory.filter((item) => item.match_id !== record.match_id)]);
        return record;
      }
      console.error("Prediction history save failed:", error.message);
    } catch (error) {
      console.error("Prediction history save failed:", error instanceof Error ? error.message : String(error));
    }
  }

  const existing = localHistory.find((item) => item.match_id === input.match_id);
  const record: PredictionHistoryRecord = {
    ...input,
    final_result: input.final_result ?? existing?.final_result ?? null,
    created_at: input.created_at ?? new Date().toISOString(),
  };
  localHistory = sortByCreatedAt([record, ...localHistory.filter((item) => item.match_id !== record.match_id)]);
  return record;
}

export function summarizePredictionHistory(records: PredictionHistoryRecord[]): PredictionHistorySummary {
  const recent = records.slice(0, 30);
  const hitCount = records.filter((record) => isHit(record.final_result)).length;
  const recentHitCount = recent.filter((record) => isHit(record.final_result)).length;
  return {
    totalPredictions: records.length,
    hitCount,
    hitRate: records.length ? Number(((hitCount / records.length) * 100).toFixed(1)) : 0,
    recent30: {
      total: recent.length,
      hitCount: recentHitCount,
      hitRate: recent.length ? Number(((recentHitCount / recent.length) * 100).toFixed(1)) : 0,
    },
  };
}

export async function getPredictionHistorySummary() {
  return summarizePredictionHistory(await getPredictionHistory());
}
