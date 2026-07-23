import { AlertTriangle, BrainCircuit, Gauge, Lightbulb, ShieldCheck, TrendingUp, Users, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FootballAnalysisResult } from "@/lib/ai/football-analyzer";
import type { OddsValueOutput } from "@/lib/odds/value-engine";
import type { MatchPrediction, PredictionTeamStats } from "@/lib/prediction/types";
import type { AiMatchAnalysisRow } from "@/types/ai-match-analysis";
import { decodeUnicode, decodeUnicodeDeep } from "@/lib/utils/decode-unicode";

type AthenaReportCardProps = {
  homeTeam: string;
  awayTeam: string;
  homeStats: PredictionTeamStats;
  awayStats: PredictionTeamStats;
  prediction: MatchPrediction;
  oddsValue: OddsValueOutput;
  analysis?: FootballAnalysisResult;
  preGeneratedAnalysis?: AiMatchAnalysisRow;
};

type ReportSection = { title: string; content: string; icon: LucideIcon; tone?: string };
type ReportCopy = {
  summary: string;
  sections: ReportSection[];
  factors: string[];
  risks: string[];
  direction: string;
  confidence: number;
  scores: string[];
  goals: string;
  level: "standard" | "vip";
};

const NO_DATA = "\u5f53\u524d\u6570\u636e\u7ef4\u5ea6\u4e0d\u5b8c\u6574\uff0c\u6682\u65e0\u6cd5\u4f5c\u51fa\u5177\u4f53\u5224\u65ad\u3002";
const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

function getReliability(confidence: number) {
  if (confidence >= 75) return { label: "\u9ad8", reason: "\u8fd1\u671f\u72b6\u6001\u3001\u653b\u9632\u6307\u6807\u4e0e\u6bd4\u8d5b\u57fa\u7840\u4fe1\u606f\u8f83\u5b8c\u6574\uff0c\u591a\u4e2a\u6570\u636e\u7ef4\u5ea6\u65b9\u5411\u8f83\u4e3a\u4e00\u81f4\u3002" };
  if (confidence >= 55) return { label: "\u4e2d", reason: "\u73b0\u6709\u6570\u636e\u53ef\u652f\u6301\u57fa\u7840\u5224\u65ad\uff0c\u4f46\u6837\u672c\u91cf\u6216\u90e8\u5206\u6bd4\u8d5b\u4fe1\u606f\u4ecd\u6709\u9650\u3002" };
  return { label: "\u4f4e", reason: "\u53ef\u7528\u6570\u636e\u7ef4\u5ea6\u4e0d\u8db3\u6216\u76f8\u4e92\u5dee\u5f02\u8f83\u5927\uff0c\u7ed3\u8bba\u9700\u4fdd\u7559\u66f4\u591a\u89c2\u5bdf\u7a7a\u95f4\u3002" };
}

function section(title: string, content: string, icon: LucideIcon, tone?: string): ReportSection {
  return { title, content, icon, tone };
}

function storedText(value: unknown, fallback: string) {
  return typeof value === "string" && decodeUnicode(value).trim() ? decodeUnicode(value) : fallback;
}

