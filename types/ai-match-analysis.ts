export type AiReportLevel = "standard" | "vip";

export type AiMatchAnalysisContent = {
  summary: string;
  match_background: string;
  strength_analysis: string;
  recent_form_analysis: string;
  head_to_head_analysis: string;
  key_player_analysis: string;
  tactical_analysis: string;
  result_reasoning: string;
  match_trend: string;
  home_analysis: string;
  away_analysis: string;
  half_prediction: string;
  score_prediction: string;
  goal_prediction: string;
  risk_warning: string;
  odds_value_analysis: string;
  confidence: number;
  report_level: AiReportLevel;
};

export type AiMatchAnalysisContext = {
  recentForm: unknown;
  homeAwayPerformance: unknown;
  metrics: unknown;
  xG: unknown;
  headToHead: unknown;
  oddsMovement: unknown;
  injuries: unknown;
};

export type AiMatchAnalysis = AiMatchAnalysisContent & {
  id: string;
  match_id: string;
  analysis_version: string;
  analysis: AiMatchAnalysisContent;
  status: string;
  version: string;
  created_at: string;
  updated_at: string;
};

/**
 * A persisted row may predate the detailed report fields. The migration adds
 * them as nullable columns so existing records remain readable.
 */
export type AiMatchAnalysisRow = Omit<AiMatchAnalysis, keyof AiMatchAnalysisContent | "analysis"> &
  Partial<AiMatchAnalysisContent> & {
    analysis: Partial<AiMatchAnalysisContent>;
    summary: string;
    match_trend: string;
    home_analysis: string;
    away_analysis: string;
    half_prediction: string;
    score_prediction: string;
    goal_prediction: string;
    risk_warning: string;
    confidence: number;
  };

export type AiMatchAnalysisInput = {
  match: {
    id: string;
    league: string;
    homeTeam: string;
    awayTeam: string;
    matchTime: string;
  };
  matchData?: AiMatchAnalysisContext;
  homeTeamData: unknown;
  awayTeamData: unknown;
  odds: unknown;
  reportLevel?: AiReportLevel;
};
