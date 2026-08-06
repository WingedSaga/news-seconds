-- До пяти изображений на новость.
-- Выполните один раз в SQL Editor проекта Supabase.

alter table public.articles add column if not exists image_urls text[] not null default '{}';

-- Уже опубликованные материалы: единственная картинка становится первой в галерее.
update public.articles
set image_urls = array[image_url]
where image_url is not null and cardinality(image_urls) = 0;

grant all privileges on public.articles to service_role;
