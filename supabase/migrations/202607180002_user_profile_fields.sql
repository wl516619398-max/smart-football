alter table public.users
  add column if not exists nickname text not null default 'Athena用户';

alter table public.users
  add column if not exists vip_level text not null default 'free';

update public.users
set vip_level = case when vip_status then 'vip' else 'free' end
where vip_level is null or vip_level = 'free';

alter table public.users
  drop constraint if exists users_vip_level_check;

alter table public.users
  add constraint users_vip_level_check check (vip_level in ('free', 'vip'));
