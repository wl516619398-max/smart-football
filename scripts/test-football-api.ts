type FootballApiResponse = {
  errors?: Record<string, unknown> | string[];
  results?: number;
  response?: Array<{
    fixture?: {
      id?: number;
      date?: string;
      status?: { short?: string | null; long?: string | null };
      venue?: { name?: string | null };
    };
    league?: { id?: number; name?: string; country?: string };
    teams?: {
      home?: { id?: number; name?: string; winner?: boolean | null };
      away?: { id?: number; name?: string; winner?: boolean | null };
    };
    goals?: { home?: number | null; away?: number | null };
  }>;
};

const API_DATE = "2026-07-22";
const apiKey = process.env.FOOTBALL_API_KEY?.trim();
const apiUrl = process.env.FOOTBALL_API_URL?.trim();

function formatErrors(errors: FootballApiResponse["errors"]) {
  if (!errors) return "未知 API 错误";
  return typeof errors === "string" ? errors : JSON.stringify(errors);
}

async function main() {
  if (!apiKey || !apiUrl) {
    throw new Error("缺少 FOOTBALL_API_KEY 或 FOOTBALL_API_URL，请检查 .env.local");
  }

  const endpoint = `${apiUrl.replace(/\/$/, "")}/fixtures?date=${API_DATE}`;
  let response: Response;
  let body: string;

  try {
    response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json", "x-apisports-key": apiKey },
      cache: "no-store",
    });
    body = await response.text();
  } catch (error) {
    throw new Error(`请求 Football API 失败：${error instanceof Error ? error.message : String(error)}`);
  }

  let payload: FootballApiResponse;
  try {
    payload = JSON.parse(body) as FootballApiResponse;
  } catch {
    throw new Error(`HTTP ${response.status}，返回内容不是有效 JSON：${body.slice(0, 500)}`);
  }

  console.log(`HTTP状态: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    throw new Error(`Football API 返回错误：${formatErrors(payload.errors)}；响应：${body.slice(0, 500)}`);
  }

  if (payload.errors && (Array.isArray(payload.errors) ? payload.errors.length > 0 : Object.keys(payload.errors).length > 0)) {
    throw new Error(`Football API 业务错误：${formatErrors(payload.errors)}`);
  }

  const fixtures = Array.isArray(payload.response) ? payload.response : [];
  console.log(`返回比赛数量: ${payload.results ?? fixtures.length}`);
  console.log("第一场比赛信息:", JSON.stringify(fixtures[0] ?? null, null, 2));
}

main().catch((error) => {
  console.error("Football API 测试失败:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
