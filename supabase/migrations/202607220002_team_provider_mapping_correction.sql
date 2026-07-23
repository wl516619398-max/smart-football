begin;

-- football_match_history is intentionally untouched. The value 62 belongs to
-- Sheffield Utd in API-Football, not Coventry City.
update public.teams
set football_data_id = null,
    updated_at = timezone('utc', now())
where canonical_name = 'coventry city'
  and football_data_id = '62';

-- Clear any other incorrect owner before assigning the unique API-Football ID.
update public.teams
set football_data_id = null,
    updated_at = timezone('utc', now())
where football_data_id = '62'
  and canonical_name <> 'sheffield utd';

insert into public.teams (name, canonical_name, football_data_id)
values ('Sheffield Utd', 'sheffield utd', '62')
on conflict (canonical_name) do update set
  name = excluded.name,
  football_data_id = excluded.football_data_id,
  updated_at = timezone('utc', now());

update public.teams
set football_data_id = '1346',
    updated_at = timezone('utc', now())
where canonical_name = 'coventry city';

create unique index if not exists teams_football_data_id_unique
  on public.teams (football_data_id)
  where football_data_id is not null;

commit;
