create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text not null,
  membership_level text not null default 'free',
  created_at timestamptz not null default timezone('utc', now()),
  constraint profiles_membership_level_check
    check (membership_level in ('free', 'vip', 'enterprise'))
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_membership_level_idx on public.profiles (membership_level);

alter table public.profiles enable row level security;
