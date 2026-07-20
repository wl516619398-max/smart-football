import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, connected: false, error: "Supabase environment variables are not configured" },
      { status: 503 },
    );
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, connected: false, error: "Supabase client could not be created" }, { status: 503 });
  }

  const { count, error } = await supabase.from("users").select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ success: false, connected: false, error: error.message }, { status: 503 });
  }

  return NextResponse.json({ success: true, connected: true, table: "users", count: count ?? 0 });
}
