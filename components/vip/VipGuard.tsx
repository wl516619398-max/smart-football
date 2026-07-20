"use client";

import { useEffect, useState } from "react";
import type { CommercialMatchData } from "@/types/match";
import type { DatabaseUser } from "@/lib/db/types";
import { getProfile, getUser as getAuthUser, upgradeProfile } from "@/lib/supabase/auth";
import { USER_CHANGED_EVENT, getUser as getLocalUser, upgradeVip } from "@/lib/user";
import { isVip } from "@/lib/vip";
import { VIPLock } from "@/components/match/VIPLock";

type VipGuardProps = {
  children: React.ReactNode;
  features: CommercialMatchData["vipFeatures"];
};

export function VipGuard({ children, features }: VipGuardProps) {
  const [profile, setProfile] = useState<DatabaseUser | null>(null);
  const [localUser, setLocalUser] = useState(getLocalUser());
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const local = getLocalUser();
      const authUser = await getAuthUser();
      const nextProfile = authUser ? await getProfile() : null;
      if (!mounted) return;
      setLocalUser(local);
      setProfile(nextProfile);
      setLoading(false);
    };

    const onUserChanged = () => { void refresh(); };
    void refresh();
    window.addEventListener(USER_CHANGED_EVENT, onUserChanged);
    return () => {
      mounted = false;
      window.removeEventListener(USER_CHANGED_EVENT, onUserChanged);
    };
  }, []);

  async function handleUpgrade() {
    setError("");
    setMessage("");
    setUpgrading(true);
    const authUser = await getAuthUser();

    if (authUser) {
      const updatedProfile = await upgradeProfile();
      if (!updatedProfile || !isVip(updatedProfile)) {
        setError("VIP升级失败，请先执行数据库迁移并重试");
        setUpgrading(false);
        return;
      }
      setProfile(updatedProfile);
    }

    const updatedLocalUser = upgradeVip();
    setLocalUser(updatedLocalUser);
    setMessage("升级成功，VIP分析内容已解锁");
    setUpgrading(false);
  }

  if (loading) return <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6 text-sm text-slate-500">正在加载会员权限...</div>;

  const fallbackUser = localUser ? { vip_level: localUser.membership } : null;
  if (isVip(profile ?? fallbackUser)) return <>{children}</>;

  return <div><VIPLock features={features} onUpgrade={() => { void handleUpgrade(); }} upgrading={upgrading} />{message && <p role="status" className="mt-3 text-sm text-green-400">{message}</p>}{error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}</div>;
}
