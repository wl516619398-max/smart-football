alter table public.predictions
  add column if not exists external_id text,
  add column if not exists analysis jsonb,
  add column if not exists model text,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.predictions
set external_id = match_id
where external_id is null and match_id is not null;

with duplicates as (
  select ctid,
    row_number() over (
      partition by external_id
      order by updated_at desc nulls last, created_at desc nulls last, ctid desc
    ) as row_number
  from public.predictions
  where external_id is not null
)
update public.predictions as predictions
set external_id = null
from duplicates
where predictions.ctid = duplicates.ctid
  and duplicates.row_number > 1;

create unique index if not exists predictions_external_id_unique_idx
  on public.predictions (external_id)
  where external_id is not null;

create index if not exists predictions_updated_at_idx
  on public.predictions (updated_at desc);
