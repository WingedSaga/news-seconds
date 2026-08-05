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
  created_at    timestamptz not null default now()
);

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

-- Бакет для картинок статей (публичное чтение).
insert into storage.buckets (id, name, public)
values ('article-images', 'article-images', true)
on conflict (id) do nothing;

-- Как назначить администратора (подставьте свой email):
-- update public.users set role = 'admin' where email = 'admin@example.com';
