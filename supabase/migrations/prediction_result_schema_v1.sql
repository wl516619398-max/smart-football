-- Athena structured prediction result fields.
-- Additive migration: existing analysis rows and legacy columns are preserved.

alter table public.ai_match_analysis
  add column if not exists home_win_probability integer,
  add column if not exists draw_probability integer,
  add column if not exists away_win_probability integer,
  add column if not exists recommended_bet text,
  add column if not exists confidence_score integer,
  add column if not exists risk_level text,
  add column if not exists key_factors jsonb default '[]'::jsonb;

create index if not exists ai_match_analysis_risk_level_idx
  on public.ai_match_analysis (risk_level);
