import { NextResponse } from "next/server";
import { getProfileById, upsertProfile } from "@/lib/db/profiles";
import type { DatabaseUser, MembershipLevel, UserProfile } from "@/lib/db/types";
import { getUserProfile, upsertUser } from "@/lib/db/users";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ProfileBody = {
  username?: string;
  nickname?: string;
  membershipLevel?: MembershipLevel;
  vipLevel?: MembershipLevel;
};

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

async function getAuthenticatedUser(request: Request) {
  const supabase = getSupabaseServerClient();
  const token = getBearerToken(request);
  if (!supabase || !token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

function defaultUsername(email: string) {
  return email.split("@")[0] || "Athena用户";
}

function normalizeProfile(profile: UserProfile): DatabaseUser {
  return {
    id: profile.id,
    email: profile.email,
    nickname: profile.username,
    vip_level: profile.membership_level,
    vip_status: profile.membership_level !== "free",
    created_at: profile.created_at,
    username: profile.username,
    membership_level: profile.membership_level,
  };
}

async function syncLegacyUser(
  profile: UserProfile,
): Promise<DatabaseUser | null> {
  try {
    return await upsertUser({
      id: profile.id,
      email: profile.email,
      nickname: profile.username,
      // The legacy users table only supports free/vip. Keep enterprise
      // users represented as VIP there for backward compatibility.
      vipLevel: profile.membership_level === "free" ? "free" : "vip",
      vipStatus: profile.membership_level !== "free",
    });
  } catch {
    return null;
  }
}

async function readOrCreateProfile(user: { id: string; email: string; user_metadata?: Record<string, unknown> }) {
  let existing: UserProfile | null = null;
  try {
    existing = await getProfileById(user.id);
  } catch {
    existing = null;
  }

  if (existing) return existing;

  try {
    return await upsertProfile({
      id: user.id,
      email: user.email,
      username: String(user.user_metadata?.username || user.user_metadata?.nickname || user.user_metadata?.name || defaultUsername(user.email)),
      membershipLevel: "free",
    });
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.email) return NextResponse.json({ success: false, data: null, error: "未登录" }, { status: 401 });

    const profile = await readOrCreateProfile({ id: user.id, email: user.email, user_metadata: user.user_metadata });
    if (!profile) {
      const legacy = await getUserProfile(user.id);
      return NextResponse.json({ success: Boolean(legacy), data: legacy, databaseConfigured: Boolean(legacy) });
    }

    await syncLegacyUser(profile);
    return NextResponse.json({ success: true, data: normalizeProfile(profile) });
  } catch {
    return NextResponse.json({ success: false, data: null }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.email) return NextResponse.json({ success: false, data: null, error: "未登录" }, { status: 401 });

    const body = (await request.json()) as ProfileBody;
    let existing: UserProfile | null = null;
    try {
      existing = await getProfileById(user.id);
    } catch {
      existing = null;
    }

    const requestedLevel = body.membershipLevel ?? body.vipLevel;
    const membershipLevel: MembershipLevel = requestedLevel === "vip" || requestedLevel === "enterprise"
      ? requestedLevel
      : existing?.membership_level ?? "free";
    const username = body.username?.trim() || body.nickname?.trim() || existing?.username || user.user_metadata?.name || defaultUsername(user.email);
    let profile: UserProfile | null = null;
    try {
      profile = await upsertProfile({ id: user.id, email: user.email, username: String(username), membershipLevel });
    } catch {
      profile = null;
    }
    if (!profile) {
      const legacy = await upsertUser({
        id: user.id,
        email: user.email,
        nickname: String(username),
        vipLevel: membershipLevel === "free" ? "free" : "vip",
        vipStatus: membershipLevel !== "free",
      });
      return NextResponse.json({ success: Boolean(legacy), data: legacy }, { status: legacy ? 200 : 503 });
    }

    await syncLegacyUser(profile);
    return NextResponse.json({ success: true, data: normalizeProfile(profile) });
  } catch {
    return NextResponse.json({ success: false, data: null }, { status: 503 });
  }
}
