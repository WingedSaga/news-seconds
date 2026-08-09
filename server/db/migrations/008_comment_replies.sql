-- Ответы на комментарии. Выполните один раз в SQL Editor проекта Supabase.
--
-- Вложенность ровно в один уровень: ответ на ответ сервер прикрепляет
-- к началу ветки. Лестница из отступов на телефоне нечитаема, а разговор
-- «комментарий — ответы на него» помещается в экран.
--
-- on delete cascade: удаляя комментарий, уносим и ответы на него,
-- иначе они повисают без вопроса и выглядят бессмыслицей.

alter table public.comments
  add column if not exists parent_id uuid references public.comments (id) on delete cascade;

create index if not exists comments_parent_idx on public.comments (parent_id, created_at);
