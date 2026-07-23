export type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type DeepSeekClientOptions = {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export type DeepSeekClientResult = {
  content: string;
  model: string;
};

type DeepSeekResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: string | null } }>;
};

const DEFAULT_BASE_URL = "https://api.deepseek.com";

function getConfiguredModel() {
  return process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
}

function getEndpoint() {
  const baseUrl = process.env.DEEPSEEK_API_BASE_URL?.trim() || DEFAULT_BASE_URL;
  return `${baseUrl.replace(/\/$/, "")}/chat/completions`;
}

function getTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeout };
}

export async function callDeepSeek(
  messages: DeepSeekMessage[],
  options: DeepSeekClientOptions = {},
): Promise<DeepSeekClientResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured");

  const model = getConfiguredModel();
  const timeoutMs = options.timeoutMs ?? 30_000;
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
        max_tokens: options.maxTokens ?? 4000,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`DeepSeek HTTP ${response.status}: ${body.slice(0, 500)}`);
    }

    let payload: DeepSeekResponse;
    try {
      payload = JSON.parse(body) as DeepSeekResponse;
    } catch {
      throw new Error("DeepSeek returned invalid JSON envelope");
    }

    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("DeepSeek response did not contain message content");
    }

    return { content: content.trim(), model: payload.model?.trim() || model };
  } finally {
    clearTimeout(timeout);
  }
}
