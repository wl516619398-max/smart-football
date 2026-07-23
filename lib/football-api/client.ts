import type { FootballApiEnvelope } from "./types";

const DEFAULT_API_URL = "https://v3.football.api-sports.io";

export class FootballApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
    this.name = "FootballApiError";
  }
}

function getConfig() {
  const key = process.env.FOOTBALL_API_KEY?.trim();
  const baseUrl = (process.env.FOOTBALL_API_URL?.trim() || DEFAULT_API_URL).replace(/\/$/, "");
  if (!key) throw new FootballApiError("FOOTBALL_API_KEY is not configured");
  return { key, baseUrl };
}

function describeErrors(errors: FootballApiEnvelope<unknown>["errors"]) {
  if (!errors) return "unknown API error";
  return typeof errors === "string" ? errors : JSON.stringify(errors);
}

export async function footballApiRequest<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const { key, baseUrl } = getConfig();
  const url = new URL(`${baseUrl}/${path.replace(/^\//, "")}`);
  Object.entries(params).forEach(([name, value]) => url.searchParams.set(name, String(value)));

  let response: Response;
  let body: string;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", "x-apisports-key": key },
      cache: "no-store",
    });
    body = await response.text();
  } catch (error) {
    throw new FootballApiError(`request failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  let payload: FootballApiEnvelope<T>;
  try {
    payload = JSON.parse(body) as FootballApiEnvelope<T>;
  } catch {
    throw new FootballApiError(`HTTP ${response.status}: invalid JSON response`, response.status);
  }

  if (!response.ok) throw new FootballApiError(`HTTP ${response.status}: ${describeErrors(payload.errors)}`, response.status);
  if (payload.errors && (Array.isArray(payload.errors) ? payload.errors.length > 0 : Object.keys(payload.errors).length > 0)) {
    throw new FootballApiError(`API error: ${describeErrors(payload.errors)}`, response.status);
  }
  return payload.response ?? ([] as T);
}
