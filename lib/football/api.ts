export { isFootballApiConfigured, requestFootballApi as footballApiRequest, requestFootballApiRaw as footballApiRawRequest } from "./api-client.ts";

export function footballApiRequestUrl(path: string, params: Record<string, string | number> = {}) {
  const base = process.env.FOOTBALL_API_BASE_URL || process.env.FOOTBALL_API_URL || "https://v3.football.api-sports.io";
  const url = new URL(`${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  for (const key of ["key", "api_key", "apikey", "x-apisports-key", "token"]) {
    url.searchParams.delete(key);
  }
  return url.toString();
}
