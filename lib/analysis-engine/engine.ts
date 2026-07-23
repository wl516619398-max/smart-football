import type { MatchData } from "@/lib/data-provider/types";
import { createDeepSeekProvider } from "@/lib/analysis-engine/providers/deepseek";
import { createSkillProvider } from "@/lib/analysis-engine/providers/skill";
import { matchDataToSkillSnapshot } from "@/lib/analysis-engine/skill/snapshot";
import type { AnalysisProvider, AnalysisProviderName, AnalysisProviderResult, AnalysisRunOptions, MatchPrediction } from "@/lib/analysis-engine/types";

export const DEFAULT_ANALYSIS_PROVIDER: AnalysisProviderName = "skill";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Synchronous rule model kept for existing page/server consumers. */
export function analyzeMatch(match: MatchData): MatchPrediction {
  const homeStats = match.home_team_stats;
  const awayStats = match.away_team_stats;
  const homeStrength = homeStats.attack * 0.35 + homeStats.defense * 0.25 + homeStats.form * 0.25 + homeStats.homeAdvantage * 0.15;
  const awayStrength = awayStats.attack * 0.35 + awayStats.defense * 0.25 + awayStats.form * 0.25 + awayStats.homeAdvantage * 0.1;
  const gap = homeStrength - awayStrength;
  const draw = clamp(Math.round(29 - Math.abs(gap) * 0.08), 18, 34);
  const remaining = 100 - draw;
  const homeWin = Math.round(remaining * clamp(0.5 + gap / 120, 0.15, 0.85));
  const awayWin = remaining - homeWin;
  const confidence = clamp(Math.round(58 + Math.abs(homeWin - awayWin) * 1.2), 50, 92);
  const expectedHome = clamp((homeStats.xG ?? homeStats.goalsFor / 5) * 0.7 + (awayStats.goalsAgainst / 5) * 0.3, 0, 4);
  const expectedAway = clamp((awayStats.xG ?? awayStats.goalsFor / 5) * 0.7 + (homeStats.goalsAgainst / 5) * 0.3, 0, 4);
  const recommendedPick = homeWin >= awayWin && homeWin >= draw ? "主队方向" : awayWin >= draw ? "客队方向" : "平局方向";

  return {
    home_win_probability: homeWin,
    draw_probability: draw,
    away_win_probability: awayWin,
    recommended_pick: recommendedPick,
    confidence,
    expected_score: `${Math.round(expectedHome)}-${Math.round(expectedAway)}`,
    key_factors: ["近期状态", "攻防指标", "主客场因素"],
  };
}

function configuredProvider(): AnalysisProviderName {
  const value = process.env.ANALYSIS_PROVIDER?.trim().toLowerCase();
  if (value === "deepseek" || value === "skill" || value === "mock") return value;
  return DEFAULT_ANALYSIS_PROVIDER;
}

function providersFor(name: AnalysisProviderName): AnalysisProvider[] {
  const skill = createSkillProvider();
  const deepseek = createDeepSeekProvider();
  if (name === "deepseek") return [deepseek];
  if (name === "mock") return [skill];
  return [skill, deepseek];
}

export async function runAnalysis(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: AnalysisRunOptions = {},
): Promise<AnalysisProviderResult> {
  const primary = configuredProvider();
  const providers = providersFor(primary);
  let lastResult: AnalysisProviderResult | null = null;

  for (const provider of providers) {
    const result = await provider.analyze(messages, options);
    lastResult = result;
    if (result.success) {
      console.info(`[Analysis engine] provider=${provider.name} status=success fallback=${provider.name !== primary}`);
      return { ...result, fallback: provider.name !== primary };
    }
    console.info(`[Analysis engine] provider=${provider.name} status=failed code=${result.code} fallback=true`);
  }

  return lastResult ?? {
    success: false,
    code: "ANALYSIS_PROVIDER_FAILED",
    status: 503,
    retryAfter: 0,
    model: primary,
    provider: primary,
  };
}

/** Run the default analysis chain with a complete provider-neutral MatchData snapshot. */
export async function runMatchAnalysis(match: MatchData, options: AnalysisRunOptions = {}) {
  return runAnalysis([], { ...options, skillSnapshot: matchDataToSkillSnapshot(match) });
}

export { configuredProvider as getConfiguredAnalysisProvider };
export type { AnalysisProvider, AnalysisProviderName, AnalysisProviderResult } from "@/lib/analysis-engine/types";
