import type { OpenRouterOptions, OpenRouterResult } from "@/lib/ai/openrouter";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";

type OpenAIResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: string | null } }>;
};

function getModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

function getEndpoint() {
  const baseUrl = process.env.OPENAI_API_BASE_URL?.trim() || DEFAULT_BASE_URL;
  return `${baseUrl.replace(/\/$/, "")}/chat/completions`;
}

export async function requestOpenAI(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: OpenRouterOptions = {},
): Promise<OpenRouterResult> {
  const model = getModel();
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { success: false, code: "AI_REQUEST_FAILED", status: 500, retryAfter: 0, model };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);

  try {
    const response = await fetch(getEndpoint(), {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
    console.info(`[OpenAI] model=${model} status=${response.status} body=${body.slice(0, 500)}`);

    if (response.status === 429) return { success: false, code: "AI_RATE_LIMITED", status: 429, retryAfter: 10, model };
    if (response.status === 404) return { success: false, code: "AI_MODEL_UNAVAILABLE", status: 503, retryAfter: 0, model };
    if (!response.ok) return { success: false, code: "AI_REQUEST_FAILED", status: 500, retryAfter: 0, model };

    try {
      const payload = JSON.parse(body) as OpenAIResponse;
      const content = payload.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) return { success: true, content: content.trim(), model: payload.model?.trim() || model };
    } catch {
      // Return a normalized failure for malformed provider output.
    }
    return { success: false, code: "AI_REQUEST_FAILED", status: 500, retryAfter: 0, model };
  } catch {
    return { success: false, code: "AI_REQUEST_FAILED", status: 500, retryAfter: 0, model };
  } finally {
    clearTimeout(timeout);
  }
}
