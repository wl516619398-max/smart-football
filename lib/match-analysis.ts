import { getMatchById } from "@/data/matches";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { HeadToHeadMatch, MatchAnalysisData, MatchFocusFactor, MatchMetric, MatchRecentStats, MatchTeam, RecentMatch } from "@/types/match";
import { getTeamDisplayName } from "@/lib/football/team-name-map";
import { getHistoricalHeadToHead, getHistoricalTeamMatches, resolveFootballTeamId } from "@/lib/football/history";

type DatabaseMatchRow = Record<string, unknown>;

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)));

function text(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

const TEAM_IDENTITIES: Record<string, string> = {
  "manchester united": "manchester united",
  "曼联": "manchester united",
  "曼彻斯特联": "manchester united",
  liverpool: "liverpool",
  "利物浦": "liverpool",
  "manchester city": "manchester city",
  "曼城": "manchester city",
  arsenal: "arsenal",
  "阿森纳": "arsenal",
  chelsea: "chelsea",
  "切尔西": "chelsea",
  "real madrid": "real madrid",
  "皇家马德里": "real madrid",
  barcelona: "barcelona",
  "巴塞罗那": "barcelona",
  "巴萨": "barcelona",
  "bayern munich": "bayern munich",
  "拜仁慕尼黑": "bayern munich",
};

function sameTeam(left: string, right: string) {
  const normalize = (name: string) => {
    const value = name.trim().toLocaleLowerCase();
    return TEAM_IDENTITIES[value] ?? value;
  };
  const leftIdentity = normalize(left);
  const rightIdentity = normalize(right);
  if (leftIdentity === rightIdentity) return true;
  return getTeamDisplayName(left).toLocaleLowerCase() === getTeamDisplayName(right).toLocaleLowerCase();
}

function number(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
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

function normalizedId(value: unknown) {
  return text(value).trim();
}

function teamMatches(row: DatabaseMatchRow, side: "home" | "away", teamId?: string) {
  const rowTeamId = normalizedId(row[`${side}_team_id`] ?? row[`${side}TeamId`]);
  return Boolean(teamId && rowTeamId && rowTeamId === teamId);
}

function recentFromRow(row: DatabaseMatchRow, team: string, teamId?: string): RecentMatch | null {
  const home = text(row.home_team ?? row.homeTeam);
  const away = text(row.away_team ?? row.awayTeam);
  const score = scoreFor(row);
  const homeMatches = teamMatches(row, "home", teamId);
  const awayMatches = teamMatches(row, "away", teamId);
  if (!score || (!homeMatches && !awayMatches)) return null;
  const isHome = homeMatches;
  const goalsFor = isHome ? score.home : score.away;
  const goalsAgainst = isHome ? score.away : score.home;
  return { opponent: isHome ? away : home, score: score.value, result: goalsFor > goalsAgainst ? "win" : goalsFor < goalsAgainst ? "loss" : "draw", venue: isHome ? "home" : "away" };
}

function summarize(items: RecentMatch[]): MatchRecentStats {
  const matches = items.slice(0, 5).map((item) => ({
    opponent: item.opponent,
    score: item.score.replace("-", ":"),
    result: item.result,
    venue: item.venue,
  } satisfies RecentMatch));

  return matches.reduce<MatchRecentStats>((summary, item) => {
    const [goalsFor, goalsAgainst] = item.score.split(":").map(Number);
    summary.matches.push(item);
    summary.wins += item.result === "win" ? 1 : 0;
    summary.draws += item.result === "draw" ? 1 : 0;
    summary.losses += item.result === "loss" ? 1 : 0;
    summary.goalsFor += Number.isFinite(goalsFor) ? goalsFor : 0;
    summary.goalsAgainst += Number.isFinite(goalsAgainst) ? goalsAgainst : 0;
    summary.trend.push(item.result);
    return summary;
  }, { matches: [], wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, trend: [] });
}

function fallbackRecent(team: "home" | "away", fallback: ReturnType<typeof getMatchById>) {
  return fallback?.recentForm[team].slice(0, 5) ?? [];
  /*
  const scores = team === "home" ? ["2:1", "1:1", "2:0", "0:1", "1:0"] : ["1:1", "2:1", "1:2", "2:0", "0:0"];
  return scores.map((score, index) => {
    const [goalsFor, goalsAgainst] = score.split(":").map(Number);
    return { opponent: `近期对手 ${index + 1}`, score, result: goalsFor > goalsAgainst ? "win" : goalsFor < goalsAgainst ? "loss" : "draw", venue: team === "home" ? (index % 2 ? "away" : "home") : (index % 2 ? "home" : "away") } satisfies RecentMatch;
  });
  */
}

function fallbackHeadToHead(fallback: ReturnType<typeof getMatchById>) {
  return fallback?.headToHead.slice(0, 10) ?? [];
}

function teamIdForName(name: string, fallbackId = "") {
  const normalized = name.toLocaleLowerCase();
  const knownIds: Record<string, string> = {
    "manchester united": "33",
    "曼彻斯特联": "33",
    "曼联": "33",
    liverpool: "40",
    "利物浦": "40",
    arsenal: "42",
    chelsea: "49",
    "real madrid": "541",
    barcelona: "529",
    "bayern munich": "157",
    "borussia dortmund": "165",
  };
  return knownIds[normalized] ?? fallbackId;
}

function toRecentMatch(item: { opponent?: string; score?: string; result: RecentMatch["result"]; venue: RecentMatch["venue"] }) {
  return {
    opponent: item.opponent ?? "对手待确认",
    score: (item.score ?? "0-0").replace("-", ":"),
    result: item.result,
    venue: item.venue,
  } satisfies RecentMatch;
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
  const homeLookupTeam = text(currentRow.home_team_raw) || homeTeam;
  const awayLookupTeam = text(currentRow.away_team_raw) || awayTeam;
  const [homeFootballDataId, awayFootballDataId] = await Promise.all([
    resolveFootballTeamId(homeLookupTeam, text(currentRow.home_team_id)),
    resolveFootballTeamId(awayLookupTeam, text(currentRow.away_team_id)),
  ]);
  console.log("[history-query]", {
    teamId: {
      home: text(currentRow.home_team_id),
      away: text(currentRow.away_team_id),
    },
    footballDataId: {
      home: homeFootballDataId,
      away: awayFootballDataId,
    },
  });
  const relatedRows = rows.filter((row) => text(row.external_id) !== text(currentRow.external_id) && dateValue(row) <= currentTime);
  let historyRows: DatabaseMatchRow[] = [];
  const footballDataIds = [homeFootballDataId, awayFootballDataId].filter((value): value is string => Boolean(value));
  if (supabase && footballDataIds.length) {
    console.log("[match-analysis] football_match_history query start", {
      externalId,
      footballDataId: footballDataIds,
    });
    try {
      const historyFilter = footballDataIds
        .flatMap((footballDataId) => [
          `home_team_id.eq.${footballDataId}`,
          `away_team_id.eq.${footballDataId}`,
        ])
        .join(",");
      const historyResult = await supabase
        .from("football_match_history")
        .select("*")
        .or(historyFilter)
        .order("match_time", { ascending: false })
        .limit(1000);
      console.log("[match-analysis] football_match_history query result", {
        data: historyResult.data,
        error: historyResult.error,
      });
      if (!historyResult.error && Array.isArray(historyResult.data)) historyRows = historyResult.data as DatabaseMatchRow[];
    } catch (error) {
      console.log("[match-analysis] football_match_history query error", error);
      historyRows = [];
    }
  }
  const historicalRows = [...historyRows, ...relatedRows].sort((left, right) => dateValue(right) - dateValue(left));
  // Match against raw provider names. The display layer may translate a team
  // name, while football_match_history keeps the provider's original name.
  const homeMatchName = homeLookupTeam || homeTeam;
  const awayMatchName = awayLookupTeam || awayTeam;
  const homeTeamId = homeFootballDataId ?? undefined;
  const awayTeamId = awayFootballDataId ?? undefined;
  const homeDatabaseForm = historicalRows.map((row) => recentFromRow(row, homeMatchName, homeTeamId)).filter((item): item is RecentMatch => Boolean(item)).slice(0, 5);
  const awayDatabaseForm = historicalRows.map((row) => recentFromRow(row, awayMatchName, awayTeamId)).filter((item): item is RecentMatch => Boolean(item)).slice(0, 5);
  let homeApiForm: RecentMatch[] = [];
  let awayApiForm: RecentMatch[] = [];
  try {
    if (!homeDatabaseForm.length || !awayDatabaseForm.length) {
      const [resolvedHomeTeamId, resolvedAwayTeamId] = [homeFootballDataId, awayFootballDataId];
      if (!homeDatabaseForm.length && resolvedHomeTeamId) {
      homeApiForm = (await getHistoricalTeamMatches(resolvedHomeTeamId)).slice(0, 5).map((item) => toRecentMatch({
        opponent: item.homeTeamId === resolvedHomeTeamId ? item.awayTeam : item.homeTeam,
        score: item.homeTeamId === resolvedHomeTeamId ? `${item.homeScore}-${item.awayScore}` : `${item.awayScore}-${item.homeScore}`,
        result: item.homeTeamId === resolvedHomeTeamId
          ? item.homeScore > item.awayScore ? "win" : item.homeScore < item.awayScore ? "loss" : "draw"
          : item.awayScore > item.homeScore ? "win" : item.awayScore < item.homeScore ? "loss" : "draw",
        venue: item.homeTeamId === resolvedHomeTeamId ? "home" : "away",
      }));
      }
      if (!awayDatabaseForm.length && resolvedAwayTeamId) {
      awayApiForm = (await getHistoricalTeamMatches(resolvedAwayTeamId)).slice(0, 5).map((item) => toRecentMatch({
        opponent: item.homeTeamId === resolvedAwayTeamId ? item.awayTeam : item.homeTeam,
        score: item.homeTeamId === resolvedAwayTeamId ? `${item.homeScore}-${item.awayScore}` : `${item.awayScore}-${item.homeScore}`,
        result: item.homeTeamId === resolvedAwayTeamId
          ? item.homeScore > item.awayScore ? "win" : item.homeScore < item.awayScore ? "loss" : "draw"
          : item.awayScore > item.homeScore ? "win" : item.awayScore < item.homeScore ? "loss" : "draw",
        venue: item.homeTeamId === resolvedAwayTeamId ? "home" : "away",
      }));
      }
    }
  } catch {
    // Continue with persisted history when the remote provider is unavailable.
  }
  const homeRecent = homeDatabaseForm.length ? homeDatabaseForm : homeApiForm.length ? homeApiForm : [];
  const awayRecent = awayDatabaseForm.length ? awayDatabaseForm : awayApiForm.length ? awayApiForm : [];
  const recent = { home: summarize(homeRecent), away: summarize(awayRecent) };
  console.log("[match-analysis] recent lengths", {
    externalId,
    recentHomeLength: recent.home.matches.length,
    recentAwayLength: recent.away.matches.length,
  });

  const databaseH2H = historicalRows.filter((row) => {
    const rowHomeId = normalizedId(row.home_team_id ?? row.homeTeamId);
    const rowAwayId = normalizedId(row.away_team_id ?? row.awayTeamId);
    const hasComparableIds = Boolean(homeTeamId && awayTeamId && rowHomeId && rowAwayId);
    const directIdMatch = hasComparableIds && rowHomeId === homeTeamId && rowAwayId === awayTeamId;
    const reversedIdMatch = hasComparableIds && rowHomeId === awayTeamId && rowAwayId === homeTeamId;
    return Boolean(scoreFor(row) && (directIdMatch || reversedIdMatch));
  }).slice(0, 10).map((row): HeadToHeadMatch => ({ home: getTeamDisplayName(text(row.home_team)), away: getTeamDisplayName(text(row.away_team)), score: scoreFor(row)?.value ?? "-", date: text(row.match_time).slice(0, 10) }));
  let apiH2H: HeadToHeadMatch[] = [];
  if (!databaseH2H.length) {
    try {
      const [resolvedHomeTeamId, resolvedAwayTeamId] = [homeFootballDataId, awayFootballDataId];
      if (resolvedHomeTeamId && resolvedAwayTeamId) {
        apiH2H = (await getHistoricalHeadToHead(resolvedHomeTeamId, resolvedAwayTeamId)).map((item) => ({
          home: getTeamDisplayName(item.homeTeam),
          away: getTeamDisplayName(item.awayTeam),
          score: `${item.homeScore}:${item.awayScore}`,
          date: item.matchTime.slice(0, 10),
        }));
      }
    } catch {
      apiH2H = [];
    }
  }
  const h2hMatches = databaseH2H.length ? databaseH2H : apiH2H;
  const h2hSummary = h2hMatches.reduce((summary, item) => {
    const [homeScore, awayScore] = item.score.split(":").map(Number);
    const homeWon = sameTeam(item.home, homeMatchName) ? homeScore > awayScore : awayScore > homeScore;
    const awayWon = sameTeam(item.away, awayMatchName) ? awayScore > homeScore : homeScore > awayScore;
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
  console.info("[match-analysis] mapped fields", {
    externalId,
    current: { homeTeamId, awayTeamId, homeTeam: homeMatchName, awayTeam: awayMatchName },
    recent: {
      home: { count: recent.home.matches.length, wins: recent.home.wins, draws: recent.home.draws, losses: recent.home.losses, goalsFor: recent.home.goalsFor, goalsAgainst: recent.home.goalsAgainst, fields: Object.keys(recent.home) },
      away: { count: recent.away.matches.length, wins: recent.away.wins, draws: recent.away.draws, losses: recent.away.losses, goalsFor: recent.away.goalsFor, goalsAgainst: recent.away.goalsAgainst, fields: Object.keys(recent.away) },
    },
    headToHead: { count: headToHead.matches.length, homeWins: headToHead.homeWins, draws: headToHead.draws, awayWins: headToHead.awayWins, fields: Object.keys(headToHead) },
  });
  return { recent, headToHead, metrics, focusFactors: createFocusFactors(currentRow, fallback, recent, headToHead, aiScore) };
}
