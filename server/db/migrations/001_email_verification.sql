-- Миграция для баз, созданных до появления подтверждения почты.
-- Выполните один раз в SQL Editor проекта Supabase.
-- Для новой базы ничего запускать не нужно: всё уже есть в schema.sql.

alter table public.users add column if not exists email_verified          boolean not null default false;
alter table public.users add column if not exists verification_token_hash text;
alter table public.users add column if not exists verification_expires_at timestamptz;
alter table public.users add column if not exists verification_sent_at    timestamptz;

create index if not exists users_verification_token_idx on public.users (verification_token_hash);

-- Аккаунты, заведённые до включения проверки, считаем подтверждёнными,
-- иначе их владельцы потеряют доступ к сайту.
-- ВАЖНО: выполнять только один раз, сразу после добавления колонок.
update public.users
set email_verified = true
where verification_token_hash is null;

-- Права на изменённую таблицу для роли, под которой работает сервер.
grant all privileges on public.users to service_role;
