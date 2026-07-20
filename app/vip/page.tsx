import type { Metadata } from "next";
import { BarChart3, BrainCircuit, Crown, UserRound } from "lucide-react";
import { MembershipCenter } from "@/components/user/MembershipCenter";
import { VIPFeatureCard } from "@/components/user/VIPFeatureCard";

export const metadata: Metadata = {
  title: "Athena VIP - AI足球深度分析会员",
  description: "查看 Project Athena Free、VIP 与 Enterprise 会员权限。",
};

const featureCards = [
  { icon: BrainCircuit, title: "AI深度报告", description: "详细解释比赛走势、关键因素与模型观点。" },
  { icon: UserRound, title: "球员智能分析", description: "查看关键球员状态、对位关系与比赛影响。" },
  { icon: BarChart3, title: "高级数据模型", description: "查看更多状态、趋势与历史模型数据维度。" },
];

export default function VipPage() {
  return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-2xl text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20"><Crown className="h-6 w-6" /></div><p className="mt-5 text-xs font-medium text-amber-400">ATHENA MEMBERSHIP</p><h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">解锁更完整的<br /><span className="text-amber-400">足球 AI 分析能力</span></h1><p className="mt-4 text-sm leading-6 text-slate-400">根据你的使用需求选择会员等级，体验从基础预测到完整数据分析的不同权限。</p></div><div className="mx-auto mt-10 max-w-6xl"><MembershipCenter /></div><section className="mx-auto mt-16 max-w-5xl"><div className="text-center"><p className="text-xs font-medium text-amber-400">MEMBERSHIP BENEFITS</p><h2 className="mt-2 text-2xl font-semibold text-white">会员权益</h2><p className="mt-2 text-sm text-slate-500">更多数据维度帮助你更完整地理解赛事信息。</p></div><div className="mt-6 grid gap-4 md:grid-cols-3">{featureCards.map((feature) => <VIPFeatureCard key={feature.title} {...feature} />)}</div></section><p className="mt-10 text-center text-xs text-slate-600">当前为 MVP 演示版本，升级仅模拟更新会员权限，不产生真实支付。</p></div>;
}