function buildFallbackCopy(props: AthenaReportCardProps): ReportCopy {
  const { homeStats, awayStats, prediction, oddsValue } = props;
  const homeTeam = decodeUnicode(props.homeTeam);
  const awayTeam = decodeUnicode(props.awayTeam);
  const leader = prediction.homeWin >= prediction.awayWin ? homeTeam : awayTeam;
  const maxValue = Math.max(Math.abs(oddsValue.value.home), Math.abs(oddsValue.value.draw), Math.abs(oddsValue.value.away));
  const summary = `${homeTeam} vs ${awayTeam} \u7684\u5f53\u524d\u6a21\u578b\u89c2\u70b9\u57fa\u4e8e\u4e3b\u5ba2\u573a\u73af\u5883\u3001\u8fd1\u671f\u72b6\u6001\u3001\u653b\u9632\u80fd\u529b\u548c\u5e02\u573a\u6570\u636e\u3002\u653b\u51fb\u3001\u9632\u5b88\u4e0e\u72b6\u6001\u8bc4\u5206\u5206\u522b\u4e3a ${Math.round(homeStats.attack)}-${Math.round(awayStats.attack)}\u3001${Math.round(homeStats.defense)}-${Math.round(awayStats.defense)}\u3001${Math.round(homeStats.form)}-${Math.round(awayStats.form)}\u3002\u6a21\u578b\u6682\u65f6\u66f4\u504f\u5411${leader}\uff0c\u4f46\u9996\u53d1\u3001\u4f24\u505c\u3001\u6bd4\u8d5b\u8282\u594f\u4e0e\u4e34\u573a\u6267\u884c\u4ecd\u4f1a\u5f71\u54cd\u5b9e\u9645\u8d70\u52bf\u3002\u672c\u6bb5\u4ec5\u4f5c\u4e3a\u8d5b\u4e8b\u4fe1\u606f\u53c2\u8003\uff0c\u4e0d\u4ee3\u8868\u786e\u5b9a\u7ed3\u679c\u3002`;

  return {
    summary,
    sections: [
      section("\u6bd4\u8d5b\u80cc\u666f", `${homeTeam} \u4e3b\u573a\u5bf9\u9635 ${awayTeam}\u3002\u5f53\u524d\u53ef\u7528\u6570\u636e\u5305\u542b\u7403\u961f\u540d\u79f0\u3001\u6bd4\u8d5b\u57fa\u7840\u4fe1\u606f\u3001\u6a21\u578b\u6982\u7387\u3001\u7403\u961f\u6307\u6807\u548c\u8d54\u7387\u6570\u636e\u3002${NO_DATA}`, TrendingUp, "border-blue-500/20 bg-blue-500/5"),
      section("\u53cc\u65b9\u8fd1\u671f\u72b6\u6001", `\u4e24\u961f\u8fd1\u671f\u72b6\u6001\u8bc4\u5206\u4e3a ${Math.round(homeStats.form)}-${Math.round(awayStats.form)}\u3002\u8fd9\u4e00\u5dee\u5f02\u53ef\u80fd\u5f71\u54cd\u5f00\u5c40\u548c\u540e\u7a0b\u8282\u594f\uff0c\u4f46\u5e94\u540c\u65f6\u53c2\u8003\u6bd4\u8d5b\u5bf9\u624b\u5f3a\u5ea6\u4e0e\u6837\u672c\u5b8c\u6574\u6027\u3002${NO_DATA}`, TrendingUp),
      section("\u653b\u9632\u6570\u636e\u5206\u6790", `${homeTeam} \u653b\u51fb\u6307\u6570 ${Math.round(homeStats.attack)}\u3001\u9632\u5b88\u6307\u6570 ${Math.round(homeStats.defense)}\uff1b${awayTeam} \u653b\u51fb\u6307\u6570 ${Math.round(awayStats.attack)}\u3001\u9632\u5b88\u6307\u6570 ${Math.round(awayStats.defense)}\u3002\u8fd9\u4e9b\u6307\u6807\u7528\u4e8e\u6bd4\u8f83\u521b\u9020\u673a\u4f1a\u548c\u9650\u5236\u5bf9\u624b\u7684\u76f8\u5bf9\u80fd\u529b\uff0c\u4e0d\u7b49\u540c\u4e8e\u5b9e\u9645\u6bd4\u8d5b\u4e2d\u7684\u5c04\u95e8\u6216\u8fdb\u7403\u7ed3\u679c\u3002`, ShieldCheck),
      section("\u5386\u53f2\u4ea4\u950b\u5206\u6790", NO_DATA, TrendingUp),
      section("\u6218\u672f\u5206\u6790", `\u8d70\u52bf\u53ef\u80fd\u56f4\u7ed5 ${leader} \u7684\u63a8\u8fdb\u6548\u7387\u4e0e\u53e6\u4e00\u65b9\u7684\u9632\u5b88\u8f6c\u6362\u5c55\u5f00\u3002\u7531\u4e8e\u672a\u4f20\u5165\u5177\u4f53\u9635\u578b\u3001\u538b\u8feb\u9ad8\u5ea6\u4e0e\u8fb9\u8def\u7b56\u7565\uff0c\u672c\u6bb5\u4e0d\u5bf9\u672a\u63d0\u4f9b\u7684\u6218\u672f\u7ec6\u8282\u505a\u63a8\u65ad\u3002`, Lightbulb),
      section("\u5173\u952e\u7403\u5458\u56e0\u7d20", NO_DATA, Users),
      section("\u8d54\u7387\u5206\u6790", `\u5f53\u524d\u5e02\u573a\u4e0e\u6a21\u578b\u4f30\u7b97\u7684\u6700\u5927\u504f\u5dee\u7ea6\u4e3a ${(maxValue * 100).toFixed(1)} \u4e2a\u767e\u5206\u70b9\u3002\u8d54\u7387\u53cd\u6620\u5e02\u573a\u6570\u636e\u503e\u5411\uff0c\u6a21\u578b\u6982\u7387\u5219\u7efc\u5408\u4f20\u5165\u7684\u7403\u961f\u6307\u6807\uff0c\u4e24\u8005\u5dee\u5f02\u53ea\u4f5c\u7814\u7a76\u89c2\u5bdf\u3002`, Gauge),
      section("AI\u9884\u6d4b", `\u5f53\u524d\u6a21\u578b\u66f4\u504f\u5411 ${leader}\u65b9\u5411\uff0c\u9884\u6d4b\u6bd4\u5206\u5e94\u540c\u65f6\u53c2\u8003\u9875\u9762\u4e2d\u7684\u6982\u7387\u4e0e\u9884\u671f\u8fdb\u7403\u3002\u6837\u672c\u53d8\u5316\u3001\u9635\u5bb9\u786e\u8ba4\u4e0e\u6bd4\u8d5b\u8fdb\u7a0b\u90fd\u53ef\u80fd\u6539\u53d8\u5b9e\u9645\u8d70\u52bf\u3002`, TrendingUp),
      section("\u98ce\u9669\u63d0\u793a", `\u4e3b\u8981\u4e0d\u786e\u5b9a\u6027\u5305\u62ec\u6837\u672c\u662f\u5426\u5b8c\u6574\u3001\u9635\u5bb9\u4e0e\u4f24\u505c\u662f\u5426\u66f4\u65b0\u3001\u4e34\u573a\u6218\u672f\u662f\u5426\u6539\u53d8\u3001\u4ee5\u53ca\u8d54\u7387\u662f\u5426\u53ea\u6709\u5355\u70b9\u4fe1\u606f\u3002${NO_DATA}`, AlertTriangle, "border-amber-500/20 bg-amber-500/5"),
    ],
    factors: [`${homeTeam} / ${awayTeam} \u653b\u9632\u6307\u6807\u5bf9\u6bd4`, `\u8fd1\u671f\u72b6\u6001\u8bc4\u5206: ${Math.round(homeStats.form)} - ${Math.round(awayStats.form)}`, `\u5e02\u573a\u6570\u636e\u4e0e\u6a21\u578b\u4f30\u7b97\u504f\u5dee: ${(maxValue * 100).toFixed(1)}\u4e2a\u767e\u5206\u70b9`],
    risks: [NO_DATA, "\u9996\u53d1\u3001\u4f24\u505c\u4e0e\u4e34\u573a\u4fe1\u606f\u53ef\u80fd\u6539\u53d8\u6bd4\u8d5b\u8d70\u52bf"],
    direction: `\u6a21\u578b\u66f4\u504f\u5411 ${leader} \u65b9\u5411`,
    confidence: clamp(prediction.confidence),
    scores: prediction.expectedGoals.home >= prediction.expectedGoals.away ? ["2-1", "1-1", "1-0"] : ["1-2", "1-1", "0-1"],
    goals: `\u9884\u8ba1\u8fdb\u7403\u533a\u95f4\u7ea6\u4e3a ${prediction.expectedGoals.home.toFixed(1)}-${prediction.expectedGoals.away.toFixed(1)}\uff0c\u91cd\u70b9\u89c2\u5bdf\u6bd4\u8d5b\u8282\u594f\u4e0e\u673a\u4f1a\u8f6c\u5316\u3002`,
    level: "standard",
  };
}

