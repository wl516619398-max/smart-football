"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { performanceData } from "@/data/mock-data";

export function PerformanceChart() {
  return <div className="h-[260px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={performanceData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}><CartesianGrid stroke="#1e293b" vertical={false} /><XAxis dataKey="match" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} /><Line type="monotone" dataKey="home" name="主队状态" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: "#2563EB", r: 3 }} /><Line type="monotone" dataKey="away" name="客队状态" stroke="#22C55E" strokeWidth={2.5} dot={{ fill: "#22C55E", r: 3 }} /></LineChart></ResponsiveContainer></div>;
}
