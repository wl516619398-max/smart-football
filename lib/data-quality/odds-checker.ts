import type { DataQualityIssue } from "./types.ts";

type OddsRow = {
  match_id?: string | null;
  home_odds?: number | string | null;
  draw_odds?: number | string | null;
  away_odds?: number | string | null;
};

export function checkOdds(oddsRows: OddsRow[]): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];
  for (const odds of oddsRows) {
    const id = odds.match_id || "unknown";
    for (const [name, value] of [["主胜", odds.home_odds], ["平局", odds.draw_odds], ["客胜", odds.away_odds]] as const) {
      if (value === null || value === undefined || value === "") {
        issues.push({ data_type: "odds", check_type: "missing_odds", severity: "warning", message: `比赛 ${id} 缺少${name}赔率` });
        continue;
      }
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue <= 1 || numericValue > 100) {
        issues.push({ data_type: "odds", check_type: "abnormal_odds", severity: "error", message: `比赛 ${id} 的${name}赔率数值异常：${String(value)}` });
      }
    }
  }
  return issues;
}
