import type { OpenRouterOptions, OpenRouterResult } from "@/lib/ai/openrouter";

const DEEPSEEK_DEFAULT_MODEL = "deepseek-chat";
const DEEPSEEK_DEFAULT_ENDPOINT = "https://api.deepseek.com/chat/completions";

type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepSeekResponse = {
  model?: string;
  choices?: Array<{
    message?: { content?: string | null };
  }>;
};

function getConfiguredModel() {
  return process.env.DEEPSEEK_MODEL?.trim() || DEEPSEEK_DEFAULT_MODEL;
}

function getEndpoint() {
  const baseUrl = process.env.DEEPSEEK_API_BASE_URL?.trim();
  if (!baseUrl) return DEEPSEEK_DEFAULT_ENDPOINT;
  return `${baseUrl.replace(/\/$/, "")}/chat/completions`;
}

function parseRetryAfter(value: string | null) {
  if (!value) return 10;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.min(10, Math.max(0, Math.ceil(seconds)));

  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.min(10, Math.max(0, Math.ceil((date - Date.now()) / 1000)));
  return 10;
}

function wait(seconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));
}

function getTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeout };
}

export async function requestDeepSeek(
  messages: DeepSeekMessage[],
  options: OpenRouterOptions = {},
): Promise<OpenRouterResult> {
  const model = getConfiguredModel();
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const baseUrl = process.env.DEEPSEEK_API_BASE_URL?.trim() || "https://api.deepseek.com";
  console.info(`[DeepSeek] request keyConfigured=${Boolean(apiKey)} base_url=${baseUrl} model=${model}`);
  if (!apiKey) {
    console.info(`[DeepSeek] model=${model} status=not-configured retryAfter=0 error=API key is not configured`);
    return { success: false, code: "AI_REQUEST_FAILED", status: 500, retryAfter: 0, model };
  }

  const timeoutMs = options.timeoutMs ?? 15_000;
  let retryCount = 0;

  while (true) {
    const { controller, timeout } = getTimeoutSignal(timeoutMs);

    try {
      const response = await fetch(getEndpoint(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 800,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
        cache: "no-store",
      });

      const body = await response.text();
      const retryAfter = response.status === 429 ? parseRetryAfter(response.headers.get("retry-after")) : 0;
      console.info(`[DeepSeek] response model=${model} status=${response.status} retryAfter=${retryAfter} body=${body.slice(0, 500)}`);

      if (response.status === 429 && retryCount < 1) {
        retryCount += 1;
        await wait(retryAfter);
        continue;
      }

      if (response.status === 429) return { success: false, code: "AI_RATE_LIMITED", status: 429, retryAfter, model };
      if (response.status === 404) return { success: false, code: "AI_MODEL_UNAVAILABLE", status: 503, retryAfter: 0, model };
      if (!response.ok) return { success: false, code: "AI_REQUEST_FAILED", status: 500, retryAfter: 0, model };

      try {
        const payload = JSON.parse(body) as DeepSeekResponse;
        const content = payload.choices?.[0]?.message?.content;
        if (typeof content === "string" && content.trim()) {
          return { success: true, content: content.trim(), model: payload.model?.trim() || model };
        }
      } catch {
        // The API route handles malformed output as AI_REQUEST_FAILED.
      }

      return { success: false, code: "AI_REQUEST_FAILED", status: 500, retryAfter: 0, model };
    } catch (error) {
      console.error(`[DeepSeek] model=${model} status=network-error retryAfter=0 error=${error instanceof Error ? error.message : "request failed"}`);
      return { success: false, code: "AI_REQUEST_FAILED", status: 500, retryAfter: 0, model };
    } finally {
      clearTimeout(timeout);
    }
  }
}
