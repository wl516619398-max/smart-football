"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Chrome, LockKeyhole, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/user";

export function LoginCard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email && !email.includes("@")) {
      setError("请输入有效的邮箱地址");
      return;
    }
    login();
    router.push("/profile");
  }

  function handleDemoLogin() {
    login();
    router.push("/profile");
  }

  return <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-xl shadow-slate-950/20 sm:p-8"><div className="mb-7 text-center"><h1 className="text-2xl font-semibold text-white">登录 Project Athena</h1><p className="mt-2 text-sm text-slate-400">获取你的 AI 足球分析体验</p></div><form onSubmit={handleLogin} className="space-y-4"><label className="block"><span className="mb-2 block text-xs font-medium text-slate-400">邮箱</span><div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 focus-within:border-blue-500/60"><Mail className="h-4 w-4 text-slate-500" /><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="you@example.com" className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" /></div></label>{error && <p className="text-xs text-red-400">{error}</p>}<Button type="submit" className="w-full">登录</Button></form><div className="my-6 flex items-center gap-3 text-xs text-slate-600"><span className="h-px flex-1 bg-slate-800" />或<span className="h-px flex-1 bg-slate-800" /></div><div className="grid gap-3 sm:grid-cols-2"><Button type="button" variant="outline" onClick={handleDemoLogin}><Chrome className="mr-2 h-4 w-4" />Google 登录</Button><Button type="button" variant="outline" onClick={handleDemoLogin}><MessageCircle className="mr-2 h-4 w-4" />微信登录</Button></div><div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-600"><LockKeyhole className="h-3 w-3" />MVP 演示版本，不连接真实账号系统</div></div>;
}
