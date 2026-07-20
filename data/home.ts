export type HomeLeagueSummary = {
  name: string;
  logo: string;
  matchesToday: number;
  accent: string;
};

export type HomeOverviewStats = {
  matchCount: number;
  leagueCount: number;
  analysisCount: number;
  accuracy: number;
};

export type HomeInsight = {
  category: string;
  title: string;
  summary: string;
  time: string;
  tone: "blue" | "green" | "amber";
};

export const fallbackHomeLeagues: HomeLeagueSummary[] = [
  { name: "英超", logo: "英", matchesToday: 1, accent: "#60A5FA" },
  { name: "西甲", logo: "西", matchesToday: 1, accent: "#F59E0B" },
  { name: "德甲", logo: "德", matchesToday: 1, accent: "#EF4444" },
  { name: "欧冠", logo: "欧", matchesToday: 1, accent: "#A78BFA" },
];

export const fallbackHomeStats: HomeOverviewStats = {
  matchCount: 3,
  leagueCount: 3,
  analysisCount: 12,
  accuracy: 78.6,
};

export const latestInsights: HomeInsight[] = [
  { category: "状态观察", title: "强强对话的主客场差异仍是重要变量", summary: "近期状态与场地因素出现分化时，模型会降低单一维度对整体判断的影响。", time: "今日 09:30", tone: "blue" },
  { category: "数据方法", title: "xG 与实际进球的偏差值得持续跟踪", summary: "进攻效率并不等同于最终比分，样本周期和机会质量会影响模型一致性。", time: "昨日 18:20", tone: "green" },
  { category: "赛前提醒", title: "首发信息变化可能带来新的不确定性", summary: "临场阵容、伤停和比赛节奏属于动态信息，建议结合最新数据重新观察。", time: "昨日 14:05", tone: "amber" },
];
