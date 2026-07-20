import type { CommercialMatchData, FeaturedMatch, MatchDetailData, MatchTeam } from "@/types/match";
import type { FootballMatch, FootballRecentMatch, FootballTeamStats } from "@/lib/football/types";
import { predictMatch } from "@/lib/ai/predictor";

const manchesterUnited = {
  name: "\u66fc\u8054",
  englishName: "Manchester United",
  shortName: "MUN",
  color: "#DA291C",
  secondaryColor: "#F45B4B",
};

const liverpool = {
  name: "\u5229\u7269\u6d66",
  englishName: "Liverpool",
  shortName: "LIV",
  color: "#C8102E",
  secondaryColor: "#F04B5F",
};

const baseMatchDetails: MatchDetailData[] = [
  {
    id: "manchester-united-vs-liverpool",
    league: "\u82f1\u683c\u5170\u8d85\u7ea7\u8054\u8d5b",
    round: "\u7b2c 28 \u8f6e",
    date: "2026-03-16",
    time: "22:30",
    status: "\u8d5b\u524d\u5206\u6790",
    venue: "\u8001\u7279\u62c9\u798f\u5fb7\u7403\u573a",
    city: "Manchester",
    weather: "\u591a\u4e91 11\u2103",
    referee: "Michael Oliver",
    updatedAt: "5 \u5206\u949f\u524d",
    home: manchesterUnited,
    away: liverpool,
    homeStats: { attack: 84, defense: 78, form: 82, homeAdvantage: 92 },
    awayStats: { attack: 86, defense: 78, form: 84, homeAdvantage: 50 },
    aiAnalysis: {
      home: { attackScore: 82, defenseScore: 79, formScore: 85, homeAwayScore: 90, possessionScore: 78, upsetRisk: 35 },
      away: { attackScore: 88, defenseScore: 84, formScore: 87, homeAwayScore: 75, possessionScore: 86, upsetRisk: 35 },
    },
    prediction: {
      lean: "\u66fc\u8054\u4e0d\u8d1f",
      firstChoice: "\u80dc\u5e73\u8d1f\uff1a\u4e3b\u80dc",
      cover: "\u4e3b\u80dc / \u5e73\u5c40",
      confidence: 82,
      rating: 4.5,
      score: "2:1",
      totalGoals: "2\u20143 \u7403",
      upsetRisk: "medium",
      summary: "\u66fc\u8054\u4e3b\u573a\u8fdb\u653b\u6548\u7387\u66f4\u7a33\u5b9a\uff0c\u5229\u7269\u6d66\u540e\u9632\u5b58\u5728\u4eba\u5458\u4e0e\u8f6c\u6362\u9632\u5b88\u98ce\u9669\uff0c\u4f46\u5ba2\u961f\u53cd\u51fb\u80fd\u529b\u4ecd\u7136\u8f83\u5f3a\uff0c\u672c\u573a\u9700\u91cd\u70b9\u9632\u8303\u5e73\u5c40\u3002",
      modelProbability: 46,
      referenceProbability: 41,
    },
    probabilities: [
      { label: "\u4e3b\u80dc", value: 46, color: "#2563EB" },
      { label: "\u5e73\u5c40", value: 29, color: "#64748B" },
      { label: "\u5ba2\u80dc", value: 25, color: "#22C55E" },
    ],
    lottery: [
      {
        market: "\u80dc\u5e73\u8d1f",
        recommendation: "\u4e3b\u80dc",
        alternative: "\u5e73\u5c40",
        confidence: 4,
        explanation: "\u4e3b\u961f\u4e3b\u573a\u6570\u636e\u5360\u4f18\uff0c\u4f46\u53cc\u65b9\u5f3a\u5f3a\u5bf9\u8bdd\u4ecd\u9700\u9632\u5e73\u3002",
      },
      {
        market: "\u8ba9\u7403\u80dc\u5e73\u8d1f",
        recommendation: "\u8ba9\u5e73",
        alternative: "\u8ba9\u8d1f",
        confidence: 3,
        handicap: "\u4e3b\u961f -1",
        explanation: "\u6a21\u578b\u770b\u597d\u66fc\u8054\u53d6\u80dc\uff0c\u4f46\u51c0\u80dc\u4e24\u7403\u4ee5\u4e0a\u7684\u628a\u63e1\u4e0d\u8db3\u3002",
        note: "\u8ba9\u7403\u6570\u4e3a Mock \u793a\u4f8b\uff0c\u771f\u5b9e\u4e0a\u7ebf\u540e\u9700\u540c\u6b65\u4f53\u5f69\u5b98\u65b9\u8d5b\u7a0b\u3002",
      },
      {
        market: "\u6bd4\u5206",
        recommendation: "2:1",
        alternative: "1:1\u3001 1:0",
        confidence: 3.5,
        explanation: "\u4e3b\u961f\u7684\u4e3b\u573a\u4f18\u52bf\u548c\u8fdb\u653b\u7a33\u5b9a\u6027\u8ba9\u5c0f\u80dc\u6bd4\u5206\u6210\u4e3a\u9996\u9009\u65b9\u5411\u3002",
      },
      {
        market: "\u603b\u8fdb\u7403",
        recommendation: "2\u20143 \u7403",
        alternative: "\u6700\u9ad8\u6982\u7387\uff1a3 \u7403",
        confidence: 4,
        explanation: "\u53cc\u65b9\u90fd\u5177\u5907\u5feb\u901f\u8f6c\u6362\u80fd\u529b\uff0c\u6bd4\u8d5b\u8fdb\u7403\u6570\u91cf\u6216\u843d\u5728\u4e2d\u95f4\u533a\u95f4\u3002",
      },
      {
        market: "\u534a\u5168\u573a",
        recommendation: "\u5e73 / \u80dc",
        alternative: "\u80dc / \u80dc",
        confidence: 3,
        explanation: "\u4e0a\u534a\u573a\u53cc\u65b9\u53ef\u80fd\u4e92\u76f8\u8bd5\u63a2\uff0c\u66fc\u8054\u7684\u4e3b\u573a\u540e\u7a0b\u4f18\u52bf\u66f4\u660e\u663e\u3002",
      },
    ],
    scoreProbabilities: [
      { score: "2:1", probability: 16 },
      { score: "1:1", probability: 14 },
      { score: "1:0", probability: 12 },
      { score: "2:0", probability: 10 },
      { score: "1:2", probability: 9 },
    ],
    goalDistribution: [
      { label: "0 \u7403", home: 18, away: 24 },
      { label: "1 \u7403", home: 37, away: 41 },
      { label: "2 \u7403", home: 29, away: 25 },
      { label: "3+ \u7403", home: 16, away: 10 },
    ],
    players: [
      {
        name: "Bruno Fernandes",
        englishName: "Bruno Fernandes",
        team: "\u66fc\u8054",
        position: "\u4e2d\u573a",
        avatar: "BF",
        rating: 8.1,
        stats: [
          { label: "\u8fdb\u7403", value: "2" },
          { label: "\u52a9\u653b", value: "3" },
          { label: "\u5173\u952e\u4f20\u7403", value: "15" },
        ],
        formIndex: 91,
        impact: "\u7ec4\u7ec7\u4e0e\u5b9a\u4f4d\u7403\u6838\u5fc3",
        note: "\u524d\u573a\u4f20\u7403\u548c\u5b9a\u4f4d\u7403\u5904\u7406\u80fd\u529b\u662f\u66fc\u8054\u521b\u9020\u673a\u4f1a\u7684\u5173\u952e\u3002",
      },
      {
        name: "Rasmus Højlund",
        englishName: "Rasmus Højlund",
        team: "\u66fc\u8054",
        position: "\u524d\u950b",
        avatar: "RH",
        rating: 7.6,
        stats: [
          { label: "\u8fdb\u7403", value: "4" },
          { label: "xG", value: "3.2" },
          { label: "\u5c04\u6b63\u7387", value: "58%" },
        ],
        formIndex: 86,
        impact: "\u7981\u533a\u7ec8\u7ed3\u4e0e\u7eb5\u6df1\u51b2\u51fb",
        note: "\u4ed6\u7684\u8dd1\u4f4d\u53ef\u4ee5\u62c9\u5f00\u5229\u7269\u6d66\u4e2d\u536b\u7ebf\uff0c\u4e5f\u662f\u4e3b\u961f\u8f6c\u6362\u8fdb\u653b\u7684\u7ec8\u70b9\u3002",
      },
      {
        name: "Mohamed Salah",
        englishName: "Mohamed Salah",
        team: "\u5229\u7269\u6d66",
        position: "\u524d\u950b",
        avatar: "MS",
        rating: 8.0,
        stats: [
          { label: "\u8fdb\u7403", value: "3" },
          { label: "\u52a9\u653b", value: "2" },
          { label: "xG", value: "2.8" },
        ],
        formIndex: 89,
        impact: "\u53f3\u8def\u5355\u70b9\u7206\u7834\u4e0e\u53cd\u51fb\u6838\u5fc3",
        note: "\u8f6c\u6362\u9636\u6bb5\u7684\u63a5\u7403\u7a7a\u95f4\u662f Salah \u521b\u9020\u5a01\u80c1\u7684\u4e3b\u8981\u6765\u6e90\u3002",
      },
      {
        name: "Alexis Mac Allister",
        englishName: "Alexis Mac Allister",
        team: "\u5229\u7269\u6d66",
        position: "\u4e2d\u573a",
        avatar: "AM",
        rating: 7.7,
        stats: [
          { label: "\u5173\u952e\u4f20\u7403", value: "11" },
          { label: "\u62a2\u65ad", value: "9" },
          { label: "\u72b6\u6001\u6307\u6570", value: "84" },
        ],
        formIndex: 84,
        impact: "\u4e2d\u573a\u63a8\u8fdb\u4e0e\u4e8c\u70b9\u7403\u63a7\u5236",
        note: "\u79fb\u52a8\u548c\u62e6\u622a\u53ef\u80fd\u9650\u5236 Bruno \u5728\u6301\u7403\u65f6\u7684\u8282\u594f\u3002",
      },
    ],
    analysis: [
      { title: "\u8fd1\u671f\u72b6\u6001", content: "\u66fc\u8054\u8fd1 5 \u573a\u53d6\u5f97 3 \u80dc 1 \u5e73 1 \u8d1f\uff0c\u4e3b\u573a\u8fdb\u653b\u8868\u73b0\u76f8\u5bf9\u7a33\u5b9a\u3002\u5229\u7269\u6d66\u8fd1 5 \u573a\u53d6\u5f97 2 \u80dc 2 \u5e73 1 \u8d1f\uff0c\u5ba2\u573a\u6bd4\u8d5b\u4e2d\u7684\u9632\u5b88\u6ce2\u52a8\u66f4\u660e\u663e\u3002" },
      { title: "\u8fdb\u653b\u4e0e\u9632\u5b88", content: "\u66fc\u8054\u8fd1 5 \u573a\u573a\u5747 xG \u4e3a 1.84\uff0c\u5229\u7269\u6d66\u4e3a 1.67\u3002\u66fc\u8054\u7684\u7981\u533a\u89e6\u7403\u548c\u5b9a\u4f4d\u7403\u5a01\u80c1\u7565\u5360\u4f18\u52bf\uff0c\u4f46\u5229\u7269\u6d66\u5728\u5feb\u901f\u53cd\u51fb\u4e0e\u8fb9\u8def\u63a8\u8fdb\u65b9\u9762\u66f4\u5177\u7206\u53d1\u529b\u3002" },
      { title: "\u9635\u5bb9\u4e0e\u5173\u952e\u7403\u5458", content: "Bruno Fernandes \u7684\u7ec4\u7ec7\u80fd\u529b\u662f\u66fc\u8054\u8fdb\u653b\u8d28\u91cf\u7684\u91cd\u8981\u6765\u6e90\u3002\u5229\u7269\u6d66\u5219\u66f4\u4f9d\u8d56 Salah \u5728\u8f6c\u6362\u9636\u6bb5\u5236\u9020\u5a01\u80c1\u3002\u5982\u679c\u66fc\u8054\u80fd\u9650\u5236 Salah \u7684\u63a5\u7403\u7a7a\u95f4\uff0c\u4e3b\u573a\u4f18\u52bf\u5c06\u66f4\u52a0\u660e\u663e\u3002" },
      { title: "\u6218\u672f\u5bf9\u4f4d", content: "\u66fc\u8054\u53ef\u80fd\u901a\u8fc7\u4e2d\u573a\u538b\u8feb\u548c\u8fb9\u540e\u536b\u524d\u63d2\u4e89\u53d6\u4e3b\u52a8\uff0c\u5229\u7269\u6d66\u5219\u53ef\u80fd\u5229\u7528\u66fc\u8054\u538b\u4e0a\u540e\u7684\u8eab\u540e\u7a7a\u95f4\u3002\u6bd4\u8d5b\u8282\u594f\u8d8a\u5feb\uff0c\u5229\u7269\u6d66\u53cd\u51fb\u7684\u5a01\u80c1\u8d8a\u5927\uff1b\u6bd4\u8d5b\u8d8a\u504f\u9635\u5730\u6218\uff0c\u66fc\u8054\u66f4\u5bb9\u6613\u53d1\u6325\u4e3b\u573a\u4f18\u52bf\u3002" },
      { title: "\u7efc\u5408\u5224\u65ad", content: "\u6a21\u578b\u8ba4\u4e3a\u66fc\u8054\u7565\u5360\u4f18\u52bf\uff0c\u4f46\u4f18\u52bf\u4e0d\u8db3\u4ee5\u652f\u6301\u6781\u7aef\u4e50\u89c2\u5224\u65ad\u3002\u4e3b\u80dc\u662f\u9996\u9009\u65b9\u5411\uff0c\u540c\u65f6\u9700\u8981\u9632\u8303\u5e73\u5c40\u3002\u9884\u8ba1\u6bd4\u8d5b\u4e0d\u4f1a\u5f62\u6210\u5355\u65b9\u9762\u78be\u538b\u3002" },
    ],
    teamStats: [
      { label: "\u8fd1 5 \u573a\u80dc\u7387", home: 60, away: 40, unit: "%", higherIsBetter: true },
      { label: "\u573a\u5747\u8fdb\u7403", home: 1.8, away: 1.6, higherIsBetter: true },
      { label: "\u573a\u5747\u5931\u7403", home: 1.0, away: 1.4, higherIsBetter: false },
      { label: "\u573a\u5747 xG", home: 1.84, away: 1.67, higherIsBetter: true },
      { label: "\u573a\u5747 xGA", home: 1.12, away: 1.39, higherIsBetter: false },
      { label: "\u63a7\u7403\u7387", home: 53, away: 57, unit: "%", higherIsBetter: true },
      { label: "\u5c04\u6b63", home: 5.8, away: 5.4, higherIsBetter: true },
      { label: "\u91cd\u5927\u673a\u4f1a", home: 2.6, away: 2.3, higherIsBetter: true },
    ],
    recentForm: {
      home: [
        { opponent: "\u5207\u5c14\u897f", score: "2:0", result: "win", venue: "home" },
        { opponent: "\u963f\u65af\u987f\u7ef4\u62c9", score: "3:1", result: "win", venue: "home" },
        { opponent: "\u7ebd\u5361\u65af\u5c14", score: "1:1", result: "draw", venue: "away" },
        { opponent: "\u963f\u68ee\u7eb3", score: "0:1", result: "loss", venue: "away" },
        { opponent: "\u5bcc\u52d2\u59c6", score: "2:1", result: "win", venue: "home" },
      ],
      away: [
        { opponent: "\u66fc\u57ce", score: "1:1", result: "draw", venue: "away" },
        { opponent: "\u5e03\u83b1\u987f", score: "2:0", result: "win", venue: "home" },
        { opponent: "\u70ed\u523a", score: "1:2", result: "loss", venue: "away" },
        { opponent: "\u8bfa\u4e01\u6c49\u68ee", score: "3:1", result: "win", venue: "home" },
        { opponent: "\u57ce\u5e02", score: "2:2", result: "draw", venue: "home" },
      ],
    },
    homeVenueSummary: "\u66fc\u8054\u4e3b\u573a\u8fd1 5 \u573a\uff1a4 \u80dc 1 \u5e73",
    awayVenueSummary: "\u5229\u7269\u6d66\u5ba2\u573a\u8fd1 5 \u573a\uff1a2 \u80dc 2 \u5e73 1 \u8d1f",
    headToHead: [
      { home: "\u66fc\u8054", away: "\u5229\u7269\u6d66", score: "2:1", date: "2025-12-14" },
      { home: "\u5229\u7269\u6d66", away: "\u66fc\u8054", score: "1:1", date: "2025-08-24" },
      { home: "\u66fc\u8054", away: "\u5229\u7269\u6d66", score: "0:2", date: "2025-05-18" },
      { home: "\u5229\u7269\u6d66", away: "\u66fc\u8054", score: "2:2", date: "2025-01-05" },
      { home: "\u66fc\u8054", away: "\u5229\u7269\u6d66", score: "1:0", date: "2024-09-01" },
      { home: "\u5229\u7269\u6d66", away: "\u66fc\u8054", score: "0:1", date: "2024-04-07" },
      { home: "\u66fc\u8054", away: "\u5229\u7269\u6d66", score: "2:2", date: "2023-12-17" },
      { home: "\u5229\u7269\u6d66", away: "\u66fc\u8054", score: "1:0", date: "2023-03-05" },
      { home: "\u66fc\u8054", away: "\u5229\u7269\u6d66", score: "1:2", date: "2022-08-22" },
      { home: "\u5229\u7269\u6d66", away: "\u66fc\u8054", score: "0:0", date: "2022-04-19" },
    ],
    headToHeadSummary: { homeWins: 3, draws: 4, awayWins: 3, averageGoals: 2.1, bothScored: 50 },
    risks: [
      { title: "\u5f3a\u5f3a\u5bf9\u8bdd\u8bef\u5dee", description: "\u5f3a\u5f3a\u5bf9\u8bdd\u7684\u6bd4\u8d5b\u73af\u5883\u53d8\u91cf\u66f4\u591a\uff0c\u6a21\u578b\u8bef\u5dee\u901a\u5e38\u9ad8\u4e8e\u666e\u901a\u6bd4\u8d5b\u3002" },
      { title: "\u53cd\u51fb\u8282\u594f", description: "\u5229\u7269\u6d66\u5728\u5feb\u901f\u53cd\u51fb\u4e2d\u7684\u7206\u53d1\u529b\u53ef\u80fd\u6539\u53d8\u6bd4\u8d5b\u8d70\u52bf\u3002" },
      { title: "\u9996\u53d1\u4fe1\u606f", description: "\u6b63\u5f0f\u9996\u53d1\u5c1a\u672a\u516c\u5e03\uff0c\u5b9e\u9645\u9635\u5bb9\u53ef\u80fd\u5bf9\u9884\u6d4b\u4ea7\u751f\u5f71\u54cd\u3002" },
      { title: "\u8ba9\u7403\u6570\u53d8\u5316", description: "\u4f53\u5f69\u5b98\u65b9\u8ba9\u7403\u6570\u53ef\u80fd\u5728\u8d5b\u524d\u53d1\u751f\u53d8\u5316\uff0c\u9700\u4ee5\u6700\u7ec8\u516c\u5e03\u4fe1\u606f\u4e3a\u51c6\u3002" },
      { title: "Mock \u6570\u636e\u9650\u5236", description: "Mock \u6570\u636e\u4e0d\u4ee3\u8868\u5b9e\u65f6\u4fe1\u606f\uff0c\u672c\u9875\u5185\u5bb9\u4ec5\u4f5c\u6570\u636e\u5206\u6790\u53c2\u8003\u3002" },
    ],
  },
];

