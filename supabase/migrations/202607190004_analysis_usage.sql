create table if not exists public.analysis_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  count integer not null default 0 check (count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  constraint analysis_usage_user_date_unique unique (user_id, date)
);

create index if not exists analysis_usage_user_date_idx
  on public.analysis_usage (user_id, date);

alter table public.analysis_usage enable row level security;
