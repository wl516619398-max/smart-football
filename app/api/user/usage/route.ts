import { NextResponse } from "next/server";
import { getDailyAnalysisLimit, getMembershipLevel } from "@/lib/auth/permissions";
import { getDailyAnalysisUsage } from "@/lib/db/analysis-usage";
import { getProfileById } from "@/lib/db/profiles";
import { getUserProfile } from "@/lib/db/users";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MembershipLevel } from "@/lib/db/types";

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export async function GET(request: Request) {
  const supabase = getSupabaseServerClient();
  const token = bearerToken(request);
  let userId: string | null = null;
  let membershipLevel: MembershipLevel = "free";

  if (supabase && token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    userId = data.user.id;
    try {
      const profile = await getProfileById(userId);
      if (profile) membershipLevel = getMembershipLevel(profile);
      else membershipLevel = getMembershipLevel(await getUserProfile(userId));
    } catch {
      membershipLevel = "free";
    }
  }

  const limit = getDailyAnalysisLimit({ membership_level: membershipLevel });
  const used = userId && limit !== null ? (await getDailyAnalysisUsage(userId)).count : 0;
  return NextResponse.json({ success: true, authenticated: Boolean(userId), membershipLevel, limit, used, remaining: limit === null ? null : Math.max(limit - used, 0) });
}
