-- GOATPrep November 2026 upgrade. Run once in the Neon SQL Editor (safe to re-run).
-- Adds: profile goals (Me tab), test resume position + pause, daily questions and answers.

alter table public.profiles add column if not exists display_name text check (char_length(display_name) <= 40);
alter table public.profiles add column if not exists grade text;
alter table public.profiles add column if not exists test_date date;
alter table public.profiles add column if not exists target_score integer check (target_score between 400 and 1600);
alter table public.profiles add column if not exists start_score integer check (start_score between 400 and 1600);
alter table public.profiles add column if not exists focus text check (focus in ('rw','math','both'));
alter table public.profiles add column if not exists onboarded_at timestamptz;

alter table public.attempts add column if not exists position integer not null default 0;
alter table public.attempts add column if not exists paused_remaining integer;

create table if not exists public.daily_questions(
 day_index integer not null check (day_index between 0 and 364),
 section text not null check (section in ('rw','math')),
 question_id text not null references public.goat_questions(id) on delete cascade,
 primary key (day_index, section)
);
create table if not exists public.daily_answers(
 user_id uuid not null references public.profiles(id) on delete cascade,
 day date not null, section text not null check (section in ('rw','math')),
 question_id text not null, answer text not null, correct boolean not null,
 answered_at timestamptz not null default now(),
 primary key (user_id, day, section)
);
alter table public.daily_questions enable row level security;
alter table public.daily_answers enable row level security;

-- Pick 365 Reading & Writing + 365 Math questions at random from all 12 tests (scored questions only,
-- spread across domains). Re-running keeps existing picks; delete from daily_questions to reshuffle.
insert into public.daily_questions(day_index, section, question_id)
select (rn - 1) as day_index, section, id from (
 select id, case when module like 'rw%' then 'rw' else 'math' end as section,
        row_number() over (partition by (module like 'rw%') order by md5(id || 'goatprep-daily')) as rn
 from public.goat_questions where scored
) picked where rn <= 365
on conflict (day_index, section) do nothing;

revoke all on public.daily_questions, public.daily_answers from public;
