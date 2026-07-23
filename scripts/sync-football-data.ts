import { createClient } from "@supabase/supabase-js";
import { getFootballDataProvider } from "../lib/football-data/provider.ts";
import type { FootballApiHistory, FootballApiOdds, FootballApiTeam, FootballApiTeamStatistics, UpcomingMatch } from "../lib/football-api/types.ts";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });
const provider = getFootballDataProvider();

function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    if (record.message) return JSON.stringify({ message: record.message, code: record.code, details: record.details, hint: record.hint });
  }
  return String(error);
}

async function writeLog(entity: string, status: "success" | "error", fetchedCount: number, insertedCount: number, errorMessage?: string) {
  const { error } = await supabase.from("collection_logs").insert({
    provider: provider.name,
    entity,
    status,
    fetched_count: fetchedCount,
    inserted_count: insertedCount,
    error_message: errorMessage ?? null,
  });
  if (error) console.error(`[sync:football] collection_logs write failed for ${entity}: ${error.message}`);
}

async function step<T>(entity: string, operation: () => Promise<T>, count: (value: T) => number) {
  try {
    const value = await operation();
    const fetched = count(value);
    await writeLog(entity, "success", fetched, fetched);
    console.info(`[sync:football] provider=${provider.name} ${entity}: fetched=${fetched} insertedOrUpdated=${fetched}`);
    return value;
  } catch (error) {
    const message = formatError(error);
    await writeLog(entity, "error", 0, 0, message);
    throw new Error(`${entity}: ${message}`);
  }
}

async function upsertMatches(matches: UpcomingMatch[]) {
  const { error } = await supabase.from("matches").upsert(matches.map((match) => ({
    external_id: match.external_id,
    league: match.league,
    home_team_id: match.home_team_id,
    home_team: match.home_team,
    away_team_id: match.away_team_id,
    away_team: match.away_team,
    match_time: match.match_time,
    status: match.status,
    venue: match.venue ?? null,
  })), { onConflict: "external_id" });
  if (error) throw error;
  return matches.length;
}

async function upsertTeams(teams: FootballApiTeam[]) {
  const { error } = await supabase.from("teams").upsert(teams.map((team) => ({
    name: team.name,
    canonical_name: team.canonical_name,
    league: team.league,
    logo: team.logo ?? null,
    football_data_id: team.football_data_id,
  })), { onConflict: "canonical_name" });
  if (error) throw error;
  return teams.length;
}

async function upsertTeamStats(stats: FootballApiTeamStatistics[]) {
  if (!stats.length) return 0;
  const { error } = await supabase.from("team_statistics").upsert(stats, { onConflict: "team_id" });
  if (error) throw error;
  return stats.length;
}

async function upsertOdds(odds: FootballApiOdds[]) {
  if (!odds.length) return 0;
  const { error } = await supabase.from("odds").upsert(odds, { onConflict: "match_id" });
  if (error) throw error;
  return odds.length;
}

async function upsertHistory(history: FootballApiHistory[]) {
  if (!history.length) return 0;
  const { error: primaryError } = await supabase.from("football_match_history").upsert(history, { onConflict: "external_id" });
  if (primaryError) throw primaryError;
  const legacyRows = history.map(({ provider: _provider, ...row }) => row);
  const { error: legacyError } = await supabase.from("match_history").upsert(legacyRows, { onConflict: "external_id" });
  if (legacyError) throw legacyError;
  return history.length;
}

async function main() {
  console.info(`[sync:football] selected provider=${provider.name}`);
  const matches = await step("matches", () => provider.getMatches(), (value) => value.length);
  await step("matches-write", () => upsertMatches(matches), (value) => value);

  const teams = await step("teams", () => provider.getTeams(matches), (value) => value.length);
  await step("teams-write", () => upsertTeams(teams), (value) => value);

  const teamStats = await step("team_statistics", () => provider.getTeamStats(matches, teams), (value) => value.length);
  await step("team_statistics-write", () => upsertTeamStats(teamStats), (value) => value);

  const odds = await step("odds", () => provider.getOdds(matches), (value) => value.length);
  await step("odds-write", () => upsertOdds(odds), (value) => value);

  const history = await step("history", () => provider.getHistory(matches), (value) => value.length);
  await step("history-write", () => upsertHistory(history), (value) => value);

  console.info(`[sync:football] complete provider=${provider.name} matches=${matches.length} teams=${teams.length}`);
}

main().catch((error) => {
  console.error("[sync:football] failed:", formatError(error));
  process.exitCode = 1;
});
