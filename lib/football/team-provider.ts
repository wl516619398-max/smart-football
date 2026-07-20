import { getFootballDataProvider } from "@/lib/football/data-provider";
import { getFootballTeamStatsFallback, getFootballMatchesFallback } from "@/data/matches";
import type { FootballRecentMatch, FootballStanding } from "@/lib/football/types";
import type { Team, TeamRecentMatch, TeamStats } from "@/types/team";

export type TeamProvider = {
  getTeam(id: string): Promise<Team | null>;
  getTeamStats(id: string): Promise<TeamStats>;
  getRecentMatches(id: string): Promise<TeamRecentMatch[]>;
};

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

function canonicalTeamId(id: string) {
  const match = getFootballMatchesFallback().find(({ homeTeam, awayTeam }) => homeTeam.name === id || awayTeam.name === id);
  if (!match) return id;
  return match.homeTeam.name === id ? match.homeTeam.id : match.awayTeam.id;
}

function fallbackTeam(id: string): Team | null {
  const canonicalId = canonicalTeamId(id);
  const match = getFootballMatchesFallback().find(({ homeTeam, awayTeam }) => homeTeam.id === canonicalId || awayTeam.id === canonicalId);
  if (!match) return null;
  const isHome = match.homeTeam.id === canonicalId;
  const team = isHome ? match.homeTeam : match.awayTeam;
  const stats = isHome ? match.stats.home : match.stats.away;
  const recent = stats.recentMatches;
  const wins = recent.filter((item) => item.result === "win").length;
  const draws = recent.filter((item) => item.result === "draw").length;
  const losses = recent.filter((item) => item.result === "loss").length;
  return {
    id: team.id,
    name: team.name,
    league: match.league,
    rank: stats.rank,
    points: wins * 3 + draws,
    played: recent.length,
    wins,
    draws,
    losses,
    goalsFor: Math.round(stats.goalsFor),
    goalsAgainst: Math.round(stats.goalsAgainst),
  };
}

function standingFor(standings: FootballStanding[], id: string) {
  return standings.find((standing) => standing.teamId === id);
}

function toTeamRecentMatch(item: FootballRecentMatch, index: number): TeamRecentMatch {
  return {
    id: item.matchId ?? `${index}-${item.date ?? "match"}`,
    opponent: item.opponent ?? "对手待确认",
    date: item.date ?? "",
    score: item.score ?? `${item.goalsFor}-${item.goalsAgainst}`,
    result: item.result,
    venue: item.venue,
  };
}

function deriveStats(team: Team, recent: TeamRecentMatch[], fallbackAttack: number, fallbackDefense: number): TeamStats {
  const scored = recent.reduce((sum, item) => sum + Number(item.score.split("-")[0] || 0), 0);
  const conceded = recent.reduce((sum, item) => sum + Number(item.score.split("-")[1] || 0), 0);
  const averageScored = recent.length ? scored / recent.length : team.played ? team.goalsFor / team.played : 1.5;
  const averageConceded = recent.length ? conceded / recent.length : team.played ? team.goalsAgainst / team.played : 1.2;
  const formPoints = recent.reduce((sum, item) => sum + (item.result === "win" ? 3 : item.result === "draw" ? 1 : 0), 0);
  return {
    attackIndex: clamp(recent.length || team.played ? 45 + averageScored * 24 : fallbackAttack),
    defenseIndex: clamp(recent.length || team.played ? 100 - averageConceded * 22 : fallbackDefense),
    athenaStatusIndex: clamp(recent.length ? 35 + (formPoints / (recent.length * 3)) * 65 : 50),
  };
}

export function createTeamProvider(): TeamProvider {
  const footballProvider = getFootballDataProvider();

  return {
    async getTeam(id) {
      const fallback = fallbackTeam(id);
      try {
        const [teams, standings] = await Promise.all([
          footballProvider.getTeams({ teamId: id }),
          footballProvider.getStandings(),
        ]);
        const remote = teams.find((team) => team.id === id) ?? teams[0];
        const standing = standingFor(standings, id);
        if (!remote && !fallback) return null;
        const stats = getFootballTeamStatsFallback(id);
        return {
          id,
          name: remote?.name ?? fallback?.name ?? id,
          logo: remote?.logo ?? fallback?.logo,
          league: standing?.league ?? fallback?.league ?? "",
          rank: standing?.rank ?? fallback?.rank ?? stats.rank,
          points: standing?.points ?? fallback?.points ?? 0,
          played: standing?.played ?? fallback?.played ?? 0,
          wins: standing?.wins ?? fallback?.wins ?? 0,
          draws: standing?.draws ?? fallback?.draws ?? 0,
          losses: standing?.losses ?? fallback?.losses ?? 0,
          goalsFor: standing?.goalsFor ?? fallback?.goalsFor ?? Math.round(stats.goalsFor),
          goalsAgainst: standing?.goalsAgainst ?? fallback?.goalsAgainst ?? Math.round(stats.goalsAgainst),
        };
      } catch {
        return fallback;
      }
    },

    async getRecentMatches(id) {
      const providerId = canonicalTeamId(id);
      try {
        const form = await footballProvider.getForm(providerId, { teamId: providerId });
        if (form.matches.length) return form.matches.slice(0, 10).map(toTeamRecentMatch);
      } catch {
        // Use the static FootballTeamStats fallback below.
      }
      return getFootballTeamStatsFallback(providerId).recentMatches.slice(0, 10).map(toTeamRecentMatch);
    },

    async getTeamStats(id) {
      const team = await this.getTeam(id) ?? fallbackTeam(id);
      const recent = await this.getRecentMatches(id);
      const fallback = getFootballTeamStatsFallback(canonicalTeamId(id));
      return deriveStats(team ?? { id, name: id, league: "", rank: 20, points: 0, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }, recent, fallback.attack, fallback.defense);
    },
  };
}

export const teamProvider = createTeamProvider();
