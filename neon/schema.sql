-- Run in the Neon SQL Editor using the database owner. Supabase is used only for Google Auth.
create table if not exists public.profiles(id uuid primary key,created_at timestamptz not null default now());
create table if not exists public.tests(id text primary key,number integer not null unique,title text not null,published boolean not null default false);
create table if not exists public.goat_questions(
 id text primary key,test_id text not null references public.tests(id) on delete cascade,
 module text not null check(module in ('rw1','rw2easy','rw2hard','math1','math2easy','math2hard')),position integer not null,
 domain text not null,skill text not null,difficulty integer not null check(difficulty between 1 and 3),
 passage text not null default '',prompt text not null,options jsonb not null,answer jsonb not null,explanation text not null,
 scored boolean not null default true,unique(test_id,module,position)
);
create table if not exists public.attempts(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 test_id text not null references public.tests(id),stage integer not null default 0 check(stage between 0 and 5),
 route_rw text not null default 'easy',route_math text not null default 'easy',deadline timestamptz not null,
 responses jsonb not null default '{}',version integer not null default 0,rw_score integer,math_score integer,
 scoring_version text,completed_at timestamptz,created_at timestamptz not null default now()
);
create unique index if not exists one_active_attempt on public.attempts(user_id,test_id) where completed_at is null;
create table if not exists public.reviews(
 id uuid primary key default gen_random_uuid(),user_id uuid unique not null references public.profiles(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 1 and 40),
 body text not null check(char_length(body) between 15 and 800),rating integer not null check(rating between 1 and 5),
 featured boolean not null default false,created_at timestamptz not null default now()
);
create table if not exists public.lesson_progress(user_id uuid not null references public.profiles(id) on delete cascade,lesson_id text not null,completed_at timestamptz not null default now(),primary key(user_id,lesson_id));
create table if not exists public.jerry_usage(user_id uuid not null references public.profiles(id) on delete cascade,day date not null default current_date,calls integer not null default 0,primary key(user_id,day));
create or replace function public.consume_jerry_quota(uid uuid,daily_limit integer) returns boolean language plpgsql security definer set search_path='' as $$
declare used integer;
begin
 insert into public.jerry_usage(user_id,day,calls) values(uid,current_date,1)
 on conflict(user_id,day) do update set calls=public.jerry_usage.calls+1 where public.jerry_usage.calls<daily_limit returning calls into used;
 return used is not null;
end; $$;
revoke all on function public.consume_jerry_quota(uuid,integer) from public;
alter table public.profiles enable row level security;
alter table public.tests enable row level security;
alter table public.goat_questions enable row level security;
alter table public.attempts enable row level security;
alter table public.reviews enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.jerry_usage enable row level security;
-- No browser policies: Next.js routes authenticate users and enforce ownership.

-- Run AFTER schema.sql. Generated sources remain private; only published payloads
-- are served by /api/lessons. Browser clients cannot publish lessons.
create table if not exists public.study_lessons (
 id text primary key check(id ~ '^resource-[a-z0-9-]+$'),
 payload jsonb not null check(jsonb_typeof(payload)='object' and payload->>'id'=id),
 provenance jsonb not null default '[]'::jsonb,
 published boolean not null default false,
 sort_order integer not null default 0,
 updated_at timestamptz not null default now()
);
alter table public.study_lessons enable row level security;

-- Run after schema.sql. Atomic publication: either every question is saved or nothing changes.
create or replace function public.publish_goat_test(test_id_value text,test_number integer,question_bank jsonb,make_public boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
 if jsonb_array_length(question_bank)<>147 then raise exception 'Expected 147 questions'; end if;
 if test_id_value <> 'test-' || test_number::text or test_number not between 1 and 18 then raise exception 'Invalid test identifier'; end if;
 insert into public.tests(id,number,title,published) values(test_id_value,test_number,'Practice Test '||test_number,false)
 on conflict(id) do nothing;
 perform 1 from public.tests where id=test_id_value for update;
 if exists(select 1 from public.attempts where test_id=test_id_value) then raise exception 'Cannot modify a test with student attempts'; end if;
 if exists(select 1 from jsonb_array_elements(question_bank) q where q->>'test_id'<>test_id_value) then raise exception 'Mixed test IDs'; end if;
 delete from public.goat_questions where test_id=test_id_value;
 insert into public.goat_questions
 select * from jsonb_populate_recordset(null::public.goat_questions,question_bank);
 if exists(select 1 from public.goat_questions where test_id=test_id_value group by module having count(*)<>case when module like 'rw%' then 27 else 22 end)
 or (select count(distinct module) from public.goat_questions where test_id=test_id_value)<>6 then raise exception 'Invalid module sizes'; end if;
 update public.tests set published=make_public where id=test_id_value;
end; $$;
revoke all on function public.publish_goat_test(text,integer,jsonb,boolean) from public;
revoke all on all tables in schema public from public;
