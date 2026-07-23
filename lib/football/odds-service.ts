import { getMatchData } from "@/lib/football/fixture-service";
import { mockFootballApiClient } from "@/lib/football/api-client";
import type { MatchData } from "@/lib/data-provider/types";

export type MatchOdds = MatchData["odds"];

export async function getMatchOdds(matchId: string): Promise<MatchOdds | null> {
  const match = await getMatchData(matchId);
  return match ? mockFootballApiClient.request(match.odds) : null;
}
