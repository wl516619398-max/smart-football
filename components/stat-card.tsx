import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, detail, icon: Icon, trend = "up", accent = "blue" }: { label: string; value: string; detail: string; icon: LucideIcon; trend?: "up" | "down"; accent?: "blue" | "green" | "amber" }) {
  const colors = { blue: "bg-blue-500/10 text-blue-400", green: "bg-green-500/10 text-green-400", amber: "bg-amber-500/10 text-amber-400" };
  return <Card className="overflow-hidden"><CardContent className="relative p-5"><div className={cn("mb-4 flex h-9 w-9 items-center justify-center rounded-lg", colors[accent])}><Icon className="h-4 w-4" /></div><p className="text-xs text-slate-400">{label}</p><div className="mt-1 flex items-end justify-between gap-2"><p className="text-2xl font-semibold text-white">{value}</p><span className={cn("flex items-center text-xs", trend === "up" ? "text-green-400" : "text-red-400")}>{trend === "up" ? <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}{detail}</span></div><div className="absolute -right-4 -top-5 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl" /></CardContent></Card>;
}
