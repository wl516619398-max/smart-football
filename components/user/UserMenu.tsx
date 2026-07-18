"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { USER_CHANGED_EVENT, AthenaUser, getUser, logout } from "@/lib/user";
import { cn } from "@/lib/utils";

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const [user, setUser] = useState<AthenaUser | null>(null);

  useEffect(() => {
    const syncUser = () => setUser(getUser());
    syncUser();
    window.addEventListener(USER_CHANGED_EVENT, syncUser);
    return () => window.removeEventListener(USER_CHANGED_EVENT, syncUser);
  }, []);

  if (!user) return <Link href="/login" className={cn("text-sm text-slate-400 hover:text-white", compact && "block rounded-lg border border-slate-700 px-3 py-3")}>登录</Link>;

  return <div className={cn("flex items-center gap-2", compact && "justify-between rounded-lg border border-slate-700 px-3 py-3")}><Link href="/profile" className="flex min-w-0 items-center gap-2 text-left hover:text-white"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/15 text-xs font-semibold text-blue-300">{user.avatar || user.name.slice(0, 1)}</span><span className="min-w-0"><span className="block max-w-[110px] truncate text-sm text-slate-200">{user.name}</span><span className="block text-[10px] text-amber-400">{user.membership === "vip" ? "Athena VIP" : "普通会员"}</span></span></Link><button type="button" aria-label="退出登录" onClick={logout} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-300"><LogOut className="h-4 w-4" /></button></div>;
}
