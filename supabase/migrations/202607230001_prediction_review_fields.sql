-- Additive fields for AI prediction review and post-match evaluation.
alter table public.prediction_history
  add column if not exists match_time timestamptz,
  add column if not exists home_win_probability numeric(5, 2),
  add column if not exists draw_probability numeric(5, 2),
  add column if not exists away_win_probability numeric(5, 2),
  add column if not exists score_probabilities jsonb,
  add column if not exists goals_prediction text,
  add column if not exists risk_level text,
  add column if not exists actual_score text,
  add column if not exists actual_result text,
  add column if not exists prediction_hit boolean,
  add column if not exists goals_prediction_hit boolean,
  add column if not exists score_top3_hit boolean;

create index if not exists prediction_history_match_time_idx
  on public.prediction_history (match_time desc);
