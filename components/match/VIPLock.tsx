import Link from "next/link";
import { Check, LockKeyhole, Sparkles } from "lucide-react";
import type { CommercialMatchData } from "@/types/match";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function VIPLock({ features }: { features: CommercialMatchData["vipFeatures"] }) {
  return <Card className="overflow-hidden border-amber-500/25 bg-gradient-to-br from-amber-950/30 to-[#111827]"><CardContent className="relative p-6 sm:p-8"><div className="absolute right-6 top-6 rounded-full border border-amber-400/20 bg-amber-500/10 p-3 text-amber-300"><LockKeyhole className="h-5 w-5" /></div><Sparkles className="h-6 w-6 text-amber-300" /><h2 className="mt-4 text-xl font-bold text-white">🔒 VIP高级模型</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">解锁更完整的比赛模型与历史数据，让每一次赛前判断都更有依据。</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{features.map((feature) => <div key={feature} className="flex items-center gap-2 text-sm text-slate-300"><Check className="h-4 w-4 shrink-0 text-amber-300" />{feature}</div>)}</div><Button asChild className="mt-6 bg-amber-500 text-slate-950 hover:bg-amber-400"><Link href="/vip">立即升级VIP</Link></Button></CardContent></Card>;
}
