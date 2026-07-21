-- Complements 202607200001_ai_match_analysis.sql with the structured analysis contract.
-- Run migrations in filename order. The legacy text columns remain for current UI compatibility.

alter table public.ai_match_analysis
  add column if not exists analysis jsonb,
  add column if not exists status text,
  add column if not exists version text;

update public.ai_match_analysis
set
  analysis = jsonb_build_object(
    'summary', summary,
    'match_trend', match_trend,
    'home_analysis', home_analysis,
    'away_analysis', away_analysis,
    'half_prediction', half_prediction,
    'score_prediction', score_prediction,
    'goal_prediction', goal_prediction,
    'risk_warning', risk_warning,
    'confidence', confidence
  ),
  status = coalesce(nullif(status, ''), 'completed'),
  version = coalesce(nullif(version, ''), coalesce(nullif(analysis_version, ''), 'v1'))
where analysis is null or status is null or version is null;

alter table public.ai_match_analysis
  alter column analysis set default '{}'::jsonb,
  alter column analysis set not null,
  alter column status set default 'completed',
  alter column status set not null,
  alter column version set default 'v1',
  alter column version set not null;

create unique index if not exists ai_match_analysis_match_id_unique_idx
  on public.ai_match_analysis (match_id);

create index if not exists ai_match_analysis_match_id_idx
  on public.ai_match_analysis (match_id);
