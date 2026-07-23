import { getMatchData } from "@/lib/football/fixture-service";
import { mockFootballApiClient } from "@/lib/football/api-client";
import type { HeadToHeadData, MatchData } from "@/lib/data-provider/types";
import type { FootballRecentMatch } from "@/lib/football/types";

export type MatchHistoryData = {
  recent_form: MatchData["recent_form"];
  head_to_head: HeadToHeadData;
};

export async function getRecentForm(teamId: string): Promise<FootballRecentMatch[]> {
  const matches = await getMatchDataForTeam(teamId);
  return matches?.recent_form.home.concat(matches.recent_form.away).slice(0, 10) ?? [];
}

export async function getHeadToHead(matchId: string): Promise<HeadToHeadData> {
  const match = await getMatchData(matchId);
  return mockFootballApiClient.request(match?.head_to_head ?? { matches: [], home_wins: 0, draws: 0, away_wins: 0 });
}

export async function getMatchHistory(matchId: string): Promise<MatchHistoryData | null> {
  const match = await getMatchData(matchId);
  if (!match) return null;
  return mockFootballApiClient.request({ recent_form: match.recent_form, head_to_head: match.head_to_head });
}

async function getMatchDataForTeam(teamId: string): Promise<MatchData | null> {
  const candidates = ["manchester-united-vs-liverpool", "real-madrid-vs-barcelona", "bayern-munich-vs-borussia-dortmund"];
  for (const matchId of candidates) {
    const match = await getMatchData(matchId);
    if (match?.home_team.id === teamId || match?.away_team.id === teamId) return match;
  }
  return null;
}
