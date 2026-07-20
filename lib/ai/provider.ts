import {
  requestOpenRouter,
  type OpenRouterOptions,
  type OpenRouterResult,
} from "@/lib/ai/openrouter";
import { requestDeepSeek } from "@/lib/ai/deepseek";

export type AIProviderTier = "free" | "vip" | "enterprise";
export type AIProviderName = "deepseek" | "openrouter" | "free" | "vip" | "enterprise";

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIProviderOptions = OpenRouterOptions;
export type AIProviderResult = OpenRouterResult & {
  provider?: "deepseek" | "openrouter";
  fallback?: boolean;
};

export type AIProvider = {
  name: AIProviderName;
  tier: AIProviderTier;
  generate: (
    messages: AIMessage[],
    options?: AIProviderOptions,
  ) => Promise<AIProviderResult>;
};

function getConfiguredProvider(): AIProviderName {
  const configuredProvider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (configuredProvider === "deepseek" || configuredProvider === "openrouter" || configuredProvider === "free" || configuredProvider === "vip" || configuredProvider === "enterprise") {
    return configuredProvider;
  }

  return "openrouter";
}

function createProvider(name: AIProviderName, tier: AIProviderTier, generate: AIProvider["generate"]): AIProvider {
  return {
    name,
    tier,
    generate,
  };
}

function getAIProvider(): AIProvider {
  const configuredProvider = getConfiguredProvider();

  switch (configuredProvider) {
    case "openrouter":
      return createProvider("openrouter", "free", requestOpenRouter);
    case "vip":
      return createProvider("vip", "vip", requestDeepSeek);
    case "enterprise":
      return createProvider("enterprise", "enterprise", requestDeepSeek);
    case "free":
      return createProvider("free", "free", requestDeepSeek);
    case "deepseek":
      return createProvider("deepseek", "free", requestDeepSeek);
    default:
      return createProvider("deepseek", "free", requestDeepSeek);
  }
}

export async function requestAI(
  messages: AIMessage[],
  options: AIProviderOptions = {},
): Promise<AIProviderResult> {
  const provider = getAIProvider();

  console.info(`[AI provider] name=${provider.name} tier=${provider.tier}`);
  const result = await provider.generate(messages, options);

  const primaryName = provider.name === "openrouter" ? "openrouter" : "deepseek";
  if (result.success) {
    return { ...result, provider: primaryName, fallback: false };
  }

  if (primaryName === "deepseek") {
    console.info(`[AI provider] fallback=openrouter primary=${primaryName} status=${result.status}`);
    const fallback = await requestOpenRouter(messages, options);
    return fallback.success
      ? { ...fallback, provider: "openrouter", fallback: true }
      : { ...result, provider: "deepseek", fallback: true };
  }

  console.info(`[AI provider] fallback=deepseek primary=${primaryName} status=${result.status}`);
  const fallback = await requestDeepSeek(messages, options);
  return fallback.success
    ? { ...fallback, provider: "deepseek", fallback: true }
    : { ...result, provider: "openrouter", fallback: true };
}
