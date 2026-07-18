"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

type ShareStatus = "idle" | "copied" | "shared";

export function ShareButton() {
  const [status, setStatus] = useState<ShareStatus>("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
        setStatus("shared");
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("textarea");
        input.value = url;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      setStatus("copied");
    } catch {
      setStatus("idle");
    }
  }

  const StatusIcon = status === "copied" ? Check : Copy;
  return <><button type="button" onClick={share} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-400 transition-colors hover:border-blue-500/30 hover:text-blue-300"><Share2 className="h-3.5 w-3.5" />分享</button>{status !== "idle" && <div role="status" className="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-700 bg-[#111827] px-4 py-2 text-xs text-slate-200 shadow-xl"><StatusIcon className="h-3.5 w-3.5 text-green-400" />{status === "copied" ? "已复制" : "已分享"}</div>}</>;
}
