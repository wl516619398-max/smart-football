import type { MembershipLevel } from "@/lib/db/types";

export const FREE_DAILY_ANALYSIS_LIMIT = 3;
export type PermissionUser = {
  membership_level?: MembershipLevel | string | null;
  vip_level?: MembershipLevel | string | null;
} | null | undefined;

export function getMembershipLevel(user: PermissionUser): MembershipLevel {
  const level = user?.membership_level ?? user?.vip_level;
  return level === "vip" || level === "enterprise" ? level : "free";
}

export function canUseAIAnalysis(user: PermissionUser = null, usedToday = 0) {
  const limit = getDailyAnalysisLimit(user);
  return limit === null || usedToday < limit;
}

export function canAccessAdvancedData(user: PermissionUser = null) {
  const level = getMembershipLevel(user);
  return level === "vip" || level === "enterprise";
}

/** Returns null when the membership has no daily limit. */
export function getDailyAnalysisLimit(user: PermissionUser = null): number | null {
  return getMembershipLevel(user) === "free" ? FREE_DAILY_ANALYSIS_LIMIT : null;
}
