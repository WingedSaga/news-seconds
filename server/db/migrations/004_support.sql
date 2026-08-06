-- Служба поддержки: обращения и переписка по ним.
-- Выполните один раз в SQL Editor проекта Supabase.

create table if not exists public.support_tickets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users (id) on delete set null,
  name       text        not null,
  email      text        not null,
  subject    text        not null,
  status     text        not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_status_idx on public.support_tickets (status, created_at desc);
create index if not exists support_tickets_user_idx on public.support_tickets (user_id, created_at desc);

create table if not exists public.support_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid        not null references public.support_tickets (id) on delete cascade,
  author_id   uuid        references public.users (id) on delete set null,
  author_name text        not null,
  from_staff  boolean     not null default false,
  text        text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists support_messages_ticket_idx on public.support_messages (ticket_id, created_at);

alter table public.support_tickets  enable row level security;
alter table public.support_messages enable row level security;

grant all privileges on public.support_tickets  to service_role;
grant all privileges on public.support_messages to service_role;
