import { requestAI, type AIMessage } from "@/lib/ai/provider";
import type { MatchPrediction, PredictionTeamStats } from "@/lib/prediction/types";

export type FootballAnalyzerInput = {
  homeTeam: string;
  awayTeam: string;
  homeTeamStats: PredictionTeamStats;
  awayTeamStats: PredictionTeamStats;
  prediction: MatchPrediction;
};

export type FootballAnalysisResult = {
  analysis: string[];
  recommendation: {
    safe: string;
    risk: string;
    goals: string;
  };
  predictedScores: string[];
  confidence: number;
};

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));
const sectionNames = ["比赛整体趋势", "双方实力分析", "近期状态分析", "进攻防守特点", "半场走势分析", "比分趋势", "风险提醒"];

function fallbackAnalysis(input: FootballAnalyzerInput): FootballAnalysisResult {
  const { homeTeam, awayTeam, homeTeamStats, awayTeamStats, prediction } = input;
  const predictedScore = `${Math.round(prediction.expectedGoals.home)}-${Math.round(prediction.expectedGoals.away)}`;
  const alternateScore = prediction.draw >= Math.max(prediction.homeWin, prediction.awayWin) ? "1-1" : prediction.homeWin >= prediction.awayWin ? "2-1" : "1-2";
  const leader = prediction.homeWin >= prediction.awayWin ? homeTeam : awayTeam;
  const homeOverall = Math.round((homeTeamStats.attack + homeTeamStats.defense + homeTeamStats.form) / 3);
  const awayOverall = Math.round((awayTeamStats.attack + awayTeamStats.defense + awayTeamStats.form) / 3);
  const closeGame = Math.abs(prediction.homeWin - prediction.awayWin) < 8;

  return {
    analysis: [
      `${homeTeam}与${awayTeam}的比赛整体呈现${closeGame ? "相对接近、节奏可能反复" : `${leader}略占主动、但仍需观察比赛进程`}的趋势。模型综合主客场环境、球队攻防评分、近期表现和胜平负概率后，认为比赛不会简单地由单一因素决定。${homeTeam}在主场拥有熟悉场地和主动推进的条件，${awayTeam}则可能通过转换速度和比赛经验寻找回应。预计双方会在中场争夺、禁区前沿处理和防守转换方面形成较多影响，比赛走势可能随着首个有效机会、定位球或攻防节奏变化而调整。当前预测更适合被理解为赛前信息整理，不能替代临场阵容、比赛状态和实际表现的观察。`,
      `从双方实力结构看，${homeTeam}的综合评分约为${homeOverall}，${awayTeam}的综合评分约为${awayOverall}。${homeTeam}的主场优势会提高其控球推进和前场压迫的稳定性，但这并不意味着能够持续压制对手；${awayTeam}如果能够在中后场保持紧凑，利用边路或中路快速衔接，仍有机会把比赛带入自己熟悉的节奏。两队的差距主要体现在进攻效率、防守回收速度以及关键回合的处理质量，而不是简单的排名高低。模型概率显示，${prediction.homeWin}%的主胜倾向、${prediction.draw}%的平局倾向和${prediction.awayWin}%的客胜倾向共同构成当前判断，实际表现仍需结合场上执行力验证。`,
      `近期状态方面，${homeTeam}的状态指数为${Math.round(homeTeamStats.form)}，${awayTeam}为${Math.round(awayTeamStats.form)}。状态指数反映的是近期结果、比赛连续性和攻防表现的综合信号，不能直接等同于下一场比赛的确定结果。如果${homeTeam}能够延续近期的推进效率，主队可能在比赛前段获得更多主动；如果${awayTeam}的连续传递和反击选择保持稳定，客队也可能在主队压上后制造有威胁的回合。需要注意的是，近期样本通常有限，且对手强弱、主客场差异和比赛阶段都会影响数据解读，因此当前趋势更适合用于识别关注因素，而不是对结果作出绝对判断。`,
      `进攻与防守特点方面，${homeTeam}的攻击指标为${Math.round(homeTeamStats.attack)}、防守指标为${Math.round(homeTeamStats.defense)}，${awayTeam}对应为${Math.round(awayTeamStats.attack)}和${Math.round(awayTeamStats.defense)}。${homeTeam}更值得观察的是主场推进、二点球争夺和前场连续施压能否转化为高质量机会；${awayTeam}的重点则可能在于防守站位、断球后的第一脚传递以及快速反击的纵深。若主队能够减少中场丢球并保持边后卫回收，比赛会更接近主队预期节奏；若客队成功把比赛拉入快速转换，主队防线身后的空间就会成为重要变量。两队防守稳定性和进攻选择的变化，可能比纸面评分更直接地影响比分。`,
      `半场走势上，双方通常会先通过中场站位和出球线路试探对手。${homeTeam}在主场环境下可能更主动地争取前二十分钟的控球和前场压力，但如果推进过于集中，${awayTeam}就可能通过回收后快速转换制造反击。模型建议重点观察上半场是否出现持续压迫、禁区内有效触球以及定位球机会，而不是只看控球率这一单一指标。若比赛前段双方都保持谨慎，上半场比分可能较为接近；如果一方在中场夺回球权并连续形成射门，半场走势可能提前倾向一侧。半场信息应与首发、比赛节奏和现场表现结合解读。`,
      `比分趋势方面，模型预计双方进球期望约为${prediction.expectedGoals.home.toFixed(2)}比${prediction.expectedGoals.away.toFixed(2)}，首要参考比分为${predictedScore}，备选比分包括${alternateScore}。这一结果主要由胜平负概率、攻防能力和主客场因素共同推导，表达的是概率较高的比分区间，而不是确定的赛果。若${homeTeam}能够率先建立进攻优势，比赛可能朝着小比分主队领先的方向发展；若${awayTeam}在转换中获得空间，平局或客队取得进球的可能性会增加。总进球数量仍会受到临场效率、射门质量、定位球和防守失误影响，因而更应关注比分背后的比赛逻辑和变化路径。`,
      `风险提醒方面，当前判断仍存在多项不确定因素。首先，球队评分和近期样本无法完整覆盖首发变化、临场战术调整及球员当日状态；其次，强强对话中单次失误、定位球和裁判尺度都可能放大比赛波动；再次，若比赛节奏与模型假设不同，原有概率会快速失去参考意义。${homeTeam}需要注意压上后的防守空间，${awayTeam}需要注意长时间承受压力后的体能和站位变化。当前结论只代表基于已获取数据的模型观点，数据维度有限，比赛结果具有不确定性，用户应把它作为赛事信息参考，而不是确定性判断。`,
    ],
    recommendation: {
      safe: `${leader}方向的模型概率相对更高，但建议结合临场阵容和比赛节奏继续观察。`,
      risk: "双方攻防转换和临场状态可能放大结果波动，强弱差距不等于确定结果。",
      goals: `预计进球区间围绕${prediction.expectedGoals.home.toFixed(1)}-${prediction.expectedGoals.away.toFixed(1)}展开，重点观察比赛节奏和机会质量。`,
    },
    predictedScores: [...new Set([predictedScore, alternateScore])],
    confidence: prediction.confidence,
  };
}

