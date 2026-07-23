import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchData, MatchTeamStats } from "@/lib/data-provider/types";
import type { FootballRecentMatch } from "@/lib/football/types";
import { decodeUnicodeDeep } from "@/lib/utils/decode-unicode";

type MatchRow = {
  external_id: string;
  league: string | null;
  home_team_id: string | null;
  home_team: string | null;
  away_team_id: string | null;
  away_team: string | null;
  match_time: string;
  status: string | null;
  venue?: string | null;
  home_logo?: string | null;
  away_logo?: string | null;
};

type TeamStatsRow = {
  team_id: string;
  team_name: string;
  attack: number | null;
  defense: number | null;
  form: number | null;
  home_advantage: number | null;
  possession: number | null;
  goals_for: number | null;
  goals_against: number | null;
  xg: number | null;
  rank: number | null;
  points: number | null;
  recent_form: FootballRecentMatch[] | null;
};

type OddsRow = { match_id: string; home_odds: number | null; draw_odds: number | null; away_odds: number | null };
const numberOr = (value: number | null | undefined, fallback: number) => Number.isFinite(value) ? Number(value) : fallback;

function toTeamStats(row: TeamStatsRow | undefined): MatchTeamStats {
  return {
    attack: numberOr(row?.attack, 50), defense: numberOr(row?.defense, 50), form: numberOr(row?.form, 50),
    homeAdvantage: numberOr(row?.home_advantage, 50), possession: numberOr(row?.possession, 50),
    goalsFor: numberOr(row?.goals_for, 0), goalsAgainst: numberOr(row?.goals_against, 0), xG: numberOr(row?.xg, 0),
    rank: numberOr(row?.rank, 0), points: row?.points ?? undefined,
  };
}

function toMatchData(match: MatchRow, teamRows: TeamStatsRow[], odds?: OddsRow): MatchData {
  const homeId = match.home_team_id ?? `${match.external_id}-home`;
  const awayId = match.away_team_id ?? `${match.external_id}-away`;
  const homeName = match.home_team ?? "主队";
  const awayName = match.away_team ?? "客队";
  const homeStats = teamRows.find((row) => row.team_id === homeId);
  const awayStats = teamRows.find((row) => row.team_id === awayId);
  return decodeUnicodeDeep({
    match_id: match.external_id, league: match.league ?? "",
    home_team: { id: homeId, name: homeName, logo: match.home_logo ?? undefined },
    away_team: { id: awayId, name: awayName, logo: match.away_logo ?? undefined },
    match_time: match.match_time, home_team_stats: toTeamStats(homeStats), away_team_stats: toTeamStats(awayStats),
    recent_form: { home: homeStats?.recent_form ?? [], away: awayStats?.recent_form ?? [] },
    head_to_head: { matches: [], home_wins: 0, draws: 0, away_wins: 0 },
    odds: { home: numberOr(odds?.home_odds, 0), draw: numberOr(odds?.draw_odds, 0), away: numberOr(odds?.away_odds, 0) },
    injuries: [],
  });
}

export async function getStoredMatchData(matchId?: string): Promise<MatchData[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase.from("matches").select("external_id,league,home_team_id,home_team,away_team_id,away_team,match_time,status,venue,home_logo,away_logo").order("match_time", { ascending: true });
  if (matchId) query = query.eq("external_id", matchId);
  const { data: matches, error: matchesError } = await query;
  if (matchesError || !matches?.length) return [];

  const teamIds = [...new Set(matches.flatMap((row) => [row.home_team_id, row.away_team_id]).filter((id): id is string => Boolean(id)))];
  const [statsResult, oddsResult] = await Promise.all([
    teamIds.length ? supabase.from("team_stats").select("team_id,team_name,attack,defense,form,home_advantage,possession,goals_for,goals_against,xg,rank,points,recent_form").in("team_id", teamIds) : Promise.resolve({ data: [], error: null }),
    supabase.from("odds").select("match_id,home_odds,draw_odds,away_odds").in("match_id", matches.map((row) => row.external_id)),
  ]);
  if (statsResult.error || oddsResult.error) return [];
  return matches.map((match) => toMatchData(match as MatchRow, (statsResult.data ?? []) as TeamStatsRow[], ((oddsResult.data ?? []) as OddsRow[]).find((row) => row.match_id === match.external_id)));
}
