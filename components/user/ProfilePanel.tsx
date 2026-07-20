"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Crown, Heart, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { DatabaseUser, PredictionRecord } from "@/lib/db/types";
import { getPredictionHistory, getProfile, getUser as getAuthUser, signOut as signOutAuth } from "@/lib/supabase/auth";
import { featured } from "@/data/matches";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { USER_CHANGED_EVENT, FAVORITES_CHANGED_EVENT, type AthenaUser, FAVORITES_STORAGE_KEY, RECENT_MATCHES_STORAGE_KEY, getStoredIds, getUser, logout } from "@/lib/user";

export function ProfilePanel() {
  const [user, setUser] = useState<AthenaUser | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<DatabaseUser | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    const sync = async () => {
      const local = getUser();
      const favorites = getStoredIds(FAVORITES_STORAGE_KEY);
      const recent = getStoredIds(RECENT_MATCHES_STORAGE_KEY);
      const auth = await getAuthUser();
      const [nextProfile, history] = auth ? await Promise.all([getProfile(), getPredictionHistory()]) : [null, []];
      if (!mounted) return;
      setUser(local);
      setAuthUser(auth);
      setProfile(nextProfile);
      setFavoriteIds(favorites);
      setRecentIds(recent);
      setPredictions(history);
    };

    const onUserChanged = () => { void sync(); };
    const onFavoritesChanged = () => { void sync(); };
    const onStorage = () => { void sync(); };
    void sync();
    window.addEventListener(USER_CHANGED_EVENT, onUserChanged);
    window.addEventListener(FAVORITES_CHANGED_EVENT, onFavoritesChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      mounted = false;
      window.removeEventListener(USER_CHANGED_EVENT, onUserChanged);
      window.removeEventListener(FAVORITES_CHANGED_EVENT, onFavoritesChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const hasAccount = Boolean(user || authUser);
  if (!hasAccount) {
    return <Card className="mx-auto max-w-xl border-slate-800 bg-[#111827]"><CardContent className="p-8 text-center"><p className="text-lg font-semibold text-white">登录后管理你的 Athena 账户</p><p className="mt-2 text-sm text-slate-500">收藏比赛、查看预测记录并管理会员权益。</p><Button asChild className="mt-6"><Link href="/login">前往登录</Link></Button></CardContent></Card>;
  }

  const favorites = favoriteIds.map((id) => featured.find((match) => match.id === id)).filter((match): match is (typeof featured)[number] => Boolean(match));
  const recent = recentIds.map((id) => featured.find((match) => match.id === id)).filter((match): match is (typeof featured)[number] => Boolean(match));
  const displayName = profile?.username || profile?.nickname || user?.name || authUser?.email?.split("@")[0] || "Athena用户";
  const membershipLevel = profile?.membership_level ?? profile?.vip_level ?? user?.membership ?? "free";
  const vip = membershipLevel !== "free";
  const membershipLabel = membershipLevel === "enterprise" ? "Athena Enterprise" : membershipLevel === "vip" ? "Athena VIP" : "普通会员";

  async function handleLogout() {
    await signOutAuth();
    logout();
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-blue-500/20 bg-gradient-to-br from-[#111827] via-[#111d3a] to-[#111827]">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/15 text-2xl font-semibold text-blue-300">{displayName.slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500">ATHENA ACCOUNT</p>
            <h1 className="mt-1 truncate text-2xl font-semibold text-white">{displayName}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">{vip ? <><Crown className="h-4 w-4 text-amber-400" />{membershipLabel}</> : <><ShieldCheck className="h-4 w-4 text-slate-500" />{membershipLabel}</>}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => { void handleLogout(); }}><LogOut className="mr-2 h-4 w-4" />退出登录</Button>
        </CardContent>
      </Card>

      <section>
        <div className="mb-4 flex items-end justify-between"><div><p className="text-xs text-blue-400">ATHENA SPACE</p><h2 className="mt-1 text-xl font-semibold text-white">功能入口</h2></div></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/favorites"><Card className="h-full transition-colors hover:border-blue-500/40"><CardContent className="p-5"><Heart className="h-5 w-5 text-pink-400" /><h3 className="mt-4 text-sm font-semibold text-white">收藏比赛</h3><p className="mt-1 text-xs text-slate-500">{favorites.length} 场已收藏</p></CardContent></Card></Link>
          <a href="#recent"><Card className="h-full transition-colors hover:border-blue-500/40"><CardContent className="p-5"><Clock3 className="h-5 w-5 text-blue-400" /><h3 className="mt-4 text-sm font-semibold text-white">浏览记录</h3><p className="mt-1 text-xs text-slate-500">最近浏览 {recent.length} 场</p></CardContent></Card></a>
          <Link href="/vip"><Card className="h-full transition-colors hover:border-blue-500/40"><CardContent className="p-5"><Sparkles className="h-5 w-5 text-amber-400" /><h3 className="mt-4 text-sm font-semibold text-white">会员权益</h3><p className="mt-1 flex items-center gap-1 text-xs text-slate-500">查看 VIP 方案 <ArrowRight className="h-3 w-3" /></p></CardContent></Card></Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between"><div><p className="text-xs text-blue-400">AI PREDICTIONS</p><h2 className="mt-1 text-xl font-semibold text-white">历史预测</h2></div><span className="text-xs text-slate-600">仅显示当前账户记录</span></div>
        <Card><CardContent className="divide-y divide-slate-800/80 p-0">{predictions.length ? predictions.map((item) => { const match = featured.find((entry) => entry.id === item.match_id); return <div key={`${item.match_id}-${item.created_at}`} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-200">{match ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : item.match_id}</p><p className="mt-1 text-xs text-slate-500">模型观点 {item.prediction} · 比分 {item.score} · 一致性 {item.confidence}%</p></div><span className="shrink-0 text-xs text-slate-600">{new Date(item.created_at).toLocaleDateString("zh-CN")}</span></div>; }) : <p className="p-6 text-center text-sm text-slate-500">还没有分析记录，去查看一场比赛的 AI 分析吧。</p>}</CardContent></Card>
      </section>

      <section id="recent">
        <div className="mb-4 flex items-end justify-between"><div><p className="text-xs text-slate-500">RECENT MATCHES</p><h2 className="mt-1 text-xl font-semibold text-white">最近浏览</h2></div><span className="text-xs text-slate-600">最多保留 5 场</span></div>
        <Card><CardContent className="divide-y divide-slate-800/80 p-0">{recent.length ? recent.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-900/50"><div><p className="text-sm font-medium text-slate-200">{match.homeTeam.name} vs {match.awayTeam.name}</p><p className="mt-1 text-xs text-slate-500">{match.league} · {match.date} {match.time}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-slate-600" /></Link>) : <p className="p-6 text-center text-sm text-slate-500">还没有浏览记录，去查看一场比赛吧。</p>}</CardContent></Card>
      </section>
    </div>
  );
}
