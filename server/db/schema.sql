-- Схема базы данных для проекта «НОВОСТИ СЕКУНДЫ».
-- Выполните этот файл в SQL Editor вашего проекта Supabase.

create extension if not exists "pgcrypto";

-- Пользователи -------------------------------------------------------------
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  username      text        not null unique,
  email         text        not null unique,
  password_hash text        not null,
  role          text        not null default 'user' check (role in ('user', 'admin')),
  avatar_url    text,
  is_banned     boolean     not null default false,
  created_at    timestamptz not null default now(),
  -- Подтверждение почты. Хранится хеш токена, а не сам токен:
  -- утечка дампа базы не должна давать возможность подтвердить чужой адрес.
  email_verified          boolean not null default false,
  verification_token_hash text,
  verification_expires_at timestamptz,
  verification_sent_at    timestamptz
);

create index if not exists users_verification_token_idx on public.users (verification_token_hash);

-- Статьи --------------------------------------------------------------------
create table if not exists public.articles (
  id         uuid primary key default gen_random_uuid(),
  title      text        not null,
  content    text        not null,
  category   text        not null check (category in ('news', 'joke', 'weather')),
  image_url  text,
  author_id  uuid        references public.users (id) on delete set null,
  status     text        not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  views      integer     not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists articles_status_created_at_idx on public.articles (status, created_at desc);
create index if not exists articles_category_idx on public.articles (category);
create index if not exists articles_author_idx on public.articles (author_id);

-- Комментарии ---------------------------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid        not null references public.articles (id) on delete cascade,
  user_id    uuid        not null references public.users (id) on delete cascade,
  text       text        not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_article_idx on public.comments (article_id, created_at desc);

-- Закладки ------------------------------------------------------------------
create table if not exists public.bookmarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users (id) on delete cascade,
  article_id uuid        not null references public.articles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, article_id)
);

create index if not exists bookmarks_user_idx on public.bookmarks (user_id, created_at desc);

-- Атомарный инкремент счётчика просмотров -----------------------------------
create or replace function public.increment_article_views(article_id uuid)
returns void
language sql
as $$
  update public.articles set views = views + 1 where id = article_id;
$$;

-- Доступ к таблицам идёт только через сервер с service_role ключом,
-- поэтому анонимный доступ полностью закрыт.
alter table public.users     enable row level security;
alter table public.articles  enable row level security;
alter table public.comments  enable row level security;
alter table public.bookmarks enable row level security;

-- Права для роли service_role, под которой работает сервер.
-- Выдаются явно: полагаться на привилегии по умолчанию нельзя, иначе
-- запросы падают с ошибкой 42501 «permission denied for table».
-- Ролям anon и authenticated права не выдаются намеренно: в базу
-- ходит только сервер, напрямую из браузера доступа быть не должно.
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Тот же набор для таблиц, которые появятся позже.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;

-- Бакет для картинок статей (публичное чтение).
insert into storage.buckets (id, name, public)
values ('article-images', 'article-images', true)
on conflict (id) do nothing;

-- Как назначить администратора (подставьте свой email):
-- update public.users set role = 'admin' where email = 'admin@example.com';
