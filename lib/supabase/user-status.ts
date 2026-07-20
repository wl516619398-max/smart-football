import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { DatabaseUser, MembershipLevel } from "@/lib/db/types";
import { getProfile, getUser } from "@/lib/supabase/auth";

export type UserStatus = {
  authenticated: boolean;
  user: SupabaseUser | null;
  profile: DatabaseUser | null;
  membershipLevel: MembershipLevel;
  displayName: string;
};

export async function getUserStatus(): Promise<UserStatus> {
  const user = await getUser();
  if (!user) {
    return {
      authenticated: false,
      user: null,
      profile: null,
      membershipLevel: "free",
      displayName: "",
    };
  }

  const profile = await getProfile();
  const membershipLevel = profile?.membership_level ?? profile?.vip_level ?? "free";
  const displayName = profile?.username || profile?.nickname || user.user_metadata?.name || user.email?.split("@")[0] || "Athena用户";

  return { authenticated: true, user, profile, membershipLevel, displayName };
}
