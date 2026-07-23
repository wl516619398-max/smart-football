import { footballApiRawRequest, footballApiRequestUrl } from "./api.ts";
import { getFootballSeasonCandidates } from "./season.ts";
import { resolveFootballTeamId as resolveApiFootballTeamId, type FootballTeamReference } from "./team-id.ts";
import type { ApiFootballFixture } from "./types.ts";
import { getSupabaseServerClient } from "../supabase/server.ts";
import { decodeUnicodeDeep } from "@/lib/utils/decode-unicode";

export type { FootballTeamReference } from "@/lib/football/team-id";

export type FootballHistoryProvider = "football-data" | "api-football" | "thesportsdb";

export type HistoricalMatch = {
  externalId: string;
  provider: FootballHistoryProvider;
  season?: number;
  league: string;
  matchTime: string;
  status: string;
  homeTeamId: string;
  homeTeam: string;
  awayTeamId: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  venue?: string;
};

export type RecentFormCalculation = {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: string;
};

export type StoredHeadToHeadRow = Record<string, unknown>;

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue | null {
  return typeof value === "object" && value !== null ? value as RecordValue : null;
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value === null || value === undefined ? fallback : String(value);
}

function numberValue(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export async function calculateRecentForm(teamId: string): Promise<RecentFormCalculation> {
  const empty: RecentFormCalculation = {
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    form: "",
  };
  const normalizedTeamId = teamId.trim();
  if (!normalizedTeamId) return empty;

  const supabase = getSupabaseServerClient();
  if (!supabase) return empty;

  const result = await supabase
    .from("football_match_history")
    .select("home_team_id,away_team_id,home_score,away_score,match_time")
    .or(`home_team_id.eq.${normalizedTeamId},away_team_id.eq.${normalizedTeamId}`)
    .order("match_time", { ascending: false })
    .limit(5);

  const rows = decodeUnicodeDeep(Array.isArray(result.data) ? result.data : []);
  console.info("[football-history] recent form", {
    teamId: normalizedTeamId,
    rows: rows.length,
    error: result.error?.message || null,
  });
  if (result.error || !rows.length) return empty;

  return rows.reduce<RecentFormCalculation>((summary, row) => {
    const homeScore = numberValue(row.home_score);
    const awayScore = numberValue(row.away_score);
    if (homeScore === null || awayScore === null) return summary;

    const isHome = String(row.home_team_id) === normalizedTeamId;
    const goalsFor = isHome ? homeScore : awayScore;
    const goalsAgainst = isHome ? awayScore : homeScore;
    const resultCode = goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "L" : "D";
    summary.goalsFor += goalsFor;
    summary.goalsAgainst += goalsAgainst;
    summary.form += resultCode;
    if (resultCode === "W") {
      summary.wins += 1;
      summary.points += 3;
    } else if (resultCode === "D") {
      summary.draws += 1;
      summary.points += 1;
    } else {
      summary.losses += 1;
    }
    return summary;
  }, empty);
}

/**
 * Reads only direct meetings between the two resolved API-Football team IDs.
 * The pair is checked in both home/away orientations because either team may
 * have hosted the historical fixture.
 */
export async function getStoredHeadToHead(
  homeFootballDataId: string,
  awayFootballDataId: string,
): Promise<StoredHeadToHeadRow[]> {
  const homeId = homeFootballDataId.trim();
  const awayId = awayFootballDataId.trim();
  console.info("[history-query]", {
    homeFootballDataId: homeId,
    awayFootballDataId: awayId,
  });

  if (!homeId || !awayId) return [];

  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  try {
    const result = await supabase
      .from("football_match_history")
      .select("*")
      .or(`and(home_team_id.eq.${homeId},away_team_id.eq.${awayId}),and(home_team_id.eq.${awayId},away_team_id.eq.${homeId})`)
      .order("match_time", { ascending: false })
      .limit(10);

    const rows = decodeUnicodeDeep(Array.isArray(result.data) ? result.data as StoredHeadToHeadRow[] : []);
    console.info("[history-query] result", {
      homeFootballDataId: homeId,
      awayFootballDataId: awayId,
      rows: rows.length,
      error: result.error?.message || null,
    });
    if (result.error) return [];
    return rows;
  } catch (error) {
    console.info("[history-query] failed", {
      homeFootballDataId: homeId,
      awayFootballDataId: awayId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

function providerFromEnv(): FootballHistoryProvider | null {
  const explicit = process.env.FOOTBALL_API_PROVIDER?.trim().toLowerCase();
  if (explicit === "football-data" || explicit === "api-football" || explicit === "thesportsdb") return explicit;
  if (process.env.FOOTBALL_API_KEY?.trim()) return "api-football";
  if (process.env.FOOTBALL_DATA_API_KEY?.trim()) return "football-data";
  if (process.env.THESPORTSDB_API_KEY?.trim() || process.env.FOOTBALL_DATA_PROVIDER === "api") return "thesportsdb";
  return null;
}

export function getFootballHistoryProvider(): FootballHistoryProvider | null {
  return providerFromEnv();
}

const API_FOOTBALL_TEAM_ALIASES: Record<string, string> = {
  "manchester united": "33",
  "曼联": "33",
  "曼彻斯特联": "33",
  liverpool: "40",
  "利物浦": "40",
  "manchester city": "50",
  "曼城": "50",
  arsenal: "42",
  "阿森纳": "42",
  chelsea: "49",
  "切尔西": "49",
  "real madrid": "541",
  "皇家马德里": "541",
  barcelona: "529",
  "巴塞罗那": "529",
  "bayern munich": "157",
  "拜仁慕尼黑": "157",
};

function seasonCandidates() {
  return getFootballSeasonCandidates();
}

function isApiFootballError(payload: { errors?: unknown } | null) {
  if (!payload?.errors) return false;
  return Array.isArray(payload.errors) ? payload.errors.length > 0 : Object.keys(record(payload.errors) || {}).length > 0;
}

function normalizeApiFootballFixture(fixture: ApiFootballFixture, provider: "api-football"): HistoricalMatch | null {
  const homeScore = numberValue(fixture.goals?.home);
  const awayScore = numberValue(fixture.goals?.away);
  if (homeScore === null || awayScore === null) return null;
  return {
    externalId: String(fixture.fixture.id),
    provider,
    season: fixture.league?.season,
    league: fixture.league?.name || "",
    matchTime: fixture.fixture.date,
    status: fixture.fixture.status?.short || fixture.fixture.status?.long || "finished",
    homeTeamId: String(fixture.teams.home.id),
    homeTeam: fixture.teams.home.name,
    awayTeamId: String(fixture.teams.away.id),
    awayTeam: fixture.teams.away.name,
    homeScore,
    awayScore,
    venue: fixture.fixture.venue?.name || undefined,
  };
}

async function getApiFootballFixtures(params: Record<string, string | number>, path = "fixtures") {
  console.info("[football-history] request URL:", footballApiRequestUrl(path, params));
  const payload = await footballApiRawRequest<ApiFootballFixture[]>(path, params);
  const fixtures = !payload || isApiFootballError(payload) || !Array.isArray(payload.response) ? [] : payload.response;
  console.info("[football-history]", {
    teamId: params.team || params.h2h || "",
    season: params.season || "headtohead",
    "fixtures length": fixtures.length,
  });
  return decodeUnicodeDeep(fixtures);
}

export type HistoricalTeamMatchOptions = {
  season?: string;
  seasons?: string[];
  limit?: number;
};

async function getApiFootballTeamHistory(teamId: string, options: HistoricalTeamMatchOptions = {}) {
  const limit = options.limit ?? 10;
  const seasons = options.seasons?.length ? options.seasons : options.season ? [options.season] : seasonCandidates();
  for (const season of seasons) {
    const fixtures = await getApiFootballFixtures({ team: teamId, season });
    const matches = fixtures
      .map((fixture) => normalizeApiFootballFixture(fixture, "api-football"))
      .filter((item): item is HistoricalMatch => Boolean(item))
      .sort((left, right) => Date.parse(right.matchTime) - Date.parse(left.matchTime));
    if (matches.length) return matches.slice(0, limit);
  }
  return [];
}

async function getApiFootballHeadToHead(homeTeamId: string, awayTeamId: string) {
  return (await getApiFootballFixtures({ h2h: `${homeTeamId}-${awayTeamId}` }, "fixtures/headtohead"))
    .map((fixture) => normalizeApiFootballFixture(fixture, "api-football"))
    .filter((item): item is HistoricalMatch => Boolean(item))
    .sort((left, right) => Date.parse(right.matchTime) - Date.parse(left.matchTime))
    .slice(0, 10);
}

function sportsDbBase() {
  const key = process.env.THESPORTSDB_API_KEY?.trim() || "3";
  return `https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}`;
}

async function requestJson(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return record(await response.json());
  } catch {
    return null;
  }
}

function normalizeSportsDbEvent(event: RecordValue, provider: "thesportsdb"): HistoricalMatch | null {
  const homeScore = numberValue(event.intHomeScore);
  const awayScore = numberValue(event.intAwayScore);
  const externalId = stringValue(event.idEvent);
  const matchTime = stringValue(event.dateEvent);
  if (homeScore === null || awayScore === null || !externalId || !matchTime) return null;
  return {
    externalId,
    provider,
    league: stringValue(event.strLeague),
    matchTime,
    status: "finished",
    homeTeamId: stringValue(event.idHomeTeam),
    homeTeam: stringValue(event.strHomeTeam),
    awayTeamId: stringValue(event.idAwayTeam),
    awayTeam: stringValue(event.strAwayTeam),
    homeScore,
    awayScore,
    venue: stringValue(event.strVenue) || undefined,
  };
}

async function getSportsDbTeamHistory(teamId: string) {
  const payload = await requestJson(`${sportsDbBase()}/eventslast.php?id=${encodeURIComponent(teamId)}`);
  return decodeUnicodeDeep(arrayValue(payload?.results)
    .map((item) => normalizeSportsDbEvent(record(item) || {}, "thesportsdb"))
    .filter((item): item is HistoricalMatch => Boolean(item))
    .sort((left, right) => Date.parse(right.matchTime) - Date.parse(left.matchTime))
    .slice(0, 10));
}

async function getSportsDbHeadToHead(homeTeamId: string, awayTeamId: string) {
  const payload = await requestJson(`${sportsDbBase()}/eventsh2h.php?id=${encodeURIComponent(homeTeamId)}&id2=${encodeURIComponent(awayTeamId)}`);
  return decodeUnicodeDeep(arrayValue(payload?.event)
    .map((item) => normalizeSportsDbEvent(record(item) || {}, "thesportsdb"))
    .filter((item): item is HistoricalMatch => Boolean(item))
    .sort((left, right) => Date.parse(right.matchTime) - Date.parse(left.matchTime))
    .slice(0, 10));
}

async function sportsDbSearchTeam(name: string) {
  const payload = await requestJson(`${sportsDbBase()}/searchteams.php?t=${encodeURIComponent(name)}`);
  const team = record(arrayValue(payload?.teams)[0]);
  return stringValue(team?.idTeam) || null;
}

async function footballDataHistory(teamId: string) {
  const key = process.env.FOOTBALL_DATA_API_KEY?.trim();
  if (!key) return [];
  const base = (process.env.FOOTBALL_DATA_API_BASE_URL || "https://api.football-data.org/v4").replace(/\/$/, "");
  const response = await fetch(`${base}/teams/${encodeURIComponent(teamId)}/matches?status=FINISHED&limit=10`, {
    headers: { Accept: "application/json", "X-Auth-Token": key },
    cache: "no-store",
  });
  if (!response.ok) return [];
  const payload = record(await response.json());
  return arrayValue(payload?.matches).map((item): HistoricalMatch | null => {
    const event = record(item) || {};
    const home = record(event.homeTeam) || {};
    const away = record(event.awayTeam) || {};
    const score = record(event.score) || {};
    const fullTime = record(score.fullTime) || {};
    const homeScore = numberValue(fullTime.home);
    const awayScore = numberValue(fullTime.away);
    if (homeScore === null || awayScore === null) return null;
    return {
      externalId: stringValue(event.id), provider: "football-data" as const, league: stringValue(record(event.competition)?.name), matchTime: stringValue(event.utcDate), status: "finished",
      homeTeamId: stringValue(home.id), homeTeam: stringValue(home.name), awayTeamId: stringValue(away.id), awayTeam: stringValue(away.name),
      homeScore, awayScore, venue: stringValue(event.venue) || undefined,
    };
  }).filter((item): item is HistoricalMatch => Boolean(item && item.externalId));
}

async function footballDataSearchTeam(name: string) {
  const key = process.env.FOOTBALL_DATA_API_KEY?.trim();
  if (!key) return null;
  const base = (process.env.FOOTBALL_DATA_API_BASE_URL || "https://api.football-data.org/v4").replace(/\/$/, "");
  const response = await fetch(`${base}/teams?name=${encodeURIComponent(name)}`, { headers: { Accept: "application/json", "X-Auth-Token": key }, cache: "no-store" });
  if (!response.ok) return null;
  const payload = record(await response.json());
  return stringValue(record(arrayValue(payload?.teams)[0])?.id) || null;
}

export async function resolveFootballTeamId(team: FootballTeamReference, knownId?: string | null) {
  return resolveApiFootballTeamId(team, knownId);
}

export async function getHistoricalTeamMatches(team: FootballTeamReference, options: HistoricalTeamMatchOptions = {}) {
  const provider = providerFromEnv();
  if (!provider) return [];
  if (provider === "api-football") {
    const apiFootballId = await resolveApiFootballTeamId(team);
    return apiFootballId ? getApiFootballTeamHistory(apiFootballId, options) : [];
  }
  const rawId = typeof team === "string" ? team.trim() : String(team.thesportsdb_id || team.id || "").trim();
  if (!rawId) return [];
  if (provider === "thesportsdb") return getSportsDbTeamHistory(rawId);
  return footballDataHistory(rawId);
}

export async function getHistoricalHeadToHead(homeTeam: FootballTeamReference, awayTeam: FootballTeamReference) {
  const provider = providerFromEnv();
  if (provider === "api-football") {
    const [homeTeamId, awayTeamId] = await Promise.all([
      resolveApiFootballTeamId(homeTeam),
      resolveApiFootballTeamId(awayTeam),
    ]);
    if (!homeTeamId || !awayTeamId) return [];
    return getApiFootballHeadToHead(homeTeamId, awayTeamId);
  }
  const homeTeamId = typeof homeTeam === "string" ? homeTeam.trim() : String(homeTeam.thesportsdb_id || homeTeam.id || "").trim();
  const awayTeamId = typeof awayTeam === "string" ? awayTeam.trim() : String(awayTeam.thesportsdb_id || awayTeam.id || "").trim();
  if (!homeTeamId || !awayTeamId) return [];
  if (provider === "thesportsdb") return getSportsDbHeadToHead(homeTeamId, awayTeamId);
  return [];
}
