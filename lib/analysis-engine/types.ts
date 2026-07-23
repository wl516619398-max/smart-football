import type { OpenRouterOptions } from "@/lib/ai/openrouter";
import type { MatchData } from "@/lib/data-provider/types";
import type { SkillSnapshot } from "@/lib/analysis-engine/skill/types";

export type MatchPrediction = {
  home_win_probability: number;
  draw_probability: number;
  away_win_probability: number;
  recommended_pick: string;
  confidence: number;
  expected_score: string;
  key_factors: string[];
};

export type RuleAnalysisInput = MatchData;

export type AnalysisProviderName = "skill" | "deepseek" | "mock";

export type AnalysisProviderResult =
  | { success: true; content: string; model: string; provider: AnalysisProviderName; fallback?: boolean }
  | { success: false; code: string; status: number; retryAfter: number; model: string; provider: AnalysisProviderName; fallback?: boolean };

export type AnalysisProvider = {
  name: AnalysisProviderName;
  analyze: (messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, options?: AnalysisRunOptions) => Promise<AnalysisProviderResult>;
};

export type AnalysisRunOptions = OpenRouterOptions & {
  skillSnapshot?: SkillSnapshot;
};
