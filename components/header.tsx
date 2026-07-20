"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, Menu, X, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user/UserMenu";
import { cn } from "@/lib/utils";

const navItems = [{ href: "/", label: "首页" }, { href: "/matches", label: "比赛" }, { href: "/recommend", label: "AI分析", icon: Zap }, { href: "/leagues", label: "联赛" }, { href: "/players", label: "球员" }, { href: "/vip", label: "VIP会员" }];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0F172A]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-glow"><BrainCircuit className="h-5 w-5 text-white" /></span>
          <span className="text-base font-semibold tracking-tight text-white">Project <span className="text-blue-400">Athena</span></span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors", active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/60 hover:text-white")}>{Icon && <Icon className="h-3.5 w-3.5" />}{item.label}</Link>;
          })}
        </nav>
        <div className="hidden items-center gap-3 md:flex"><UserMenu /><Button asChild size="sm"><Link href="/vip">查看 VIP</Link></Button></div>
        <button aria-label="打开菜单" className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 md:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="border-t border-slate-800 bg-[#0F172A] px-4 pb-4 md:hidden"><nav className="flex flex-col gap-1 pt-3">{navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-slate-800">{item.label}</Link>)}<div className="mt-2"><UserMenu compact /></div></nav></div>}
    </header>
  );
}