const realMadrid: MatchTeam = {
  name: "皇马",
  englishName: "Real Madrid",
  shortName: "RMA",
  color: "#FEBE10",
  secondaryColor: "#F4D35E",
};

const barcelona: MatchTeam = {
  name: "巴萨",
  englishName: "FC Barcelona",
  shortName: "BAR",
  color: "#A50044",
  secondaryColor: "#2D7DD2",
};

const bayern: MatchTeam = {
  name: "拜仁",
  englishName: "Bayern Munich",
  shortName: "FCB",
  color: "#DC052D",
  secondaryColor: "#F45B69",
};

const dortmund: MatchTeam = {
  name: "多特",
  englishName: "Borussia Dortmund",
  shortName: "BVB",
  color: "#FDE100",
  secondaryColor: "#2D2D2D",
};

function createSupplementalMatch(config: {
  id: string;
  league: string;
  round: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  home: MatchTeam;
  away: MatchTeam;
  homeStats: { attack: number; defense: number; form: number; homeAdvantage: number };
  awayStats: { attack: number; defense: number; form: number; homeAdvantage: number };
  aiAnalysis: { home: { attackScore: number; defenseScore: number; formScore: number; homeAwayScore: number; possessionScore: number; upsetRisk: number }; away: { attackScore: number; defenseScore: number; formScore: number; homeAwayScore: number; possessionScore: number; upsetRisk: number } };
  confidence: number;
  prediction: string;
  score: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  summary: string;
}): MatchDetailData {
  return {
    id: config.id,
    league: config.league,
    round: config.round,
    date: config.date,
    time: config.time,
    status: "赛前分析",
    venue: config.venue,
    city: config.city,
    weather: "晴 14℃",
    referee: "Mock Referee",
    updatedAt: "12 分钟前",
    home: config.home,
    away: config.away,
    homeStats: config.homeStats,
    awayStats: config.awayStats,
    aiAnalysis: config.aiAnalysis,
    prediction: {
      lean: `${config.home.name}方向`,
      firstChoice: `胜平负：${config.prediction}`,
      cover: `${config.prediction} / 平局`,
      confidence: config.confidence,
      rating: 4,
      score: config.score,
      totalGoals: "2—4 球",
      upsetRisk: "medium",
      summary: config.summary,
      modelProbability: config.homeWin,
      referenceProbability: Math.max(config.homeWin - 3, 1),
    },
    probabilities: [
      { label: "主胜", value: config.homeWin, color: "#2563EB" },
      { label: "平局", value: config.draw, color: "#64748B" },
      { label: "客胜", value: config.awayWin, color: "#22C55E" },
    ],
    lottery: [
      { market: "胜平负", recommendation: config.prediction, alternative: "平局", confidence: 3, explanation: "Mock 数据仅用于展示模型分析维度，真实比赛仍会受到临场因素影响。" },
      { market: "比分", recommendation: config.score, alternative: "1:1", confidence: 3, explanation: "根据双方近期进攻效率与主客场表现生成参考方向。" },
      { market: "总进球", recommendation: "2—4 球", alternative: "3 球", confidence: 3, explanation: "双方具备持续创造机会的能力，进球区间存在一定弹性。" },
    ],
    scoreProbabilities: [
      { score: config.score, probability: 15 },
      { score: "1:1", probability: 13 },
      { score: "2:0", probability: 10 },
    ],
    goalDistribution: [
      { label: "0 球", home: 16, away: 20 },
      { label: "1 球", home: 36, away: 38 },
      { label: "2 球", home: 31, away: 28 },
      { label: "3+ 球", home: 17, away: 14 },
    ],
    players: [],
    analysis: [
      { title: "近期状态", content: "当前为首页精选比赛的 Mock 分析摘要，完整实时数据将在后续数据源接入后更新。" },
      { title: "战术对位", content: config.summary },
      { title: "综合判断", content: "模型输出仅作为赛前信息整理和数据分析参考，不构成确定性结论。" },
    ],
    teamStats: [
      { label: "近 5 场模型估算概率", home: 60, away: 48, unit: "%", higherIsBetter: true },
      { label: "场均进球", home: 1.9, away: 1.6, higherIsBetter: true },
      { label: "场均 xG", home: 1.75, away: 1.55, higherIsBetter: true },
      { label: "控球率", home: 54, away: 52, unit: "%", higherIsBetter: true },
    ],
    recentForm: { home: [], away: [] },
    homeVenueSummary: `${config.home.name}主场近期状态：数据分析参考`,
    awayVenueSummary: `${config.away.name}客场近期状态：数据分析参考`,
    headToHead: [],
    headToHeadSummary: { homeWins: 2, draws: 1, awayWins: 2, averageGoals: 2.7, bothScored: 58 },
    risks: [
      { title: "首发信息待确认", description: "正式首发与临场阵容变化可能影响模型输出。" },
      { title: "Mock 数据限制", description: "本场内容为 Mock 数据，仅作数据分析参考。" },
    ],
  };
}

