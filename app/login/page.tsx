import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import { LoginCard } from "@/components/user/LoginCard";

export const metadata: Metadata = {
  title: "登录 Project Athena",
  description: "登录 Project Athena，获取你的 AI 足球分析体验。",
};

export default function LoginPage() {
  return <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12"><div className="w-full max-w-md"><Link href="/" className="mb-8 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-white"><ArrowLeft className="h-4 w-4" />返回首页</Link><div className="mb-6 flex items-center justify-center gap-2 text-sm font-semibold text-white"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-glow"><BrainCircuit className="h-4 w-4" /></span>Project <span className="text-blue-400">Athena</span></div><LoginCard /></div></div>;
}
