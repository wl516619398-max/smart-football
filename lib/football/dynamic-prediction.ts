import { predictMatch, type MatchPrediction } from "@/lib/ai/predictor";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { FootballMatch, FootballRecentMatch, FootballTeamStats } from "@/lib/football/types";

type HistoryRow = Record<string, unknown>;

let historyCache: { expiresAt: number; rows: HistoryRow[] } | null = null;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value).trim();
}

function number(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sameName(left: string, right: string) {
  return left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();
}

function sideMatches(row: HistoryRow, side: "home" | "away", teamId: string, teamName: string) {
  const rowId = text(row[`${side}_team_id`]);
  const rowName = text(row[`${side}_team`]);
  return (rowId && rowId === teamId) || (!rowId && sameName(rowName, teamName)) || (rowId !== teamId && sameName(rowName, teamName));
}

function score(row: HistoryRow) {
  const home = number(row.home_score);
  const away = number(row.away_score);
  return home === null || away === null ? null : { home, away };
}

async function getHistoryRows() {
  if (historyCache && historyCache.expiresAt > Date.now()) return historyCache.rows;
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("football_match_history")
    .select("external_id,home_team_id,away_team_id,home_team,away_team,match_time,home_score,away_score")
    .order("match_time", { ascending: false })
    .limit(1000);

  if (error || !Array.isArray(data)) return [];
  const rows = data as HistoryRow[];
  historyCache = { expiresAt: Date.now() + 60_000, rows };
  return rows;
}

function summarizeTeam(teamId: string, teamName: string, rows: HistoryRow[]): FootballTeamStats | null {
  const matches = rows
    .map((row): FootballRecentMatch | null => {
      const result = score(row);
      if (!result) return null;
      const isHome = sideMatches(row, "home", teamId, teamName);
      const isAway = sideMatches(row, "away", teamId, teamName);
      if (!isHome && !isAway) return null;
      const goalsFor = isHome ? result.home : result.away;
      const goalsAgainst = isHome ? result.away : result.home;
      return {
        matchId: text(row.external_id),
        opponent: isHome ? text(row.away_team) : text(row.home_team),
        date: text(row.match_time),
        score: `${goalsFor}-${goalsAgainst}`,
        result: goalsFor > goalsAgainst ? "win" : goalsFor < goalsAgainst ? "loss" : "draw",
        goalsFor,
        goalsAgainst,
        venue: isHome ? "home" : "away",
      };
    })
    .filter((item): item is FootballRecentMatch => Boolean(item))
    .slice(0, 10);

  if (!matches.length) return null;
  const wins = matches.filter((item) => item.result === "win").length;
  const draws = matches.filter((item) => item.result === "draw").length;
  const goalsFor = matches.reduce((total, item) => total + item.goalsFor, 0);
  const goalsAgainst = matches.reduce((total, item) => total + item.goalsAgainst, 0);
  const form = ((wins * 3 + draws) / (matches.length * 3)) * 100;
  const averageFor = goalsFor / matches.length;
  const averageAgainst = goalsAgainst / matches.length;
  const homeMatches = matches.filter((item) => item.venue === "home");
  const homeWins = homeMatches.filter((item) => item.result === "win").length;
  const homeAdvantage = homeMatches.length ? (homeWins / homeMatches.length) * 100 : 50;

  return {
    teamId,
    attack: Math.min(95, Math.max(20, 35 + averageFor * 22 + form * 0.18)),
    defense: Math.min(95, Math.max(20, 88 - averageAgainst * 22 + form * 0.1)),
    form,
    homeAdvantage,
    possession: 50,
    recentMatches: matches,
    goalsFor,
    goalsAgainst,
    xG: averageFor,
    rank: 20,
  };
}

function headToHead(homeTeam: FootballMatch["homeTeam"], awayTeam: FootballMatch["awayTeam"], rows: HistoryRow[]) {
  const matches = rows.filter((row) => {
    const direct = sideMatches(row, "home", homeTeam.id, homeTeam.name) && sideMatches(row, "away", awayTeam.id, awayTeam.name);
    const reversed = sideMatches(row, "home", awayTeam.id, awayTeam.name) && sideMatches(row, "away", homeTeam.id, homeTeam.name);
    return score(row) && (direct || reversed);
  });
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  for (const row of matches) {
    const result = score(row);
    if (!result) continue;
    const homeIsStoredHome = sideMatches(row, "home", homeTeam.id, homeTeam.name);
    const homeScore = homeIsStoredHome ? result.home : result.away;
    const awayScore = homeIsStoredHome ? result.away : result.home;
    if (homeScore > awayScore) homeWins += 1;
    else if (homeScore < awayScore) awayWins += 1;
    else draws += 1;
  }
  return { total: matches.length, homeWins, draws, awayWins };
}

function adjustForHeadToHead(prediction: MatchPrediction, h2h: ReturnType<typeof headToHead>): MatchPrediction {
  if (!h2h.total) return prediction;
  const adjustment = Math.min(6, Math.max(-6, (h2h.homeWins - h2h.awayWins) * 1.5));
  const drawAdjustment = (h2h.draws / h2h.total - 1 / 3) * 4;
  const raw = [prediction.homeWin + adjustment, prediction.draw + drawAdjustment, prediction.awayWin - adjustment];
  const rounded = raw.map((value) => Math.max(1, Math.round(value)));
  const difference = 100 - rounded.reduce((sum, value) => sum + value, 0);
  rounded[0] += difference;
  const [homeWin, draw, awayWin] = rounded;
  const confidence = Math.min(93, Math.max(52, Math.round(55 + Math.abs(Math.max(homeWin, draw, awayWin) - Math.min(homeWin, draw, awayWin)) * 0.45)));
  const recommendation = homeWin >= awayWin && homeWin >= draw ? "\u4e3b\u80dc" : awayWin >= draw ? "\u5ba2\u80dc" : "\u5e73\u5c40";
  return { ...prediction, homeWin, draw, awayWin, confidence, recommendation };
}

export async function getDynamicMatchPrediction(match: FootballMatch): Promise<MatchPrediction | null> {
  const rows = await getHistoryRows();
  const homeStats = summarizeTeam(match.homeTeam.id, match.homeTeam.name, rows);
  const awayStats = summarizeTeam(match.awayTeam.id, match.awayTeam.name, rows);
  if (!homeStats || !awayStats) return null;

  const enrichedMatch: FootballMatch = { ...match, stats: { home: homeStats, away: awayStats } };
  return adjustForHeadToHead(predictMatch(enrichedMatch), headToHead(match.homeTeam, match.awayTeam, rows));
}
