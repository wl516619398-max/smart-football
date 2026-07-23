import { decodeUnicode } from "@/lib/utils/decode-unicode";

const TEAM_NAME_MAP: Record<string, string> = {
  Arsenal: "阿森纳",
  "Manchester United": "曼彻斯特联",
  Liverpool: "利物浦",
  "Manchester City": "曼城",
  Chelsea: "切尔西",
  "Tottenham Hotspur": "托特纳姆热刺",
  Tottenham: "托特纳姆热刺",
  "Newcastle United": "纽卡斯尔联",
  Newcastle: "纽卡斯尔联",
  "Aston Villa": "阿斯顿维拉",
  "West Ham United": "西汉姆联",
  "West Ham": "西汉姆联",
  Brighton: "布莱顿",
  "Brighton and Hove Albion": "布莱顿",
  "Crystal Palace": "水晶宫",
  Fulham: "富勒姆",
  Everton: "埃弗顿",
  "Wolverhampton Wanderers": "狼队",
  Wolves: "狼队",
  "Nottingham Forest": "诺丁汉森林",
  "Leicester City": "莱斯特城",
  "Leeds United": "利兹联",
  "Coventry City": "考文垂",
  "Real Madrid": "皇家马德里",
  Barcelona: "巴塞罗那",
  "Atletico Madrid": "马德里竞技",
  "Atlético Madrid": "马德里竞技",
  Sevilla: "塞维利亚",
  Valencia: "瓦伦西亚",
  Villarreal: "比利亚雷亚尔",
  "Athletic Club": "毕尔巴鄂竞技",
  "Real Betis": "皇家贝蒂斯",
  "Real Sociedad": "皇家社会",
  "Deportivo Alavés": "阿拉维斯",
  Alaves: "阿拉维斯",
  Getafe: "赫塔费",
  "Bayern Munich": "拜仁慕尼黑",
  "Borussia Dortmund": "多特蒙德",
  Stuttgart: "斯图加特",
  "Bayer Leverkusen": "勒沃库森",
  "RB Leipzig": "莱比锡红牛",
  Leipzig: "莱比锡",
  "Eintracht Frankfurt": "法兰克福",
  "Borussia Monchengladbach": "门兴格拉德巴赫",
  "Borussia Mönchengladbach": "门兴格拉德巴赫",
  Juventus: "尤文图斯",
  "Inter Milan": "国际米兰",
  Inter: "国际米兰",
  Milan: "AC米兰",
  "AC Milan": "AC米兰",
  Roma: "罗马",
  Lazio: "拉齐奥",
  Napoli: "那不勒斯",
  Atalanta: "亚特兰大",
  Fiorentina: "佛罗伦萨",
  "Paris Saint-Germain": "巴黎圣日耳曼",
  PSG: "巴黎圣日耳曼",
  Mjällby: "米亚尔比",
  "Lincoln Red Imps": "林肯红魔",
};

const NORMALIZED_TEAM_NAME_MAP = Object.fromEntries(
  Object.entries(TEAM_NAME_MAP).map(([name, displayName]) => [name.toLocaleLowerCase(), displayName]),
);

function repairUtf8Mojibake(value: string) {
  if (!value || !Array.from(value).every((character) => character.charCodeAt(0) <= 0xff)) return value;

  try {
    const bytes = Uint8Array.from(Array.from(value), (character) => character.charCodeAt(0));
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return /[\u3400-\u9fff]/.test(decoded) ? decoded : value;
  } catch {
    return value;
  }
}

function normalizeTeamName(value: string) {
  return repairUtf8Mojibake(decodeUnicode(value)).trim();
}

export function getTeamDisplayName(name: string | null | undefined) {
  const originalName = name?.trim() ?? "";
  if (!originalName) return "未知球队";

  const normalizedName = normalizeTeamName(originalName);
  return TEAM_NAME_MAP[normalizedName]
    ?? NORMALIZED_TEAM_NAME_MAP[normalizedName.toLocaleLowerCase()]
    ?? normalizedName;
}

export { TEAM_NAME_MAP };
