import { getFootballMatchFallback, getFootballMatchesFallback } from "@/data/matches";
import type { FootballMatch, FootballTeamStats } from "@/lib/football/types";
import { decodeUnicodeDeep } from "@/lib/utils/decode-unicode";
import type { MatchData, MatchDataProvider, MatchDataQuery, MatchTeamStats } from "@/lib/data-provider/types";

function toTeamStats(stats: FootballTeamStats): MatchTeamStats {
  return {
    attack: stats.attack,
    defense: stats.defense,
    form: stats.form,
    homeAdvantage: stats.homeAdvantage,
    possession: stats.possession,
    goalsFor: stats.goalsFor,
    goalsAgainst: stats.goalsAgainst,
    xG: stats.xG,
    rank: stats.rank,
  };
}

function toMatchData(match: FootballMatch): MatchData {
  return decodeUnicodeDeep({
    match_id: match.id,
    league: match.league,
    home_team: match.homeTeam,
    away_team: match.awayTeam,
    match_time: match.date,
    home_team_stats: toTeamStats(match.stats.home),
    away_team_stats: toTeamStats(match.stats.away),
    recent_form: {
      home: match.stats.home.recentMatches,
      away: match.stats.away.recentMatches,
    },
    head_to_head: {
      matches: [],
      home_wins: 0,
      draws: 0,
      away_wins: 0,
    },
    odds: {
      home: match.odds.homeWin,
      draw: match.odds.draw,
      away: match.odds.awayWin,
    },
    injuries: match.injuries,
  });
}

function filterMatches(matches: MatchData[], query?: MatchDataQuery) {
  return matches.filter((match) => {
    if (query?.matchId && match.match_id !== query.matchId) return false;
    if (query?.league && match.league !== query.league) return false;
    if (query?.from && match.match_time < query.from) return false;
    if (query?.to && match.match_time > query.to) return false;
    return true;
  });
}

export function createMockDataProvider(): MatchDataProvider {
  return {
    name: "mock",
    async getMatches(query) {
      return filterMatches(getFootballMatchesFallback().map(toMatchData), query);
    },
    async getMatch(matchId) {
      const match = getFootballMatchFallback(matchId);
      return match ? toMatchData(match) : null;
    },
  };
}
