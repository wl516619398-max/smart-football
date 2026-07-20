import { NextResponse } from "next/server";
import { upsertProfile } from "@/lib/db/profiles";
import { upsertUser } from "@/lib/db/users";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SyncUserBody = {
  id?: string;
  email?: string;
  nickname?: string;
  vipStatus?: boolean;
  membershipLevel?: "free" | "vip" | "enterprise";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SyncUserBody;
    if (!body.id || !body.email) {
      return NextResponse.json({ success: false, data: null, error: "id and email are required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(body.id);
      if (authError || !authData.user || authData.user.email?.toLowerCase() !== body.email.toLowerCase()) {
        return NextResponse.json({ success: false, data: null, error: "用户身份校验失败" }, { status: 401 });
      }
    }

    const membershipLevel = body.membershipLevel === "enterprise" || body.membershipLevel === "vip"
      ? body.membershipLevel
      : body.vipStatus ? "vip" : "free";
    let profile = null;
    try {
      profile = await upsertProfile({ id: body.id, email: body.email, username: body.nickname || body.email.split("@")[0], membershipLevel });
    } catch {
      profile = null;
    }

    const user = await upsertUser({ id: body.id, email: body.email, nickname: body.nickname, vipStatus: Boolean(body.vipStatus) });
    const data = profile
      ? { ...profile, nickname: profile.username, vip_level: profile.membership_level, vip_status: profile.membership_level !== "free" }
      : user;
    return NextResponse.json({ success: true, data, databaseConfigured: Boolean(user || profile) });
  } catch {
    return NextResponse.json({ success: false, data: null }, { status: 503 });
  }
}
