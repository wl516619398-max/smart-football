import type { FootballMockBundle } from "./collection-types";

export function generateMockFootballData(): FootballMockBundle {
  const teams = [
    { name: "曼联", canonical_name: "manchester-united", league: "英格兰超级联赛" },
    { name: "利物浦", canonical_name: "liverpool", league: "英格兰超级联赛" },
    { name: "皇家马德里", canonical_name: "real-madrid", league: "西甲" },
    { name: "巴塞罗那", canonical_name: "barcelona", league: "西甲" },
  ];
  const ids = { manchesterUnited: "mock-man-utd", liverpool: "mock-liverpool", realMadrid: "mock-real-madrid", barcelona: "mock-barcelona" };
  const matches = [
    { external_id: "manchester-united-vs-liverpool", league: "英格兰超级联赛", home_team_id: ids.manchesterUnited, home_team: "曼联", away_team_id: ids.liverpool, away_team: "利物浦", match_time: "2026-08-01T19:30:00+08:00", status: "scheduled", venue: "老特拉福德球场" },
    { external_id: "real-madrid-vs-barcelona", league: "西甲", home_team_id: ids.realMadrid, home_team: "皇家马德里", away_team_id: ids.barcelona, away_team: "巴塞罗那", match_time: "2026-08-02T03:00:00+08:00", status: "scheduled", venue: "伯纳乌球场" },
  ];
  const team_statistics = [
    { team_id: ids.manchesterUnited, team_name: "曼联", league: "英格兰超级联赛", attack: 84, defense: 78, form: 82, home_advantage: 90, possession: 55, goals_for: 12, goals_against: 6, xg: 1.8, rank: 6, points: 48, recent_form: [] },
    { team_id: ids.liverpool, team_name: "利物浦", league: "英格兰超级联赛", attack: 88, defense: 84, form: 84, home_advantage: 50, possession: 58, goals_for: 15, goals_against: 5, xg: 2.1, rank: 2, points: 67, recent_form: [] },
    { team_id: ids.realMadrid, team_name: "皇家马德里", league: "西甲", attack: 90, defense: 86, form: 88, home_advantage: 92, possession: 60, goals_for: 18, goals_against: 6, xg: 2.2, rank: 1, points: 72, recent_form: [] },
    { team_id: ids.barcelona, team_name: "巴塞罗那", league: "西甲", attack: 87, defense: 79, form: 83, home_advantage: 50, possession: 62, goals_for: 16, goals_against: 8, xg: 2, rank: 2, points: 68, recent_form: [] },
  ];
  const odds = matches.map((match, index) => ({ match_id: match.external_id, home_odds: index ? 1.9 : 2.1, draw_odds: index ? 3.8 : 3.6, away_odds: index ? 3.4 : 2.9, source: "mock" as const }));
  const match_history = [{ external_id: "mock-history-001", league: "英格兰超级联赛", home_team_id: ids.manchesterUnited, home_team: "曼联", away_team_id: ids.liverpool, away_team: "利物浦", home_score: 2, away_score: 1, match_time: "2026-05-10T22:00:00+08:00", status: "finished" as const }];
  return { matches, teams, team_statistics, odds, match_history };
}
