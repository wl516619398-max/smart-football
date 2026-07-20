alter table public.predictions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.predictions
  add column if not exists score text not null default '';

create index if not exists predictions_user_id_idx on public.predictions (user_id);
