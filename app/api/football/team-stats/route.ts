import { NextResponse } from "next/server";
import { calculateFootballStrengthRating } from "@/lib/football/rating";
import { getTeamRecentStats } from "@/lib/football/stats";

export async function GET(request: Request) {
  const teamId = new URL(request.url).searchParams.get("team_id")?.trim();
  if (!teamId) {
    return NextResponse.json({ success: false, error: "team_id 参数不能为空" }, { status: 400 });
  }

  try {
    const stats = await getTeamRecentStats(teamId);
    const rating = calculateFootballStrengthRating(stats);
    return NextResponse.json({
      team: stats.team,
      stats: {
        last10: stats.last10,
        goals: stats.goals,
      },
      rating: {
        attack: rating.attackScore,
        defense: rating.defenseScore,
        form: rating.formScore,
        overall: rating.overallScore,
      },
    });
  } catch (error) {
    console.error("Football team stats failed:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, error: "球队近期数据暂不可用" }, { status: 502 });
  }
}
