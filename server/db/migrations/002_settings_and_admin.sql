-- Настройки сайта и назначение администратора.
-- Выполните один раз в SQL Editor проекта Supabase.

create table if not exists public.settings (
  key        text primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

grant all privileges on public.settings to service_role;

-- Значения по умолчанию. on conflict do nothing: повторный запуск
-- не затрёт то, что уже переключено в админ-панели.
insert into public.settings (key, value) values
  ('email_verification',   'false'::jsonb),
  ('registration_open',    'true'::jsonb),
  ('comments_enabled',     'true'::jsonb),
  ('auto_approve_articles','false'::jsonb),
  ('site_tagline',         '"Новости, анекдоты и погода — каждую секунду"'::jsonb)
on conflict (key) do nothing;

-- Назначение администратора.
update public.users set role = 'admin' where email = 'vladimirradev516@gmail.com';

-- Аккаунт заведён до отключения проверки почты — снимаем блокировку входа.
update public.users set email_verified = true where email = 'vladimirradev516@gmail.com';
