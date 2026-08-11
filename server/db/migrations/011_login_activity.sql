create table if not exists public.login_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  ip_address inet,
  user_agent text not null default '',
  device_label text not null default 'Unknown device',
  created_at timestamptz not null default now()
);

create index if not exists login_activity_created_at_idx on public.login_activity (created_at desc);
create index if not exists login_activity_user_created_at_idx on public.login_activity (user_id, created_at desc);
