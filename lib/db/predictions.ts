import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { PredictionRecord, PredictionRecordInput } from "@/lib/db/types";

export async function createPredictionRecord(input: PredictionRecordInput): Promise<PredictionRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("predictions")
    .upsert({
      external_id: input.externalId ?? input.matchId,
      user_id: input.userId,
      match_id: input.matchId,
      prediction: input.prediction,
      confidence: input.confidence,
      score: input.score,
      result: input.result ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "external_id" })
    .select("external_id,user_id,match_id,prediction,confidence,score,analysis,model,result,created_at,updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data as PredictionRecord;
}

export async function getPredictionRecords(userId: string, matchId?: string): Promise<PredictionRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  let query = supabase
    .from("predictions")
    .select("external_id,user_id,match_id,prediction,confidence,score,analysis,model,result,created_at,updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (matchId) query = query.eq("match_id", matchId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as PredictionRecord[];
}
