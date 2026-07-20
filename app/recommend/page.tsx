import type { Metadata } from "next";
import { headers } from "next/headers";
import { BrainCircuit, Gauge, Lightbulb, Radar, ShieldCheck, Sparkles } from "lucide-react";
import { AIRecommendationCard } from "@/components/ai-recommendation-card";
import { UpsetOpportunityCard } from "@/components/recommend/UpsetOpportunityCard";
import { featured as mockFeatured } from "@/data/matches";
import { calculateProbabilities } from "@/lib/ai/probability";
import { assessRisk } from "@/lib/ai/risk-engine";
import { predictScores } from "@/lib/ai/score-model";
import { detectUpset } from "@/lib/ai/upset-engine";
import type { FootballMatch } from "@/lib/football/types";
import type { FeaturedMatch, MatchRisk, MatchTeam } from "@/types/match";

export const metadata: Metadata = {
  title: "Athena AI 赛事分析 | Project Athena",
  description: "基于真实足球比赛数据生成今日精选、关注方向、模型预测比分、模型一致性指数与数据不确定性分析。",
};

function toTeam(team: FootballMatch["homeTeam"], index: number): MatchTeam {
  const colors = ["#2563EB", "#22C55E", "#A855F7", "#F59E0B"];
  return { name: team.name, englishName: team.name, shortName: team.shortName || team.name.slice(0, 3).toUpperCase(), color: colors[index % colors.length], secondaryColor: colors[(index + 1) % colors.length] };
}

function toRecommendation(match: FootballMatch, index: number): FeaturedMatch {
  const probabilities = calculateProbabilities(match);
  const scores = predictScores(match, probabilities);
  const risk = assessRisk(match, probabilities);
  const values = [probabilities.homeWin, probabilities.draw, probabilities.awayWin].sort((left, right) => right - left);
  const confidence = Math.max(52, Math.min(93, Math.round(58 + (values[0] - values[1]) * 1.4 - risk.riskScore * 0.12)));
  const recommendation = probabilities.homeWin >= probabilities.awayWin && probabilities.homeWin >= probabilities.draw ? "主队方向" : probabilities.awayWin >= probabilities.draw ? "客队方向" : "平局观察";
  const date = new Date(match.date);
  const validDate = !Number.isNaN(date.getTime());
  const riskLevel: MatchRisk = risk.riskLevel;

  return { id: match.id, league: match.league, date: validDate ? date.toISOString().slice(0, 10) : match.date.slice(0, 10), time: validDate ? date.toISOString().slice(11, 16) : "待定", homeTeam: toTeam(match.homeTeam, index), awayTeam: toTeam(match.awayTeam, index + 1), aiScore: confidence, prediction: recommendation, score: scores[0].replace("-", ":"), risk: riskLevel, homeWin: probabilities.homeWin, draw: probabilities.draw, awayWin: probabilities.awayWin };
}

async function getRecommendationMatches(): Promise<{ matches: FeaturedMatch[]; sourceMatches: FootballMatch[]; fallback: boolean }> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  if (!host) return { matches: mockFeatured, sourceMatches: [], fallback: true };
  const protocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0] || "http";

  try {
    const response = await fetch(`${protocol}://${host}/api/football`, { cache: "no-store" });
    if (!response.ok) throw new Error("Recommendation API request failed");
    const payload = (await response.json()) as { success: boolean; data: FootballMatch[] };
    if (!payload.success || !payload.data.length) throw new Error("No recommendation data returned");
    return { matches: payload.data.map(toRecommendation), sourceMatches: payload.data, fallback: false };
  } catch {
    return { matches: mockFeatured, sourceMatches: [], fallback: true };
  }
}

export default async function RecommendPage() {
  const { matches, sourceMatches, fallback } = await getRecommendationMatches();
  const upsetOpportunities = sourceMatches.map((sourceMatch, index) => ({ match: matches[index], analysis: detectUpset(sourceMatch, calculateProbabilities(sourceMatch)) })).filter((item) => item.match && item.analysis.opportunity);

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><section className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#111827] via-[#111d3a] to-[#111827] p-6 sm:p-10"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/15 blur-[80px]" /><div className="relative max-w-3xl"><div className="flex items-center gap-2 text-xs font-medium text-blue-300"><BrainCircuit className="h-4 w-4" />ATHENA AI LAB</div><h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Athena AI 赛事分析</h1><p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">基于真实足球比赛数据、球队状态、市场数据与 Athena AI 模型生成今日模型观点，仅供赛事研究参考。</p><div className="mt-6 flex flex-wrap gap-3"><div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-300"><Radar className="h-4 w-4 text-blue-400" />概率模型</div><div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-300"><Gauge className="h-4 w-4 text-green-400" />比分模型</div><div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-300"><ShieldCheck className="h-4 w-4 text-amber-400" />不确定性模型</div></div>{fallback && <p className="mt-4 text-xs text-amber-300/80">实时数据暂不可用，当前使用 Mock 比赛数据。</p>}</div></section><div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]"><section><div className="mb-4 flex items-end justify-between"><div><p className="text-xs text-blue-400">MODEL FEED</p><h2 className="mt-1 text-xl font-semibold text-white">今日精选比赛</h2></div><span className="text-xs text-slate-500">{matches.length} 场精选</span></div><div className="space-y-4">{matches.map((match) => <AIRecommendationCard key={match.id} match={match} />)}</div><div className="mt-8"><div className="mb-4"><p className="text-xs text-red-400">OUTCOME RADAR</p><h2 className="mt-1 text-xl font-semibold text-white">非主流结果概率</h2><p className="mt-1 text-xs text-slate-500">识别强弱对局中的潜在结果变化信号</p></div><div className="space-y-3">{upsetOpportunities.length ? upsetOpportunities.map((item) => <UpsetOpportunityCard key={item.match.id} match={item.match} analysis={item.analysis} />) : <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">当前模型未发现高于阈值的非主流结果概率。</div>}</div></div></section><section><div className="mb-4"><p className="text-xs text-blue-400">ATHENA METHOD</p><h2 className="mt-1 text-xl font-semibold text-white">AI分析维度</h2></div><div className="space-y-4"><div className="rounded-xl border border-white/10 bg-[#111827] p-5"><div className="flex items-center gap-3"><div className="rounded-lg bg-blue-500/10 p-2 text-blue-300"><Sparkles className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-white">胜平负模型估算概率</p><p className="mt-1 text-xs leading-5 text-slate-500">结合近期状态、进攻防守能力、排名、主客场与市场数据。</p></div></div></div><div className="rounded-xl border border-white/10 bg-[#111827] p-5"><div className="flex items-center gap-3"><div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-300"><ShieldCheck className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-white">数据不确定性等级</p><p className="mt-1 text-xs leading-5 text-slate-500">通过实力差距、状态波动、防守稳定性与市场偏差评估数据不确定性。</p></div></div></div><div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5"><div className="flex items-center gap-3"><Lightbulb className="h-5 w-5 text-amber-400" /><div><p className="text-sm font-semibold text-white">数据说明</p><p className="mt-1 text-xs leading-5 text-slate-400">模型内容仅供赛事研究参考，不代表确定性结果。</p></div></div></div></div></section></div></main>;
}
