import { BarChart3, Globe2, TrendingUp, Users } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import type { HomeOverviewStats } from "@/data/home";

export function StatsOverview({ stats }: { stats: HomeOverviewStats }) {
  return <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8"><StatCard label="比赛总数" value={`${stats.matchCount}场`} detail="实时" icon={BarChart3} /><StatCard label="联赛数量" value={`${stats.leagueCount}个`} detail="覆盖" icon={Globe2} accent="green" /><StatCard label="AI分析数量" value={`${stats.analysisCount}次`} detail="估算" icon={TrendingUp} accent="amber" /><StatCard label="模型准确率" value={`${stats.accuracy}%`} detail="Mock" icon={Users} /></section>;
}
