import { requestDeepSeek } from "@/lib/ai/deepseek";
import type { AnalysisProvider, AnalysisRunOptions } from "@/lib/analysis-engine/types";

export function createDeepSeekProvider(): AnalysisProvider {
  return {
    name: "deepseek",
    async analyze(messages, options?: AnalysisRunOptions) {
      const result = await requestDeepSeek(messages, options);
      return result.success
        ? { ...result, provider: "deepseek" as const }
        : { ...result, provider: "deepseek" as const };
    },
  };
}
