import { createClient } from "@supabase/supabase-js";
import { checkMatches } from "../lib/data-quality/match-checker.ts";
import { checkTeams } from "../lib/data-quality/team-checker.ts";
import { checkOdds } from "../lib/data-quality/odds-checker.ts";
import type { DataQualityIssue } from "../lib/data-quality/types.ts";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function readTable(table: "matches" | "teams" | "odds") {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw new Error(`${table} query failed: ${error.message}`);
  return data ?? [];
}

async function main() {
  const [matches, teams, odds] = await Promise.all([readTable("matches"), readTable("teams"), readTable("odds")]);
  const issues: DataQualityIssue[] = [...checkMatches(matches), ...checkTeams(teams), ...checkOdds(odds)];

  if (issues.length) {
    const { error } = await supabase.from("data_quality_logs").insert(issues);
    if (error) throw new Error(`data_quality_logs insert failed: ${error.message}`);
  }

  const summary = issues.reduce<Record<string, number>>((result, issue) => {
    result[issue.severity] = (result[issue.severity] ?? 0) + 1;
    return result;
  }, {});
  console.info(`[check:data] matches=${matches.length} teams=${teams.length} odds=${odds.length}`);
  console.info(`[check:data] issues=${issues.length}`, summary);
  for (const issue of issues) console.info(`[check:data] ${issue.severity} ${issue.data_type}/${issue.check_type}: ${issue.message}`);
}

main().catch((error) => {
  console.error("[check:data] failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
