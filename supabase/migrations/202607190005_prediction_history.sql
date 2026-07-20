create table if not exists public.prediction_history (
  match_id text primary key,
  home_team text not null,
  away_team text not null,
  prediction text not null,
  confidence numeric(5, 2) not null default 0 check (confidence >= 0 and confidence <= 100),
  odds_value numeric(10, 4) not null default 0,
  final_result text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists prediction_history_created_at_idx
  on public.prediction_history (created_at desc);

alter table public.prediction_history enable row level security;