const supplementalMatchDetails: MatchDetailData[] = [
  createSupplementalMatch({
    id: "real-madrid-vs-barcelona",
    league: "西甲",
    round: "第 29 轮",
    date: "2026-03-17",
    time: "04:00",
    venue: "伯纳乌球场",
    city: "Madrid",
    home: realMadrid,
    away: barcelona,
    homeStats: { attack: 88, defense: 82, form: 86, homeAdvantage: 90 },
    awayStats: { attack: 84, defense: 78, form: 80, homeAdvantage: 52 },
    aiAnalysis: {
      home: { attackScore: 89, defenseScore: 84, formScore: 88, homeAwayScore: 91, possessionScore: 82, upsetRisk: 28 },
      away: { attackScore: 86, defenseScore: 80, formScore: 81, homeAwayScore: 72, possessionScore: 88, upsetRisk: 28 },
    },
    confidence: 76,
    prediction: "主胜",
    score: "2:1",
    homeWin: 45,
    draw: 25,
    awayWin: 30,
    summary: "皇马主场推进与定位球组织更稳定，巴萨的控球和中路渗透能力会持续制造压力。",
  }),
  createSupplementalMatch({
    id: "bayern-munich-vs-borussia-dortmund",
    league: "德甲",
    round: "第 26 轮",
    date: "2026-03-18",
    time: "01:30",
    venue: "安联球场",
    city: "Munich",
    home: bayern,
    away: dortmund,
    homeStats: { attack: 91, defense: 84, form: 88, homeAdvantage: 93 },
    awayStats: { attack: 79, defense: 72, form: 74, homeAdvantage: 48 },
    aiAnalysis: {
      home: { attackScore: 93, defenseScore: 87, formScore: 90, homeAwayScore: 94, possessionScore: 85, upsetRisk: 18 },
      away: { attackScore: 81, defenseScore: 75, formScore: 76, homeAwayScore: 69, possessionScore: 77, upsetRisk: 18 },
    },
    confidence: 84,
    prediction: "主胜",
    score: "3:1",
    homeWin: 58,
    draw: 21,
    awayWin: 21,
    summary: "拜仁在主场压迫、边路推进和禁区触球方面占优，多特需要依靠转换速度寻找空间。",
  }),
];

