-- Project Athena: future test fixtures for the matches API.
-- This migration only upserts rows whose external_id starts with athena-test-
-- and does not alter the existing public.matches schema or remove data.

with seed_matches(
  external_id,
  league,
  home_team,
  away_team,
  day_offset,
  kickoff_time,
  home_win,
  draw,
  away_win,
  ai_score,
  ai_pick,
  risk_level
) as (
  values
    ('athena-test-match-20260725', '英超', '阿森纳', '切尔西', 1, time '19:30', 48, 27, 25, 84, '主队方向', '中'),
    ('athena-test-match-20260726', '西甲', '皇家马德里', '巴塞罗那', 2, time '03:00', 42, 28, 30, 81, '主队方向', '高'),
    ('athena-test-match-20260727', '德甲', '拜仁慕尼黑', '多特蒙德', 3, time '21:30', 57, 23, 20, 87, '主队方向', '低'),
    ('athena-test-match-20260728', '意甲', '国际米兰', 'AC米兰', 4, time '20:45', 45, 30, 25, 79, '主队方向', '中'),
    ('athena-test-match-20260729', '欧冠', '曼彻斯特城', '利物浦', 5, time '03:00', 39, 29, 32, 76, '客队方向', '高'),
    ('athena-test-match-20260730', '英超', '曼联', '托特纳姆热刺', 6, time '20:00', 44, 26, 30, 78, '主队方向', '高'),
    ('athena-test-match-20260731', '西甲', '马德里竞技', '塞维利亚', 7, time '23:00', 51, 29, 20, 83, '主队方向', '中'),
    ('athena-test-match-20260801', '德甲', '勒沃库森', '莱比锡', 8, time '21:30', 46, 28, 26, 80, '主队方向', '中'),
    ('athena-test-match-20260802', '欧冠', '巴黎圣日耳曼', '国际米兰', 9, time '03:00', 43, 27, 30, 77, '主队方向', '高'),
    ('athena-test-match-20260803', '英超', '纽卡斯尔联', '阿斯顿维拉', 10, time '22:00', 41, 30, 29, 74, '主队方向', '高')
), prepared as (
  select
    seed.*,
    (
      (
        (now() at time zone 'Asia/Shanghai')::date
        + seed.day_offset
        + seed.kickoff_time
      ) at time zone 'Asia/Shanghai'
    ) as match_time
  from seed_matches as seed
)
insert into public.matches (
  external_id,
  league,
  home_team,
  away_team,
  match_time,
  status,
  home_win,
  draw,
  away_win,
  ai_score,
  ai_pick,
  risk_level,
  updated_at
)
select
  external_id,
  league,
  home_team,
  away_team,
  match_time,
  'scheduled',
  home_win,
  draw,
  away_win,
  ai_score,
  ai_pick,
  risk_level,
  now()
from prepared
on conflict (external_id) do update set
  league = excluded.league,
  home_team = excluded.home_team,
  away_team = excluded.away_team,
  match_time = excluded.match_time,
  status = excluded.status,
  home_win = excluded.home_win,
  draw = excluded.draw,
  away_win = excluded.away_win,
  ai_score = excluded.ai_score,
  ai_pick = excluded.ai_pick,
  risk_level = excluded.risk_level,
  updated_at = now();
