import { getHistoricalTeamMatches, getFootballHistoryProvider } from "../lib/football/history.ts";
import { getSupabaseServerClient } from "../lib/supabase/server.ts";

const SEASON = "2025";
const FALLBACK_SEASONS = [SEASON, "2024", "2023"];
const LIMIT = 50;
const TARGET_TEAMS = [
  { name: "Arsenal", footballDataId: "42" },
  { name: "Coventry City", footballDataId: "1346" },
] as const;

type HistoryRow = {
  external_id: string;
  provider: "api-football";
  home_team_id: string;
  away_team_id: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  match_time: string;
  league: string;
  status: string;
};

function toRow(match: Awaited<ReturnType<typeof getHistoricalTeamMatches>>[number]): HistoryRow {
  return {
    external_id: match.externalId,
    provider: "api-football",
    home_team_id: match.homeTeamId,
    away_team_id: match.awayTeamId,
    home_team: match.homeTeam,
    away_team: match.awayTeam,
    home_score: match.homeScore,
    away_score: match.awayScore,
    match_time: match.matchTime,
    league: match.league,
    status: match.status || "finished",
  };
}

async function syncTeam(team: (typeof TARGET_TEAMS)[number]) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase server environment is not configured");

  const mapping = await supabase
    .from("teams")
    .select("football_data_id")
    .eq("canonical_name", team.name.toLocaleLowerCase())
    .maybeSingle();
  if (mapping.error) throw new Error(`${team.name} mapping query failed: ${mapping.error.message}`);
  if (mapping.data?.football_data_id && String(mapping.data.football_data_id) !== team.footballDataId) {
    throw new Error(`${team.name} mapping conflict: stored ${mapping.data.football_data_id}, expected ${team.footballDataId}; refusing to overwrite`);
  }

  const matches = await getHistoricalTeamMatches(
    { name: team.name, football_data_id: team.footballDataId },
    { seasons: FALLBACK_SEASONS, limit: LIMIT },
  );
  const rows = matches.map(toRow).filter((row) => row.home_team_id === team.footballDataId || row.away_team_id === team.footballDataId);
  const externalIds = rows.map((row) => row.external_id);
  const existingResult = externalIds.length
    ? await supabase.from("football_match_history").select("external_id").in("external_id", externalIds)
    : { data: [], error: null };
  if (existingResult.error) throw new Error(`${team.name} existing-id query failed: ${existingResult.error.message}`);

  const existingIds = new Set((existingResult.data || []).map((row) => String(row.external_id)));
  const newRows = rows.filter((row) => !existingIds.has(row.external_id));
  if (newRows.length) {
    const insertResult = await supabase.from("football_match_history").insert(newRows);
    if (insertResult.error) throw new Error(`${team.name} insert failed: ${insertResult.error.message}`);
  }

  const countResult = await supabase
    .from("football_match_history")
    .select("external_id", { count: "exact", head: true })
    .or(`home_team_id.eq.${team.footballDataId},away_team_id.eq.${team.footballDataId}`);
  if (countResult.error) throw new Error(`${team.name} verification failed: ${countResult.error.message}`);

  console.info("[sync:history]", {
    team: team.name,
    footballDataId: team.footballDataId,
    season: SEASON,
    fetched: rows.length,
    existing: existingIds.size,
    insertedOrUpdated: newRows.length,
    databaseCount: countResult.count ?? 0,
    requestedSeasons: FALLBACK_SEASONS,
    sourceSeason: matches[0]?.season ?? null,
  });
}

async function main() {
  const provider = getFootballHistoryProvider();
  if (provider !== "api-football") {
    throw new Error(`API-Football provider is required; current provider: ${provider || "none"}`);
  }

  for (const team of TARGET_TEAMS) await syncTeam(team);
}

main().catch((error) => {
  console.error("[sync:history] failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