const mockMatchDetails: MatchDetailData[] = [...baseMatchDetails, ...supplementalMatchDetails];

const footballTeamIds: Record<string, string> = {
  "Manchester United": "manchester-united",
  Liverpool: "liverpool",
  "Real Madrid": "real-madrid",
  "FC Barcelona": "barcelona",
  "Bayern Munich": "bayern-munich",
  "Borussia Dortmund": "borussia-dortmund",
};

function toFootballTeamId(team: MatchTeam): string {
  return footballTeamIds[team.englishName] ?? team.englishName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function toFootballTeamStats(match: MatchDetailData, side: "home" | "away"): FootballTeamStats {
  const team = match[side];
  const stats = match[`${side}Stats`];
  const recentMatches: FootballRecentMatch[] = match.recentForm[side].map((recentMatch) => {
    const [goalsFor, goalsAgainst] = recentMatch.score.split(":").map(Number);
    return { result: recentMatch.result, goalsFor: goalsFor || 0, goalsAgainst: goalsAgainst || 0, venue: recentMatch.venue };
  });
  const teamStats = match.teamStats;
  const goalsFor = (teamStats.find((item) => item.label === "场均进球")?.[side] ?? 1.5) * Math.max(recentMatches.length, 5);
  const goalsAgainst = (teamStats.find((item) => item.label === "场均失球")?.[side] ?? 1.2) * Math.max(recentMatches.length, 5);
  const xG = teamStats.find((item) => item.label === "场均 xG")?.[side] ?? 1.5;
  return {
    teamId: toFootballTeamId(team),
    attack: stats.attack,
    defense: stats.defense,
    form: stats.form,
    homeAdvantage: stats.homeAdvantage,
    possession: match.aiAnalysis[side].possessionScore,
    recentMatches,
    goalsFor,
    goalsAgainst,
    xG,
    rank: side === "home" ? 6 : 4,
  };
}

export const footballMatchFallbacks: FootballMatch[] = mockMatchDetails.map((match) => ({
  id: match.id,
  league: match.league,
  homeTeam: { id: toFootballTeamId(match.home), name: match.home.name, shortName: match.home.shortName },
  awayTeam: { id: toFootballTeamId(match.away), name: match.away.name, shortName: match.away.shortName },
  date: `${match.date}T${match.time}:00`,
  venue: match.venue,
  odds: {
    homeWin: match.probabilities[0]?.value ?? match.prediction.modelProbability,
    draw: match.probabilities[1]?.value ?? 25,
    awayWin: match.probabilities[2]?.value ?? 25,
    asianHandicap: { initial: `${match.home.name} -0.25`, current: `${match.home.name} -0.5` },
  },
  stats: { home: toFootballTeamStats(match, "home"), away: toFootballTeamStats(match, "away") },
  injuries: [],
}));

const generatedPredictions = new Map(footballMatchFallbacks.map((match) => [match.id, predictMatch(match)]));

export const matchDetails: MatchDetailData[] = mockMatchDetails.map((match) => {
  const prediction = generatedPredictions.get(match.id);
  if (!prediction) return match;
  return {
    ...match,
    prediction: { ...match.prediction, confidence: prediction.confidence, score: prediction.score[0], modelProbability: prediction.homeWin },
    probabilities: [
      { label: "主胜", value: prediction.homeWin, color: "#2563EB" },
      { label: "平局", value: prediction.draw, color: "#64748B" },
      { label: "客胜", value: prediction.awayWin, color: "#22C55E" },
    ],
  };
});

export function getFootballMatchesFallback(): FootballMatch[] {
  return footballMatchFallbacks;
}

export function getFootballMatchFallback(id: string): FootballMatch | undefined {
  return footballMatchFallbacks.find((match) => match.id === id);
}

export function getFootballTeamStatsFallback(teamId: string): FootballTeamStats {
  const match = footballMatchFallbacks.find(({ homeTeam, awayTeam }) => homeTeam.id === teamId || awayTeam.id === teamId);
  if (match?.homeTeam.id === teamId) return match.stats.home;
  if (match?.awayTeam.id === teamId) return match.stats.away;
  return { teamId, attack: 50, defense: 50, form: 50, homeAdvantage: 50, possession: 50, recentMatches: [], goalsFor: 7.5, goalsAgainst: 7.5, xG: 1.5, rank: 20 };
}

const featuredMeta: Record<string, Pick<FeaturedMatch, "aiScore" | "prediction" | "score" | "risk">> = {
  "manchester-united-vs-liverpool": { aiScore: 82, prediction: "主胜", score: "2:1", risk: "中" },
  "real-madrid-vs-barcelona": { aiScore: 76, prediction: "主胜", score: "2:1", risk: "中" },
  "bayern-munich-vs-borussia-dortmund": { aiScore: 84, prediction: "主胜", score: "3:1", risk: "低" },
};

export const featured: FeaturedMatch[] = matchDetails.map((match) => ({
  id: match.id,
  league: match.league,
  date: match.date,
  time: match.time,
  homeTeam: match.home,
  awayTeam: match.away,
  homeWin: match.probabilities[0]?.value ?? match.prediction.modelProbability,
  draw: match.probabilities[1]?.value ?? 25,
  awayWin: match.probabilities[2]?.value ?? 25,
  ...featuredMeta[match.id],
}));

const commercialOverrides: Record<string, CommercialMatchData> = {
  "manchester-united-vs-liverpool": {
    prediction: {
      homeWin: generatedPredictions.get("manchester-united-vs-liverpool")?.homeWin ?? 0,
      draw: generatedPredictions.get("manchester-united-vs-liverpool")?.draw ?? 0,
      awayWin: generatedPredictions.get("manchester-united-vs-liverpool")?.awayWin ?? 0,
      score: generatedPredictions.get("manchester-united-vs-liverpool")?.score[0] ?? "0-0",
      confidence: generatedPredictions.get("manchester-united-vs-liverpool")?.confidence ?? 0,
    },
    teams: {
      home: { name: "曼联", shortName: "MUN", color: "#DA291C", form: ["W", "W", "D", "L", "W"], goalsFor: 12, goalsAgainst: 6, venueWinRate: 72, venueLabel: "主场模型概率" },
      away: { name: "利物浦", shortName: "LIV", color: "#C8102E", form: ["W", "W", "W", "D", "W"], goalsFor: 15, goalsAgainst: 5, venueWinRate: 68, venueLabel: "客场模型概率" },
    },
    players: [
      { name: "Bruno Fernandes", team: "曼联", avatar: "BF", rating: 8.1, goals: 2, assists: 3 },
      { name: "Mohamed Salah", team: "利物浦", avatar: "MS", rating: 8.4, goals: 4, assists: 2 },
    ],
    odds: { market: "亚洲市场数据", initial: "曼联 -0.25", current: "曼联 -0.5", trend: "主队关注度增强" },
    report: {
      summary: "根据球队近期表现、进攻效率、防守稳定性、主客场因素综合分析，曼联在比赛主动权与主场环境上略占优势。",
      lean: "主胜略占优势",
      risk: "利物浦反击能力较强。",
    },
    vipFeatures: ["精细比分模型", "市场数据变化分析", "最近100场历史数据", "AI市场关注度判断"],
  },
};

const aliases: Record<string, string> = {
  "man-utd-liverpool": "manchester-united-vs-liverpool",
};

export function getMatchById(id: string) {
  const canonicalId = aliases[id] ?? id;
  return matchDetails.find((match) => match.id === canonicalId);
}

export function getCommercialMatchBySlug(slug: string): { match: MatchDetailData; commercial: CommercialMatchData } | undefined {
  const match = getMatchById(slug);
  if (!match) return undefined;
  const commercial = commercialOverrides[match.id] ?? {
    prediction: {
      homeWin: match.probabilities[0]?.value ?? match.prediction.modelProbability,
      draw: match.probabilities[1]?.value ?? 25,
      awayWin: match.probabilities[2]?.value ?? 25,
      score: match.prediction.score,
      confidence: match.prediction.confidence,
    },
    teams: {
      home: { name: match.home.name, shortName: match.home.shortName, color: match.home.color, form: ["W", "D", "W", "L", "W"], goalsFor: 10, goalsAgainst: 7, venueWinRate: 64, venueLabel: "主场模型概率" },
      away: { name: match.away.name, shortName: match.away.shortName, color: match.away.color, form: ["W", "W", "D", "W", "L"], goalsFor: 13, goalsAgainst: 8, venueWinRate: 61, venueLabel: "客场模型概率" },
    },
    players: [
      { name: "关键球员 A", team: match.home.name, avatar: "A", rating: 8.0, goals: 3, assists: 2 },
      { name: "关键球员 B", team: match.away.name, avatar: "B", rating: 7.9, goals: 3, assists: 2 },
    ],
    odds: { market: "亚洲市场数据", initial: match.home.name + " -0.25", current: match.home.name + " -0.5", trend: "主队关注度增强" },
    report: { summary: match.prediction.summary, lean: match.prediction.firstChoice, risk: "临场阵容和比赛节奏可能带来额外波动。" },
    vipFeatures: ["精细比分模型", "市场数据变化分析", "最近100场历史数据", "AI市场关注度判断"],
  };
  return { match, commercial };
}
