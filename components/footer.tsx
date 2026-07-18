import Link from "next/link";
import { BrainCircuit, Github, Twitter } from "lucide-react";

export function Footer() {
  return <footer className="border-t border-slate-800/80 bg-[#0B1120]"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"><div><Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-200"><BrainCircuit className="h-4 w-4 text-blue-400" />Project Athena</Link><p className="mt-2 text-xs text-slate-500">让每一场比赛，都有数据可依。</p></div><div className="flex items-center gap-5 text-xs text-slate-500"><Link href="/matches" className="hover:text-slate-300">比赛中心</Link><Link href="/ai" className="hover:text-slate-300">AI 实验室</Link><Link href="/vip" className="hover:text-slate-300">会员权益</Link><Github className="h-4 w-4 hover:text-slate-300" /><Twitter className="h-4 w-4 hover:text-slate-300" /></div></div></footer>;
}
