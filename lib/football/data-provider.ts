import { getFootballApiAdapter } from "@/lib/football/adapters";
import type {
  FootballMatch,
  FootballRecentMatch,
  FootballStanding,
  FootballTeam,
  FootballTeamForm,
} from "@/lib/football/types";
import { decodeUnicodeDeep } from "@/lib/utils/decode-unicode";

export type FootballProviderKind = "mock" | "api" | "api-football" | "database" | "external";

export type FootballDataQuery = {
  matchId?: string;
  league?: string;
  teamId?: string;
  from?: string;
  to?: string;
};

export type FootballDataProvider = {
  kind: FootballProviderKind;
  getMatches(query?: FootballDataQuery): Promise<FootballMatch[]>;
  getMatch(matchId: string): Promise<FootballMatch | null>;
  getTeams(query?: FootballDataQuery): Promise<FootballTeam[]>;
  getStandings(query?: FootballDataQuery): Promise<FootballStanding[]>;
  getForm(teamId: string, query?: FootballDataQuery): Promise<FootballTeamForm>;
};

export function getFootballDataProvider(
  kind?: FootballProviderKind,
): FootballDataProvider {
  const adapter = getFootballApiAdapter(kind);
  return {
    kind: adapter.provider,
  getMatches: async (query) => decodeUnicodeDeep(await adapter.getUpcomingMatches(query)),
    getTeams: async (query) => decodeUnicodeDeep(await adapter.getTeamInfo(query?.teamId, query)),
    getStandings: async (query) => decodeUnicodeDeep(await adapter.getStandings(query)),
  getForm: async (teamId, query) => decodeUnicodeDeep(await adapter.getTeamForm(teamId, query)),
  getMatch: async (matchId) => {
    const matches = await adapter.getUpcomingMatches({ matchId });
    return matches[0] ? decodeUnicodeDeep(matches[0]) : null;
  },
  };
}

export const footballDataProvider = getFootballDataProvider();

export const getMatches = (query?: FootballDataQuery) =>
  footballDataProvider.getMatches(query);

export const getTeams = (query?: FootballDataQuery) =>
  footballDataProvider.getTeams(query);

export const getStandings = (query?: FootballDataQuery) =>
  footballDataProvider.getStandings(query);

export const getForm = (teamId: string, query?: FootballDataQuery) =>
  footballDataProvider.getForm(teamId, query);

export const getMatch = (matchId: string) => footballDataProvider.getMatch(matchId);

export type { FootballRecentMatch, FootballStanding, FootballTeam, FootballTeamForm };
