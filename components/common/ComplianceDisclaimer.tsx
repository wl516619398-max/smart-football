export const PLATFORM_DISCLAIMER = "本平台仅提供足球赛事数据整理、概率模型与信息分析，不提供彩票销售、代购、下注或资金交易服务。页面中的概率、比分和赛事观点均为模型估算，不代表确定结果，也不构成任何购买、投资或收益承诺。请理性看待赛事不确定性，未成年人请勿参与任何彩票或博彩活动。";

export function ComplianceDisclaimer({ className = "" }: { className?: string }) {
  return <p className={["text-[11px] leading-5 text-slate-500", className].filter(Boolean).join(" ")}>{PLATFORM_DISCLAIMER}</p>;
}
