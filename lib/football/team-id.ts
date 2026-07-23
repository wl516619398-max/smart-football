import { footballApiRawRequest } from "./api.ts";
import { getSupabaseServerClient } from "../supabase/server.ts";

export type FootballTeamReference = string | {
  id?: string | number | null;
  name?: string | null;
  teamName?: string | null;
  football_data_id?: string | number | null;
  api_football_id?: string | number | null;
  thesportsdb_id?: string | number | null;
};

const API_FOOTBALL_ALIASES: Record<string, string> = {
  "manchester united": "33",
  liverpool: "40",
  "manchester city": "50",
  arsenal: "42",
  chelsea: "49",
  "real madrid": "541",
  barcelona: "529",
  "bayern munich": "157",
  "borussia dortmund": "165",
};

const KNOWN_API_FOOTBALL_IDS = new Set(Object.values(API_FOOTBALL_ALIASES));

// Legacy rows created from TheSportsDB can arrive as a bare numeric ID before
// the provider mapping migration has been applied. Keep only verified mappings
// here; unresolved IDs are looked up by team name when one is available.
const LEGACY_SPORTSDB_TO_API: Record<string, string> = {
  "133604": "42", // Arsenal
};

const LEGACY_SPORTSDB_NAMES: Record<string, string> = {
  "133604": "Arsenal",
  "133625": "Coventry City",
};

function text(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function referenceValues(team: FootballTeamReference, knownId?: string | null) {
  if (typeof team === "string") {
    const value = team.trim();
    return {
      name: /^\d+$/.test(value) ? LEGACY_SPORTSDB_NAMES[value] || "" : value,
      databaseId: knownId?.trim() || value,
      explicitApiId: "",
      explicitSportsDbId: "",
    };
  }

  const name = text(team.name || team.teamName);
  return {
    name,
    databaseId: text(team.id) || text(knownId),
    explicitApiId: text(team.football_data_id) || text(team.api_football_id),
    explicitSportsDbId: text(team.thesportsdb_id),
  };
}

async function findStoredMapping(name: string, databaseId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const result = await supabase.from("teams").select("*").limit(1000);
  if (result.error || !Array.isArray(result.data)) {
    if (result.error?.code !== "PGRST205") {
      console.warn("[football-id-map] mapping lookup failed:", result.error?.message || "unknown error");
    }
    return null;
  }

  const normalized = normalizeName(name);
  return (result.data as Array<Record<string, unknown>>).find((row) => {
    const rowName = normalizeName(text(row.canonical_name || row.name));
    const rowSportsDbId = text(row.thesportsdb_id);
    return (normalized && rowName === normalized) || (databaseId && rowSportsDbId === databaseId);
  }) ?? null;
}

async function saveStoredMapping(name: string, databaseId: string, apiFootballId: string) {
  if (!name || !apiFootballId) return;
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const payload: Record<string, string> = {
    name,
    canonical_name: normalizeName(name),
    football_data_id: apiFootballId,
    updated_at: new Date().toISOString(),
  };
  if (databaseId && databaseId !== apiFootballId && databaseId.length >= 5) {
    payload.thesportsdb_id = databaseId;
  }

  const result = await supabase.from("teams").upsert(payload, { onConflict: "canonical_name" });
  if (result.error && result.error.code !== "PGRST205") {
    console.warn("[football-id-map] mapping save failed:", result.error.message);
  }
}

async function searchApiFootballTeam(name: string) {
  if (!name) return null;
  const payload = await footballApiRawRequest<Array<{ team?: { id?: number; name?: string } }>>("teams", { search: name });
  if (!payload || payload.errors) return null;
  const candidates = Array.isArray(payload.response) ? payload.response : [];
  const normalized = normalizeName(name);
  const exact = candidates.find((item) => normalizeName(text(item.team?.name)) === normalized);
  return exact?.team?.id ? String(exact.team.id) : null;
}

export async function resolveFootballTeamId(team: FootballTeamReference, knownId?: string | null) {
  const values = referenceValues(team, knownId);
  const stored = await findStoredMapping(values.name, values.databaseId);
  const storedApiId = text(stored?.football_data_id) || text(stored?.api_football_id);
  const apiFootballId = values.explicitApiId || storedApiId || LEGACY_SPORTSDB_TO_API[values.databaseId] || API_FOOTBALL_ALIASES[normalizeName(values.name)] || (
    !values.name && KNOWN_API_FOOTBALL_IDS.has(values.databaseId) ? values.databaseId : ""
  ) || await searchApiFootballTeam(values.name);

  console.info("[football-id-map]", {
    teamName: values.name || text(stored?.name),
    databaseId: values.databaseId || text(stored?.thesportsdb_id),
    apiFootballId: apiFootballId || null,
  });

  if (apiFootballId) {
    await saveStoredMapping(
      values.name || text(stored?.name),
      values.databaseId || text(stored?.thesportsdb_id),
      apiFootballId,
    );
  }
  return apiFootballId || null;
}
