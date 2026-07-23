import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AiMatchAnalysis, AiMatchAnalysisRow } from "@/types/ai-match-analysis";
import { decodeUnicodeDeep } from "@/lib/utils/decode-unicode";

type AiMatchAnalysisUpsert = Omit<
  AiMatchAnalysisRow,
  "id" | "created_at" | "updated_at" | "head_to_head_analysis" | "key_player_analysis" | "report_level"
>;

export async function getAiMatchAnalysis(matchId: string): Promise<AiMatchAnalysisRow | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("ai_match_analysis")
    .select("*")
    .eq("match_id", matchId)
    .maybeSingle();

  if (error) {
    console.error(`[AI match analysis] read failed error=${error.message}`);
    return null;
  }

  return data ? decodeUnicodeDeep(data as AiMatchAnalysisRow) : null;
}

export async function upsertAiMatchAnalysis(input: AiMatchAnalysisUpsert) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("ai_match_analysis")
    .upsert({ ...input, updated_at: now }, { onConflict: "match_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return decodeUnicodeDeep(data as AiMatchAnalysis);
}
