import { getSupabaseServerClient } from "../supabase/server.ts";
import { decodeUnicodeDeep } from "../utils/decode-unicode.ts";
import type { AnalysisDataset } from "./feature-builder";

export type AnalysisPrompt = {
  match_id: string;
  version: string;
  system_prompt: string;
  user_prompt: string;
  data_json: string;
  missing_fields: string[];
};

const SYSTEM_PROMPT = [
  "你是 Project Athena 的足球赛事数据分析引擎。",
  "你的定位是足球赛事数据分析与信息解读，不提供彩票销售、代购、下注、资金或收益建议。",
  "只能基于输入的数据进行客观分析；禁止编造未提供的伤停、阵容、天气、新闻、排名或赔率信息。",
  "必须说明数据样本、更新时间和数据局限性，比赛结果具有不确定性。",
  "请使用‘模型观点’、‘关注因素’、‘数据不确定性’和‘仅供赛事研究参考’等中性表达。",
  "输出中文 JSON，不要输出 Markdown 代码块、隐藏推理过程或接口外的解释。",
  "建议 JSON 字段：summary、teamAnalysis、formAnalysis、tacticalFactors、prediction、scorePrediction、riskWarning、dataLimitations。",
  "任何缺失字段都必须明确标记为‘数据不足’，不得用猜测补齐。",
].join("\n");

function createUserPrompt(dataset: AnalysisDataset, dataJson: string) {
  return [
    "请根据以下标准化比赛数据生成赛前信息分析。",
    "分析顺序：比赛背景、双方实力、近期状态、攻防指标、历史交锋、赔率数据、可能走势和数据不确定性。",
    "请区分事实数据与模型观点，不要把概率表达成确定结果。",
    "输入数据如下：",
    "<analysis_dataset>",
    dataJson,
    "</analysis_dataset>",
  ].join("\n\n");
}

export function buildAnalysisPrompt(dataset: AnalysisDataset): AnalysisPrompt {
  const normalized = decodeUnicodeDeep(dataset);
  const dataJson = JSON.stringify(normalized, null, 2);
  return {
    match_id: normalized.match_id,
    version: normalized.feature_version,
    system_prompt: SYSTEM_PROMPT,
    user_prompt: createUserPrompt(normalized, dataJson),
    data_json: dataJson,
    missing_fields: normalized.data_quality.missing_fields,
  };
}

export async function getAnalysisDataset(matchId?: string): Promise<AnalysisDataset[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase server configuration is missing");

  let query = supabase
    .from("analysis_dataset")
    .select("*")
    .order("match_time", { ascending: true });
  if (matchId) query = query.eq("match_id", matchId);

  const result = await query;
  if (result.error) throw new Error(`analysis_dataset read failed: ${result.error.message}`);
  return decodeUnicodeDeep((result.data ?? []) as AnalysisDataset[]);
}
