import { createClient } from "@supabase/supabase-js";
import { generateMockFootballData } from "../lib/football/mock-generator.ts";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const bundle = generateMockFootballData();
  const matchResult = await supabase.from("matches").upsert(bundle.matches, { onConflict: "external_id" });
  if (matchResult.error) throw new Error(`matches seed failed: ${matchResult.error.message}`);
  console.info(`[seed:football] matches: ${bundle.matches.length}`);

  const teamResult = await supabase.from("teams").upsert(bundle.teams, { onConflict: "canonical_name" });
  if (teamResult.error) throw new Error(`teams seed failed: ${teamResult.error.message}`);
  console.info(`[seed:football] teams: ${bundle.teams.length}`);

  const statsResult = await supabase.from("team_statistics").upsert(bundle.team_statistics, { onConflict: "team_id" });
  if (statsResult.error) throw new Error(`team_statistics seed failed: ${statsResult.error.message}`);
  console.info(`[seed:football] team_statistics: ${bundle.team_statistics.length}`);

  const oddsResult = await supabase.from("odds").upsert(bundle.odds, { onConflict: "match_id" });
  if (oddsResult.error) throw new Error(`odds seed failed: ${oddsResult.error.message}`);
  console.info(`[seed:football] odds: ${bundle.odds.length}`);

  const historyResult = await supabase.from("match_history").upsert(bundle.match_history, { onConflict: "external_id" });
  if (historyResult.error) throw new Error(`match_history seed failed: ${historyResult.error.message}`);
  console.info(`[seed:football] match_history: ${bundle.match_history.length}`);

  const footballHistory = bundle.match_history.map((row) => ({ ...row, provider: "mock" }));
  const footballHistoryResult = await supabase.from("football_match_history").upsert(footballHistory, { onConflict: "external_id" });
  if (footballHistoryResult.error) throw new Error(`football_match_history seed failed: ${footballHistoryResult.error.message}`);
  console.info(`[seed:football] football_match_history: ${footballHistory.length}`);

  const inserted = bundle.matches.length + bundle.teams.length + bundle.team_statistics.length + bundle.odds.length + bundle.match_history.length + footballHistory.length;

  const { error: logError } = await supabase.from("collection_logs").insert({ provider: "mock", entity: "football", status: "success", fetched_count: inserted, inserted_count: inserted });
  if (logError) throw new Error(`collection_logs seed failed: ${logError.message}`);
  console.info(`[seed:football] complete: ${inserted} rows`);
}

main().catch((error) => {
  console.error("[seed:football] failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
