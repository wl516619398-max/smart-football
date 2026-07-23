import { getFixtureDetail, getUpcomingFixtures } from "@/lib/football/fixture-service";
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

export function footballMatchToMatchData(match: FootballMatch): MatchData {
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

export function createFootballApiDataProvider(): MatchDataProvider {
  return {
    name: "football-api",
    async getMatches(query) {
      const matches = await getUpcomingFixtures();
      return filterMatches(matches.map(footballMatchToMatchData), query);
    },
    async getMatch(matchId) {
      const match = await getFixtureDetail(matchId);
      return match ? footballMatchToMatchData(match) : null;
    },
  };
}
