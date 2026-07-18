"use client";

import { useEffect, useState } from "react";
import { Check, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { USER_CHANGED_EVENT, AthenaUser, getUser, upgradeVip } from "@/lib/user";
import { cn } from "@/lib/utils";

const freeBenefits = ["基础比赛信息", "基础 AI 分析", "部分数据"];
const vipBenefits = ["完整 AI 赛事报告", "球员深度分析", "首发预测", "盘口趋势", "AI 风险分析", "历史模型数据"];

export function MembershipCard({ plan }: { plan: "free" | "vip" }) {
  const [user, setUser] = useState<AthenaUser | null>(null);
  const [message, setMessage] = useState("");
  const isVip = user?.membership === "vip";
  const isCurrent = plan === "vip" ? isVip : !isVip;
  const benefits = plan === "vip" ? vipBenefits : freeBenefits;

  useEffect(() => {
    const syncUser = () => setUser(getUser());
    syncUser();
    window.addEventListener(USER_CHANGED_EVENT, syncUser);
    return () => window.removeEventListener(USER_CHANGED_EVENT, syncUser);
  }, []);

  function handleUpgrade() {
    upgradeVip();
    setMessage("升级成功，已解锁 Athena VIP");
  }

  return <div className={cn("relative rounded-2xl border p-6 sm:p-8", plan === "vip" ? "border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-[#111827] shadow-lg shadow-amber-500/5" : "border-slate-800 bg-[#111827]")}><div className="flex items-start justify-between"><div><p className={cn("flex items-center gap-2 text-sm font-medium", plan === "vip" ? "text-amber-300" : "text-white")}>{plan === "vip" ? <Sparkles className="h-4 w-4" /> : <Crown className="h-4 w-4 text-slate-500" />}{plan === "vip" ? "VIP版" : "免费版"}</p><p className="mt-3 text-3xl font-semibold text-white">{plan === "vip" ? "¥29" : "¥0"} <span className="text-sm font-normal text-slate-500">{plan === "vip" ? "/ 月" : "/ 永久"}</span></p></div>{plan === "vip" && <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-slate-950">推荐方案</span>}</div><p className="mt-5 border-t border-slate-800/80 pt-5 text-sm text-slate-400">{plan === "vip" ? "解锁更深层的足球 AI 分析能力" : "适合快速了解 Project Athena"}</p><ul className="mt-5 space-y-3">{benefits.map((benefit) => <li key={benefit} className="flex gap-2 text-sm text-slate-300"><Check className={cn("h-4 w-4", plan === "vip" ? "text-green-400" : "text-slate-500")} />{benefit}</li>)}</ul><Button type="button" disabled={isCurrent} onClick={handleUpgrade} variant={plan === "vip" ? "premium" : "outline"} className="mt-8 w-full">{isCurrent ? "当前方案" : "升级VIP"}</Button>{message && plan === "vip" && <p role="status" className="mt-3 text-center text-xs text-green-400">{message}</p>}</div>;
}
