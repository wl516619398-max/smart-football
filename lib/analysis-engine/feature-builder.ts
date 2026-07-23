export type AnalysisTeam = {
  id: string;
  provider_id: string | null;
  name: string;
  canonical_name: string | null;
  league: string | null;
  logo: string | null;
};

export type AnalysisTeamStats = {
  team_id: string | null;
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
  recent_form: unknown[];
};

export type AnalysisHistoryMatch = {
  match_id: string;
  league: string | null;
  match_time: string | null;
  home_team_id: string | null;
  home_team: string | null;
  away_team_id: string | null;
  away_team: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string | null;
};

export type AnalysisOdds = {
  home: number | null;
  draw: number | null;
  away: number | null;
  source: string | null;
};

export type AnalysisDataset = {
  match_id: string;
  league: string | null;
  match_time: string | null;
  home_team: AnalysisTeam;
  away_team: AnalysisTeam;
  home_team_stats: AnalysisTeamStats;
  away_team_stats: AnalysisTeamStats;
  recent_form: {
    home: AnalysisHistoryMatch[];
    away: AnalysisHistoryMatch[];
  };
  head_to_head: {
    matches: AnalysisHistoryMatch[];
    home_wins: number;
    draws: number;
    away_wins: number;
  };
  odds: AnalysisOdds;
  injuries: unknown[];
  data_quality: {
    missing_fields: string[];
    source_tables: string[];
  };
  feature_version: "v1";
};

type Row = Record<string, unknown>;

function text(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const result = String(value).trim();
  return result || null;
}

