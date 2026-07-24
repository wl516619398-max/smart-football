import { NextResponse } from "next/server";
import { syncUpcomingFootballMatches } from "@/lib/football/sync-service";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.MATCH_SYNC_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const result = await syncUpcomingFootballMatches();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[api/football/sync] failed:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
