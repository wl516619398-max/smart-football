import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { FavoritesPanel } from "@/components/user/FavoritesPanel";

export const metadata: Metadata = {
  title: "收藏比赛 | Project Athena",
  description: "查看你收藏的 Project Athena AI 足球分析比赛。",
};

export default function FavoritesPage() {
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"><ArrowLeft className="h-4 w-4" />返回个人中心</Link><div className="mb-8 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400"><Heart className="h-5 w-5" /></div><div><p className="text-xs text-pink-400">MY COLLECTION</p><h1 className="mt-1 text-3xl font-semibold text-white">收藏比赛</h1></div></div><FavoritesPanel /></div>;
}
