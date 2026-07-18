"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FAVORITES_CHANGED_EVENT, FAVORITES_STORAGE_KEY, getStoredIds } from "@/lib/user";

export function FavoriteButton({ matchId }: { matchId: string }) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    setFavorite(getStoredIds(FAVORITES_STORAGE_KEY).includes(matchId));
  }, [matchId]);

  function toggleFavorite() {
    const current = getStoredIds(FAVORITES_STORAGE_KEY);
    const next = current.includes(matchId) ? current.filter((item) => item !== matchId) : [...current, matchId];
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
    setFavorite(next.includes(matchId));
  }

  return <button type="button" aria-pressed={favorite} aria-label={favorite ? "取消收藏比赛" : "收藏比赛"} onClick={toggleFavorite} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors", favorite ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-amber-500/30 hover:text-amber-300")}><Star className={cn("h-3.5 w-3.5", favorite && "fill-current")} />{favorite ? "★ 已收藏" : "☆ 收藏"}</button>;
}
