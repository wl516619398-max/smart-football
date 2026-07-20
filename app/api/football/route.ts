import { NextResponse } from "next/server";
import { getUpcomingFixturesWithSource } from "@/lib/football/fixture-service";
import { isTodayOrFuture } from "@/lib/football/date-window";

export async function GET() {
  try {
    const result = await getUpcomingFixturesWithSource();
    const data = result.source === "football-api" ? result.matches : result.matches.filter((match) => isTodayOrFuture(match.date));
    return NextResponse.json({ success: true, data, source: result.source });
  } catch {
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
