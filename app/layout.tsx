import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const legacyMetadata: Metadata = {
  title: "Project Athena - AI足球比赛分析平台",
  description: "足球数据分析与赛事信息平台，提供比赛概率模型、比分分析、球员数据、xG分析以及市场数据变化观察。",
  openGraph: {
    title: "Project Athena - AI足球比赛分析平台",
    description: "足球数据分析与赛事信息平台，提供比赛概率模型、比分分析、球员数据、xG分析以及市场数据变化观察。",
    type: "website",
    siteName: "Project Athena",
    locale: "zh_CN",
  },
};

export const metadata: Metadata = {
  ...legacyMetadata,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Project Athena｜AI足球赛事分析平台",
  description: "足球赛事数据整理、概率模型与AI赛前信息分析平台。",
  openGraph: {
    title: "Project Athena｜AI足球赛事分析平台",
    description: "足球赛事数据整理、概率模型与AI赛前信息分析平台。",
    type: "website",
    siteName: "Project Athena",
    locale: "zh_CN",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-[#0F172A]">
        <Header />
        <main className="min-h-[calc(100vh-140px)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
