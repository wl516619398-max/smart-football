import type { DataQualityIssue } from "./types.ts";

type MatchRow = {
  external_id?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  match_time?: string | null;
};

export function checkMatches(matches: MatchRow[]): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];
  const seen = new Set<string>();
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  for (const match of matches) {
    const id = match.external_id?.trim() || "unknown";
    if (!match.home_team?.trim() || !match.away_team?.trim()) {
      issues.push({ data_type: "matches", check_type: "missing_teams", severity: "error", message: `比赛 ${id} 缺少主队或客队信息` });
    }
    if (seen.has(id)) {
      issues.push({ data_type: "matches", check_type: "duplicate_match", severity: "error", message: `比赛 external_id 重复：${id}` });
    }
    seen.add(id);

    const timestamp = match.match_time ? Date.parse(match.match_time) : NaN;
    if (!Number.isFinite(timestamp)) {
      issues.push({ data_type: "matches", check_type: "invalid_time", severity: "error", message: `比赛 ${id} 缺少有效 match_time` });
    } else if (timestamp < now - oneYear || timestamp > now + 2 * oneYear) {
      issues.push({ data_type: "matches", check_type: "abnormal_time", severity: "warning", message: `比赛 ${id} 的比赛时间异常：${match.match_time}` });
    }
  }

  return issues;
}
