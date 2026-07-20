import { getMatchById } from "@/data/matches";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { HeadToHeadMatch, MatchAnalysisData, MatchFocusFactor, MatchMetric, MatchRecentStats, MatchTeam, RecentMatch } from "@/types/match";

type DatabaseMatchRow = Record<string, unknown>;

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)));

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function scoreFor(row: DatabaseMatchRow) {
  const home = number(row.home_score ?? row.home_goals ?? row.goals_home);
  const away = number(row.away_score ?? row.away_goals ?? row.goals_away);
  return home === null || away === null ? null : { home, away, value: `${home}:${away}` };
}

function dateValue(row: DatabaseMatchRow) {
  const value = text(row.match_time ?? row.date);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function recentFromRow(row: DatabaseMatchRow, team: string): RecentMatch | null {
  const home = text(row.home_team ?? row.homeTeam);
  const away = text(row.away_team ?? row.awayTeam);
  const score = scoreFor(row);
  if (!score || (home !== team && away !== team)) return null;
  const isHome = home === team;
  const goalsFor = isHome ? score.home : score.away;
  const goalsAgainst = isHome ? score.away : score.home;
  return { opponent: isHome ? away : home, score: score.value, result: goalsFor > goalsAgainst ? "win" : goalsFor < goalsAgainst ? "loss" : "draw", venue: isHome ? "home" : "away" };
}

function summarize(items: RecentMatch[]): MatchRecentStats {
  return items.reduce<MatchRecentStats>((summary, item) => {
    const [goalsFor, goalsAgainst] = item.score.split(":").map(Number);
    summary.matches.push(item);
    summary.wins += item.result === "win" ? 1 : 0;
    summary.draws += item.result === "draw" ? 1 : 0;
    summary.losses += item.result === "loss" ? 1 : 0;
    summary.goalsFor += Number.isFinite(goalsFor) ? goalsFor : 0;
    summary.goalsAgainst += Number.isFinite(goalsAgainst) ? goalsAgainst : 0;
    return summary;
  }, { matches: [], wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 });
}

function fallbackRecent(team: "home" | "away", fallback: ReturnType<typeof getMatchById>) {
  if (!fallback) return [];
  return fallback.recentForm[team].slice(0, 5);
}

function fallbackHeadToHead(fallback: ReturnType<typeof getMatchById>) {
  return fallback?.headToHead.slice(0, 10) ?? [];
}

function numericRow(row: DatabaseMatchRow, keys: string[], fallback: number) {
  for (const key of keys) {
    const value = number(row[key]);
    if (value !== null) return clamp(value);
  }
  return fallback;
}

function createMetrics(row: DatabaseMatchRow, fallback: ReturnType<typeof getMatchById>, homeWin: number, awayWin: number, aiScore: number): MatchMetric[] {
  const homeStats = fallback?.homeStats;
  const awayStats = fallback?.awayStats;
  return [
    { label: "攻击指数", home: numericRow(row, ["home_attack", "home_attack_index"], homeStats?.attack ?? clamp(50 + homeWin * 0.45)), away: numericRow(row, ["away_attack", "away_attack_index"], awayStats?.attack ?? clamp(50 + awayWin * 0.45)) },
    { label: "防守指数", home: numericRow(row, ["home_defense", "home_defense_index"], homeStats?.defense ?? 72), away: numericRow(row, ["away_defense", "away_defense_index"], awayStats?.defense ?? 72) },
    { label: "状态指数", home: numericRow(row, ["home_form", "home_form_index"], homeStats?.form ?? clamp(aiScore)), away: numericRow(row, ["away_form", "away_form_index"], awayStats?.form ?? clamp(aiScore - 2)) },
    { label: "稳定性指数", home: numericRow(row, ["home_stability", "home_consistency"], clamp(72 + (homeStats?.defense ?? 72) * 0.18)), away: numericRow(row, ["away_stability", "away_consistency"], clamp(70 + (awayStats?.defense ?? 72) * 0.18)) },
  ];
}

function createFocusFactors(row: DatabaseMatchRow, fallback: ReturnType<typeof getMatchById>, recent: MatchAnalysisData["recent"], headToHead: MatchAnalysisData["headToHead"], aiScore: number): MatchFocusFactor[] {
  const injuries = Array.isArray(row.injuries) ? row.injuries.length : number(row.injury_count) ?? 0;
  const homeForm = recent.home.wins * 3 + recent.home.draws;
  const awayForm = recent.away.wins * 3 + recent.away.draws;
  const recentLeader = homeForm >= awayForm ? fallback?.home.name ?? "主队" : fallback?.away.name ?? "客队";
  return [
    { label: "主场优势", value: fallback?.homeStats.homeAdvantage ? `${fallback.homeStats.homeAdvantage} 分` : "纳入模型", tone: "blue" },
    { label: "最近状态", value: `${recentLeader}领先`, tone: "green" },
    { label: "历史交锋", value: `${headToHead.homeWins}-${headToHead.draws}-${headToHead.awayWins}`, tone: "violet" },
    { label: "伤病影响", value: injuries ? `${injuries} 条记录` : "暂无记录", tone: injuries ? "amber" : "green" },
    { label: "比赛密度", value: `${Math.max(recent.home.matches.length, recent.away.matches.length)} 场样本`, tone: "amber" },
    { label: "数据一致性", value: `${aiScore}%`, tone: "blue" },
  ];
}

export async function getMatchAnalysisData(externalId: string, currentRow: DatabaseMatchRow): Promise<MatchAnalysisData> {
  const fallback = getMatchById(externalId);
  let rows: DatabaseMatchRow[] = [];
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const result = await supabase.from("matches").select("*").order("match_time", { ascending: false }).limit(1000);
      if (!result.error && Array.isArray(result.data)) rows = result.data as DatabaseMatchRow[];
    } catch {
      rows = [];
    }
  }

  const homeTeam = text(currentRow.home_team) || fallback?.home.name || "主队";
  const awayTeam = text(currentRow.away_team) || fallback?.away.name || "客队";
  const currentTime = dateValue(currentRow);
  const relatedRows = rows.filter((row) => text(row.external_id) !== text(currentRow.external_id) && dateValue(row) <= currentTime);
  const homeDatabaseForm = relatedRows.map((row) => recentFromRow(row, homeTeam)).filter((item): item is RecentMatch => Boolean(item)).slice(0, 5);
  const awayDatabaseForm = relatedRows.map((row) => recentFromRow(row, awayTeam)).filter((item): item is RecentMatch => Boolean(item)).slice(0, 5);
  const homeRecent = homeDatabaseForm.length ? homeDatabaseForm : fallbackRecent("home", fallback);
  const awayRecent = awayDatabaseForm.length ? awayDatabaseForm : fallbackRecent("away", fallback);
  const recent = { home: summarize(homeRecent), away: summarize(awayRecent) };

  const databaseH2H = relatedRows.filter((row) => {
    const rowHome = text(row.home_team);
    const rowAway = text(row.away_team);
    return scoreFor(row) && ((rowHome === homeTeam && rowAway === awayTeam) || (rowHome === awayTeam && rowAway === homeTeam));
  }).slice(0, 10).map((row): HeadToHeadMatch => ({ home: text(row.home_team), away: text(row.away_team), score: scoreFor(row)?.value ?? "-", date: text(row.match_time).slice(0, 10) }));
  const h2hMatches = databaseH2H.length ? databaseH2H : fallbackHeadToHead(fallback);
  const h2hSummary = h2hMatches.reduce((summary, item) => {
    const [homeScore, awayScore] = item.score.split(":").map(Number);
    const homeWon = item.home === homeTeam ? homeScore > awayScore : awayScore > homeScore;
    const awayWon = item.away === awayTeam ? awayScore > homeScore : homeScore > awayScore;
    summary.homeWins += homeWon ? 1 : 0;
    summary.awayWins += awayWon ? 1 : 0;
    summary.draws += homeScore === awayScore ? 1 : 0;
    return summary;
  }, { homeWins: 0, draws: 0, awayWins: 0 });
  const homeWin = number(currentRow.home_win) ?? fallback?.probabilities[0]?.value ?? 40;
  const awayWin = number(currentRow.away_win) ?? fallback?.probabilities[2]?.value ?? 30;
  const aiScore = number(currentRow.ai_score) ?? fallback?.prediction.confidence ?? 70;
  const metrics = createMetrics(currentRow, fallback, homeWin, awayWin, aiScore);
  const headToHead = { matches: h2hMatches, ...h2hSummary, latestScore: h2hMatches[0]?.score ?? "暂无数据" };
  return { recent, headToHead, metrics, focusFactors: createFocusFactors(currentRow, fallback, recent, headToHead, aiScore) };
}
