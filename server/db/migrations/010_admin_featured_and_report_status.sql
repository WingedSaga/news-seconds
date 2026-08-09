-- Одна публикация может быть закреплена в блоке «Главное сейчас».
alter table public.articles
  add column if not exists is_featured boolean not null default false;

create index if not exists articles_featured_idx
  on public.articles (is_featured desc, created_at desc);

alter table public.content_reports
  add column if not exists status text not null default 'new'
    check (status in ('new', 'resolved', 'dismissed')),
  add column if not exists resolved_at timestamptz;

create index if not exists content_reports_status_created_at_idx
  on public.content_reports (status, created_at desc);
