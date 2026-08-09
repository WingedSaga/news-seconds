-- Причина отклонения видна только автору через API его собственных материалов.
alter table public.articles
  add column if not exists moderation_note text,
  add column if not exists moderated_at timestamptz;

create table if not exists public.content_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users (id) on delete cascade,
  target_type text not null check (target_type in ('article', 'comment')),
  target_id   uuid not null,
  reason      text,
  created_at  timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

create index if not exists content_reports_created_at_idx on public.content_reports (created_at desc);
