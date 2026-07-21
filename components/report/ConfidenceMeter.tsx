"use client";

import { useEffect, useState } from "react";

export function ConfidenceMeter({ value, compact = false }: { value: number; compact?: boolean }) {
  const target = Math.min(100, Math.max(0, Math.round(value)));
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setCurrent(target), 80);
    return () => window.clearTimeout(timer);
  }, [target]);

  return <div className={compact ? "mt-2" : "mt-4"} aria-label={`AI可信度 ${target}%`}><div className="flex items-end justify-between gap-3"><span className={compact ? "text-xs text-slate-500" : "text-sm text-slate-400"}>AI可信度</span><span className={compact ? "text-2xl font-bold text-emerald-300" : "text-4xl font-black text-emerald-300"}>{current}%</span></div><div className={`${compact ? "mt-2 h-1.5" : "mt-3 h-2.5"} overflow-hidden rounded-full bg-slate-800`}><div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-[width] duration-1000 ease-out" style={{ width: `${current}%` }} /></div></div>;
}
