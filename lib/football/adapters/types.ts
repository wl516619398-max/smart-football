import type { FootballDataQuery, FootballProviderKind } from "@/lib/football/data-provider";
import type {
  FootballMatch,
  FootballStanding,
  FootballTeam,
  FootballTeamForm,
} from "@/lib/football/types";

export type FootballApiAdapter = {
  provider: FootballProviderKind;
  getUpcomingMatches(query?: FootballDataQuery): Promise<FootballMatch[]>;
  getTeamInfo(teamId?: string, query?: FootballDataQuery): Promise<FootballTeam[]>;
  getTeamForm(teamId: string, query?: FootballDataQuery): Promise<FootballTeamForm>;
  getStandings(query?: FootballDataQuery): Promise<FootballStanding[]>;
};
