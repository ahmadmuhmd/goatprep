-- GOATPrep Admin Center. Run once in the Neon SQL Editor (safe to re-run).
-- Adds page-view tracking for the visits numbers. No IP addresses are stored: each browser
-- gets a random id kept in its own localStorage.
create table if not exists public.site_visits(
 id bigint generated always as identity primary key,
 day date not null default current_date,
 visitor text not null check (char_length(visitor) between 8 and 64),
 path text not null check (char_length(path) <= 40),
 signed_in boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists site_visits_day_idx on public.site_visits(day);
create index if not exists site_visits_visitor_idx on public.site_visits(visitor, path, created_at desc);
alter table public.site_visits enable row level security;
revoke all on public.site_visits from public;
