import { getFootballApiAdapter } from "@/lib/football/adapters";
import type {
  FootballMatch,
  FootballRecentMatch,
  FootballStanding,
  FootballTeam,
  FootballTeamForm,
} from "@/lib/football/types";

export type FootballProviderKind = "mock" | "api" | "database" | "external";

export type FootballDataQuery = {
  league?: string;
  teamId?: string;
  from?: string;
  to?: string;
};

export type FootballDataProvider = {
  kind: FootballProviderKind;
  getMatches(query?: FootballDataQuery): Promise<FootballMatch[]>;
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
    getMatches: (query) => adapter.getUpcomingMatches(query),
    getTeams: (query) => adapter.getTeamInfo(query?.teamId, query),
    getStandings: (query) => adapter.getStandings(query),
    getForm: (teamId, query) => adapter.getTeamForm(teamId, query),
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

export type { FootballRecentMatch, FootballStanding, FootballTeam, FootballTeamForm };
