import { getSupabaseServerClient } from "@/lib/supabase/server";

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

export type AnalysisUsage = {
  date: string;
  count: number;
};

export async function getDailyAnalysisUsage(userId: string, date = todayUTC()): Promise<AnalysisUsage> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { date, count: 0 };

  const { data, error } = await supabase
    .from("analysis_usage")
    .select("date,count")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return { date, count: Number(data?.count ?? 0) };
}

export async function incrementDailyAnalysisUsage(userId: string, date = todayUTC()): Promise<AnalysisUsage> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { date, count: 0 };

  const current = await getDailyAnalysisUsage(userId, date);
  const nextCount = current.count + 1;
  const { data, error } = await supabase
    .from("analysis_usage")
    .upsert(
      { user_id: userId, date, count: nextCount },
      { onConflict: "user_id,date" },
    )
    .select("date,count")
    .single();

  if (error) throw new Error(error.message);
  return { date: String(data.date), count: Number(data.count) };
}
