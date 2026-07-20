import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MatchNotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-140px)] max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-[#111827] text-slate-500"><SearchX className="h-6 w-6" /></div>
      <h1 className="mt-5 text-2xl font-semibold text-white">比赛不存在</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">没有找到对应的比赛数据，请返回比赛列表重新选择。</p>
      <Button asChild variant="outline" className="mt-6"><Link href="/matches"><ArrowLeft className="mr-2 h-4 w-4" />返回比赛列表</Link></Button>
    </main>
  );
}
