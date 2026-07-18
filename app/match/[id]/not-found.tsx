import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

const copy = {
  title: "\u6bd4\u8d5b\u4e0d\u5b58\u5728",
  description: "\u8fd9\u573a\u6bd4\u8d5b\u6682\u65f6\u4e0d\u5728 Mock \u6570\u636e\u4e2d\uff0c\u8bf7\u8fd4\u56de\u6bd4\u8d5b\u5217\u8868\u67e5\u770b\u53ef\u7528\u5206\u6790\u3002",
  back: "\u8fd4\u56de\u6bd4\u8d5b\u5217\u8868",
};

export default function MatchNotFound() {
  return <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-4 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-[#111827] text-slate-500"><SearchX className="h-6 w-6" /></div><h1 className="mt-5 text-2xl font-semibold text-white">{copy.title}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{copy.description}</p><Button asChild variant="outline" className="mt-6"><Link href="/matches"><ArrowLeft className="mr-2 h-4 w-4" />{copy.back}</Link></Button></div>;
}
