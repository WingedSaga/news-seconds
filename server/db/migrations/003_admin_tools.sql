-- Журнал действий администраторов и новые настройки сайта.
-- Выполните один раз в SQL Editor проекта Supabase.

create table if not exists public.admin_actions (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.users (id) on delete set null,
  actor_name  text        not null,
  action      text        not null,
  target_type text,
  target_id   text,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists admin_actions_created_at_idx on public.admin_actions (created_at desc);

alter table public.admin_actions enable row level security;
grant all privileges on public.admin_actions to service_role;

insert into public.settings (key, value) values
  ('maintenance_mode', 'false'::jsonb),
  ('site_title',       '"НОВОСТИ СЕКУНДЫ"'::jsonb)
on conflict (key) do nothing;
