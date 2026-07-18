import type { ApiFootballEnvelope } from "@/lib/football/types";

const API_FOOTBALL_BASE_URL = process.env.FOOTBALL_API_BASE_URL || "https://v3.football.api-sports.io";
const API_FOOTBALL_KEY = process.env.FOOTBALL_API_KEY;

export const isFootballApiConfigured = Boolean(API_FOOTBALL_KEY);

export async function requestFootballApi<T>(path: string, params: Record<string, string | number> = {}): Promise<T | null> {
  if (!API_FOOTBALL_KEY) return null;

  const url = new URL(`${API_FOOTBALL_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "x-apisports-key": API_FOOTBALL_KEY },
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as ApiFootballEnvelope<T>;
    if (payload.errors && (Array.isArray(payload.errors) ? payload.errors.length > 0 : Object.keys(payload.errors).length > 0)) return null;
    return payload.response ?? null;
  } catch {
    return null;
  }
}
