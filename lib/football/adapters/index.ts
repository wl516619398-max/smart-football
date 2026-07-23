import type { FootballProviderKind } from "@/lib/football/data-provider";
import { createMockFootballAdapter } from "@/lib/football/adapters/mock";
import { createRealFootballAdapter, type RealFootballProviderName } from "@/lib/football/adapters/real";
import type { FootballApiAdapter } from "@/lib/football/adapters/types";

function normalizeProvider(value: string | undefined): FootballProviderKind {
  const normalized = value?.trim().toLowerCase();

  // An explicit mock setting must win even when an API adapter is configured.
  if (normalized === "mock") return "mock";
  if (normalized === "api" || normalized === "api-football") return "api";
  if (normalized === "database" || normalized === "external") {
    return normalized;
  }

  if (process.env.FOOTBALL_API_PROVIDER?.trim()) return "api";
  return "mock";
}

export function getFootballApiAdapter(
  provider?: FootballProviderKind,
  source?: RealFootballProviderName,
): FootballApiAdapter {
  const selectedProvider = provider === "api-football"
    ? "api"
    : provider ?? normalizeProvider(process.env.FOOTBALL_DATA_PROVIDER);

  switch (selectedProvider) {
    case "api":
      return createRealFootballAdapter(source);
    case "database":
    case "external":
      // Reserved adapters currently use Mock data until their integrations are added.
      return createMockFootballAdapter(selectedProvider);
    case "mock":
    default:
      return createMockFootballAdapter("mock");
  }
}

export type { FootballApiAdapter } from "@/lib/football/adapters/types";
