-- Structured fields used by the post-sync match analysis generator.
-- Additive only: existing analysis rows and legacy report columns are preserved.

alter table public.ai_match_analysis
  add column if not exists prediction jsonb,
  add column if not exists risk_factors jsonb default '[]'::jsonb;

create index if not exists ai_match_analysis_status_idx
  on public.ai_match_analysis (status);
