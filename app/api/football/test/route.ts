import { NextResponse } from "next/server";
import { footballApiRequest, isFootballApiConfigured } from "@/lib/football/api";

export async function GET() {
  if (!isFootballApiConfigured) {
    return NextResponse.json({
      success: false,
      provider: "api-football",
      configured: false,
      data: null,
      error: "FOOTBALL_API_KEY 未配置",
    }, { status: 503 });
  }

  const data = await footballApiRequest<unknown>("status");
  if (data === null) {
    return NextResponse.json({
      success: false,
      provider: "api-football",
      configured: true,
      data: null,
      error: "Football API 请求失败",
    }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    provider: "api-football",
    configured: true,
    data,
  });
}
