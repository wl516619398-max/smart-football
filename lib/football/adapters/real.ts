import { createMockFootballAdapter } from "@/lib/football/adapters/mock";
import { getFootballSeasonCandidates } from "@/lib/football/season";
import { resolveFootballTeamId } from "@/lib/football/team-id";
import type { FootballApiAdapter } from "@/lib/football/adapters/types";
import type { FootballDataQuery } from "@/lib/football/data-provider";
import type {
  FootballMatch,
  FootballRecentMatch,
  FootballStanding,
  FootballTeam,
  FootballTeamForm,
  FootballTeamStats,
} from "@/lib/football/types";

type RecordValue = Record<string, unknown>;
export type RealFootballProviderName = "football-data" | "api-football" | "thesportsdb";

type RealFootballSource = {
  name: RealFootballProviderName;
  getUpcomingMatches(query?: FootballDataQuery): Promise<FootballMatch[] | null>;
  getTeamInfo(teamId?: string, query?: FootballDataQuery): Promise<FootballTeam[] | null>;
  getTeamForm(teamId: string, query?: FootballDataQuery): Promise<FootballTeamForm | null>;
  getStandings(query?: FootballDataQuery): Promise<FootballStanding[] | null>;
};

function asRecord(value: unknown): RecordValue | null {
  return typeof value === "object" && value !== null ? value as RecordValue : null;
}

