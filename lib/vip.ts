export type VipLevelUser = {
  vip_level?: string | null;
  membership_level?: string | null;
} | null | undefined;

export function isVip(user: VipLevelUser) {
  return user?.vip_level === "vip" || user?.membership_level === "vip" || user?.membership_level === "enterprise";
}