function buildStoredCopy(props: AthenaReportCardProps, fallback: ReportCopy): ReportCopy {
  const stored = props.preGeneratedAnalysis;
  if (!stored) return fallback;
  const content = stored.analysis ?? stored;
  const reportLevel = content.report_level === "vip" || stored.report_level === "vip" ? "vip" : "standard";
  return {
    summary: storedText(content.summary ?? stored.summary, fallback.summary),
    sections: [
      section("\u6bd4\u8d5b\u80cc\u666f", storedText(content.match_background, NO_DATA), TrendingUp, "border-blue-500/20 bg-blue-500/5"),
      section("\u53cc\u65b9\u8fd1\u671f\u72b6\u6001", storedText(content.recent_form_analysis, NO_DATA), TrendingUp),
      section("\u653b\u9632\u6570\u636e\u5206\u6790", storedText(content.strength_analysis, `${storedText(content.home_analysis, NO_DATA)} ${storedText(content.away_analysis, "")}`), ShieldCheck),
      section("\u5386\u53f2\u4ea4\u950b\u5206\u6790", storedText(content.head_to_head_analysis, NO_DATA), TrendingUp),
      section("\u6218\u672f\u5206\u6790", storedText(content.tactical_analysis, NO_DATA), Lightbulb),
      section("\u5173\u952e\u7403\u5458\u56e0\u7d20", storedText(content.key_player_analysis, NO_DATA), Users),
      section("\u8d54\u7387\u5206\u6790", storedText(content.odds_value_analysis, NO_DATA), Gauge),
      section("AI\u9884\u6d4b", storedText(content.result_reasoning ?? content.match_trend, NO_DATA), TrendingUp),
      section("\u98ce\u9669\u63d0\u793a", storedText(content.risk_warning, NO_DATA), AlertTriangle, "border-amber-500/20 bg-amber-500/5"),
    ],
    factors: [content.home_analysis, content.away_analysis, content.goal_prediction].filter((value): value is string => typeof value === "string" && Boolean(value)).map((value) => decodeUnicode(value)),
    risks: [storedText(content.risk_warning, NO_DATA)],
    direction: storedText(content.result_reasoning ?? content.match_trend, fallback.direction),
    confidence: clamp(Number(content.confidence_score ?? stored.confidence_score ?? fallback.confidence)),
    scores: [storedText(content.score_prediction ?? stored.score_prediction, fallback.scores[0])],
    goals: storedText(content.goal_prediction ?? stored.goal_prediction, fallback.goals),
    level: reportLevel,
  };
}