function number(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function sameId(left: unknown, ids: Set<string>) {
  const value = text(left);
  return value !== null && ids.has(value);
}

function teamIds(match: Row, side: "home" | "away", team?: Row) {
  const ids = [
    text(match[`${side}_team_id`]),
    text(team?.id),
    text(team?.football_data_id),
    text(team?.provider_id),
  ].filter((value): value is string => Boolean(value));
  return new Set(ids);
}

function findTeam(match: Row, side: "home" | "away", teams: Row[]) {
  const matchId = text(match[`${side}_team_id`]);
  const matchName = text(match[`${side}_team`]);
  return teams.find((team) =>
    (matchId !== null && [team.id, team.football_data_id, team.provider_id].some((id) => text(id) === matchId)) ||
    (matchName !== null && [team.name, team.canonical_name].some((name) => text(name) === matchName)),
  );
}

function toTeam(match: Row, side: "home" | "away", team?: Row): AnalysisTeam {
  return {
    id: text(team?.id) ?? text(match[`${side}_team_id`]) ?? `${text(match.external_id) ?? "match"}-${side}`,
    provider_id: text(team?.football_data_id) ?? text(team?.provider_id) ?? text(match[`${side}_team_id`]),
    name: text(team?.name) ?? text(match[`${side}_team`]) ?? "",
    canonical_name: text(team?.canonical_name),
    league: text(team?.league) ?? text(match.league),
    logo: text(team?.logo) ?? text(match[`${side}_logo`]),
  };
}

function matchesForTeam(history: Row[], ids: Set<string>) {
  return history
    .filter((row) => sameId(row.home_team_id, ids) || sameId(row.away_team_id, ids))
    .sort((a, b) => String(b.match_time ?? "").localeCompare(String(a.match_time ?? "")))
    .slice(0, 5)
    .map(toHistoryMatch);
}

function toHistoryMatch(row: Row): AnalysisHistoryMatch {
  return {
    match_id: text(row.external_id) ?? text(row.match_id) ?? "",
    league: text(row.league),
    match_time: text(row.match_time),
    home_team_id: text(row.home_team_id),
    home_team: text(row.home_team),
    away_team_id: text(row.away_team_id),
    away_team: text(row.away_team),
    home_score: number(row.home_score),
    away_score: number(row.away_score),
    status: text(row.status),
  };
}

function findStats(stats: Row[], ids: Set<string>) {
  return stats.find((row) => sameId(row.team_id, ids) || sameId(row.id, ids)) ?? {};
}

function toStats(row: Row): AnalysisTeamStats {
  return {
    team_id: text(row.team_id) ?? text(row.id),
    attack: number(row.attack),
    defense: number(row.defense),
    form: number(row.form),
    home_advantage: number(row.home_advantage),
    possession: number(row.possession),
    goals_for: number(row.goals_for),
    goals_against: number(row.goals_against),
    xg: number(row.xg),
    rank: number(row.rank),
    points: number(row.points),
    recent_form: Array.isArray(row.recent_form) ? row.recent_form : [],
  };
}

function toOdds(row?: Row): AnalysisOdds {
  return {
    home: number(row?.home_odds ?? row?.home),
    draw: number(row?.draw_odds ?? row?.draw),
    away: number(row?.away_odds ?? row?.away),
    source: text(row?.source),
  };
}

function getHeadToHead(history: Row[], homeIds: Set<string>, awayIds: Set<string>) {
  const matches = history
    .filter((row) =>
      (sameId(row.home_team_id, homeIds) && sameId(row.away_team_id, awayIds)) ||
      (sameId(row.home_team_id, awayIds) && sameId(row.away_team_id, homeIds)),
    )
    .sort((a, b) => String(b.match_time ?? "").localeCompare(String(a.match_time ?? "")))
    .slice(0, 10);

  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  for (const match of matches) {
    const homeScore = number(match.home_score);
    const awayScore = number(match.away_score);
    if (homeScore === null || awayScore === null || homeScore === awayScore) {
      draws += 1;
    } else {
      const homeId = text(match.home_team_id);
      const homeWon = homeScore > awayScore;
      if ((homeWon && homeIds.has(homeId ?? "")) || (!homeWon && awayIds.has(homeId ?? ""))) homeWins += 1;
      else awayWins += 1;
    }
  }

  return { matches: matches.map(toHistoryMatch), home_wins: homeWins, draws, away_wins: awayWins };
}

export function buildAnalysisDataset(
  match: Row,
  teams: Row[],
  stats: Row[],
  odds: Row[],
  history: Row[],
): AnalysisDataset {
  const homeTeamRow = findTeam(match, "home", teams);
  const awayTeamRow = findTeam(match, "away", teams);
  const homeTeam = toTeam(match, "home", homeTeamRow);
  const awayTeam = toTeam(match, "away", awayTeamRow);
  const homeIds = teamIds(match, "home", homeTeamRow);
  const awayIds = teamIds(match, "away", awayTeamRow);
  const matchId = text(match.external_id) ?? "";
  const oddsRow = odds.find((row) => text(row.match_id) === matchId || text(row.external_id) === matchId);
  const missingFields: string[] = [];
  if (!homeTeam.name) missingFields.push("home_team");
  if (!awayTeam.name) missingFields.push("away_team");
  const homeStatsRow = findStats(stats, homeIds);
  const awayStatsRow = findStats(stats, awayIds);
  if (!homeStatsRow.team_id) missingFields.push("home_team_stats");
  if (!awayStatsRow.team_id) missingFields.push("away_team_stats");
  if (!oddsRow) missingFields.push("odds");

  return {
    match_id: matchId,
    league: text(match.league),
    match_time: text(match.match_time),
    home_team: homeTeam,
    away_team: awayTeam,
    home_team_stats: toStats(homeStatsRow),
    away_team_stats: toStats(awayStatsRow),
    recent_form: { home: matchesForTeam(history, homeIds), away: matchesForTeam(history, awayIds) },
    head_to_head: getHeadToHead(history, homeIds, awayIds),
    odds: toOdds(oddsRow),
    injuries: [],
    data_quality: {
      missing_fields: missingFields,
      source_tables: ["matches", "teams", "team_statistics", "odds", "match_history"],
    },
    feature_version: "v1",
  };
}

export function buildAnalysisDatasets(
  matches: Row[],
  teams: Row[],
  stats: Row[],
  odds: Row[],
  history: Row[],
) {
  return matches.map((match) => buildAnalysisDataset(match, teams, stats, odds, history));
}
