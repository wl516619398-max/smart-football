import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MembershipLevel, UserProfile } from "@/lib/db/types";

export type UpsertProfileInput = {
  id: string;
  email: string;
  username: string;
  membershipLevel?: MembershipLevel;
};

export async function getProfileById(id: string): Promise<UserProfile | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,username,membership_level,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as UserProfile | null;
}

export async function upsertProfile(input: UpsertProfileInput): Promise<UserProfile | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: input.id,
        email: input.email,
        username: input.username.trim() || input.email.split("@")[0] || "Athena用户",
        membership_level: input.membershipLevel ?? "free",
      },
      { onConflict: "id" },
    )
    .select("id,email,username,membership_level,created_at")
    .single();

  if (error) throw new Error(error.message);
  return data as UserProfile;
}
