import { ArrowUpRight, WalletCards } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function FundsDirection() {
  return <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-[#111827]"><CardContent className="p-5"><div className="flex items-center gap-2 text-xs font-medium text-amber-300"><WalletCards className="h-4 w-4" />市场关注方向</div><p className="mt-3 text-sm font-semibold text-white">市场数据变化偏向主队</p><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-lg bg-slate-950/40 p-3"><p className="text-[11px] text-slate-500">主队关注度</p><p className="mt-1 text-lg font-semibold text-green-300">58%</p></div><div className="rounded-lg bg-slate-950/40 p-3"><p className="text-[11px] text-slate-500">客队关注度</p><p className="mt-1 text-lg font-semibold text-slate-300">42%</p></div></div><p className="mt-3 flex items-center gap-1 text-xs text-slate-500">模拟市场数据模型信号 <ArrowUpRight className="h-3.5 w-3.5 text-green-400" /></p></CardContent></Card>;
}
