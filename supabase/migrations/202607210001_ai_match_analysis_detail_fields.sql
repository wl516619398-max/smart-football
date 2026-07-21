-- Adds the detailed report fields required by the admin analysis generator.
-- These columns are nullable so existing ai_match_analysis rows remain valid.

alter table public.ai_match_analysis
  add column if not exists match_background text,
  add column if not exists strength_analysis text,
  add column if not exists recent_form_analysis text,
  add column if not exists tactical_analysis text,
  add column if not exists result_reasoning text,
  add column if not exists odds_value_analysis text;
