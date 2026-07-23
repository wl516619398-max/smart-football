import { getFootballMatchFallback, getFootballMatchesFallback } from "@/data/matches";
import { getUpcomingDateWindow } from "@/lib/football/date-window";
import { getFootballDataProvider } from "@/lib/football/data-provider";
import { filterTodayHotMatches } from "@/lib/football/hot-leagues";
import type { FootballMatch } from "@/lib/football/types";
import type { MatchData } from "@/lib/data-provider/types";
import { decodeUnicodeDeep } from "@/lib/utils/decode-unicode";

export type UpcomingFixturesResult = {
  matches: FootballMatch[];
  source: "football-api" | "mock";
};

export async function getUpcomingFixtures(): Promise<FootballMatch[]> {
  return (await getUpcomingFixturesWithSource()).matches;
}

export async function getUpcomingFixturesWithSource(): Promise<UpcomingFixturesResult> {
  const window = getUpcomingDateWindow();
  const provider = getFootballDataProvider();

  try {
    const matches = await provider.getMatches({ from: window.startKey, to: window.endKey });
    if (matches.length) {
      return {
        matches: decodeUnicodeDeep(matches),
        source: provider.kind === "mock" ? "mock" : "football-api",
      };
    }
  } catch {
    // The unified Provider owns its fallback behavior. Keep a final static fallback here.
  }

  return { matches: decodeUnicodeDeep(getFootballMatchesFallback()), source: "mock" };
}

export async function getTodayHotFixturesWithSource(): Promise<UpcomingFixturesResult> {
  const today = getUpcomingDateWindow(0);
  const provider = getFootballDataProvider();

  try {
    const matches = filterTodayHotMatches(await provider.getMatches({ from: today.startKey, to: today.startKey }));
    if (matches.length) {
      return {
        matches: decodeUnicodeDeep(matches),
        source: provider.kind === "mock" ? "mock" : "football-api",
      };
    }
  } catch {
    // Keep the static Mock fallback below when the configured source is unavailable.
  }

  return {
    matches: filterTodayHotMatches(decodeUnicodeDeep(getFootballMatchesFallback())),
    source: "mock",
  };
}

/** Returns all fixtures scheduled for today in Shanghai time. */
export async function getTodayFixturesWithSource(): Promise<UpcomingFixturesResult> {
  const today = getUpcomingDateWindow(0);
  const provider = getFootballDataProvider();

  try {
    const matches = await provider.getMatches({ from: today.startKey, to: today.startKey });
    if (matches.length) {
      return {
        matches: decodeUnicodeDeep(matches),
        source: provider.kind === "mock" ? "mock" : "football-api",
      };
    }
  } catch {
    // Continue to the static fallback.
  }

  return { matches: decodeUnicodeDeep(getFootballMatchesFallback()), source: "mock" };
}

export async function getFixtureDetail(id: string): Promise<FootballMatch | undefined> {
  const provider = getFootballDataProvider();

  try {
    const match = await provider.getMatch(id);
    if (match) return decodeUnicodeDeep(match);
  } catch {
    // Fall through to the static Mock fallback.
  }

  return decodeUnicodeDeep(getFootballMatchFallback(id));
}

function toMatchData(match: FootballMatch): MatchData {
  return {
    match_id: match.id,
    league: match.league,
    home_team: { id: match.homeTeam.id, name: match.homeTeam.name, logo: match.homeTeam.logo },
    away_team: { id: match.awayTeam.id, name: match.awayTeam.name, logo: match.awayTeam.logo },
    match_time: match.date,
    home_team_stats: match.stats.home,
    away_team_stats: match.stats.away,
    recent_form: { home: match.stats.home.recentMatches, away: match.stats.away.recentMatches },
    head_to_head: { matches: [], home_wins: 0, draws: 0, away_wins: 0 },
    odds: { home: match.odds.homeWin, draw: match.odds.draw, away: match.odds.awayWin },
    injuries: match.injuries,
  };
}

export async function getUpcomingMatchData(): Promise<MatchData[]> {
  const provider = getFootballDataProvider();
  return decodeUnicodeDeep((await provider.getMatches()).map(toMatchData));
}

export async function getMatchData(id: string): Promise<MatchData | null> {
  const provider = getFootballDataProvider();
  const match = await provider.getMatch(id);
  return match ? decodeUnicodeDeep(toMatchData(match)) : null;
}
