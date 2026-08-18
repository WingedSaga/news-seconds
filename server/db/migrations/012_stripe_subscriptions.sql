-- Stripe customer and subscription identifiers belong to an existing site user.
-- The Stripe API remains the financial source of truth; this table provides the
-- association needed for account management and webhook reconciliation.
create table if not exists public.user_subscriptions (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null unique references public.users (id) on delete cascade,
  stripe_customer_id          text not null unique,
  stripe_subscription_id      text unique,
  stripe_checkout_session_id  text unique,
  stripe_price_id             text,
  status                      text not null default 'checkout_created',
  current_period_end          timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists user_subscriptions_status_idx
  on public.user_subscriptions (status, updated_at desc);

alter table public.user_subscriptions enable row level security;
grant all privileges on public.user_subscriptions to service_role;
