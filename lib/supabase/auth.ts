import type { User } from "@supabase/supabase-js";
import type { DatabaseUser, PredictionRecord } from "@/lib/db/types";
import type { MembershipLevel } from "@/lib/db/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthResult<T> = {
  data: T;
  error: Error | null;
};

function configurationError() {
  return new Error("Supabase Auth 尚未配置，请检查 .env.local");
}

export async function signUp(email: string, password: string): Promise<AuthResult<{ user: User | null; session: unknown }>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: { user: null, session: null }, error: configurationError() };

  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function signIn(email: string, password: string): Promise<AuthResult<{ user: User | null; session: unknown }>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: { user: null, session: null }, error: configurationError() };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut(): Promise<{ error: Error | null }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: configurationError() };

  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getUser(): Promise<User | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

export async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function getProfile(): Promise<DatabaseUser | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const response = await fetch("/api/user/profile", { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) return null;
  const payload = (await response.json()) as { data?: DatabaseUser | null };
  return payload.data ?? null;
}

export async function syncProfile(nickname?: string): Promise<DatabaseUser | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const response = await fetch("/api/user/profile", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { data?: DatabaseUser | null };
  return payload.data ?? null;
}

export async function updateMembershipProfile(membershipLevel: MembershipLevel): Promise<DatabaseUser | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const response = await fetch("/api/user/profile", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ membershipLevel }),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { data?: DatabaseUser | null };
  return payload.data ?? null;
}

export async function upgradeProfile(): Promise<DatabaseUser | null> {
  return updateMembershipProfile("vip");
}

export type PredictionInput = {
  matchId: string;
  prediction: string;
  confidence: number;
  score: string;
};

export async function savePrediction(input: PredictionInput) {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const response = await fetch("/api/predictions", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { data?: unknown };
  return payload.data ?? null;
}

export async function getPredictionHistory() {
  const accessToken = await getAccessToken();
  if (!accessToken) return [];

  const response = await fetch("/api/predictions", { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) return [];
  const payload = (await response.json()) as { data?: PredictionRecord[] };
  return payload.data ?? [];
}

export async function syncUnverifiedUser(user: User, nickname?: string) {
  if (!user.email) return null;

  const response = await fetch("/api/users/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: user.id, email: user.email, nickname }),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { data?: DatabaseUser | null };
  return payload.data ?? null;
}
