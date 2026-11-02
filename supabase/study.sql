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
revoke all on public.study_lessons from anon, authenticated;
grant select,insert,update,delete on public.study_lessons to service_role;
