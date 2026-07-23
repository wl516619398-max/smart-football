import type { Metadata } from "next";
import PredictPanel from "@/components/predict/PredictPanel";

export const metadata: Metadata = {
  title: "赛事预测 | Project Athena",
  description: "基于球队近期状态与攻防数据的规则模型预测。",
};

export default function PredictPage() {
  return <PredictPanel />;
}
