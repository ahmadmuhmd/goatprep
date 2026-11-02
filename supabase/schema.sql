-- Run in Supabase SQL Editor. Existing prototype questions remain untouched.
create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
create or replace function public.handle_goatprep_user() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id) values(new.id) on conflict do nothing; return new; end; $$;
drop trigger if exists on_goatprep_signup on auth.users;
create trigger on_goatprep_signup after insert on auth.users for each row execute procedure public.handle_goatprep_user();
insert into public.profiles(id) select id from auth.users on conflict do nothing;
create table if not exists public.tests(id text primary key,number integer not null unique,title text not null,published boolean not null default false);
create table if not exists public.goat_questions(
 id text primary key,test_id text not null references public.tests(id) on delete cascade,
 module text not null check(module in ('rw1','rw2easy','rw2hard','math1','math2easy','math2hard')),position integer not null,
 domain text not null,skill text not null,difficulty integer not null check(difficulty between 1 and 3),
 passage text not null default '',prompt text not null,options jsonb not null,answer jsonb not null,explanation text not null,
 scored boolean not null default true,unique(test_id,module,position)
);
create table if not exists public.attempts(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 test_id text not null references public.tests(id),stage integer not null default 0 check(stage between 0 and 5),
 route_rw text not null default 'easy',route_math text not null default 'easy',deadline timestamptz not null,
 responses jsonb not null default '{}',version integer not null default 0,rw_score integer,math_score integer,
 scoring_version text,completed_at timestamptz,created_at timestamptz not null default now()
);
create unique index if not exists one_active_attempt on public.attempts(user_id,test_id) where completed_at is null;
create table if not exists public.reviews(
 id uuid primary key default gen_random_uuid(),user_id uuid unique not null references auth.users(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 1 and 40),
 body text not null check(char_length(body) between 15 and 800),rating integer not null check(rating between 1 and 5),
 featured boolean not null default false,created_at timestamptz not null default now()
);
create table if not exists public.lesson_progress(user_id uuid not null references auth.users(id) on delete cascade,lesson_id text not null,completed_at timestamptz not null default now(),primary key(user_id,lesson_id));
create table if not exists public.jerry_usage(user_id uuid not null references auth.users(id) on delete cascade,day date not null default current_date,calls integer not null default 0,primary key(user_id,day));
create or replace function public.consume_jerry_quota(uid uuid,daily_limit integer) returns boolean language plpgsql security definer set search_path='' as $$
declare used integer;
begin
 insert into public.jerry_usage(user_id,day,calls) values(uid,current_date,1)
 on conflict(user_id,day) do update set calls=public.jerry_usage.calls+1 where public.jerry_usage.calls<daily_limit returning calls into used;
 return used is not null;
end; $$;
revoke all on function public.consume_jerry_quota(uuid,integer) from public,anon,authenticated;
grant execute on function public.consume_jerry_quota(uuid,integer) to service_role;
alter table public.profiles enable row level security;
alter table public.tests enable row level security;
alter table public.goat_questions enable row level security;
alter table public.attempts enable row level security;
alter table public.reviews enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.jerry_usage enable row level security;
-- No browser policies: Next.js routes authenticate users and enforce ownership.
