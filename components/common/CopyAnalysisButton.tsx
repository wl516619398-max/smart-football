"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyAnalysisButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyAnalysis() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = content;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const Icon = copied ? Check : Copy;
  return <div className="flex flex-wrap items-center gap-3"><Button type="button" variant="outline" size="sm" onClick={copyAnalysis}><Icon className="mr-2 h-3.5 w-3.5" />{copied ? "已复制" : "复制 AI 分析"}</Button>{copied && <span className="text-xs text-emerald-300" role="status" aria-live="polite">复制成功</span>}</div>;
}
