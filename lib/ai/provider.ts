import {
  requestOpenRouter,
  type OpenRouterOptions,
  type OpenRouterResult,
} from "@/lib/ai/openrouter";
import { requestDeepSeek } from "@/lib/ai/deepseek";
import { requestMockAI } from "@/lib/ai/mock";
import { requestOpenAI } from "@/lib/ai/openai";

export type AIProviderTier = "free" | "vip" | "enterprise";
export type AIProviderName = "deepseek" | "openrouter" | "openai" | "mock" | "free" | "vip" | "enterprise";
export const DEFAULT_AI_PROVIDER: AIProviderName = "deepseek";

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIProviderOptions = OpenRouterOptions;
export type AIProviderResult = OpenRouterResult & {
  provider?: "deepseek" | "openrouter" | "openai" | "mock";
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

  if (configuredProvider === "deepseek" || configuredProvider === "openrouter" || configuredProvider === "openai" || configuredProvider === "mock" || configuredProvider === "free" || configuredProvider === "vip" || configuredProvider === "enterprise") {
    return configuredProvider;
  }

  return DEFAULT_AI_PROVIDER;
}

function createProvider(name: AIProviderName, tier: AIProviderTier, generate: AIProvider["generate"]): AIProvider {
  return {
    name,
    tier,
    generate,
  };
}

export function getAIProvider(): AIProvider {
  const configuredProvider = getConfiguredProvider();

  switch (configuredProvider) {
    case "openrouter":
      return createProvider("openrouter", "free", requestOpenRouter);
    case "openai":
      return createProvider("openai", "enterprise", requestOpenAI);
    case "mock":
      return createProvider("mock", "free", requestMockAI);
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

  if (result.success) {
    return { ...result, provider: provider.name === "free" || provider.name === "vip" || provider.name === "enterprise" ? "deepseek" : provider.name, fallback: false };
  }

  const fallbackNames: AIProviderName[] = provider.name === "deepseek"
    ? ["openrouter", "mock"]
    : provider.name === "openrouter"
      ? ["deepseek", "mock"]
      : provider.name === "openai"
        ? ["deepseek", "openrouter", "mock"]
        : ["mock"];

  for (const fallbackName of fallbackNames) {
    const fallbackProvider = getProviderByName(fallbackName);
    console.info(`[AI provider] fallback=${fallbackName} primary=${provider.name} status=${result.status}`);
    const fallback = await fallbackProvider.generate(messages, options);
    if (fallback.success) return { ...fallback, provider: fallbackProvider.name === "free" || fallbackProvider.name === "vip" || fallbackProvider.name === "enterprise" ? "deepseek" : fallbackProvider.name, fallback: true };
  }

  return {
    ...result,
    provider: provider.name === "free" || provider.name === "vip" || provider.name === "enterprise" ? "deepseek" : provider.name,
    fallback: true,
  };
}

function getProviderByName(name: AIProviderName): AIProvider {
  switch (name) {
    case "openrouter": return createProvider("openrouter", "free", requestOpenRouter);
    case "openai": return createProvider("openai", "enterprise", requestOpenAI);
    case "mock": return createProvider("mock", "free", requestMockAI);
    case "deepseek":
    default: return createProvider("deepseek", "free", requestDeepSeek);
  }
}
