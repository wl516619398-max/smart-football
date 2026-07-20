create table if not exists public.users (
  id text primary key,
  email text not null unique,
  vip_status boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.predictions (
  match_id text not null,
  prediction text not null,
  confidence numeric(5, 2) not null check (confidence >= 0 and confidence <= 100),
  result text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists predictions_match_id_idx on public.predictions (match_id);
create index if not exists predictions_created_at_idx on public.predictions (created_at desc);

alter table public.users enable row level security;
alter table public.predictions enable row level security;
