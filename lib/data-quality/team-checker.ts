import type { DataQualityIssue } from "./types.ts";

type TeamRow = {
  id?: string | null;
  name?: string | null;
  canonical_name?: string | null;
};

export function checkTeams(teams: TeamRow[]): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];
  for (const team of teams) {
    const id = team.id || "unknown";
    if (!team.name?.trim()) {
      issues.push({ data_type: "teams", check_type: "missing_name", severity: "error", message: `球队 ${id} 名称为空` });
    }
    if (!team.canonical_name?.trim()) {
      issues.push({ data_type: "teams", check_type: "missing_canonical_name", severity: "error", message: `球队 ${id} canonical_name 为空` });
    }
  }
  return issues;
}
