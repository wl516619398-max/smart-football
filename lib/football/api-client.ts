import type { ApiFootballEnvelope } from "@/lib/football/types";
import { decodeUnicodeDeep } from "@/lib/utils/decode-unicode";

/**
 * Mock-only client used by the first data-collection phase.
 * It deliberately does not perform network requests.
 */
export type MockFootballApiClient = {
  request<T>(payload: T): Promise<T>;
};

export const mockFootballApiClient: MockFootballApiClient = {
  async request<T>(payload: T) {
    return decodeUnicodeDeep(payload);
  },
};

const API_FOOTBALL_BASE_URL = process.env.FOOTBALL_API_BASE_URL || process.env.FOOTBALL_API_URL || "https://v3.football.api-sports.io";
const API_FOOTBALL_KEY = process.env.FOOTBALL_API_KEY;

export const isFootballApiConfigured = Boolean(API_FOOTBALL_KEY);

export async function requestFootballApiRaw<T>(path: string, params: Record<string, string | number> = {}): Promise<ApiFootballEnvelope<T> | null> {
  if (!API_FOOTBALL_KEY) return null;

  const url = new URL(`${API_FOOTBALL_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "x-apisports-key": API_FOOTBALL_KEY },
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return decodeUnicodeDeep((await response.json()) as ApiFootballEnvelope<T>);
  } catch {
    return null;
  }
}

export async function requestFootballApi<T>(path: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const payload = await requestFootballApiRaw<T>(path, params);
  if (!payload) return null;
    if (payload.errors && (Array.isArray(payload.errors) ? payload.errors.length > 0 : Object.keys(payload.errors).length > 0)) return null;
    return decodeUnicodeDeep(payload.response ?? null);
}
