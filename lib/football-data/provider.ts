import { createApiFootballProvider } from "./providers/api-football.ts";
import { createMockFootballProvider } from "./providers/mock.ts";
import type { FootballApiHistory, FootballApiOdds, FootballApiTeam, FootballApiTeamStatistics, UpcomingMatch } from "../football-api/types.ts";

export type FootballDataProviderName = "mock" | "api-football";

export type FootballDataProvider = {
  name: FootballDataProviderName;
  getMatches(): Promise<UpcomingMatch[]>;
  getTeams(matches?: UpcomingMatch[]): Promise<FootballApiTeam[]>;
  getTeamStats(matches?: UpcomingMatch[], teams?: FootballApiTeam[]): Promise<FootballApiTeamStatistics[]>;
  getOdds(matches?: UpcomingMatch[]): Promise<FootballApiOdds[]>;
  getHistory(matches?: UpcomingMatch[]): Promise<FootballApiHistory[]>;
};

export function getFootballDataProvider(): FootballDataProvider {
  const configured = process.env.FOOTBALL_DATA_PROVIDER?.trim().toLowerCase();
  return configured === "api" || configured === "api-football"
    ? createApiFootballProvider()
    : createMockFootballProvider();
}
