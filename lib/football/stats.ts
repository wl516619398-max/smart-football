import { footballApiRawRequest, footballApiRequestUrl } from "@/lib/football/api";
import { getFootballDataProvider } from "@/lib/football/data-provider";
import { getFootballSeasonCandidates } from "@/lib/football/season";
import { resolveFootballTeamId, type FootballTeamReference } from "@/lib/football/team-id";
import type { ApiFootballFixture, FootballRecentMatch } from "@/lib/football/types";

export type TeamRecentStats = {
  team: string;
  source: "api" | "fallback";
  recentMatches: FootballRecentMatch[];
  last10: {
    win: number;
    draw: number;
    loss: number;
  };
  goals: {
    scored: number;
    conceded: number;
  };
};

export type TeamHeadToHeadMatch = {
  home: string;
  away: string;
  score: string;
  date: string;
};

function summarizeMatches(matches: FootballRecentMatch[]) {
  return matches.slice(0, 10).reduce(
    (summary, match) => {
      if (match.result === "win") summary.last10.win += 1;
      if (match.result === "draw") summary.last10.draw += 1;
      if (match.result === "loss") summary.last10.loss += 1;
      summary.goals.scored += Number.isFinite(match.goalsFor) ? match.goalsFor : 0;
      summary.goals.conceded += Number.isFinite(match.goalsAgainst) ? match.goalsAgainst : 0;
      return summary;
    },
    {
      last10: { win: 0, draw: 0, loss: 0 },
      goals: { scored: 0, conceded: 0 },
    },
  );
}

function toFiniteNumber(value: unknown): number | null {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getSeasonCandidates() {
  return getFootballSeasonCandidates();
}

function parseApiFootballFixture(fixture: ApiFootballFixture, teamId: string): { match: FootballRecentMatch; teamName: string } | null {
  const homeTeamId = String(fixture.teams?.home?.id ?? "");
  const awayTeamId = String(fixture.teams?.away?.id ?? "");
  const isHome = homeTeamId === teamId;
  const isAway = awayTeamId === teamId;
  if (!isHome && !isAway) return null;

  const homeGoals = toFiniteNumber(fixture.goals?.home);
  const awayGoals = toFiniteNumber(fixture.goals?.away);
  if (homeGoals === null || awayGoals === null) return null;

  const goalsFor = isHome ? homeGoals : awayGoals;
  const goalsAgainst = isHome ? awayGoals : homeGoals;
  return {
    teamName: isHome ? fixture.teams.home.name : fixture.teams.away.name,
    match: {
      matchId: String(fixture.fixture.id),
      opponent: isHome ? fixture.teams.away.name : fixture.teams.home.name,
      date: fixture.fixture.date,
      score: `${goalsFor}-${goalsAgainst}`,
      result: goalsFor > goalsAgainst ? "win" : goalsFor < goalsAgainst ? "loss" : "draw",
      goalsFor,
      goalsAgainst,
      venue: isHome ? "home" : "away",
    },
  };
}

async function getApiFootballRecentStats(team: FootballTeamReference): Promise<TeamRecentStats | null> {
  const teamId = await resolveFootballTeamId(team);
  if (!teamId) return null;
  for (const season of getSeasonCandidates()) {
    console.info("[football-stats] request URL:", footballApiRequestUrl("fixtures", { team: teamId, season }));
    const rawResponse = await footballApiRawRequest<ApiFootballFixture[]>("fixtures", { team: teamId, season });
    console.info(`[Football stats] Football API raw response season=${season}:`, JSON.stringify(rawResponse, null, 2));
    const fixtures = Array.isArray(rawResponse?.response)
      ? [...rawResponse.response]
        .sort((left, right) => Date.parse(right.fixture.date) - Date.parse(left.fixture.date))
        .slice(0, 10)
      : [];
    console.info(`[football-stats] teamId=${teamId} season=${season} fixtures length=${fixtures.length}`);
    if (!fixtures.length) continue;

    const parsed = fixtures
      .map((fixture) => parseApiFootballFixture(fixture, teamId))
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .slice(0, 10);
    if (!parsed.length) continue;

    return {
      team: parsed[0].teamName,
      source: "api",
      recentMatches: parsed.map((item) => item.match),
      ...summarizeMatches(parsed.map((item) => item.match)),
    };
  }

  return null;
}

export async function getTeamRecentStats(team: FootballTeamReference): Promise<TeamRecentStats> {
  const normalizedTeamId = typeof team === "string"
    ? team.trim()
    : String(team.football_data_id || team.api_football_id || team.thesportsdb_id || team.id || "").trim();
  const apiStats = await getApiFootballRecentStats(team);
  if (apiStats) return apiStats;

  const provider = getFootballDataProvider();
  const providerTeamId = normalizedTeamId;
  const [form, teams] = await Promise.all([
    provider.getForm(providerTeamId, { teamId: providerTeamId }),
    provider.getTeams({ teamId: providerTeamId }),
  ]);
  const summary = summarizeMatches(form.matches);
  const teamInfo = teams.find((item) => item.id === providerTeamId) ?? teams[0];

  return {
    team: teamInfo?.name ?? (typeof team === "string" ? team : team.name || normalizedTeamId),
    source: "fallback",
    recentMatches: form.matches.slice(0, 10),
    ...summary,
  };
}

export async function getTeamHeadToHeadMatches(homeTeam: FootballTeamReference, awayTeam: FootballTeamReference): Promise<TeamHeadToHeadMatch[]> {
  const [homeTeamId, awayTeamId] = await Promise.all([
    resolveFootballTeamId(homeTeam),
    resolveFootballTeamId(awayTeam),
  ]);
  if (!homeTeamId || !awayTeamId) return [];
  const response = await footballApiRawRequest<ApiFootballFixture[]>("fixtures/headtohead", { h2h: `${homeTeamId}-${awayTeamId}` });
  const fixtures = Array.isArray(response?.response) ? response.response : [];
  return [...fixtures]
    .filter((fixture) => Number.isFinite(fixture.goals?.home) && Number.isFinite(fixture.goals?.away))
    .sort((left, right) => Date.parse(right.fixture.date) - Date.parse(left.fixture.date))
    .slice(0, 10)
    .map((fixture) => ({
      home: fixture.teams.home.name,
      away: fixture.teams.away.name,
      score: `${fixture.goals.home}:${fixture.goals.away}`,
      date: fixture.fixture.date.slice(0, 10),
    }));
}
