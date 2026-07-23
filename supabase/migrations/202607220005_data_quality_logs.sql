create table if not exists public.data_quality_logs (
  id uuid primary key default gen_random_uuid(),
  data_type text not null,
  check_type text not null,
  severity text not null,
  message text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.data_quality_logs
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists data_type text,
  add column if not exists check_type text,
  add column if not exists severity text,
  add column if not exists message text,
  add column if not exists created_at timestamptz default timezone('utc', now());

create index if not exists data_quality_logs_created_at_idx on public.data_quality_logs (created_at desc);
create index if not exists data_quality_logs_type_idx on public.data_quality_logs (data_type, check_type);

alter table public.data_quality_logs enable row level security;
