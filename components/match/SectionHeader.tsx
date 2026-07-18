import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({ icon: Icon, eyebrow, title, description, className }: { icon?: LucideIcon; eyebrow?: string; title: string; description?: string; className?: string }) {
  return <div className={cn("mb-4", className)}>{eyebrow && <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-blue-400">{eyebrow}</p>}<div className="flex items-center gap-2">{Icon && <Icon className="h-4 w-4 text-blue-400" />}<h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2></div>{description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}</div>;
}
