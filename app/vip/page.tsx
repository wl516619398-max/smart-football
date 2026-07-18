import type { Metadata } from "next";
import { BarChart3, BrainCircuit, Crown, UserRound } from "lucide-react";
import { MembershipCard } from "@/components/user/MembershipCard";
import { VIPFeatureCard } from "@/components/user/VIPFeatureCard";

export const metadata: Metadata = {
  title: "Athena VIP - AI足球深度分析会员",
  description: "解锁 Project Athena 更深层的足球 AI 赛事、球员与风险分析能力。",
};

const featureCards = [
  { icon: BrainCircuit, title: "AI深度报告", description: "详细解释比赛走势、关键变量与模型判断依据。" },
  { icon: UserRound, title: "球员智能分析", description: "查看关键球员状态、对位关系与比赛影响。" },
  { icon: BarChart3, title: "高级数据模型", description: "查看更多 xG、趋势、历史模型等数据维度。" },
];

export default function VipPage() {
  return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-2xl text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20"><Crown className="h-6 w-6" /></div><p className="mt-5 text-xs font-medium text-amber-400">ATHENA VIP</p><h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">解锁更深层的<br /><span className="text-amber-400">足球AI分析能力</span></h1><p className="mt-4 text-sm leading-6 text-slate-400">为认真看球的人准备的高级数据分析体验。</p></div><div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2"><MembershipCard plan="free" /><MembershipCard plan="vip" /></div><section className="mx-auto mt-16 max-w-4xl"><div className="text-center"><p className="text-xs font-medium text-amber-400">WHY ATHENA VIP</p><h2 className="mt-2 text-2xl font-semibold text-white">为什么选择VIP</h2><p className="mt-2 text-sm text-slate-500">把公开信息，转化为更完整的比赛理解。</p></div><div className="mt-6 grid gap-4 md:grid-cols-3">{featureCards.map((feature) => <VIPFeatureCard key={feature.title} {...feature} />)}</div></section><p className="mt-10 text-center text-xs text-slate-600">当前为 MVP 演示页面，升级仅修改浏览器 localStorage，不会产生真实支付。</p></div>;
}
