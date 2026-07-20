const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_DEFAULT_MODEL = "openrouter/free";

type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

type OpenRouterFailureCode = "AI_RATE_LIMITED" | "AI_MODEL_UNAVAILABLE" | "AI_REQUEST_FAILED";

export type OpenRouterOptions = {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export type OpenRouterResult =
  | { success: true; content: string; model: string }
  | { success: false; code: OpenRouterFailureCode; status: number; retryAfter: number; model: string };

type ProviderResponse = {
  status: number;
  body: string;
  retryAfter: number;
};

function getConfiguredModel() {
  const configuredModel = process.env.OPENROUTER_MODEL?.trim();
  return configuredModel || OPENROUTER_DEFAULT_MODEL;
}

function parseRetryAfter(value: string | null) {
  if (!value) return 10;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.min(10, Math.max(0, Math.ceil(seconds)));

  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.min(10, Math.max(0, Math.ceil((date - Date.now()) / 1000)));
  return 10;
}

function getErrorDetail(body: string, status: number) {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: unknown } };
    if (typeof parsed.error?.message === "string") return parsed.error.message.replace(/\s+/g, " ").slice(0, 240);
  } catch {
    // Keep provider logs concise even when the response is not JSON.
  }
  return `HTTP ${status}`;
}

function logProviderResponse(model: string, response: ProviderResponse) {
  console.info(`[OpenRouter] model=${model} status=${response.status} retryAfter=${response.retryAfter} error=${getErrorDetail(response.body, response.status)}`);
}

function wait(seconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));
}

function getTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeout };
}

async function callProvider(model: string, messages: OpenRouterMessage[], options: OpenRouterOptions): Promise<ProviderResponse | null> {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return null;

  let retryCount = 0;
  while (true) {
    const { controller, timeout } = getTimeoutSignal(timeoutMs);

    try {
      const response = await fetch(OPENROUTER_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
          "X-Title": process.env.NEXT_PUBLIC_APP_NAME ?? "Project Athena",
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
      const providerResponse = { status: response.status, body, retryAfter: response.status === 429 ? parseRetryAfter(response.headers.get("retry-after")) : 0 };
      logProviderResponse(model, providerResponse);

      if (response.status !== 429 || retryCount >= 1) return providerResponse;
      retryCount += 1;
      await wait(providerResponse.retryAfter);
    } catch (error) {
      console.error(`[OpenRouter] model=${model} status=network-error retryAfter=0 error=${error instanceof Error ? error.message : "request failed"}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export async function requestOpenRouter(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {},
): Promise<OpenRouterResult> {
  const model = getConfiguredModel();
  if (!process.env.OPENROUTER_API_KEY?.trim()) {
    console.info(`[OpenRouter] model=${model} status=not-configured retryAfter=0 error=API key is not configured`);
    return { success: false, code: "AI_REQUEST_FAILED", status: 500, retryAfter: 0, model };
  }

  const models = model === OPENROUTER_DEFAULT_MODEL ? [model] : [model, OPENROUTER_DEFAULT_MODEL];

  for (const candidate of models) {
    const response = await callProvider(candidate, messages, options);
    if (!response) return { success: false, code: "AI_REQUEST_FAILED", status: 500, retryAfter: 0, model: candidate };

    if (response.status >= 200 && response.status < 300) {
      try {
        const payload = JSON.parse(response.body) as OpenRouterResponse;
        const content = payload.choices?.[0]?.message?.content;
        if (typeof content === "string" && content.trim()) return { success: true, content: content.trim(), model: candidate };
      } catch {
        // The route converts an invalid provider response into AI_REQUEST_FAILED.
      }
      return { success: false, code: "AI_REQUEST_FAILED", status: 500, retryAfter: 0, model: candidate };
    }

    if (response.status === 429) return { success: false, code: "AI_RATE_LIMITED", status: 429, retryAfter: response.retryAfter, model: candidate };
    if (response.status === 404 && candidate !== OPENROUTER_DEFAULT_MODEL) continue;
    if (response.status === 404) return { success: false, code: "AI_MODEL_UNAVAILABLE", status: 503, retryAfter: 0, model: candidate };
    return { success: false, code: "AI_REQUEST_FAILED", status: 500, retryAfter: 0, model: candidate };
  }

  return { success: false, code: "AI_MODEL_UNAVAILABLE", status: 503, retryAfter: 0, model: OPENROUTER_DEFAULT_MODEL };
}
