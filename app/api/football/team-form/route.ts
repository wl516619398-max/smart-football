import { NextResponse } from "next/server";
import { getTeamFormSummary } from "@/lib/football/team-form-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const teamId = new URL(request.url).searchParams.get("team_id")?.trim() ?? "";
  if (!teamId) {
    return NextResponse.json({ success: false, error: "team_id is required" }, { status: 400 });
  }

  try {
    return NextResponse.json({ success: true, data: await getTeamFormSummary(teamId) });
  } catch (error) {
    console.error("[football/team-form] failed:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, error: "Team form unavailable" }, { status: 502 });
  }
}
