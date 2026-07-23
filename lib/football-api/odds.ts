import { footballApiRequest } from "./client.ts";
import type { FootballApiOdds } from "./types.ts";

type ApiOddsResponse = {
  fixture?: { id?: number };
  bookmakers?: Array<{ bets?: Array<{ id?: number; name?: string; values?: Array<{ value?: string; odd?: string }> }> }>;
};

function findOdd(payload: ApiOddsResponse[], value: string) {
  for (const fixture of payload) {
    for (const bookmaker of fixture.bookmakers ?? []) {
      const bet = bookmaker.bets?.find((item) => item.id === 1 || item.name === "Match Winner");
      const quote = bet?.values?.find((item) => item.value?.toLowerCase() === value.toLowerCase());
      const odd = Number(quote?.odd);
      if (Number.isFinite(odd)) return odd;
    }
  }
  return null;
}

export async function getMatchOdds(fixtureId: number): Promise<FootballApiOdds> {
  const response = await footballApiRequest<ApiOddsResponse[]>("odds", { fixture: fixtureId });
  return {
    match_id: String(fixtureId),
    home_odds: findOdd(response, "Home"),
    draw_odds: findOdd(response, "Draw"),
    away_odds: findOdd(response, "Away"),
    source: "api-football",
  };
}
