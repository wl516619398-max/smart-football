"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { DatabaseUser } from "@/lib/db/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { signOut as signOutAuth } from "@/lib/supabase/auth";
import { getUserStatus } from "@/lib/supabase/user-status";
import { USER_CHANGED_EVENT, type AthenaUser, getUser as getLocalUser, logout as logoutLocal } from "@/lib/user";
import { cn } from "@/lib/utils";

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [localUser, setLocalUser] = useState<AthenaUser | null>(null);
  const [profile, setProfile] = useState<DatabaseUser | null>(null);

  useEffect(() => {
    let mounted = true;
    const syncLocalUser = () => setLocalUser(getLocalUser());
    const syncAuthUser = async () => {
      const status = await getUserStatus();
      if (!mounted) return;
      setAuthUser(status.user);
      setProfile(status.profile);
    };

    void syncAuthUser();
    syncLocalUser();
    window.addEventListener(USER_CHANGED_EVENT, syncLocalUser);

    const supabase = getSupabaseBrowserClient();
    const subscription = supabase?.auth.onAuthStateChange(() => {
      void syncAuthUser();
    });

    return () => {
      mounted = false;
      window.removeEventListener(USER_CHANGED_EVENT, syncLocalUser);
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  const signedIn = Boolean(authUser || localUser);
  const name = profile?.username || profile?.nickname || localUser?.name || authUser?.user_metadata?.name || authUser?.email?.split("@")[0] || "Athena用户";
  const membershipLevel = profile?.membership_level ?? profile?.vip_level ?? localUser?.membership ?? "free";
  const membership = membershipLevel === "enterprise" ? "Athena Enterprise" : membershipLevel === "vip" ? "Athena VIP" : "普通会员";

  async function handleLogout() {
    await signOutAuth();
    logoutLocal();
    setAuthUser(null);
    setLocalUser(null);
    setProfile(null);
  }

  if (!signedIn) return <Link href="/login" className={cn("text-sm text-slate-400 hover:text-white", compact && "block rounded-lg border border-slate-700 px-3 py-3")}>登录</Link>;

  return (
    <div className={cn("flex items-center gap-2", compact && "justify-between rounded-lg border border-slate-700 px-3 py-3")}>
      <Link href="/profile" className="flex min-w-0 items-center gap-2 text-left hover:text-white">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/15 text-xs font-semibold text-blue-300">{name.slice(0, 1).toUpperCase()}</span>
        <span className="min-w-0"><span className="block max-w-[110px] truncate text-sm text-slate-200">{name}</span><span className="block text-[10px] text-amber-400">{membership}</span></span>
      </Link>
      <button type="button" aria-label="退出登录" onClick={() => { void handleLogout(); }} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-300"><LogOut className="h-4 w-4" /></button>
    </div>
  );
}
