import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Home } from "lucide-react";
import { notFound } from "next/navigation";
import { getMatchById, matchDetails } from "@/data/matches";
import { AIAnalysis } from "@/components/match/AIAnalysis";
import { AIConclusion } from "@/components/match/AIConclusion";
import { HeadToHead } from "@/components/match/HeadToHead";
import { KeyPlayersSection } from "@/components/match/KeyPlayersSection";
import { LotteryAnalysis } from "@/components/match/LotteryAnalysis";
import { MatchHero } from "@/components/match/MatchHero";
import { MatchSidebar } from "@/components/match/MatchSidebar";
import { ProbabilitySection } from "@/components/match/ProbabilitySection";
import { RecentForm } from "@/components/match/RecentForm";
import { RiskAlert } from "@/components/match/RiskAlert";
import { ScorePrediction } from "@/components/match/ScorePrediction";
import { TeamComparison } from "@/components/match/TeamComparison";
import { RecentMatchTracker } from "@/components/common/RecentMatchTracker";

const copy = {
  home: "\u9996\u9875",
  matches: "\u6bd4\u8d5b",
  back: "\u8fd4\u56de\u6bd4\u8d5b\u5217\u8868",
  data: "\u6570\u636e\u66f4\u65b0\u4e8e",
  reference: "\u672c\u9875\u6240\u6709\u4f53\u5f69\u5185\u5bb9\u5747\u4ec5\u4f9b\u6570\u636e\u5206\u6790\u53c2\u8003\uff0cMock \u6570\u636e\u4e0d\u4ee3\u8868\u5b9e\u65f6\u4fe1\u606f\u3002",
};

export function generateStaticParams() {
  return matchDetails.map((match) => ({ id: match.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const match = getMatchById(id);
  if (!match) return { title: "\u6bd4\u8d5b\u4e0d\u5b58\u5728 | Project Athena" };
  return {
    title: match.home.name + " vs " + match.away.name + " AI\u5206\u6790\u3001\u80dc\u7387\u9884\u6d4b\u4e0e\u4f53\u5f69\u53c2\u8003 | Project Athena",
    description: "\u67e5\u770b" + match.home.name + "\u5bf9\u9635" + match.away.name + "\u7684 AI \u80dc\u7387\u9884\u6d4b\u3001\u6bd4\u5206\u9884\u6d4b\u3001\u5173\u952e\u7403\u5458\u5206\u6790\u3001xG \u6570\u636e\u3001\u5386\u53f2\u4ea4\u950b\u53ca\u4e2d\u56fd\u4f53\u5f69\u73a9\u6cd5\u5206\u6790\u53c2\u8003\u3002",
  };
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = getMatchById(id);
  if (!match) notFound();

  return <div className="grid-glow"><div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
      <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-slate-300"><Home className="h-3 w-3" />{copy.home}</Link>
      <ChevronRight className="h-3 w-3 text-slate-700" /><Link href="/matches" className="transition-colors hover:text-slate-300">{copy.matches}</Link>
      <ChevronRight className="h-3 w-3 text-slate-700" /><span className="text-slate-400">{match.league}</span>
      <ChevronRight className="h-3 w-3 text-slate-700" /><span className="text-slate-300">{match.home.name} vs {match.away.name}</span>
    </nav>
    <Link href="/matches" className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" />{copy.back}</Link>
    <RecentMatchTracker matchId={match.id} /><MatchHero match={match} />
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
      <main className="min-w-0 space-y-6 lg:col-span-8">
        <AIConclusion match={match} />
        <ProbabilitySection match={match} />
        <LotteryAnalysis match={match} />
        <ScorePrediction match={match} />
        <KeyPlayersSection match={match} />
        <AIAnalysis match={match} />
        <TeamComparison match={match} />
        <RecentForm match={match} />
        <HeadToHead match={match} />
        <RiskAlert match={match} />
      </main>
      <MatchSidebar match={match} />
    </div>
    <div className="mt-8 border-t border-slate-800/70 pt-5 text-center text-[11px] leading-5 text-slate-600"><p>{copy.data} {match.updatedAt} · {copy.reference}</p></div>
  </div></div>;
}