function readString(record: RecordValue | null, key: string, fallback = "") {
  const value = record?.[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function readNumber(record: RecordValue | null, key: string, fallback = 0) {
  const value = record?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function readRecord(record: RecordValue | null, key: string) {
  return asRecord(record?.[key]);
}

function readArray(record: RecordValue | null, key: string) {
  return Array.isArray(record?.[key]) ? record[key] as unknown[] : [];
}

function neutralStats(teamId: string): FootballTeamStats {
  return {
    teamId,
    attack: 50,
    defense: 50,
    form: 50,
    homeAdvantage: 50,
    possession: 50,
    recentMatches: [],
    goalsFor: 0,
    goalsAgainst: 0,
    xG: 1.5,
    rank: 20,
  };
}

function createMatch(input: {
  id: string;
  league: string;
  date: string;
  status?: string;
  venue?: string;
  home: FootballTeam;
  away: FootballTeam;
}): FootballMatch {
  return {
    id: input.id,
    league: input.league,
    homeTeam: input.home,
    awayTeam: input.away,
    date: input.date,
    status: input.status,
    venue: input.venue || "待确认",
    odds: { homeWin: 33, draw: 34, awayWin: 33 },
    stats: { home: neutralStats(input.home.id), away: neutralStats(input.away.id) },
    injuries: [],
  };
}

function parseResult(homeGoals: number, awayGoals: number): FootballRecentMatch["result"] {
  return homeGoals > awayGoals ? "win" : homeGoals < awayGoals ? "loss" : "draw";
}

function parseFormEvent(event: RecordValue, teamId: string): FootballRecentMatch {
  const homeTeam = readString(event, "strHomeTeam") || readString(readRecord(event, "teams")?.home as RecordValue | null, "name");
  const awayTeam = readString(event, "strAwayTeam") || readString(readRecord(event, "teams")?.away as RecordValue | null, "name");
  const homeGoals = readNumber(event, "intHomeScore", readNumber(readRecord(event, "goals"), "home"));
  const awayGoals = readNumber(event, "intAwayScore", readNumber(readRecord(event, "goals"), "away"));
  const isHome = readString(event, "idHomeTeam") === teamId || readString(readRecord(event, "teams")?.home as RecordValue | null, "id") === teamId;
  const result = parseResult(homeGoals, awayGoals);
  return {
    matchId: readString(event, "idEvent") || readString(readRecord(event, "fixture"), "id"),
    opponent: isHome ? awayTeam : homeTeam,
    date: readString(event, "dateEvent") || readString(readRecord(event, "fixture"), "date"),
    score: `${isHome ? homeGoals : awayGoals}-${isHome ? awayGoals : homeGoals}`,
    result: isHome ? result : result === "win" ? "loss" : result === "loss" ? "win" : "draw",
    goalsFor: isHome ? homeGoals : awayGoals,
    goalsAgainst: isHome ? awayGoals : homeGoals,
    venue: isHome ? "home" : "away",
  };
}

function getDateRange(query?: FootballDataQuery) {
  const from = query?.from || new Date().toISOString().slice(0, 10);
  const to = query?.to || from;
  return { from, to };
}

function getSeasonCandidates() {
  return getFootballSeasonCandidates();
}

async function requestJson(url: string, headers?: HeadersInit): Promise<unknown | null> {
  try {
    const response = await fetch(url, { headers, cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.log("API REQUEST ERROR:", error);
    return null;
  }
}

function footballDataTeam(team: RecordValue | null, fallbackId: string): FootballTeam {
  const id = readString(team, "id", fallbackId);
  return {
    id,
    name: readString(team, "name", "待确认"),
    shortName: readString(team, "shortName", readString(team, "tla", readString(team, "name", "球队").slice(0, 3))),
    logo: readString(team, "crest") || undefined,
  };
}

function createFootballDataSource(): RealFootballSource | null {
  const key = process.env.FOOTBALL_DATA_API_KEY?.trim();
  if (!key) return null;
  const base = (process.env.FOOTBALL_DATA_API_BASE_URL || "https://api.football-data.org/v4").replace(/\/$/, "");
  const competition = process.env.FOOTBALL_DATA_COMPETITION || "PL";
  const headers = { Accept: "application/json", "X-Auth-Token": key };

  return {
    name: "football-data",
    async getUpcomingMatches(query) {
      const range = getDateRange(query);
      const url = new URL(`${base}/matches`);
      url.searchParams.set("dateFrom", range.from);
      url.searchParams.set("dateTo", range.to);
      url.searchParams.set("competitions", query?.league || competition);
      const payload = asRecord(await requestJson(url.toString(), headers));
      const matches = readArray(payload, "matches");
      const normalized = matches.map((item) => {
        const fixture = asRecord(item);
        const home = footballDataTeam(readRecord(fixture, "homeTeam"), "home");
        const away = footballDataTeam(readRecord(fixture, "awayTeam"), "away");
        const competitionData = readRecord(fixture, "competition");
        return createMatch({
          id: readString(fixture, "id"),
          league: readString(competitionData, "name", competition),
          date: readString(fixture, "utcDate"),
          status: readString(fixture, "status"),
          venue: readString(fixture, "venue"),
          home,
          away,
        });
      }).filter((match) => match.id && match.homeTeam.name && match.awayTeam.name);
      return normalized.length ? normalized : null;
    },
    async getTeamInfo(teamId) {
      if (!teamId) return null;
      const payload = asRecord(await requestJson(`${base}/teams/${encodeURIComponent(teamId)}`, headers));
      const team = footballDataTeam(payload, teamId);
      return team.name === "待确认" ? null : [team];
    },
    async getTeamForm(teamId) {
      const payload = asRecord(await requestJson(`${base}/teams/${encodeURIComponent(teamId)}/matches?status=FINISHED&limit=5`, headers));
      const matches = readArray(payload, "matches").map((item) => parseFormEvent(asRecord(item) || {}, teamId));
      return matches.length ? { teamId, matches } : null;
    },
    async getStandings(query) {
      const payload = asRecord(await requestJson(`${base}/competitions/${encodeURIComponent(query?.league || competition)}/standings`, headers));
      const table = readArray(readArray(payload, "standings")[0] ? asRecord(readArray(payload, "standings")[0]) : null, "table");
      const standings = table.map((item) => {
        const row = asRecord(item);
        const team = readRecord(row, "team");
        return {
          teamId: readString(team, "id"),
          teamName: readString(team, "name"),
          league: query?.league || competition,
          rank: readNumber(row, "position", 20),
          played: readNumber(row, "playedGames"),
          points: readNumber(row, "points"),
          wins: readNumber(row, "won"),
          draws: readNumber(row, "draw"),
          losses: readNumber(row, "lost"),
          goalsFor: readNumber(row, "goalsFor"),
          goalsAgainst: readNumber(row, "goalsAgainst"),
        } satisfies FootballStanding;
      }).filter((standing) => standing.teamId && standing.teamName);
      return standings.length ? standings : null;
    },
  };
}

function apiFootballTeam(team: RecordValue | null, fallbackId: string): FootballTeam {
  return {
    id: readString(team, "id", fallbackId),
    name: readString(team, "name", "待确认"),
    shortName: readString(team, "name", "球队").slice(0, 3),
    logo: readString(team, "logo") || undefined,
  };
}

function createApiFootballSource(): RealFootballSource | null {
  const key = process.env.FOOTBALL_API_KEY?.trim();
  console.log("API KEY LENGTH:", process.env.FOOTBALL_API_KEY?.length);
  if (!key) return null;
  const base = (process.env.FOOTBALL_API_URL || process.env.FOOTBALL_API_BASE_URL || "https://v3.football.api-sports.io").replace(/\/$/, "");
  const headers = { Accept: "application/json", "x-apisports-key": key };

  async function request(path: string, params: Record<string, string | number>) {
    const url = new URL(`${base}/${path.replace(/^\//, "")}`);
    Object.entries(params).forEach(([name, value]) => url.searchParams.set(name, String(value)));
    console.log("API URL:", url.toString());
    console.log("HEADERS:", {
      "x-apisports-key-exists": Boolean(key),
      "key-length": key?.length,
    });
    const payload = asRecord(await requestJson(url.toString(), headers));
    const errors = payload?.errors;
    if (errors && (Array.isArray(errors) ? errors.length : Object.keys(asRecord(errors) || {}).length)) return null;
    return Array.isArray(payload?.response) ? payload.response as unknown[] : null;
  }

  return {
    name: "api-football",
    async getUpcomingMatches(query) {
      if (query?.matchId) {
        const response = await request("fixtures", { id: query.matchId });
        const normalized = (response || []).map((item) => {
          const fixture = asRecord(item);
          const fixtureInfo = readRecord(fixture, "fixture");
          const league = readRecord(fixture, "league");
          const teams = readRecord(fixture, "teams");
          const home = apiFootballTeam(readRecord(teams, "home"), "home");
          const away = apiFootballTeam(readRecord(teams, "away"), "away");
          return createMatch({
            id: readString(fixtureInfo, "id"),
            league: readString(league, "name"),
            date: readString(fixtureInfo, "date"),
            status: readString(readRecord(fixtureInfo, "status"), "short"),
            venue: readString(readRecord(fixtureInfo, "venue"), "name"),
            home,
            away,
          });
        }).filter((match) => match.id && match.homeTeam.name !== "寰呯‘璁?" && match.awayTeam.name !== "寰呯‘璁?");
        return normalized.length ? normalized : null;
      }

      // API-Football free plans do not allow the `next` parameter. Requesting
      // each date also keeps this adapter compatible with the free plan's
      // limited forward-looking date window.
      const range = getDateRange(query);
      const from = new Date(`${range.from}T00:00:00Z`);
      const to = new Date(`${range.to}T00:00:00Z`);
      const dateKeys: string[] = [];

      if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
        for (const cursor = new Date(from); cursor <= to && dateKeys.length <= 14; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
          dateKeys.push(cursor.toISOString().slice(0, 10));
        }
      }

      const fixtures: unknown[] = [];
      for (const date of dateKeys) {
        const response = await request("fixtures", { date });
        // A null response indicates a plan/rate-limit/provider error. Stop
        // here so a free API key is not exhausted by futile future requests.
        if (response === null) break;
        fixtures.push(...response);
      }

      const normalized = fixtures.map((item) => {
        const fixture = asRecord(item);
        const fixtureInfo = readRecord(fixture, "fixture");
        const league = readRecord(fixture, "league");
        const teams = readRecord(fixture, "teams");
        const home = apiFootballTeam(readRecord(teams, "home"), "home");
        const away = apiFootballTeam(readRecord(teams, "away"), "away");
        return createMatch({
          id: readString(fixtureInfo, "id"),
          league: readString(league, "name"),
          date: readString(fixtureInfo, "date"),
          status: readString(readRecord(fixtureInfo, "status"), "short"),
          venue: readString(readRecord(fixtureInfo, "venue"), "name"),
          home,
          away,
        });
      }).filter((match) => match.id && match.homeTeam.name !== "待确认" && match.awayTeam.name !== "待确认");
      return normalized.length ? normalized : null;
    },
    async getTeamInfo(teamId) {
      if (!teamId) return null;
      const apiFootballTeamId = await resolveFootballTeamId(teamId);
      if (!apiFootballTeamId) return null;
      const response = await request("teams", { id: apiFootballTeamId });
      const team = apiFootballTeam(readRecord(asRecord(response?.[0]), "team"), apiFootballTeamId);
      return team.name === "待确认" ? null : [team];
    },
    async getTeamForm(teamId) {
      const apiFootballTeamId = await resolveFootballTeamId(teamId);
      if (!apiFootballTeamId) return null;
      for (const season of getSeasonCandidates()) {
        const response = await request("fixtures", { team: apiFootballTeamId, season });
        const matches = (response || [])
          .sort((left, right) => {
            const leftDate = readString(readRecord(asRecord(left), "fixture"), "date");
            const rightDate = readString(readRecord(asRecord(right), "fixture"), "date");
            return Date.parse(rightDate) - Date.parse(leftDate);
          })
          .slice(0, 10)
          .map((item) => parseFormEvent(asRecord(item) || {}, apiFootballTeamId));
        if (matches.length) return { teamId: apiFootballTeamId, matches };
      }
      return null;
    },
    async getStandings() {
      const league = process.env.FOOTBALL_LEAGUE_ID || "39";
      for (const season of getSeasonCandidates()) {
        const response = await request("standings", { league, season });
        const first = asRecord(response?.[0]);
        const groups = readArray(readRecord(first, "league"), "standings");
        const rows = Array.isArray(groups[0]) ? groups[0] : groups;
        const standings = rows.map((item) => {
          const row = asRecord(item);
          const team = readRecord(row, "team");
          const all = readRecord(row, "all");
          return {
            teamId: readString(team, "id"),
            teamName: readString(team, "name"),
            league: readString(readRecord(first, "league"), "name"),
            rank: readNumber(row, "rank", 20),
            played: readNumber(all, "played"),
            points: readNumber(row, "points"),
            wins: readNumber(all, "win"),
            draws: readNumber(all, "draw"),
            losses: readNumber(all, "lose"),
            goalsFor: readNumber(readRecord(all, "goals"), "for"),
            goalsAgainst: readNumber(readRecord(all, "goals"), "against"),
          } satisfies FootballStanding;
        }).filter((standing) => standing.teamId && standing.teamName);
        if (standings.length) return standings;
      }
      return null;
    },
  };
}

const DEFAULT_SPORTSDB_LEAGUES = [
  { id: "4328", name: "English Premier League" },
  { id: "4335", name: "Spanish La Liga" },
  { id: "4331", name: "German Bundesliga" },
  { id: "4480", name: "UEFA Champions League" },
];

function createSportsDbSource(): RealFootballSource | null {
  const key = process.env.THESPORTSDB_API_KEY?.trim() || "3";
  const configuredIds = process.env.THESPORTSDB_LEAGUE_IDS?.split(",").map((id) => id.trim()).filter(Boolean) || [];
  const leagueIds = configuredIds.length ? configuredIds : DEFAULT_SPORTSDB_LEAGUES.map((league) => league.id);
  const base = `https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}`;

  return {
    name: "thesportsdb",
    async getUpcomingMatches() {
      const payloads = await Promise.all(leagueIds.map((id) => requestJson(`${base}/eventsnextleague.php?id=${encodeURIComponent(id)}`)));
      const normalized = payloads.flatMap((payload) => readArray(asRecord(payload), "events").map((item) => {
        const event = asRecord(item);
        const date = readString(event, "dateEvent");
        const time = readString(event, "strTime");
        const home = { id: readString(event, "idHomeTeam"), name: readString(event, "strHomeTeam", "待确认"), shortName: readString(event, "strHomeTeam", "球队").slice(0, 3) };
        const away = { id: readString(event, "idAwayTeam"), name: readString(event, "strAwayTeam", "待确认"), shortName: readString(event, "strAwayTeam", "球队").slice(0, 3) };
        return createMatch({ id: readString(event, "idEvent"), league: readString(event, "strLeague"), date: time ? `${date}T${time}` : date, status: readString(event, "strStatus", readString(event, "strProgress")), venue: readString(event, "strVenue"), home, away });
      })).filter((match) => match.id && match.homeTeam.name !== "待确认" && match.awayTeam.name !== "待确认");
      return normalized.length ? normalized : null;
    },
    async getTeamInfo(teamId) {
      if (!teamId) return null;
      const payload = asRecord(await requestJson(`${base}/lookupteam.php?id=${encodeURIComponent(teamId)}`));
      const team = asRecord(readArray(payload, "teams")[0]);
      if (!team) return null;
      return [{ id: readString(team, "idTeam", teamId), name: readString(team, "strTeam", "待确认"), shortName: readString(team, "strTeam", "球队").slice(0, 3), logo: readString(team, "strTeamBadge") || undefined }];
    },
    async getTeamForm(teamId) {
      const payload = asRecord(await requestJson(`${base}/eventslast.php?id=${encodeURIComponent(teamId)}`));
      const matches = readArray(payload, "results").slice(0, 10).map((item) => parseFormEvent(asRecord(item) || {}, teamId));
      return matches.length ? { teamId, matches } : null;
    },
    async getStandings() {
      const payload = asRecord(await requestJson(`${base}/lookuptable.php?l=${encodeURIComponent(leagueIds[0])}`));
      const standings = readArray(payload, "table").map((item) => {
        const row = asRecord(item);
        return {
          teamId: readString(row, "idTeam"),
          teamName: readString(row, "name"),
          league: readString(row, "strLeague"),
          rank: readNumber(row, "intRank", 20),
          played: readNumber(row, "intPlayed"),
          points: readNumber(row, "intPoints"),
          wins: readNumber(row, "intWin"),
          draws: readNumber(row, "intDraw"),
          losses: readNumber(row, "intLoss"),
          goalsFor: readNumber(row, "intGoalsFor"),
          goalsAgainst: readNumber(row, "intGoalsAgainst"),
        } satisfies FootballStanding;
      }).filter((standing) => standing.teamId && standing.teamName);
      return standings.length ? standings : null;
    },
  };
}

function getConfiguredSource(sourceOverride?: RealFootballProviderName): RealFootballSource | null {
  const selected = sourceOverride ?? process.env.FOOTBALL_API_PROVIDER?.trim().toLowerCase();
  if (selected === "football-data") return createFootballDataSource();
  if (selected === "api-football") return createApiFootballSource();
  if (selected === "thesportsdb") return createSportsDbSource();
  return createFootballDataSource() || createApiFootballSource() || createSportsDbSource();
}

export function createRealFootballAdapter(sourceOverride?: RealFootballProviderName): FootballApiAdapter {
  const source = getConfiguredSource(sourceOverride);
  const fallback = createMockFootballAdapter("api");

  async function withFallback<T>(remote: (() => Promise<T | null>) | undefined, fallbackCall: () => Promise<T>): Promise<T> {
    try {
      const value = await remote?.();
      if (value && (!Array.isArray(value) || value.length > 0)) return value;
    } catch {
      // Any source error falls through to the existing Mock provider.
    }
    return fallbackCall();
  }

  return {
    provider: "api",
    async getUpcomingMatches(query) {
      return withFallback(source ? () => source.getUpcomingMatches(query) : undefined, () => fallback.getUpcomingMatches(query));
    },
    async getTeamInfo(teamId, query) {
      return withFallback(source ? () => source.getTeamInfo(teamId, query) : undefined, () => fallback.getTeamInfo(teamId, query));
    },
    async getTeamForm(teamId, query) {
      return withFallback(source ? () => source.getTeamForm(teamId, query) : undefined, () => fallback.getTeamForm(teamId, query));
    },
    async getStandings(query) {
      return withFallback(source ? () => source.getStandings(query) : undefined, () => fallback.getStandings(query));
    },
  };
}
