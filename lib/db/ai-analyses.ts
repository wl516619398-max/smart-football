import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AthenaAIAnalysis } from "@/types/ai";

export type StoredAIAnalysis = {
  external_id: string;
  match_id?: string | null;
  prediction: string;
  confidence: number;
  score: string;
  analysis: unknown;
  model: string | null;
  created_at: string;
  updated_at: string;
};

export async function getCachedAIAnalysis(externalId: string): Promise<StoredAIAnalysis | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("predictions")
    .select("external_id,prediction,confidence,score,analysis,model,created_at,updated_at")
    .eq("external_id", externalId)
    .maybeSingle();

  if (error) {
    console.error(`[AI cache] read failed error=${error.message}`);
    return null;
  }
  return (data as StoredAIAnalysis | null) ?? null;
}

export async function upsertCachedAIAnalysis(input: {
  externalId: string;
  data: AthenaAIAnalysis;
  model: string;
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return false;

  const payload = {
    external_id: input.externalId,
    prediction: input.data.summary,
    confidence: input.data.confidence,
    score: String(input.data.score),
    analysis: input.data,
    model: input.model,
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabase
    .from("predictions")
    .upsert(payload, { onConflict: "external_id" });

  // Deployments created from earlier schemas may require a legacy match
  // identifier column. Retry only when Postgres explicitly reports that
  // column's NOT NULL constraint, never merely because its name appears in an
  // informational schema-cache error.
  const requiredLegacyColumn = error?.message.match(/null value in column "(match_name|match_id)"/i)?.[1]?.toLowerCase();
  if (error && requiredLegacyColumn) {
    ({ error } = await supabase
      .from("predictions")
      .upsert({ ...payload, [requiredLegacyColumn]: input.externalId }, { onConflict: "external_id" }));
  }

  if (error) throw new Error(error.message);
  return true;
}
