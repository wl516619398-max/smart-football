import { footballApiRequest } from "@/lib/football/api";
import type { FootballMatch } from "@/lib/football/types";
import { getFootballMatchFallback, getFootballMatchesFallback } from "@/data/matches";

export async function getUpcomingMatches(): Promise<FootballMatch[]> {
  const remoteMatches = await footballApiRequest<FootballMatch[]>("matches/upcoming");
  return remoteMatches ?? getFootballMatchesFallback();
}

export async function getMatchDetail(id: string): Promise<FootballMatch | undefined> {
  const remoteMatch = await footballApiRequest<FootballMatch>(`matches/${encodeURIComponent(id)}`);
  return remoteMatch ?? getFootballMatchFallback(id);
}
