export {};

type FootballMatch = {
  id: string;
  league: string;
  homeTeam: { id: string; name: string; shortName: string; logo?: string };
  awayTeam: { id: string; name: string; shortName: string; logo?: string };
  date: string;
  venue: string;
  odds: { homeWin: number; draw: number; awayWin: number };
  stats: { home: Record<string, unknown>; away: Record<string, unknown> };
  injuries: unknown[];
};

const apiKey = process.env.FOOTBALL_API_KEY?.trim();
const baseUrl = (process.env.FOOTBALL_API_URL?.trim() || process.env.FOOTBALL_API_BASE_URL?.trim() || "https://v3.football.api-sports.io").replace(/\/$/, "");
const season = Number(process.env.FOOTBALL_SEASON || 2025);
const league = process.env.FOOTBALL_LEAGUE_ID || "39";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function requestApi<T>(path: string, params: Record<string, string | number>) {
  const url = new URL(`${baseUrl}/${path.replace(/^\//, "")}`);
  Object.entries(params).forEach(([name, value]) => url.searchParams.set(name, String(value)));
  const response = await fetch(url, {
    headers: { Accept: "application/json", "x-apisports-key": apiKey ?? "" },
  });
  const body = await response.text();
  let payload: { errors?: unknown; response?: T };
  try {
    payload = JSON.parse(body) as { errors?: unknown; response?: T };
  } catch {
    throw new Error(`${path} HTTP ${response.status}: 返回内容不是 JSON`);
  }
  const hasErrors = payload.errors && (Array.isArray(payload.errors) ? payload.errors.length > 0 : Object.keys(payload.errors as object).length > 0);
  if (!response.ok || hasErrors) {
    throw new Error(`${path} HTTP ${response.status}: ${JSON.stringify(payload.errors ?? body.slice(0, 300))}`);
  }
  return payload.response ?? null;
}

function normalizeMatch(item: Record<string, any>): FootballMatch {
  const fixture = item.fixture;
  const leagueData = item.league;
  const home = item.teams.home;
  const away = item.teams.away;
  const homeId = String(home.id);
  const awayId = String(away.id);
  const neutralStats = (teamId: string) => ({ teamId, attack: 50, defense: 50, form: 50, homeAdvantage: 50, possession: 50, recentMatches: [], goalsFor: 0, goalsAgainst: 0, xG: 1.5, rank: 20 });
  return {
    id: String(fixture.id),
    league: String(leagueData.name),
    homeTeam: { id: homeId, name: String(home.name), shortName: String(home.name), logo: home.logo ?? undefined },
    awayTeam: { id: awayId, name: String(away.name), shortName: String(away.name), logo: away.logo ?? undefined },
    date: String(fixture.date),
    venue: String(fixture.venue?.name ?? ""),
    odds: { homeWin: 33, draw: 34, awayWin: 33 },
    stats: { home: neutralStats(homeId), away: neutralStats(awayId) },
    injuries: [],
  };
}

function isFootballMatch(value: FootballMatch): boolean {
  return Boolean(value.id && value.league && value.date && value.homeTeam.id && value.homeTeam.name && value.awayTeam.id && value.awayTeam.name && value.stats.home && value.stats.away);
}

function printResult(label: string, value: unknown) {
  console.info(`[api-football-test] ${label}:`, JSON.stringify(value, null, 2));
}

async function main() {
  if (!apiKey) throw new Error("FOOTBALL_API_KEY 未配置");

  console.info("[api-football-test] API key: configured");
  console.info(`[api-football-test] base URL: ${baseUrl}`);
  console.info(`[api-football-test] provider: api-football`);

  const today = new Date();
  const fixtures = await requestApi<Record<string, any>[]>("fixtures", {
    from: formatDate(today),
    to: formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)),
  });
  const matches = (fixtures ?? []).map(normalizeMatch).filter(isFootballMatch);
  const match = matches.find((item) => /^\d+$/.test(item.id) && /^\d+$/.test(item.homeTeam.id) && /^\d+$/.test(item.awayTeam.id));
  if (!match) throw new Error("fixtures 接口没有返回真实比赛，可能是日期无赛程、Key 无权限或达到 API 限额");
  printResult("fixtures", { count: matches.length, firstMatch: match });

  const teams = await requestApi<Array<{ team: { id: number; name: string; logo?: string | null } }>>("teams", { id: match.homeTeam.id });
  if (!teams?.[0]?.team) throw new Error(`teams 接口没有返回球队：${match.homeTeam.id}`);
  printResult("teams", teams[0].team);

  const statistics = await requestApi<Record<string, any>>("teams/statistics", { team: match.homeTeam.id, league, season });
  if (!statistics?.team) throw new Error(`teams/statistics 没有返回数据：team=${match.homeTeam.id}, league=${league}, season=${season}`);
  printResult("teams/statistics", {
    team: statistics.team,
    league: statistics.league,
    form: statistics.form,
    goals: statistics.goals,
  });

  console.info("[api-football-test] SUCCESS: 已返回一场真实 API-Football 比赛数据");
}

main().catch((error) => {
  console.error("[api-football-test] FAILED:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
