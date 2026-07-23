import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const matches = [
  { external_id: "manchester-united-vs-liverpool", league: "英格兰超级联赛", home_team_id: "mock-man-utd", home_team: "曼联", away_team_id: "mock-liverpool", away_team: "利物浦", match_time: "2026-08-01T19:30:00+08:00", status: "scheduled", venue: "老特拉福德球场" },
  { external_id: "real-madrid-vs-barcelona", league: "西甲", home_team_id: "mock-real-madrid", home_team: "皇家马德里", away_team_id: "mock-barcelona", away_team: "巴塞罗那", match_time: "2026-08-02T03:00:00+08:00", status: "scheduled", venue: "伯纳乌球场" },
  { external_id: "bayern-munich-vs-borussia-dortmund", league: "德甲", home_team_id: "mock-bayern", home_team: "拜仁慕尼黑", away_team_id: "mock-dortmund", away_team: "多特蒙德", match_time: "2026-08-02T21:30:00+08:00", status: "scheduled", venue: "安联球场" },
];

const teamStats = [
  { team_id: "mock-man-utd", team_name: "曼联", league: "英格兰超级联赛", attack: 84, defense: 78, form: 82, home_advantage: 90, possession: 55, goals_for: 12, goals_against: 6, xg: 1.8, rank: 6, points: 48, recent_form: [] },
  { team_id: "mock-liverpool", team_name: "利物浦", league: "英格兰超级联赛", attack: 88, defense: 84, form: 84, home_advantage: 50, possession: 58, goals_for: 15, goals_against: 5, xg: 2.1, rank: 2, points: 67, recent_form: [] },
  { team_id: "mock-real-madrid", team_name: "皇家马德里", league: "西甲", attack: 90, defense: 86, form: 88, home_advantage: 92, possession: 60, goals_for: 18, goals_against: 6, xg: 2.2, rank: 1, points: 72, recent_form: [] },
  { team_id: "mock-barcelona", team_name: "巴塞罗那", league: "西甲", attack: 87, defense: 79, form: 83, home_advantage: 50, possession: 62, goals_for: 16, goals_against: 8, xg: 2, rank: 2, points: 68, recent_form: [] },
  { team_id: "mock-bayern", team_name: "拜仁慕尼黑", league: "德甲", attack: 92, defense: 82, form: 86, home_advantage: 91, possession: 61, goals_for: 20, goals_against: 7, xg: 2.4, rank: 1, points: 70, recent_form: [] },
  { team_id: "mock-dortmund", team_name: "多特蒙德", league: "德甲", attack: 83, defense: 75, form: 78, home_advantage: 50, possession: 53, goals_for: 14, goals_against: 10, xg: 1.7, rank: 5, points: 52, recent_form: [] },
];

const odds = [
  { match_id: matches[0].external_id, home_odds: 2.1, draw_odds: 3.6, away_odds: 2.9, source: "mock" },
  { match_id: matches[1].external_id, home_odds: 1.9, draw_odds: 3.8, away_odds: 3.4, source: "mock" },
  { match_id: matches[2].external_id, home_odds: 1.55, draw_odds: 4.5, away_odds: 5.2, source: "mock" },
];

async function main() {
  const matchResult = await supabase.from("matches").upsert(matches, { onConflict: "external_id" });
  if (matchResult.error) throw new Error(`matches seed failed: ${matchResult.error.message}`);
  console.info(`[seed:football] matches: ${matches.length} rows`);

  const statsResult = await supabase.from("team_stats").upsert(teamStats, { onConflict: "team_id" });
  if (statsResult.error) throw new Error(`team_stats seed failed: ${statsResult.error.message}`);
  console.info(`[seed:football] team_stats: ${teamStats.length} rows`);

  const oddsResult = await supabase.from("odds").upsert(odds, { onConflict: "match_id" });
  if (oddsResult.error) throw new Error(`odds seed failed: ${oddsResult.error.message}`);
  console.info(`[seed:football] odds: ${odds.length} rows`);
}

main().catch((error) => {
  console.error("[seed:football] failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
