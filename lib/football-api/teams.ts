import { footballApiRequest } from "./client.ts";
import type { ApiTeam, ApiTeamStatistics, FootballApiTeam, FootballApiTeamStatistics, UpcomingMatch } from "./types.ts";

function canonicalize(name: string, fallbackId: string) {
  const canonical = name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return canonical || `team-${fallbackId}`;
}

export function getTeamsFromMatches(matches: UpcomingMatch[]): FootballApiTeam[] {
  const teams = new Map<string, FootballApiTeam>();
  for (const match of matches) {
    teams.set(match.home_team_id, { football_data_id: match.home_team_id, name: match.home_team, canonical_name: canonicalize(match.home_team, match.home_team_id), league: match.league, logo: match.home_logo });
    teams.set(match.away_team_id, { football_data_id: match.away_team_id, name: match.away_team, canonical_name: canonicalize(match.away_team, match.away_team_id), league: match.league, logo: match.away_logo });
  }
  return [...teams.values()];
}

export async function getTeam(teamId: string): Promise<FootballApiTeam | null> {
  const response = await footballApiRequest<ApiTeam[]>("teams", { id: teamId });
  const team = response[0]?.team;
  return team ? { football_data_id: String(team.id), name: team.name, canonical_name: canonicalize(team.name, String(team.id)), league: "", logo: team.logo ?? undefined } : null;
}

function average(value: string | null | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getTeamStatistics(team: FootballApiTeam, leagueId: string, season: number): Promise<FootballApiTeamStatistics | null> {
  const stats = await footballApiRequest<ApiTeamStatistics>("teams/statistics", { team: team.football_data_id, league: leagueId, season });
  if (!stats) return null;
  const goalsFor = average(stats.goals?.for?.average?.total, 1.5);
  const goalsAgainst = average(stats.goals?.against?.average?.total, 1.2);
  const form = (stats.form || "").split("").slice(-10);
  const formPoints = form.reduce((total, value) => total + (value === "W" ? 3 : value === "D" ? 1 : 0), 0);
  return {
    team_id: team.football_data_id,
    team_name: stats.team?.name ?? team.name,
    league: team.league,
    attack: Math.round(Math.min(100, goalsFor / 3 * 100)),
    defense: Math.round(Math.max(0, 100 - goalsAgainst / 3 * 100)),
    form: form.length ? Math.round(formPoints / (form.length * 3) * 100) : 50,
    home_advantage: 65,
    possession: 50,
    goals_for: stats.goals?.for?.total ?? 0,
    goals_against: stats.goals?.against?.total ?? 0,
    xg: goalsFor,
    rank: 0,
    points: 0,
    recent_form: [],
  };
}
