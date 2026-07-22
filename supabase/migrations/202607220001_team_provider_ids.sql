create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  canonical_name text not null unique,
  football_data_id text,
  thesportsdb_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.teams
  add column if not exists football_data_id text,
  add column if not exists thesportsdb_id text,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists teams_football_data_id_unique
  on public.teams (football_data_id)
  where football_data_id is not null;

create unique index if not exists teams_thesportsdb_id_unique
  on public.teams (thesportsdb_id)
  where thesportsdb_id is not null;

insert into public.teams (name, canonical_name, football_data_id, thesportsdb_id)
values
  ('Arsenal', 'arsenal', '42', '133604'),
  ('Coventry City', 'coventry city', null, '133625')
on conflict (canonical_name) do update set
  name = excluded.name,
  football_data_id = coalesce(excluded.football_data_id, public.teams.football_data_id),
  thesportsdb_id = coalesce(excluded.thesportsdb_id, public.teams.thesportsdb_id),
  updated_at = timezone('utc', now());
