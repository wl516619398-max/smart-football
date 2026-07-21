const FOOTBALL_SEASON_START_MONTH = 8;

function validSeason(value: string | undefined) {
  return value && /^\d{4}$/.test(value) ? value : null;
}

/** API-Football seasons use the calendar year in which a season starts. */
export function getCurrentFootballSeason(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= FOOTBALL_SEASON_START_MONTH ? year : year - 1;
}

export function getFootballSeasonCandidates() {
  const currentSeason = getCurrentFootballSeason();
  const configuredSeason = validSeason(process.env.FOOTBALL_SEASON?.trim());
  return [...new Set([
    configuredSeason,
    String(currentSeason),
    String(currentSeason - 1),
    String(currentSeason - 2),
  ].filter((season): season is string => Boolean(season)))];
}
