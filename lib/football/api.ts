const apiBaseUrl = process.env.FOOTBALL_API_BASE_URL;
const apiKey = process.env.FOOTBALL_API_KEY;

export const isFootballApiConfigured = Boolean(apiBaseUrl);

export async function footballApiRequest<T>(path: string, init?: RequestInit): Promise<T | undefined> {
  if (!apiBaseUrl) return undefined;

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
        ...init?.headers,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) return undefined;
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}
