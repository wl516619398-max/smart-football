import { Insight, Match, Player } from "@/types";

export const teams = {
  manUnited: { name: "曼彻斯特联", shortName: "曼联", logo: "MUN", color: "#DA291C" },
  liverpool: { name: "利物浦", shortName: "利物浦", logo: "LIV", color: "#C8102E" },
  realMadrid: { name: "皇家马德里", shortName: "皇马", logo: "RMA", color: "#FEBE10" },
  barcelona: { name: "巴塞罗那", shortName: "巴萨", logo: "BAR", color: "#A50044" },
  bayern: { name: "拜仁慕尼黑", shortName: "拜仁", logo: "FCB", color: "#DC052D" },
  dortmund: { name: "多特蒙德", shortName: "多特", logo: "BVB", color: "#FDE100" },
};

export const matches: Match[] = [
  {
    id: "man-utd-liverpool", league: "英超 · 第 28 轮", date: "2025-03-16", time: "22:30", status: "upcoming",
    home: teams.manUnited, away: teams.liverpool, homeWin: 31, draw: 26, awayWin: 43, prediction: "1 - 2", confidence: 78,
    aiPick: "利物浦不败", venue: "老特拉福德", form: { home: ["W", "D", "L", "W", "L"], away: ["W", "W", "D", "W", "W"] },
  },
  {
    id: "real-barcelona", league: "西甲 · 第 29 轮", date: "2025-03-17", time: "04:00", status: "upcoming",
    home: teams.realMadrid, away: teams.barcelona, homeWin: 45, draw: 24, awayWin: 31, prediction: "2 - 1", confidence: 72,
    aiPick: "皇马胜", venue: "圣地亚哥·伯纳乌球场", form: { home: ["W", "W", "W", "D", "W"], away: ["W", "L", "W", "W", "D"] },
  },
  {
    id: "bayern-dortmund", league: "德甲 · 第 26 轮", date: "2025-03-18", time: "01:30", status: "upcoming",
    home: teams.bayern, away: teams.dortmund, homeWin: 58, draw: 21, awayWin: 21, prediction: "3 - 1", confidence: 84,
    aiPick: "拜仁胜 & 大于 2.5 球", venue: "安联球场", form: { home: ["W", "W", "W", "W", "D"], away: ["L", "W", "D", "L", "W"] },
  },
];

export const players: Player[] = [
  { name: "布鲁诺·费尔南德斯", position: "中场", team: "曼联", rating: 8.4, goals: 8, assists: 7, avatar: "BF" },
  { name: "穆罕默德·萨拉赫", position: "前锋", team: "利物浦", rating: 8.9, goals: 21, assists: 13, avatar: "MS" },
  { name: "维尼修斯·儒尼奥尔", position: "前锋", team: "皇马", rating: 8.7, goals: 15, assists: 9, avatar: "VJ" },
  { name: "哈里·凯恩", position: "前锋", team: "拜仁", rating: 9.1, goals: 24, assists: 5, avatar: "HK" },
];

export const insights: Insight[] = [
  { title: "利物浦右路压制明显", description: "过去 5 场比赛，利物浦右侧进攻占比达到 41%，曼联左侧防守存在空间。", tone: "blue" },
  { title: "萨拉赫状态火热", description: "近 8 场贡献 7 球 4 助攻，预期进球值（xG）持续高于联赛平均。", tone: "green" },
  { title: "曼联定位球需警惕", description: "本赛季 38% 的失球来自定位球，面对利物浦的二点球创造能力风险偏高。", tone: "amber" },
];

export const probabilityData = [
  { name: "主胜", value: 31, fill: "#2563EB" },
  { name: "平局", value: 26, fill: "#64748B" },
  { name: "客胜", value: 43, fill: "#22C55E" },
];

export const performanceData = [
  { match: "第1轮", home: 62, away: 74 }, { match: "第2轮", home: 70, away: 78 }, { match: "第3轮", home: 48, away: 81 },
  { match: "第4轮", home: 76, away: 69 }, { match: "第5轮", home: 55, away: 86 }, { match: "第6轮", home: 68, away: 73 },
];
