create table if not exists public.ai_match_analysis (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  analysis_version text not null default 'v1',
  summary text not null,
  match_trend text not null,
  home_analysis text not null,
  away_analysis text not null,
  half_prediction text not null,
  score_prediction text not null,
  goal_prediction text not null,
  risk_warning text not null,
  confidence integer not null check (confidence between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists ai_match_analysis_match_id_unique_idx
  on public.ai_match_analysis (match_id);

create index if not exists ai_match_analysis_created_at_idx
  on public.ai_match_analysis (created_at desc);

alter table public.ai_match_analysis enable row level security;
