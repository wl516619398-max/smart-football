import { footballApiRequest } from "@/lib/football/api";
import type { FootballTeamStats } from "@/lib/football/types";
import { getFootballTeamStatsFallback } from "@/data/matches";

export async function getTeamStats(teamId: string): Promise<FootballTeamStats> {
  const remoteStats = await footballApiRequest<FootballTeamStats>(`teams/${encodeURIComponent(teamId)}/stats`);
  return remoteStats ?? getFootballTeamStatsFallback(teamId);
}
