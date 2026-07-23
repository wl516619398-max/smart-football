import { createFootballApiDataProvider } from "@/lib/data-provider/football-api";
import { createMockDataProvider } from "@/lib/data-provider/mock-provider";
import type { MatchData, MatchDataProvider, MatchDataQuery } from "@/lib/data-provider/types";

function configuredProvider() {
  const configured = (process.env.FOOTBALL_DATA_PROVIDER ?? process.env.FOOTBALL_API_PROVIDER ?? "mock").trim().toLowerCase();
  return configured === "api" || configured === "thesportsdb" ? createFootballApiDataProvider() : createMockDataProvider();
}

export function getMatchDataProvider(): MatchDataProvider {
  const selected = configuredProvider();
  const fallback = createMockDataProvider();

  return {
    name: selected.name,
    async getMatches(query?: MatchDataQuery): Promise<MatchData[]> {
      try {
        const matches = await selected.getMatches(query);
        if (matches.length) return matches;
      } catch {
        // Fall through to the stable local provider.
      }
      return fallback.getMatches(query);
    },
    async getMatch(matchId: string): Promise<MatchData | null> {
      try {
        const match = await selected.getMatch(matchId);
        if (match) return match;
      } catch {
        // Fall through to the stable local provider.
      }
      return fallback.getMatch(matchId);
    },
  };
}

export type { MatchData, MatchDataProvider, MatchDataQuery } from "@/lib/data-provider/types";