function textList(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, limit);
}

function parseNumber(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? clamp(parsed) : fallback;
}

function normalizeAnalysis(items: string[], fallback: FootballAnalysisResult["analysis"]) {
  return sectionNames.map((_, index) => {
    const item = items[index]?.trim();
    if (item && item.length >= 200) return item;
    return item ? `${item} ${fallback[index]}` : fallback[index];
  });
}

function parseAnalysis(content: string, fallback: FootballAnalysisResult): FootballAnalysisResult | null {
  const cleaned = content.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    const recommendation = typeof parsed.recommendation === "object" && parsed.recommendation !== null ? parsed.recommendation as Record<string, unknown> : {};
    const analysis = normalizeAnalysis(textList(parsed.analysis, sectionNames.length), fallback.analysis);
    const predictedScores = textList(parsed.predictedScores, 3);
    return {
      analysis,
      recommendation: {
        safe: typeof recommendation.safe === "string" ? recommendation.safe : fallback.recommendation.safe,
        risk: typeof recommendation.risk === "string" ? recommendation.risk : fallback.recommendation.risk,
        goals: typeof recommendation.goals === "string" ? recommendation.goals : fallback.recommendation.goals,
      },
      predictedScores: predictedScores.length ? predictedScores : fallback.predictedScores,
      confidence: parseNumber(parsed.confidence, fallback.confidence),
    };
  } catch {
    return null;
  }
}

function buildMessages(input: FootballAnalyzerInput): AIMessage[] {
  return [
    {
      role: "system",
      content: [
        "你是 Project Athena 的专业足球赛事数据分析师，定位是足球赛事数据与信息解读平台。",
        `请围绕以下七个章节输出，每个章节都必须使用中文并且不少于200字：${sectionNames.join("、")}。`,
        "只使用传入的数据，不编造伤停、阵容、天气、新闻或其他未提供事实；必须说明数据局限性和比赛不确定性。",
        "只输出 JSON，不要 Markdown、隐藏推理或模型解释过程。不得提供购买、下注、资金或收益建议，不得承诺结果。",
        '{"analysis":["比赛整体趋势","双方实力分析","近期状态分析","进攻防守特点","半场走势分析","比分趋势","风险提醒"],"recommendation":{"safe":"","risk":"","goals":""},"predictedScores":[""],"confidence":0}',
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({
        match: { homeTeam: input.homeTeam, awayTeam: input.awayTeam },
        homeTeamStats: input.homeTeamStats,
        awayTeamStats: input.awayTeamStats,
        prediction: input.prediction,
      }),
    },
  ];
}

export async function analyzeFootballMatch(input: FootballAnalyzerInput): Promise<FootballAnalysisResult> {
  const fallback = fallbackAnalysis(input);
  try {
    const result = await requestAI(buildMessages(input), { maxTokens: 4000, timeoutMs: 20_000 });
    if (!result.success) return fallback;
    return parseAnalysis(result.content, fallback) ?? fallback;
  } catch (error) {
    console.error("Football analyzer failed:", error instanceof Error ? error.message : String(error));
    return fallback;
  }
}
