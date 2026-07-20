import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseBrowser: SupabaseClient | null = null;

/**
 * Browser-safe Supabase client. It only uses the public anon key and is optional
 * because the current MVP keeps its local user state in localStorage.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  if (!supabaseBrowser) {
    supabaseBrowser = createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });
  }

  return supabaseBrowser;
}
