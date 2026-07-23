import { NextResponse } from "next/server";
import { getCollectionSnapshot } from "@/lib/football/collection-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCollectionSnapshot();
    if (!data) return NextResponse.json({ success: false, error: "Supabase is not configured" }, { status: 503 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
