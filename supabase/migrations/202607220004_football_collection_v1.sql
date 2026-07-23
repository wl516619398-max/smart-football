-- Project Athena football data collection V1.
-- Additive migration: existing tables and rows are preserved.

create table if not exists public.matches (
  external_id text primary key,
  league text not null,
  home_team_id text,
  home_team text not null,
  away_team_id text,
  away_team text not null,
  match_time timestamptz not null,
  status text not null default 'scheduled',
  venue text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.matches
  add column if not exists league text,
  add column if not exists home_team_id text,
  add column if not exists home_team text,
  add column if not exists away_team_id text,
  add column if not exists away_team text,
  add column if not exists match_time timestamptz,
  add column if not exists status text default 'scheduled',
  add column if not exists venue text,
  add column if not exists created_at timestamptz default timezone('utc', now()),
  add column if not exists updated_at timestamptz default timezone('utc', now());

create unique index if not exists matches_collection_external_id_idx on public.matches (external_id);
create index if not exists matches_collection_match_time_idx on public.matches (match_time);
create index if not exists matches_collection_league_idx on public.matches (league);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  canonical_name text not null unique,
  league text,
  logo text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.teams
  add column if not exists league text,
  add column if not exists logo text,
  add column if not exists updated_at timestamptz default timezone('utc', now());

create index if not exists teams_collection_league_idx on public.teams (league);

create table if not exists public.team_statistics (
  team_id text primary key,
  team_name text not null,
  league text,
  attack numeric not null default 50,
  defense numeric not null default 50,
  form numeric not null default 50,
  home_advantage numeric not null default 50,
  possession numeric not null default 50,
  goals_for numeric not null default 0,
  goals_against numeric not null default 0,
  xg numeric not null default 0,
  rank integer,
  points integer,
  recent_form jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists team_statistics_league_idx on public.team_statistics (league);

create table if not exists public.odds (
  match_id text primary key,
  home_odds numeric,
  draw_odds numeric,
  away_odds numeric,
  source text not null default 'mock',
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.match_history (
  external_id text primary key,
  league text,
  home_team_id text not null,
  home_team text not null,
  away_team_id text not null,
  away_team text not null,
  home_score integer,
  away_score integer,
  match_time timestamptz not null,
  status text not null default 'finished',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists match_history_home_team_idx on public.match_history (home_team_id, match_time desc);
create index if not exists match_history_away_team_idx on public.match_history (away_team_id, match_time desc);

create table if not exists public.collection_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mock',
  entity text not null,
  status text not null,
  fetched_count integer not null default 0,
  inserted_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists collection_logs_created_at_idx on public.collection_logs (created_at desc);

alter table public.matches enable row level security;
alter table public.teams enable row level security;
alter table public.team_statistics enable row level security;
alter table public.odds enable row level security;
alter table public.match_history enable row level security;
alter table public.collection_logs enable row level security;
