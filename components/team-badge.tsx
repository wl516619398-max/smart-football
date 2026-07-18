import { cn } from "@/lib/utils";

export function TeamBadge({ name, shortName, color, size = "md" }: { name: string; shortName: string; color: string; size?: "sm" | "md" | "lg" }) {
  return <div className={cn("flex items-center justify-center rounded-full font-bold shadow-inner", size === "sm" ? "h-8 w-8 text-[9px]" : size === "lg" ? "h-16 w-16 text-xs" : "h-11 w-11 text-[10px]")} style={{ background: `linear-gradient(145deg, ${color}, #111827)`, boxShadow: `0 0 0 2px ${color}30` }} title={name}>{shortName.slice(0, 3)}</div>;
}
