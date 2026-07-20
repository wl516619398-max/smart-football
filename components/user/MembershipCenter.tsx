"use client";

import { useEffect, useState } from "react";
import { Building2, Check, Crown, Infinity, Loader2, Sparkles } from "lucide-react";
import type { MembershipLevel } from "@/lib/db/types";
import { getAccessToken, getProfile, getUser as getAuthUser, updateMembershipProfile } from "@/lib/supabase/auth";
import { USER_CHANGED_EVENT, getUser as getLocalUser, setMembership } from "@/lib/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Usage = { limit: number | null; used: number; remaining: number | null };

const plans: Array<{ level: MembershipLevel; label: string; price: string; unit: string; description: string; icon: typeof Crown; benefits: string[]; accent: string }> = [
  { level: "free", label: "Free", price: "¥0", unit: "/ 永久", description: "适合基础赛事信息浏览", icon: Crown, benefits: ["每天3次AI分析", "基础预测", "基础比赛数据"], accent: "border-slate-800" },
  { level: "vip", label: "VIP", price: "¥29", unit: "/ 月", description: "解锁更完整的赛事分析能力", icon: Sparkles, benefits: ["无限AI分析", "高级模型", "更多数据维度", "深度报告与风险分析"], accent: "border-amber-500/45" },
  { level: "enterprise", label: "Enterprise", price: "定制", unit: "方案", description: "面向专业团队的完整权限", icon: Building2, benefits: ["全部权限", "高级数据与模型", "企业级分析能力", "未来团队功能预留"], accent: "border-violet-500/35" },
];

function levelLabel(level: MembershipLevel) {
  return level === "enterprise" ? "Enterprise" : level === "vip" ? "VIP" : "Free";
}

export function MembershipCenter() {
  const [membership, setMembershipLevel] = useState<MembershipLevel>("free");
  const [usage, setUsage] = useState<Usage>({ limit: 3, used: 0, remaining: 3 });
  const [loading, setLoading] = useState(true);
  const [actionLevel, setActionLevel] = useState<MembershipLevel | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sync() {
    const authUser = await getAuthUser();
    const profile = authUser ? await getProfile() : null;
    const localUser = getLocalUser();
    const nextMembership = profile?.membership_level ?? profile?.vip_level ?? localUser?.membership ?? "free";
    const token = await getAccessToken();
    const response = await fetch("/api/user/usage", { cache: "no-store", headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    const payload = await response.json().catch(() => null) as { limit?: number | null; used?: number; remaining?: number | null } | null;
    setMembershipLevel(nextMembership);
    setUsage({ limit: nextMembership === "free" ? payload?.limit ?? 3 : null, used: payload?.used ?? 0, remaining: nextMembership === "free" ? payload?.remaining ?? 3 : null });
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    void sync().then(() => { if (!mounted) return; }).catch(() => setLoading(false));
    const onChanged = () => { void sync(); };
    window.addEventListener(USER_CHANGED_EVENT, onChanged);
    return () => { mounted = false; window.removeEventListener(USER_CHANGED_EVENT, onChanged); };
  }, []);

  async function handleUpgrade(level: MembershipLevel) {
    if (level === "free" || level === membership) return;
    setActionLevel(level);
    setMessage("");
    setError("");
    const authUser = await getAuthUser();
    if (authUser) {
      const profile = await updateMembershipProfile(level);
      if (!profile) {
        setError("会员等级更新失败，请稍后重试。");
        setActionLevel(null);
        return;
      }
    }
    setMembership(level);
    setMembershipLevel(level);
    setUsage({ limit: null, used: 0, remaining: null });
    setMessage(`已切换为 ${levelLabel(level)}（MVP模拟，无实际支付）`);
    setActionLevel(null);
  }

  const remaining = membership === "free" ? `${usage.remaining ?? 3} 次` : "不限次数";

  if (loading) return <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-800 bg-[#111827] text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />正在读取会员状态</div>;

  return <div className="space-y-8">
    <Card className="overflow-hidden border-blue-500/25 bg-gradient-to-br from-[#111d3a] via-[#111827] to-[#111827]"><CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400">CURRENT MEMBERSHIP</p><h1 className="mt-2 text-3xl font-semibold text-white">{levelLabel(membership)}</h1><p className="mt-2 text-sm text-slate-400">当前等级：{levelLabel(membership)} · AI分析次数：{remaining}</p></div><div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 text-center"><p className="text-xs text-slate-500">今日剩余 AI 次数</p><p className="mt-2 flex items-center justify-center gap-2 text-2xl font-semibold text-blue-200">{membership === "free" ? remaining : <><Infinity className="h-6 w-6" />不限</>}</p></div></CardContent></Card>

    <section><div className="mb-5"><p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400">MEMBERSHIP PLANS</p><h2 className="mt-2 text-2xl font-semibold text-white">选择适合你的分析权限</h2><p className="mt-2 text-sm text-slate-500">当前为 MVP 会员体验，升级按钮仅模拟更新权限，不接入支付。</p></div><div className="grid gap-5 lg:grid-cols-3">{plans.map((plan) => { const Icon = plan.icon; const current = membership === plan.level; return <Card key={plan.level} className={cn("relative h-full bg-[#111827]", plan.accent, plan.level === "vip" && "bg-gradient-to-b from-amber-500/10 to-[#111827]")}><CardContent className="flex h-full flex-col p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-lg font-semibold text-white"><Icon className={cn("h-5 w-5", plan.level === "free" ? "text-slate-400" : plan.level === "vip" ? "text-amber-300" : "text-violet-300")} />{plan.label}</div>{current && <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-[10px] font-medium text-blue-300">当前等级</span>}</div><div className="mt-5 flex items-baseline gap-1"><span className="text-3xl font-bold text-white">{plan.price}</span><span className="text-xs text-slate-500">{plan.unit}</span></div><p className="mt-3 text-sm text-slate-400">{plan.description}</p><ul className="mt-6 flex-1 space-y-3">{plan.benefits.map((benefit) => <li key={benefit} className="flex gap-2 text-sm text-slate-300"><Check className="h-4 w-4 shrink-0 text-emerald-400" />{benefit}</li>)}</ul><Button type="button" disabled={current || actionLevel !== null || plan.level === "free"} variant={plan.level === "vip" ? "premium" : "outline"} className="mt-7 w-full" onClick={() => { void handleUpgrade(plan.level); }}>{actionLevel === plan.level ? "更新中..." : current ? "当前等级" : plan.level === "enterprise" ? "模拟升级 Enterprise" : "模拟升级 VIP"}</Button></CardContent></Card>; })}</div></section>

    {message && <p role="status" className="text-center text-sm text-emerald-400">{message}</p>}{error && <p role="alert" className="text-center text-sm text-red-400">{error}</p>}
  </div>;
}
