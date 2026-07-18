import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function VIPFeatureCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return <Card className="border-slate-800/80 bg-[#111827]"><CardContent className="p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><Icon className="h-5 w-5" /></div><h3 className="mt-4 text-sm font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{description}</p></CardContent></Card>;
}
