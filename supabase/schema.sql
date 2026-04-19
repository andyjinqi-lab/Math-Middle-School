create table if not exists public.math_attempts (
  id text primary key,
  user_id text not null,
  ts bigint not null,
  question_id text not null,
  textbook_id text not null,
  chapter_id text not null,
  correct boolean not null,
  selected integer,
  answer integer,
  difficulty text
);

create index if not exists idx_math_attempts_user_ts
  on public.math_attempts(user_id, ts);
