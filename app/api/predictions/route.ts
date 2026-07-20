import { NextResponse } from "next/server";
import { createPredictionRecord, getPredictionRecords } from "@/lib/db/predictions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type PredictionBody = {
  matchId?: string;
  prediction?: string;
  confidence?: number;
  score?: string;
  result?: string | null;
};

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

async function getAuthenticatedUserId(request: Request) {
  const supabase = getSupabaseServerClient();
  const token = getBearerToken(request);
  if (!supabase || !token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user?.id ?? null;
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) return NextResponse.json({ success: false, data: [], error: "未登录" }, { status: 401 });

    const matchId = new URL(request.url).searchParams.get("matchId") ?? undefined;
    const data = await getPredictionRecords(userId, matchId);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, data: [] }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) return NextResponse.json({ success: false, data: null, error: "未登录" }, { status: 401 });

    const body = (await request.json()) as PredictionBody;
    if (!body.matchId || !body.prediction || typeof body.confidence !== "number" || !body.score) {
      return NextResponse.json({ success: false, data: null, error: "matchId, prediction, confidence and score are required" }, { status: 400 });
    }

    const data = await createPredictionRecord({
      userId,
      matchId: body.matchId,
      prediction: body.prediction,
      confidence: body.confidence,
      score: body.score,
      result: body.result,
    });
    return NextResponse.json({ success: true, data, databaseConfigured: Boolean(data) });
  } catch {
    return NextResponse.json({ success: false, data: null }, { status: 503 });
  }
}
