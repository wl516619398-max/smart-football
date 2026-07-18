"use client";

import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { featured } from "@/data/matches";
import { MatchCard } from "@/components/match-card";
import { Card, CardContent } from "@/components/ui/card";
import { FAVORITES_CHANGED_EVENT, FAVORITES_STORAGE_KEY, getStoredIds } from "@/lib/user";

export function FavoritesPanel() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setFavoriteIds(getStoredIds(FAVORITES_STORAGE_KEY));
    sync();
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const matches = favoriteIds.map((id) => featured.find((match) => match.id === id)).filter((match): match is (typeof featured)[number] => Boolean(match));

  if (!matches.length) return <Card className="border-dashed border-slate-700 bg-[#111827]"><CardContent className="flex flex-col items-center p-10 text-center"><Heart className="h-8 w-8 text-slate-600" /><h1 className="mt-4 text-lg font-semibold text-white">你还没有收藏比赛。</h1><p className="mt-2 text-sm text-slate-500">在比赛详情页点击 ☆ 收藏，稍后可以从这里快速进入。</p><Link href="/matches" className="mt-6 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"><ArrowLeft className="h-4 w-4" />浏览比赛</Link></CardContent></Card>;

  return <div className="grid gap-5 lg:grid-cols-3">{matches.map((match) => <MatchCard key={match.id} match={match} />)}</div>;
}
