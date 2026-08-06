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
  -- Обложка: первая картинка галереи, дублируется для лент и карточек.
  image_url  text,
  -- Галерея, до пяти изображений.
  image_urls text[]      not null default '{}',
  -- Вложение: mp3 или mp4, тип нужен, чтобы выбрать проигрыватель.
  media_url  text,
  media_type text        check (media_type is null or media_type in ('audio', 'video')),
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

-- Настройки сайта -----------------------------------------------------------
-- Переключаются из админ-панели, поэтому живут в базе, а не в окружении.
create table if not exists public.settings (
  key        text primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values
  ('email_verification',   'false'::jsonb),
  ('registration_open',    'true'::jsonb),
  ('comments_enabled',     'true'::jsonb),
  ('auto_approve_articles','false'::jsonb),
  ('site_tagline',         '"Новости, анекдоты и погода — каждую секунду"'::jsonb),
  ('maintenance_mode',     'false'::jsonb),
  ('site_title',           '"НОВОСТИ СЕКУНДЫ"'::jsonb)
on conflict (key) do nothing;

-- Журнал действий администраторов ------------------------------------------
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

-- Служба поддержки ----------------------------------------------------------
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
alter table public.settings  enable row level security;
alter table public.admin_actions enable row level security;
alter table public.support_tickets  enable row level security;
alter table public.support_messages enable row level security;

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

-- Бакет для аудио и видео: файлы тяжелее картинок, лимит 50 МБ.
insert into storage.buckets (id, name, public, file_size_limit)
values ('article-media', 'article-media', true, 52428800)
on conflict (id) do nothing;

-- Как назначить администратора (подставьте свой email):
-- update public.users set role = 'admin' where email = 'admin@example.com';
