-- Dashboard sync table. Safe to run more than once
-- (by hand in the SQL Editor and again by the GitHub integration).
-- One row per user holds the whole dashboard; `rev` goes up by one on every upload.

create table if not exists public.dashboards (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null,
  rev        bigint      not null default 1,
  updated_at timestamptz not null default now()
);

-- each signed-in user can read and write only their own row
alter table public.dashboards enable row level security;

drop policy if exists "own dashboard" on public.dashboards;
create policy "own dashboard" on public.dashboards
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- live updates: the other device hears about a change within a second
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'dashboards'
  ) then
    alter publication supabase_realtime add table public.dashboards;
  end if;
end $$;
