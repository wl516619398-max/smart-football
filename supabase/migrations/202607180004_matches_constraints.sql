alter table public.matches
  alter column match_time type timestamptz using match_time::timestamptz;

create unique index if not exists matches_external_id_unique_idx on public.matches (external_id);
create index if not exists matches_match_time_idx on public.matches (match_time);
create index if not exists matches_league_idx on public.matches (league);
