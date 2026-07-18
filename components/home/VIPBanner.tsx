import Link from "next/link";
import { ArrowRight, BrainCircuit, Crown, RefreshCw, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const benefits = ["AI 深度报告", "多模型分析", "首发实时更新", "球员影响评估"];

export function VIPBanner() {
  return <Card className="relative overflow-hidden border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-[#111827] to-blue-500/10 p-6 sm:p-8"><div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" /><div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div className="max-w-xl"><div className="flex items-center gap-2 text-xs font-medium text-amber-300"><Crown className="h-4 w-4" />VIP会员</div><h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">把每一场比赛，看得更深一点。</h2><p className="mt-2 text-sm leading-6 text-slate-400">解锁更完整的 AI 比赛信息和球员影响评估，让赛前准备更有依据。</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[440px]">{benefits.map((benefit, index) => { const Icon = [BrainCircuit, Sparkles, RefreshCw, Users][index]; return <div key={benefit} className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/30 px-3 py-2 text-xs text-slate-300"><Icon className="h-3.5 w-3.5 shrink-0 text-amber-400" />{benefit}</div>; })}</div><Button asChild variant="premium" className="shrink-0"><Link href="/vip">查看会员权益 <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></Card>;
}
