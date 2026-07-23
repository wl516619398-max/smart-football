import { footballApiRequest } from "@/lib/football/api";
import { decodeUnicodeDeep } from "@/lib/utils/decode-unicode";

export type FixtureOdds = {
  home: { odds: number };
  draw: { odds: number };
  away: { odds: number };
};

type ApiOddsValue = {
  value?: string;
  odd?: string | number;
};

type ApiBet = {
  name?: string;
  values?: ApiOddsValue[];
};

type ApiBookmaker = {
  bets?: ApiBet[];
};

type ApiFixtureOdds = {
  bookmakers?: ApiBookmaker[];
};

const MOCK_ODDS: FixtureOdds = {
  home: { odds: 2.1 },
  draw: { odds: 3.4 },
  away: { odds: 3.2 },
};

function parseOdd(value: ApiOddsValue | undefined) {
  const odd = typeof value?.odd === "number" ? value.odd : Number(value?.odd);
  return Number.isFinite(odd) && odd > 1 ? odd : null;
}

function findOutcome(values: ApiOddsValue[] | undefined, outcome: string) {
  const item = values?.find((value) => value.value?.trim().toLowerCase() === outcome);
  return parseOdd(item);
}

function parseFixtureOdds(response: ApiFixtureOdds[] | null): FixtureOdds | null {
  for (const fixture of response ?? []) {
    for (const bookmaker of fixture.bookmakers ?? []) {
      const matchWinner = bookmaker.bets?.find((bet) => bet.name?.trim().toLowerCase() === "match winner");
      const home = findOutcome(matchWinner?.values, "home");
      const draw = findOutcome(matchWinner?.values, "draw");
      const away = findOutcome(matchWinner?.values, "away");
      if (home !== null && draw !== null && away !== null) {
        return decodeUnicodeDeep({ home: { odds: home }, draw: { odds: draw }, away: { odds: away } });
      }
    }
  }
  return null;
}

export async function getFixtureOdds(fixtureId: string): Promise<FixtureOdds> {
  const response = await footballApiRequest<ApiFixtureOdds[]>("odds", { fixture: fixtureId });
  return decodeUnicodeDeep(parseFixtureOdds(response) ?? MOCK_ODDS);
}
