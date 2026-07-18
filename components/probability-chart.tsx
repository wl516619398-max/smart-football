"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { probabilityData } from "@/data/mock-data";

export function ProbabilityChart({ data = probabilityData }: { data?: { name: string; value: number; fill: string }[] }) {
  return <div className="relative h-[190px] w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={4} stroke="none">{data.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}</Pie><Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} itemStyle={{ color: "#e2e8f0" }} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold text-white">AI</span><span className="text-[10px] text-slate-500">预测模型</span></div></div>;
}
