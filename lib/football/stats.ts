import { footballApiRawRequest } from "@/lib/football/api";
import { getFootballDataProvider } from "@/lib/football/data-provider";
import { getFootballTeamStatsFallback } from "@/data/matches";
import { resolveFootballTeamId, type FootballTeamReference } from "@/lib/football/team-id";
import type { ApiFootballFixture, FootballRecentMatch } from "@/lib/football/types";
import { decodeUnicodeDeep } from "@/lib/utils/decode-unicode";

export type TeamRecentStats = {
  team: string;
  source: "api" | "fallback";
  recentMatches: FootballRecentMatch[];
  last10: { win: number; draw: number; loss: number };
  goals: { scored: number; conceded: number };
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
    { last10: { win: 0, draw: 0, loss: 0 }, goals: { scored: 0, conceded: 0 } },
  );
}

function fallbackTeamName(team: FootballTeamReference, teamId: string) {
  return typeof team === "string" ? team : team.name || teamId;
}

export async function getTeamRecentStats(team: FootballTeamReference): Promise<TeamRecentStats> {
  const teamId = await resolveFootballTeamId(team) ?? (typeof team === "string" ? team.trim() : String(team.id ?? "").trim());
  const provider = getFootballDataProvider();

  if (teamId) {
    try {
      const form = await provider.getForm(teamId, { teamId });
      if (form.matches.length) {
        return decodeUnicodeDeep({
          team: fallbackTeamName(team, teamId),
          source: provider.kind === "mock" ? "fallback" : "api",
          recentMatches: form.matches.slice(0, 10),
          ...summarizeMatches(form.matches),
        });
      }
    } catch {
      // Continue with the static Mock fallback.
    }
  }

  const fallbackStats = getFootballTeamStatsFallback(teamId);
  const fallbackMatches = fallbackStats.recentMatches.slice(0, 10);
  return decodeUnicodeDeep({
    team: fallbackTeamName(team, teamId),
    source: "fallback",
    recentMatches: fallbackMatches,
    ...summarizeMatches(fallbackMatches),
  });
}

export async function getTeamHeadToHeadMatches(homeTeam: FootballTeamReference, awayTeam: FootballTeamReference): Promise<TeamHeadToHeadMatch[]> {
  const [homeTeamId, awayTeamId] = await Promise.all([
    resolveFootballTeamId(homeTeam),
    resolveFootballTeamId(awayTeam),
  ]);
  if (!homeTeamId || !awayTeamId) return [];

  const response = await footballApiRawRequest<ApiFootballFixture[]>("fixtures/headtohead", { h2h: `${homeTeamId}-${awayTeamId}` });
  const fixtures = Array.isArray(response?.response) ? response.response : [];
  return decodeUnicodeDeep([...fixtures]
    .filter((fixture) => Number.isFinite(fixture.goals?.home) && Number.isFinite(fixture.goals?.away))
    .sort((left, right) => Date.parse(right.fixture.date) - Date.parse(left.fixture.date))
    .slice(0, 10)
    .map((fixture) => ({
      home: fixture.teams.home.name,
      away: fixture.teams.away.name,
      score: `${fixture.goals.home}:${fixture.goals.away}`,
      date: fixture.fixture.date.slice(0, 10),
    })));
}
