import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { DatabaseUser } from "@/lib/db/types";

export type UpsertUserInput = {
  id: string;
  email: string;
  nickname?: string;
  vipLevel?: "free" | "vip";
  vipStatus?: boolean;
};

export async function upsertUser(input: UpsertUserInput): Promise<DatabaseUser | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        id: input.id,
        email: input.email,
        nickname: input.nickname?.trim() || input.email.split("@")[0] || "Athena用户",
        vip_level: input.vipLevel ?? (input.vipStatus ? "vip" : "free"),
        vip_status: input.vipStatus ?? input.vipLevel === "vip",
      },
      { onConflict: "id" },
    )
    .select("id,email,nickname,vip_level,vip_status,created_at")
    .single();

  if (error) throw new Error(error.message);
  return data as DatabaseUser;
}

export async function updateUserVipStatus(id: string, vipStatus: boolean): Promise<DatabaseUser | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .update({ vip_status: vipStatus, vip_level: vipStatus ? "vip" : "free" })
    .eq("id", id)
    .select("id,email,nickname,vip_level,vip_status,created_at")
    .single();

  if (error) throw new Error(error.message);
  return data as DatabaseUser;
}

export async function getUserProfile(id: string): Promise<DatabaseUser | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id,email,nickname,vip_level,vip_status,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as DatabaseUser | null;
}
