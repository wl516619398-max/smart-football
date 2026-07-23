-- Athena football collection layer. Additive migration; existing rows are preserved.

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
  home_logo text,
  away_logo text,
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
  add column if not exists home_logo text,
  add column if not exists away_logo text,
  add column if not exists created_at timestamptz default timezone('utc', now()),
  add column if not exists updated_at timestamptz default timezone('utc', now());

create unique index if not exists matches_external_id_collection_unique_idx on public.matches (external_id);
create index if not exists matches_collection_time_idx on public.matches (match_time);
create index if not exists matches_collection_league_idx on public.matches (league);

create table if not exists public.team_stats (
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

create index if not exists team_stats_league_idx on public.team_stats (league);

create table if not exists public.odds (
  match_id text primary key,
  home_odds numeric,
  draw_odds numeric,
  away_odds numeric,
  source text not null default 'mock',
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists odds_source_idx on public.odds (source);

alter table public.matches enable row level security;
alter table public.team_stats enable row level security;
alter table public.odds enable row level security;
