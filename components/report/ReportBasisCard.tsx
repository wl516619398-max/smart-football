import { Activity, Home, Shield, Swords } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BasisItem = { label: string; weight: number; value: number | null; description: string; icon: "form" | "attack" | "defense" | "home" };

function iconFor(icon: BasisItem["icon"]) { return icon === "form" ? Activity : icon === "attack" ? Swords : icon === "defense" ? Shield : Home; }

export function ReportBasisCard({ items }: { items: BasisItem[] }) {
  return <Card className="border-slate-800 bg-[#111827]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><Swords className="h-4 w-4 text-blue-300" />AI分析依据</CardTitle><p className="text-xs leading-5 text-slate-500">Athena 根据多维度数据加权形成模型观点，权重会随数据完整度进行校验。</p></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{items.map((item) => { const Icon = iconFor(item.icon); const available = item.value !== null; return <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><span className="rounded-lg bg-blue-500/10 p-2 text-blue-300"><Icon className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-white">{item.label}</p><p className="mt-1 text-[11px] text-slate-500">模型权重 {item.weight}%</p></div></div><span className="text-lg font-bold text-blue-200">{available ? item.value : "--"}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${available ? item.value : 0}%` }} /></div><p className="mt-3 text-xs leading-5 text-slate-500">{available ? item.description : "数据同步中，暂不生成评分"}</p></div>; })}</CardContent></Card>;
}
