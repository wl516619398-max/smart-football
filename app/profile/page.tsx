import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProfilePanel } from "@/components/user/ProfilePanel";

export const metadata: Metadata = {
  title: "个人中心 | Project Athena",
  description: "管理你的 Project Athena 用户信息、收藏比赛、浏览记录与会员权益。",
};

export default function ProfilePage() {
  return <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8"><Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"><ArrowLeft className="h-4 w-4" />返回首页</Link><ProfilePanel /></div>;
}
