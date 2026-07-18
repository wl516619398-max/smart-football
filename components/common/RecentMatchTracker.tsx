"use client";

import { useEffect } from "react";
import { saveRecentMatch } from "@/lib/user";

export function RecentMatchTracker({ matchId }: { matchId: string }) {
  useEffect(() => {
    saveRecentMatch(matchId);
  }, [matchId]);

  return null;
}
