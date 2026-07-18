import { BarChart3, Globe2, TrendingUp, Users } from "lucide-react";
import { StatCard } from "@/components/stat-card";

export function StatsOverview() {
  return <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8"><StatCard label="今日分析" value="128场" detail="12.4%" icon={BarChart3} /><StatCard label="AI模型覆盖" value="12个联赛" detail="+2" icon={Globe2} accent="green" /><StatCard label="昨日分析" value="78.6%" detail="3.2%" icon={TrendingUp} accent="amber" /><StatCard label="VIP用户" value="24800+" detail="8.7%" icon={Users} /></section>;
}
