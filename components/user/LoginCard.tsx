"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/user";
import { signIn, signUp, syncProfile, syncUnverifiedUser } from "@/lib/supabase/auth";

type AuthMode = "signin" | "signup";

export function LoginCard() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.includes("@")) {
      setError("请输入有效的邮箱地址");
      return;
    }
    if (password.length < 6) {
      setError("密码至少需要 6 位");
      return;
    }

    setLoading(true);
    const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error.message || "认证失败，请稍后重试");
      return;
    }

    if (mode === "signup" && !result.data.session) {
      if (result.data.user) await syncUnverifiedUser(result.data.user, email.split("@")[0]);
      setMessage("注册成功，请检查邮箱并完成验证后登录");
      return;
    }

    login(undefined, email, result.data.user?.id);
    await syncProfile(email.split("@")[0]);
    router.push("/profile");
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-xl shadow-slate-950/20 sm:p-8">
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-semibold text-white">{mode === "signin" ? "登录 Project Athena" : "注册 Project Athena"}</h1>
        <p className="mt-2 text-sm text-slate-400">获取你的 AI 足球分析体验</p>
      </div>

      <div className="mb-5 grid grid-cols-2 rounded-lg bg-slate-900 p-1 text-xs">
        <button type="button" onClick={() => { setMode("signin"); setError(""); setMessage(""); }} className={mode === "signin" ? "rounded-md bg-slate-700 px-3 py-2 text-white" : "rounded-md px-3 py-2 text-slate-500 hover:text-slate-300"}>邮箱登录</button>
        <button type="button" onClick={() => { setMode("signup"); setError(""); setMessage(""); }} className={mode === "signup" ? "rounded-md bg-slate-700 px-3 py-2 text-white" : "rounded-md px-3 py-2 text-slate-500 hover:text-slate-300"}>邮箱注册</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-medium text-slate-400">邮箱</span>
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 focus-within:border-blue-500/60">
            <Mail className="h-4 w-4 text-slate-500" />
            <input type="email" required value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="you@example.com" className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
          </div>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-medium text-slate-400">密码</span>
          <input type="password" required minLength={6} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="至少 6 位密码" className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/60" />
        </label>
        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
        {message && <p role="status" className="text-xs text-green-400">{message}</p>}
        <Button type="submit" disabled={loading} className="w-full">{loading ? "处理中..." : mode === "signin" ? "登录" : "注册"}</Button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-600"><LockKeyhole className="h-3 w-3" />邮箱认证由 Supabase Auth 提供</div>
    </div>
  );
}
