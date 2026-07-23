-- Athena standardized AI feature dataset.
-- Additive migration: existing tables and rows are preserved.

create table if not exists public.analysis_dataset (
  id uuid primary key default gen_random_uuid(),
  match_id text not null unique,
  league text,
  match_time timestamptz,
  home_team jsonb not null default '{}'::jsonb,
  away_team jsonb not null default '{}'::jsonb,
  home_team_stats jsonb not null default '{}'::jsonb,
  away_team_stats jsonb not null default '{}'::jsonb,
  recent_form jsonb not null default '{"home":[],"away":[]}'::jsonb,
  head_to_head jsonb not null default '{"matches":[],"home_wins":0,"draws":0,"away_wins":0}'::jsonb,
  odds jsonb not null default '{}'::jsonb,
  injuries jsonb not null default '[]'::jsonb,
  data_quality jsonb not null default '{"missing_fields":[],"source_tables":[]}'::jsonb,
  feature_version text not null default 'v1',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.analysis_dataset
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists match_id text,
  add column if not exists league text,
  add column if not exists match_time timestamptz,
  add column if not exists home_team jsonb default '{}'::jsonb,
  add column if not exists away_team jsonb default '{}'::jsonb,
  add column if not exists home_team_stats jsonb default '{}'::jsonb,
  add column if not exists away_team_stats jsonb default '{}'::jsonb,
  add column if not exists recent_form jsonb default '{"home":[],"away":[]}'::jsonb,
  add column if not exists head_to_head jsonb default '{"matches":[],"home_wins":0,"draws":0,"away_wins":0}'::jsonb,
  add column if not exists odds jsonb default '{}'::jsonb,
  add column if not exists injuries jsonb default '[]'::jsonb,
  add column if not exists data_quality jsonb default '{"missing_fields":[],"source_tables":[]}'::jsonb,
  add column if not exists feature_version text default 'v1',
  add column if not exists created_at timestamptz default timezone('utc', now()),
  add column if not exists updated_at timestamptz default timezone('utc', now());

create unique index if not exists analysis_dataset_match_id_idx on public.analysis_dataset (match_id);
create index if not exists analysis_dataset_match_time_idx on public.analysis_dataset (match_time);
create index if not exists analysis_dataset_league_idx on public.analysis_dataset (league);

alter table public.analysis_dataset enable row level security;
