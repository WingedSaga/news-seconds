-- Аудио- и видеовложения к новостям.
-- Выполните один раз в SQL Editor проекта Supabase.

alter table public.articles add column if not exists media_url  text;
alter table public.articles add column if not exists media_type text
  check (media_type is null or media_type in ('audio', 'video'));

grant all privileges on public.articles to service_role;

-- Отдельный бакет для медиа: файлы тяжелее картинок, и лимит на них свой.
insert into storage.buckets (id, name, public, file_size_limit)
values ('article-media', 'article-media', true, 52428800)
on conflict (id) do nothing;
