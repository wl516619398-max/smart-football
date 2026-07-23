import { NextResponse } from "next/server";
import { getTeamFormSummary, type TeamFormSummary } from "@/lib/football/team-form-service";

export const dynamic = "force-dynamic";

type TeamOption = {
  id: string;
  name: string;
};

const TEAM_NAMES: Record<string, string> = {
  "33": "曼联",
  "40": "利物浦",
  "42": "阿森纳",
  "49": "切尔西",
  "50": "曼城",
  "541": "皇家马德里",
  "529": "巴塞罗那",
  "157": "拜仁慕尼黑",
  "165": "多特蒙德",
  "496": "尤文图斯",
  "85": "巴黎圣日耳曼",
};

function teamOption(teamId: string): TeamOption {
  return { id: teamId, name: TEAM_NAMES[teamId] ?? `球队 ${teamId}` };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function calculatePrediction(home: TeamFormSummary, away: TeamFormSummary) {
  const homeRating = home.formScore * 0.55 + home.averageGoalsFor * 12 - home.averageGoalsAgainst * 8 + 8;
  const awayRating = away.formScore * 0.55 + away.averageGoalsFor * 12 - away.averageGoalsAgainst * 8;
  const gap = homeRating - awayRating;

  const rawHome = clamp(36 + gap * 0.25, 12, 72);
  const rawAway = clamp(29 - gap * 0.18, 12, 62);
  const rawDraw = clamp(100 - rawHome - rawAway, 16, 42);
  const total = rawHome + rawDraw + rawAway;
  const homeWin = Math.round((rawHome / total) * 100);
  const awayWin = Math.round((rawAway / total) * 100);

  return {
    homeWin,
    draw: 100 - homeWin - awayWin,
    awayWin,
  };
}

function getRecommendation(prediction: { homeWin: number; draw: number; awayWin: number }) {
  if (prediction.homeWin >= prediction.draw && prediction.homeWin >= prediction.awayWin) return "主队方向";
  if (prediction.awayWin >= prediction.homeWin && prediction.awayWin >= prediction.draw) return "客队方向";
  return "平局方向";
}

function getRisk(home: TeamFormSummary, away: TeamFormSummary, prediction: { homeWin: number; draw: number; awayWin: number }) {
  const sampleLimited = home.matches < 5 || away.matches < 5;
  const probabilities = [prediction.homeWin, prediction.draw, prediction.awayWin].sort((left, right) => right - left);
  if (sampleLimited || probabilities[0] - probabilities[1] < 8) return "高：近期数据样本有限或双方实力接近";
  if (probabilities[0] - probabilities[1] < 15) return "中：双方表现存在波动，结果不确定性较高";
  return "低：近期状态和攻防数据形成较清晰的模型倾向";
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const homeTeamId = params.get("home_team_id")?.trim() ?? "";
  const awayTeamId = params.get("away_team_id")?.trim() ?? "";

  if (!homeTeamId || !awayTeamId) {
    return NextResponse.json({ success: false, error: "home_team_id and away_team_id are required" }, { status: 400 });
  }
  if (homeTeamId === awayTeamId) {
    return NextResponse.json({ success: false, error: "home_team_id and away_team_id must be different" }, { status: 400 });
  }

  try {
    const [homeForm, awayForm] = await Promise.all([
      getTeamFormSummary(homeTeamId),
      getTeamFormSummary(awayTeamId),
    ]);
    const prediction = calculatePrediction(homeForm, awayForm);

    return NextResponse.json({
      homeTeam: teamOption(homeTeamId),
      awayTeam: teamOption(awayTeamId),
      homeForm,
      awayForm,
      prediction,
      recommendation: getRecommendation(prediction),
      risk: getRisk(homeForm, awayForm, prediction),
    });
  } catch (error) {
    console.error("[football/predict] failed:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, error: "Prediction data unavailable" }, { status: 502 });
  }
}
