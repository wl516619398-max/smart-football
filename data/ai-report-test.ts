import type { FixtureOdds } from "@/lib/football/odds";
import type { TeamRecentStats } from "@/lib/football/stats";
import type { MatchAnalysisData, RecentMatch } from "@/types/match";
import type { AiMatchAnalysisContext } from "@/types/ai-match-analysis";

export const AI_REPORT_TEST_MATCH_ID = "athena-ai-report-test-man-city-liverpool-20260725";

const homeRecent: RecentMatch[] = [
  { opponent: "Chelsea", score: "3:1", result: "win", venue: "home" },
  { opponent: "Arsenal", score: "2:2", result: "draw", venue: "away" },
  { opponent: "Tottenham", score: "2:0", result: "win", venue: "home" },
  { opponent: "Newcastle United", score: "1:0", result: "win", venue: "away" },
  { opponent: "Aston Villa", score: "1:1", result: "draw", venue: "home" },
];

const awayRecent: RecentMatch[] = [
  { opponent: "Manchester United", score: "2:1", result: "win", venue: "home" },
  { opponent: "Arsenal", score: "1:1", result: "draw", venue: "away" },
  { opponent: "Brighton", score: "3:2", result: "win", venue: "home" },
  { opponent: "Chelsea", score: "0:1", result: "loss", venue: "away" },
  { opponent: "Aston Villa", score: "2:2", result: "draw", venue: "home" },
];

function teamStats(team: string, teamId: string, recentMatches: RecentMatch[], attack: number, defense: number, form: number, homeAdvantage: number, goalsFor: number, goalsAgainst: number, xG: number): TeamRecentStats {
  return {
    team,
    source: "fallback",
    recentMatches: recentMatches.map((match, index) => ({
      matchId: `${teamId}-test-${index + 1}`,
      opponent: match.opponent,
      date: `2026-07-${19 - index}`,
      score: match.score.replace(":", "-"),
      result: match.result,
      goalsFor: Number(match.score.split(":")[0]),
      goalsAgainst: Number(match.score.split(":")[1]),
      venue: match.venue,
    })),
    last10: {
      win: recentMatches.filter((match) => match.result === "win").length,
      draw: recentMatches.filter((match) => match.result === "draw").length,
      loss: recentMatches.filter((match) => match.result === "loss").length,
    },
    goals: { scored: goalsFor, conceded: goalsAgainst },
    testMetrics: { attack, defense, form, homeAdvantage, xG },
  } as TeamRecentStats;
}

const analysisData: MatchAnalysisData = {
  recent: {
    home: { matches: homeRecent, wins: 3, draws: 2, losses: 0, goalsFor: 9, goalsAgainst: 4, form: "WDLWW", trend: homeRecent.map((match) => match.result) },
    away: { matches: awayRecent, wins: 2, draws: 2, losses: 1, goalsFor: 8, goalsAgainst: 7, form: "WWDLD", trend: awayRecent.map((match) => match.result) },
  },
  headToHead: {
    matches: [
      { home: "Manchester City", away: "Liverpool", score: "2:1", date: "2025-11-09" },
      { home: "Liverpool", away: "Manchester City", score: "1:1", date: "2025-03-16" },
      { home: "Manchester City", away: "Liverpool", score: "1:2", date: "2024-12-01" },
      { home: "Liverpool", away: "Manchester City", score: "3:2", date: "2024-04-14" },
      { home: "Manchester City", away: "Liverpool", score: "1:1", date: "2023-11-25" },
    ],
    homeWins: 1,
    draws: 2,
    awayWins: 2,
    latestScore: "2:1",
  },
  metrics: [
    { label: "攻击指数", home: 91, away: 87 },
    { label: "防守指数", home: 84, away: 80 },
    { label: "状态指数", home: 88, away: 81 },
    { label: "稳定性指数", home: 86, away: 78 },
  ],
  focusFactors: [
    { label: "主场优势", value: "曼城主场胜率约82%", tone: "blue" },
    { label: "最近状态", value: "曼城5场保持不败", tone: "green" },
    { label: "历史交锋", value: "近5次曼城1胜、2平、利物浦2胜", tone: "violet" },
    { label: "伤病影响", value: "双方各有1名主力存疑", tone: "amber" },
    { label: "比赛密度", value: "双方近14天各有3场比赛", tone: "amber" },
    { label: "数据一致性", value: "攻防与近期状态方向较一致", tone: "blue" },
  ],
};

export type AiReportTestFixture = {
  homeStats: TeamRecentStats;
  awayStats: TeamRecentStats;
  odds: FixtureOdds;
  analysisData: MatchAnalysisData;
  matchData: AiMatchAnalysisContext;
};

export const aiReportTestFixture: AiReportTestFixture = {
  homeStats: teamStats("Manchester City", "50", homeRecent, 91, 84, 88, 92, 9, 4, 2.35),
  awayStats: teamStats("Liverpool", "40", awayRecent, 87, 80, 81, 68, 8, 7, 1.92),
  odds: { home: { odds: 1.95 }, draw: { odds: 3.8 }, away: { odds: 3.55 } },
  analysisData,
  matchData: {
    recentForm: analysisData.recent,
    homeAwayPerformance: {
      home: { winRate: 82, goalsForPerMatch: 2.35, goalsAgainstPerMatch: 0.8 },
      away: { winRate: 68, goalsForPerMatch: 1.92, goalsAgainstPerMatch: 1.1 },
    },
    metrics: analysisData.metrics,
    xG: { home: 2.35, away: 1.92, total: 4.27 },
    headToHead: analysisData.headToHead,
    oddsMovement: {
      opening: { home: 2.1, draw: 3.7, away: 3.3 },
      current: { home: 1.95, draw: 3.8, away: 3.55 },
      interpretation: "主胜赔率从2.10降至1.95，市场对主队支持有所增强；模型仍需结合交锋均衡性观察。",
    },
    injuries: [
      { team: "Manchester City", player: "主力中场A", status: "doubtful", impact: "出场成疑，可能影响中场推进" },
      { team: "Liverpool", player: "轮换后卫B", status: "out", impact: "缺阵，防线轮换深度受到影响" },
    ],
  },
};

export function getAiReportTestFixture(matchId: string) {
  return matchId === AI_REPORT_TEST_MATCH_ID ? aiReportTestFixture : null;
}
