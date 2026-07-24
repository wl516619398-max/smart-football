-- Records each football API/cache synchronization run.
-- Additive migration: existing tables and rows are preserved.

create table if not exists public.api_sync_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  sync_type text not null default 'matches',
  status text not null default 'running',
  window_start timestamptz,
  window_end timestamptz,
  fetched_count integer not null default 0,
  upserted_count integer not null default 0,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists api_sync_logs_started_at_idx
  on public.api_sync_logs (started_at desc);

create index if not exists api_sync_logs_provider_status_idx
  on public.api_sync_logs (provider, status);

alter table public.api_sync_logs enable row level security;
