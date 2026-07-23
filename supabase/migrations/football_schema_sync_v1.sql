-- Project Athena football schema synchronization V1.
-- Safe and additive: no DELETE, DROP, TRUNCATE, or destructive ALTER operations.

create table if not exists public.matches (
  external_id text primary key,
  league text,
  home_team_id text,
  home_team text,
  away_team_id text,
  away_team text,
  match_time timestamptz,
  status text default 'scheduled',
  venue text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

alter table public.matches
  add column if not exists external_id text,
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

create unique index if not exists matches_external_id_schema_sync_idx on public.matches (external_id);
create index if not exists matches_match_time_schema_sync_idx on public.matches (match_time);
create index if not exists matches_league_schema_sync_idx on public.matches (league);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text,
  canonical_name text,
  league text,
  logo text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

alter table public.teams
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists name text,
  add column if not exists canonical_name text,
  add column if not exists league text,
  add column if not exists logo text,
  add column if not exists created_at timestamptz default timezone('utc', now()),
  add column if not exists updated_at timestamptz default timezone('utc', now());

create unique index if not exists teams_canonical_name_schema_sync_idx on public.teams (canonical_name);
create index if not exists teams_league_schema_sync_idx on public.teams (league);

create table if not exists public.team_statistics (
  team_id text primary key,
  team_name text,
  league text,
  attack numeric default 50,
  defense numeric default 50,
  form numeric default 50,
  home_advantage numeric default 50,
  possession numeric default 50,
  goals_for numeric default 0,
  goals_against numeric default 0,
  xg numeric default 0,
  rank integer,
  points integer,
  recent_form jsonb default '[]'::jsonb,
  updated_at timestamptz default timezone('utc', now())
);

alter table public.team_statistics
  add column if not exists team_id text,
  add column if not exists team_name text,
  add column if not exists league text,
  add column if not exists attack numeric default 50,
  add column if not exists defense numeric default 50,
  add column if not exists form numeric default 50,
  add column if not exists home_advantage numeric default 50,
  add column if not exists possession numeric default 50,
  add column if not exists goals_for numeric default 0,
  add column if not exists goals_against numeric default 0,
  add column if not exists xg numeric default 0,
  add column if not exists rank integer,
  add column if not exists points integer,
  add column if not exists recent_form jsonb default '[]'::jsonb,
  add column if not exists updated_at timestamptz default timezone('utc', now());

create unique index if not exists team_statistics_team_id_schema_sync_idx on public.team_statistics (team_id);

create table if not exists public.odds (
  match_id text primary key,
  home_odds numeric,
  draw_odds numeric,
  away_odds numeric,
  source text default 'mock',
  updated_at timestamptz default timezone('utc', now())
);

alter table public.odds
  add column if not exists match_id text,
  add column if not exists home_odds numeric,
  add column if not exists draw_odds numeric,
  add column if not exists away_odds numeric,
  add column if not exists source text default 'mock',
  add column if not exists updated_at timestamptz default timezone('utc', now());

create unique index if not exists odds_match_id_schema_sync_idx on public.odds (match_id);

create table if not exists public.match_history (
  external_id text primary key,
  league text,
  home_team_id text,
  home_team text,
  away_team_id text,
  away_team text,
  home_score integer,
  away_score integer,
  match_time timestamptz,
  status text default 'finished',
  created_at timestamptz default timezone('utc', now())
);

alter table public.match_history
  add column if not exists external_id text,
  add column if not exists league text,
  add column if not exists home_team_id text,
  add column if not exists home_team text,
  add column if not exists away_team_id text,
  add column if not exists away_team text,
  add column if not exists home_score integer,
  add column if not exists away_score integer,
  add column if not exists match_time timestamptz,
  add column if not exists status text default 'finished',
  add column if not exists created_at timestamptz default timezone('utc', now());

create unique index if not exists match_history_external_id_schema_sync_idx on public.match_history (external_id);
create index if not exists match_history_match_time_schema_sync_idx on public.match_history (match_time desc);

create table if not exists public.football_match_history (
  external_id text primary key,
  provider text,
  league text,
  match_time timestamptz,
  status text,
  home_team_id text,
  home_team text,
  away_team_id text,
  away_team text,
  home_score integer,
  away_score integer,
  venue text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

alter table public.football_match_history
  add column if not exists external_id text,
  add column if not exists provider text default 'mock',
  add column if not exists league text,
  add column if not exists match_time timestamptz,
  add column if not exists status text default 'finished',
  add column if not exists home_team_id text,
  add column if not exists home_team text,
  add column if not exists away_team_id text,
  add column if not exists away_team text,
  add column if not exists home_score integer,
  add column if not exists away_score integer,
  add column if not exists venue text,
  add column if not exists created_at timestamptz default timezone('utc', now()),
  add column if not exists updated_at timestamptz default timezone('utc', now());

create unique index if not exists football_match_history_external_id_schema_sync_idx on public.football_match_history (external_id);
create index if not exists football_match_history_match_time_schema_sync_idx on public.football_match_history (match_time desc);

create table if not exists public.collection_logs (
  id uuid primary key default gen_random_uuid(),
  provider text default 'mock',
  entity text,
  status text,
  fetched_count integer default 0,
  inserted_count integer default 0,
  error_message text,
  created_at timestamptz default timezone('utc', now())
);

alter table public.collection_logs
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists provider text default 'mock',
  add column if not exists entity text,
  add column if not exists status text,
  add column if not exists fetched_count integer default 0,
  add column if not exists inserted_count integer default 0,
  add column if not exists error_message text,
  add column if not exists created_at timestamptz default timezone('utc', now());

create index if not exists collection_logs_created_at_schema_sync_idx on public.collection_logs (created_at desc);

alter table public.matches enable row level security;
alter table public.teams enable row level security;
alter table public.team_statistics enable row level security;
alter table public.football_match_history enable row level security;
alter table public.odds enable row level security;
alter table public.match_history enable row level security;
alter table public.collection_logs enable row level security;
