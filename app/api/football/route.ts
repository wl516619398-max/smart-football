import { NextResponse } from "next/server";
import { getUpcomingFixtures } from "@/lib/football/fixture-service";

export async function GET() {
  try {
    const data = await getUpcomingFixtures();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
