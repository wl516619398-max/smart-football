import { footballApiRawRequest, footballApiRequestUrl } from "@/lib/football/api";
import { getFootballSeasonCandidates } from "@/lib/football/season";
import { resolveFootballTeamId as resolveApiFootballTeamId, type FootballTeamReference } from "@/lib/football/team-id";
import type { ApiFootballFixture } from "@/lib/football/types";

export type { FootballTeamReference } from "@/lib/football/team-id";

export type FootballHistoryProvider = "football-data" | "api-football" | "thesportsdb";

export type HistoricalMatch = {
  externalId: string;
  provider: FootballHistoryProvider;
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
    league: fixture.league?.name || "",
    matchTime: fixture.fixture.date,
    status: "finished",
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
  return fixtures;
}

async function getApiFootballTeamHistory(teamId: string) {
  for (const season of seasonCandidates()) {
    const fixtures = await getApiFootballFixtures({ team: teamId, season });
    const matches = fixtures
      .map((fixture) => normalizeApiFootballFixture(fixture, "api-football"))
      .filter((item): item is HistoricalMatch => Boolean(item))
      .sort((left, right) => Date.parse(right.matchTime) - Date.parse(left.matchTime));
    if (matches.length) return matches.slice(0, 10);
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
  return arrayValue(payload?.results)
    .map((item) => normalizeSportsDbEvent(record(item) || {}, "thesportsdb"))
    .filter((item): item is HistoricalMatch => Boolean(item))
    .sort((left, right) => Date.parse(right.matchTime) - Date.parse(left.matchTime))
    .slice(0, 10);
}

async function getSportsDbHeadToHead(homeTeamId: string, awayTeamId: string) {
  const payload = await requestJson(`${sportsDbBase()}/eventsh2h.php?id=${encodeURIComponent(homeTeamId)}&id2=${encodeURIComponent(awayTeamId)}`);
  return arrayValue(payload?.event)
    .map((item) => normalizeSportsDbEvent(record(item) || {}, "thesportsdb"))
    .filter((item): item is HistoricalMatch => Boolean(item))
    .sort((left, right) => Date.parse(right.matchTime) - Date.parse(left.matchTime))
    .slice(0, 10);
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

export async function getHistoricalTeamMatches(team: FootballTeamReference) {
  const provider = providerFromEnv();
  if (!provider) return [];
  if (provider === "api-football") {
    const apiFootballId = await resolveApiFootballTeamId(team);
    return apiFootballId ? getApiFootballTeamHistory(apiFootballId) : [];
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
