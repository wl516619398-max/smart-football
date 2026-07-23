import { getFootballDataProvider } from "@/lib/football/data-provider";
import type { FootballRecentMatch } from "@/lib/football/types";
import { decodeUnicodeDeep } from "@/lib/utils/decode-unicode";

export type TeamFormSummary = {
  teamId: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  averageGoalsFor: number;
  averageGoalsAgainst: number;
  formScore: number;
};

function calculateFormScore(matches: FootballRecentMatch[]) {
  if (!matches.length) return 0;
  const points = matches.reduce((total, match) => {
    if (match.result === "win") return total + 3;
    if (match.result === "draw") return total + 1;
    return total;
  }, 0);
  return Math.round((points / (matches.length * 3)) * 100);
}

export async function getTeamFormSummary(teamId: string): Promise<TeamFormSummary> {
  const normalizedTeamId = teamId.trim();
  if (!normalizedTeamId) throw new Error("teamId is required");

  // The existing API-Football adapter owns the request details. It uses the
  // free-plan-compatible season query and limits the normalized result to 10,
  // rather than bypassing the Provider with a second HTTP implementation.
  const provider = getFootballDataProvider("api-football");
  const form = await provider.getForm(normalizedTeamId, { teamId: normalizedTeamId });
  const matches = form.matches.slice(0, 10);
  const wins = matches.filter((match) => match.result === "win").length;
  const draws = matches.filter((match) => match.result === "draw").length;
  const losses = matches.filter((match) => match.result === "loss").length;
  const goalsFor = matches.reduce((total, match) => total + (Number.isFinite(match.goalsFor) ? match.goalsFor : 0), 0);
  const goalsAgainst = matches.reduce((total, match) => total + (Number.isFinite(match.goalsAgainst) ? match.goalsAgainst : 0), 0);
  const cleanSheets = matches.filter((match) => match.goalsAgainst === 0).length;

  return decodeUnicodeDeep({
    teamId: normalizedTeamId,
    matches: matches.length,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    cleanSheets,
    averageGoalsFor: matches.length ? Number((goalsFor / matches.length).toFixed(2)) : 0,
    averageGoalsAgainst: matches.length ? Number((goalsAgainst / matches.length).toFixed(2)) : 0,
    formScore: calculateFormScore(matches),
  });
}
