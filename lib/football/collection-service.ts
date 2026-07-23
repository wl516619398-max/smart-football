import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CollectionCounts = {
  matches: number;
  teams: number;
  team_statistics: number;
  odds: number;
  match_history: number;
  collection_logs: number;
};

export type CollectionSnapshot = {
  counts: CollectionCounts;
  matches: unknown[];
  teams: unknown[];
  odds: unknown[];
};

async function countRows(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, table: keyof CollectionCounts) {
  const result = await supabase.from(table).select("*", { count: "exact", head: true });
  if (result.error) throw result.error;
  return result.count ?? 0;
}

export async function getCollectionSnapshot(): Promise<CollectionSnapshot | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const tables: (keyof CollectionCounts)[] = ["matches", "teams", "team_statistics", "odds", "match_history", "collection_logs"];
  const counts = await Promise.all(tables.map((table) => countRows(supabase, table)));
  const [matches, teams, odds] = await Promise.all([
    supabase.from("matches").select("*").order("match_time", { ascending: true }).limit(20),
    supabase.from("teams").select("*").order("name", { ascending: true }).limit(50),
    supabase.from("odds").select("*").limit(50),
  ]);
  if (matches.error || teams.error || odds.error) throw matches.error ?? teams.error ?? odds.error;
  return {
    counts: Object.fromEntries(tables.map((table, index) => [table, counts[index]])) as CollectionCounts,
    matches: matches.data ?? [],
    teams: teams.data ?? [],
    odds: odds.data ?? [],
  };
}
