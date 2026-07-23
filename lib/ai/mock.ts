import type { OpenRouterOptions, OpenRouterResult } from "@/lib/ai/openrouter";

export async function requestMockAI(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  _options: OpenRouterOptions = {},
): Promise<OpenRouterResult> {
  const userMessage = messages.find((message) => message.role === "user")?.content ?? "";
  const teamLine = userMessage.split("\n").find((line) => line.includes("vs")) ?? "当前比赛";

  return {
    success: true,
    model: "mock",
    content: JSON.stringify({
      summary: `${teamLine}的模型观点基于当前传入的球队状态、攻防指标和比赛背景生成。由于使用的是本地分析模式，信息维度有限，结论仅用于赛事信息参考。`,
      strengths: ["已完成基础球队数据整理"],
      risks: ["数据样本和临场信息可能不完整"],
      keyFactors: ["近期状态", "攻防评分", "主客场因素"],
      dataLimitations: ["当前使用 Mock AI，未连接外部语言模型"],
      confidence: 50,
      score: 50,
    }),
  };
}