function SectionBody({ content }: { content: string }) {
  const decodedContent = decodeUnicode(content);
  const points = decodedContent.split(/[\u3002\uff01\uff1f\uff1b\n]/).map((item) => item.trim()).filter(Boolean);
  if (points.length < 2) return <p>{decodedContent}</p>;
  return <ul className="space-y-2">{points.map((point, index) => <li key={`${point}-${index}`} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />{point}</li>)}</ul>;
}

function ReportSection({ item }: { item: ReportSection }) {
  const Icon = item.icon;
  return <div className={`rounded-xl border p-4 ${item.tone ?? "border-slate-800 bg-slate-900/30"}`}><p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-300"><Icon className="h-4 w-4 text-blue-300" />{decodeUnicode(item.title)}</p><div className="mt-3 text-sm leading-7 text-slate-300"><SectionBody content={item.content} /></div></div>;
}

export function AthenaReportCard(props: AthenaReportCardProps) {
  const fallback = buildFallbackCopy(props);
  const report = decodeUnicodeDeep(buildStoredCopy(props, fallback));
  const reliability = getReliability(report.confidence);
  const levelLabel = report.level === "vip" ? "VIP\u6df1\u5ea6\u62a5\u544a \u00b7 2000-3000\u5b57" : "\u666e\u901a\u62a5\u544a \u00b7 800-1500\u5b57";

  return (
    <Card className="overflow-hidden border-blue-500/20 bg-gradient-to-br from-[#111827] via-[#111d3a] to-[#111827] shadow-xl shadow-blue-950/20">
      <CardHeader className="border-b border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><div className="flex items-center gap-2 text-xs font-medium text-blue-300"><BrainCircuit className="h-4 w-4" />ATHENA AI REPORT</div><CardTitle className="mt-2 text-xl text-white">{decodeUnicode("Athena AI \\u5206\\u6790\\u62a5\\u544a")}</CardTitle><p className="mt-2 text-sm text-slate-400">{decodeUnicode("\\u57fa\\u4e8e\\u6bd4\\u8d5b\\u6570\\u636e\\u5e93\\u3001\\u8fd1\\u671f\\u72b6\\u6001\\u3001\\u5386\\u53f2\\u4ea4\\u950b\\u4e0e\\u5e02\\u573a\\u6570\\u636e\\u751f\\u6210\\u3002")}</p></div>
          <div className="flex flex-col items-end gap-2"><span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200">{decodeUnicode(levelLabel)}</span><span className="text-xs text-slate-500">{decodeUnicode("Athena AI Engine \\u00b7 Analysis Model")}</span></div>
        </div>
        <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-950/30 p-3 text-xs text-slate-400"><span className="font-medium text-slate-300">{decodeUnicode("AI\\u5224\\u65ad\\u53ef\\u4fe1\\u5ea6")}: {decodeUnicode(reliability.label)}</span><span className="mx-2 text-slate-700">{decodeUnicode("\\u00b7")}</span>{decodeUnicode(reliability.reason)}</div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4"><p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-blue-200"><BrainCircuit className="h-4 w-4" />{decodeUnicode("Athena AI \\u7efc\\u5408\\u89c2\\u70b9")}</p><p className="mt-3 text-sm leading-7 text-slate-300">{decodeUnicode(report.summary)}</p></div>
        <div className="grid gap-4 lg:grid-cols-2">{report.sections.map((item) => <ReportSection key={item.title} item={item} />)}</div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-emerald-200"><ShieldCheck className="h-4 w-4" />{decodeUnicode("\\u5173\\u952e\\u5173\\u6ce8\\u56e0\\u7d20")}</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">{report.factors.map((factor, index) => <li key={`${factor}-${index}`} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{decodeUnicode(factor)}</li>)}</ul></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4"><p className="text-xs text-slate-500">{decodeUnicode("AI\\u9884\\u6d4b\\u65b9\\u5411")}</p><p className="mt-2 text-lg font-semibold text-blue-200">{decodeUnicode(report.direction)}</p><p className="mt-2 text-xs leading-5 text-slate-400">{decodeUnicode("\\u6a21\\u578b\\u89c2\\u70b9\\u4ec5\\u4f9b\\u8d5b\\u4e8b\\u4fe1\\u606f\\u53c2\\u8003\\u3002")}</p></div><div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"><p className="flex items-center gap-2 text-xs text-slate-500"><Gauge className="h-4 w-4 text-amber-400" />{decodeUnicode("AI\\u5224\\u65ad\\u53ef\\u4fe1\\u5ea6")}</p><p className="mt-2 text-2xl font-bold text-amber-200">{report.confidence}% {decodeUnicode("\\u00b7")} {decodeUnicode(reliability.label)}</p></div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4"><p className="text-xs font-semibold text-slate-300">{decodeUnicode("\\u6a21\\u578b\\u9884\\u6d4b\\u6bd4\\u5206\\u4e0e\\u8fdb\\u7403\\u8d8b\\u52bf")}</p><p className="mt-2 text-sm leading-6 text-slate-300">{decodeUnicode(report.scores.join(" \\u00b7 "))}</p><p className="mt-2 text-sm leading-6 text-slate-400">{decodeUnicode(report.goals)}</p></div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"><p className="flex items-center gap-2 text-xs font-semibold text-amber-200"><AlertTriangle className="h-4 w-4" />{decodeUnicode("\\u98ce\\u9669\\u63d0\\u793a")}</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">{report.risks.map((risk, index) => <li key={`${risk}-${index}`} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{decodeUnicode(risk)}</li>)}</ul></div>
        <p className="text-xs leading-5 text-slate-500">{decodeUnicode("\\u672c\\u62a5\\u544a\\u57fa\\u4e8e\\u5f53\\u524d\\u53ef\\u7528\\u6570\\u636e\\u5e93\\u4fe1\\u606f\\u751f\\u6210\\uff0c\\u6570\\u636e\\u5b8c\\u6574\\u5ea6\\u3001\\u4e34\\u573a\\u9635\\u5bb9\\u4e0e\\u6bd4\\u8d5b\\u968f\\u673a\\u6027\\u53ef\\u80fd\\u5f71\\u54cd\\u5b9e\\u9645\\u8d70\\u52bf\\u3002")}</p>
      </CardContent>
    </Card>
  );
}
