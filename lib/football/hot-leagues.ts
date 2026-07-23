import { toShanghaiDateKey } from "@/lib/football/date-window";

export const HOT_LEAGUE_NAMES = [
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Champions League",
  "Europa League",
] as const;

const HOT_LEAGUE_ALIASES = [
  "premier league",
  "english premier league",
  "英超",
  "la liga",
  "primera division",
  "西甲",
  "serie a",
  "意甲",
  "bundesliga",
  "德甲",
  "ligue 1",
  "法甲",
  "champions league",
  "uefa champions league",
  "欧冠",
  "europa league",
  "uefa europa league",
  "欧联",
];

function normalizeLeague(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isHotLeague(value: string | null | undefined) {
  if (!value) return false;
  const league = normalizeLeague(value);
  return HOT_LEAGUE_ALIASES.some((alias) => league === alias || league.includes(alias));
}

type MatchLike = {
  league?: string | null;
  date?: string | null;
  match_time?: string | null;
  external_id?: string | null;
  id?: string | null;
};

/** Keeps only today's hot-league matches in Shanghai time, ordered by kickoff. */
export function filterTodayHotMatches<T extends MatchLike>(matches: T[], limit = 50) {
  const todayKey = toShanghaiDateKey(new Date());
  const seen = new Set<string>();

  return matches
    .filter((match) => {
      const kickoff = match.date ?? match.match_time;
      const identifier = match.external_id ?? match.id ?? `${kickoff}:${match.league}`;
      if (!kickoff || !todayKey || toShanghaiDateKey(kickoff) !== todayKey || !isHotLeague(match.league)) return false;
      if (seen.has(identifier)) return false;
      seen.add(identifier);
      return true;
    })
    .sort((left, right) => {
      const leftDate = left.date ?? left.match_time ?? "";
      const rightDate = right.date ?? right.match_time ?? "";
      return new Date(leftDate).getTime() - new Date(rightDate).getTime();
    })
    .slice(0, limit);
}
