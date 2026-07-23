import { createClient } from "@supabase/supabase-js";
import { buildAnalysisDatasets } from "../lib/analysis-engine/feature-builder.ts";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const dryRun = process.argv.includes("--dry-run");

async function readTable(table: string) {
  const result = await supabase.from(table).select("*");
  if (result.error) throw new Error(`${table} read failed: ${result.error.message}`);
  return result.data ?? [];
}

async function main() {
  const [matches, teams, stats, odds, history] = await Promise.all([
    readTable("matches"),
    readTable("teams"),
    readTable("team_statistics"),
    readTable("odds"),
    readTable("match_history"),
  ]);
  const datasets = buildAnalysisDatasets(matches, teams, stats, odds, history);
  const rows = datasets.map((dataset) => ({ ...dataset, updated_at: new Date().toISOString() }));

  if (rows.length && !dryRun) {
    const result = await supabase.from("analysis_dataset").upsert(rows, { onConflict: "match_id" });
    if (result.error) throw new Error(`analysis_dataset write failed: ${result.error.message}`);
  }

  console.info(`[analysis-dataset] matches=${matches.length} datasets=${datasets.length} written=${dryRun ? 0 : rows.length} mode=${dryRun ? "dry-run" : "upsert"}`);
  const incomplete = datasets.filter((dataset) => dataset.data_quality.missing_fields.length).length;
  console.info(`[analysis-dataset] incomplete=${incomplete}`);
}

main().catch((error) => {
  console.error("[analysis-dataset] failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
