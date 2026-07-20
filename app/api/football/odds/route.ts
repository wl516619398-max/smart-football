import { NextResponse } from "next/server";
import { getFixtureOdds } from "@/lib/football/odds";

export async function GET(request: Request) {
  const fixtureId = new URL(request.url).searchParams.get("fixture_id")?.trim();
  if (!fixtureId) {
    return NextResponse.json({ success: false, error: "fixture_id 参数不能为空" }, { status: 400 });
  }

  try {
    return NextResponse.json(await getFixtureOdds(fixtureId));
  } catch (error) {
    console.error("Football odds failed:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(await getFixtureOddsFallback(), { status: 200 });
  }
}

async function getFixtureOddsFallback() {
  return {
    home: { odds: 2.1 },
    draw: { odds: 3.4 },
    away: { odds: 3.2 },
  };
}
