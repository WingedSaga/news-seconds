-- Категория «Другое» для материалов, не попадающих в новости,
-- анекдоты и погоду. Выполните один раз в SQL Editor проекта Supabase.
--
-- Без этой миграции база отклонит статью с category = 'other':
-- ограничение check пропускает только три старых значения.

alter table public.articles drop constraint if exists articles_category_check;

alter table public.articles
  add constraint articles_category_check
  check (category in ('news', 'joke', 'weather', 'other'));
