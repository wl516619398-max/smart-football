-- Stores completed fixtures used by recent-form and head-to-head analysis.
-- No mock rows are inserted by this migration.
alter table public.matches
  add column if not exists home_team_id text,
  add column if not exists away_team_id text;

create index if not exists matches_home_team_id_idx on public.matches (home_team_id);
create index if not exists matches_away_team_id_idx on public.matches (away_team_id);

create table if not exists public.football_match_history (
  external_id text primary key,
  provider text not null,
  league text,
  match_time timestamptz not null,
  status text,
  home_team_id text not null,
  home_team text not null,
  away_team_id text not null,
  away_team text not null,
  home_score integer not null,
  away_score integer not null,
  venue text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists football_match_history_home_team_idx
  on public.football_match_history (home_team_id, match_time desc);
create index if not exists football_match_history_away_team_idx
  on public.football_match_history (away_team_id, match_time desc);
create index if not exists football_match_history_pair_idx
  on public.football_match_history (home_team_id, away_team_id, match_time desc);
create index if not exists football_match_history_time_idx
  on public.football_match_history (match_time desc);

alter table public.football_match_history enable row level security;
