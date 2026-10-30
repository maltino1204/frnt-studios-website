-- =============================================================================
-- SOMA 0001 — core schema: extensions, enums, tables, constraints, indexes.
-- Supabase-compatible: no superuser-only features. Money is integer cents (EUR),
-- instants are timestamptz, weekly hours are Europe/Berlin wall-clock times.
-- =============================================================================

create extension if not exists btree_gist with schema extensions;
create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('customer', 'provider', 'admin');
create type public.provider_status as enum ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'suspended');
create type public.booking_mode as enum ('instant', 'request');
create type public.booking_status as enum (
  'pending_payment', 'requested', 'confirmed', 'in_progress', 'completed',
  'cancelled', 'declined', 'expired', 'no_show'
);
create type public.location_kind as enum ('home', 'hotel', 'office', 'other');
create type public.actor_role as enum ('customer', 'provider', 'admin', 'system');
create type public.document_kind as enum ('id_document', 'business_registration', 'qualification', 'insurance', 'other');
create type public.document_status as enum ('pending', 'approved', 'rejected');
create type public.payment_provider as enum ('dev', 'stripe');
create type public.payment_status as enum (
  'requires_payment_method', 'authorized', 'captured', 'partially_refunded', 'refunded', 'cancelled', 'failed'
);
create type public.refund_status as enum ('pending', 'succeeded', 'failed');
create type public.payout_status as enum ('pending', 'in_transit', 'paid', 'failed');
create type public.credit_reason as enum (
  'referral_reward', 'referral_welcome', 'booking_redemption', 'booking_refund', 'admin_adjustment', 'goodwill'
);
create type public.referral_status as enum ('pending', 'qualified', 'rewarded');
create type public.commission_scope as enum ('global', 'category', 'provider');
create type public.commission_tier as enum ('base', 'repeat', 'own_client');
create type public.client_link_source as enum ('provider_invite', 'platform');
create type public.dispute_reason as enum ('quality', 'provider_no_show', 'customer_no_show', 'damage', 'payment', 'safety', 'other');
create type public.dispute_status as enum ('open', 'investigating', 'resolved_refund', 'resolved_no_action', 'closed');
create type public.email_status as enum ('queued', 'sent', 'failed');

-- ---------------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

-- Great-circle distance in km (same formula as src/server/domain/geo.ts).
create or replace function public.haversine_km(lat1 double precision, lng1 double precision,
                                               lat2 double precision, lng2 double precision)
returns double precision
language sql immutable parallel safe
set search_path = ''
as $$
  select 2 * 6371.0088 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ))
$$;

-- True only for trusted maintenance/seed connections that explicitly opt in.
-- API roles can never use it (and have no write grants on the guarded tables).
create or replace function public.seed_mode() returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce(current_setting('soma.seed_mode', true), '') = 'on'
     and current_user not in ('anon', 'authenticated')
$$;

-- ---------------------------------------------------------------------------
-- Geography & catalogue
-- ---------------------------------------------------------------------------
create table public.cities (
  slug        text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  name        text not null,
  state       text not null,
  lat         double precision not null check (lat between -90 and 90),
  lng         double precision not null check (lng between -180 and 180),
  is_active   boolean not null default true,
  sort_order  int not null default 0
);

create table public.postal_codes (
  postal_code text primary key check (postal_code ~ '^[0-9]{5}$'),
  lat         double precision not null check (lat between 47 and 56),
  lng         double precision not null check (lng between 5 and 16),
  city_slug   text references public.cities (slug) on delete set null
);
create index postal_codes_city_idx on public.postal_codes (city_slug) where city_slug is not null;

create table public.categories (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name                text not null check (char_length(name) between 2 and 80),
  tagline             text,
  description         text,
  image_path          text,
  sort_order          int not null default 0,
  is_active           boolean not null default true,
  seo_title           text,
  seo_description     text,
  -- [{ "kind": "qualification", "label": "Meisterbrief oder Eintragung in die Handwerksrolle" }]
  required_documents  jsonb not null default '[]'::jsonb check (jsonb_typeof(required_documents) = 'array'),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.services (
  id                     uuid primary key default gen_random_uuid(),
  category_id            uuid not null references public.categories (id) on delete restrict,
  slug                   text not null check (slug ~ '^[a-z0-9-]{2,80}$'),
  name                   text not null check (char_length(name) between 2 and 120),
  description            text,
  durations              int[] not null check (cardinality(durations) between 1 and 6 and 15 <= all (durations) and 480 >= all (durations)),
  default_duration       int not null,
  price_hint_from_cents  int check (price_hint_from_cents is null or price_hint_from_cents >= 0),
  attributes             jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes) = 'object'),
  sort_order             int not null default 0,
  is_active              boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (category_id, slug),
  check (default_duration = any (durations))
);
create index services_category_idx on public.services (category_id, sort_order);

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  role              public.app_role not null default 'customer',
  first_name        text check (char_length(first_name) <= 80),
  last_name         text check (char_length(last_name) <= 80),
  phone             text check (phone ~ '^\+?[0-9 ()/-]{6,24}$'),
  avatar_path       text,
  referral_code     text not null unique check (referral_code ~ '^[A-Z0-9]{6,16}$'),
  referred_by       uuid references public.profiles (id) on delete set null,
  marketing_opt_in  boolean not null default false,
  blocked_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);

create table public.addresses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  label         text check (char_length(label) <= 60),
  kind          public.location_kind not null default 'home',
  street        text not null check (char_length(street) between 2 and 120),
  house_number  text not null check (char_length(house_number) between 1 and 12),
  postal_code   text not null references public.postal_codes (postal_code),
  city          text not null check (char_length(city) between 2 and 80),
  details       text check (char_length(details) <= 300),
  lat           double precision,
  lng           double precision,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);
create unique index addresses_one_default_idx on public.addresses (user_id) where is_default;

-- ---------------------------------------------------------------------------
-- Providers
-- ---------------------------------------------------------------------------
create table public.providers (
  id                        uuid primary key references public.profiles (id) on delete cascade,
  slug                      text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  invite_code               text not null unique check (invite_code ~ '^[A-Z0-9]{6,16}$'),
  display_name              text not null check (char_length(display_name) between 2 and 80),
  headline                  text check (char_length(headline) <= 120),
  bio                       text check (char_length(bio) <= 1200),
  avatar_path               text,
  years_experience          int check (years_experience between 0 and 60),
  languages                 text[] not null default array['de']::text[],
  status                    public.provider_status not null default 'draft',
  booking_mode              public.booking_mode not null default 'request',
  lead_time_minutes         int not null default 180 check (lead_time_minutes between 0 and 10080),
  max_advance_days          int not null default 60 check (max_advance_days between 1 and 180),
  travel_buffer_minutes     int not null default 30 check (travel_buffer_minutes between 0 and 120),
  base_postal_code          text references public.postal_codes (postal_code),
  base_lat                  double precision,
  base_lng                  double precision,
  service_radius_km         numeric(5,1) not null default 10 check (service_radius_km between 1 and 50),
  travel_fee_base_cents     int not null default 0 check (travel_fee_base_cents between 0 and 10000),
  travel_fee_included_km    numeric(5,1) not null default 0 check (travel_fee_included_km between 0 and 50),
  travel_fee_per_km_cents   int not null default 0 check (travel_fee_per_km_cents between 0 and 1000),
  rating_avg                numeric(3,2),
  rating_count              int not null default 0,
  completed_count           int not null default 0,
  commission_rate_override  numeric(5,4) check (commission_rate_override between 0 and 1),
  stripe_account_id         text unique,
  payouts_enabled           boolean not null default false,
  approved_at               timestamptz,
  submitted_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index providers_status_idx on public.providers (status);
create index providers_base_postal_idx on public.providers (base_postal_code);

create table public.provider_services (
  id                uuid primary key default gen_random_uuid(),
  provider_id       uuid not null references public.providers (id) on delete cascade,
  service_id        uuid not null references public.services (id) on delete restrict,
  duration_minutes  int not null check (duration_minutes between 15 and 480 and duration_minutes % 5 = 0),
  price_cents       int not null check (price_cents between 500 and 100000),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (provider_id, service_id, duration_minutes)
);
create index provider_services_service_idx on public.provider_services (service_id) where is_active;

create table public.provider_weekly_hours (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers (id) on delete cascade,
  weekday      smallint not null check (weekday between 1 and 7),  -- ISO: 1 = Montag … 7 = Sonntag
  start_time   time not null,
  end_time     time not null,                                       -- '24:00' allowed (end of day)
  created_at   timestamptz not null default now(),
  check (end_time > start_time),
  -- windows of one provider on one weekday never overlap
  constraint provider_weekly_hours_no_overlap exclude using gist (
    provider_id with =,
    weekday with =,
    tsrange(date '2000-01-01' + start_time, date '2000-01-01' + end_time, '[)') with &&
  )
);

create table public.provider_time_off (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers (id) on delete cascade,
  period       tstzrange not null check (not isempty(period) and not lower_inf(period) and not upper_inf(period)),
  reason       text check (char_length(reason) <= 200),
  created_at   timestamptz not null default now()
);
create index provider_time_off_idx on public.provider_time_off using gist (provider_id, period);

create table public.provider_documents (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid not null references public.providers (id) on delete cascade,
  kind          public.document_kind not null,
  -- set for category-specific requirements (e.g. Haare & Styling: Meisterbrief / Handwerksrolle)
  category_id   uuid references public.categories (id) on delete set null,
  storage_path  text not null unique,
  file_name     text not null check (char_length(file_name) <= 200),
  mime_type     text not null,
  size_bytes    int not null check (size_bytes > 0),
  status        public.document_status not null default 'pending',
  review_note   text,
  reviewed_by   uuid references public.profiles (id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index provider_documents_provider_idx on public.provider_documents (provider_id);

create table public.provider_portfolio (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid not null references public.providers (id) on delete cascade,
  storage_path  text not null,
  caption       text check (char_length(caption) <= 200),
  category_id   uuid references public.categories (id) on delete set null,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index provider_portfolio_provider_idx on public.provider_portfolio (provider_id, sort_order);

create table public.provider_status_events (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers (id) on delete cascade,
  from_status  public.provider_status,
  to_status    public.provider_status not null,
  actor_id     uuid references public.profiles (id) on delete set null,
  note         text,
  created_at   timestamptz not null default now()
);
create index provider_status_events_idx on public.provider_status_events (provider_id, created_at desc);

-- Which customers a provider brought to SOMA (own-client commission tier).
create table public.provider_client_links (
  provider_id  uuid not null references public.providers (id) on delete cascade,
  customer_id  uuid not null references public.profiles (id) on delete cascade,
  source       public.client_link_source not null,
  created_at   timestamptz not null default now(),
  primary key (provider_id, customer_id)
);
create index provider_client_links_customer_idx on public.provider_client_links (customer_id);

-- ---------------------------------------------------------------------------
-- Money: payouts first (bookings reference them)
-- ---------------------------------------------------------------------------
create table public.payouts (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid not null references public.providers (id) on delete restrict,
  amount_cents  int not null check (amount_cents >= 0),
  status        public.payout_status not null default 'pending',
  period_start  timestamptz,
  period_end    timestamptz,
  external_id   text,
  paid_at       timestamptz,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index payouts_provider_idx on public.payouts (provider_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Bookings (see docs/architecture.md §5)
-- ---------------------------------------------------------------------------
create table public.bookings (
  id                      uuid primary key default gen_random_uuid(),
  reference               text not null unique check (reference ~ '^SM-[0-9A-Z]{6}$'),
  customer_id             uuid not null references public.profiles (id) on delete restrict,
  provider_id             uuid not null references public.providers (id) on delete restrict,
  provider_service_id     uuid not null references public.provider_services (id) on delete restrict,
  service_id              uuid not null references public.services (id) on delete restrict,
  category_id             uuid not null references public.categories (id) on delete restrict,
  service_name            text not null,
  duration_minutes        int not null check (duration_minutes between 15 and 480),
  starts_at               timestamptz not null,
  ends_at                 timestamptz not null,
  blocked_range           tstzrange not null,
  status                  public.booking_status not null default 'pending_payment',
  booking_mode            public.booking_mode not null,
  location_kind           public.location_kind not null default 'home',
  address_line            text not null check (char_length(address_line) <= 200),
  postal_code             text not null references public.postal_codes (postal_code),
  city                    text not null,
  address_details         text check (char_length(address_details) <= 300),
  lat                     double precision,
  lng                     double precision,
  customer_notes          text check (char_length(customer_notes) <= 1000),
  distance_km             numeric(6,2) not null default 0 check (distance_km >= 0),
  service_price_cents     int not null check (service_price_cents >= 0),
  travel_fee_cents        int not null default 0 check (travel_fee_cents >= 0),
  service_fee_cents       int not null default 0 check (service_fee_cents >= 0),
  discount_cents          int not null default 0 check (discount_cents >= 0),
  total_cents             int not null check (total_cents >= 0),
  commission_rate         numeric(5,4) not null check (commission_rate between 0 and 1),
  commission_tier         public.commission_tier not null default 'base',
  commission_cents        int not null check (commission_cents >= 0),
  provider_payout_cents   int not null check (provider_payout_cents >= 0),
  is_repeat_client        boolean not null default false,
  cancellation_policy     jsonb not null,
  start_code              text not null default lpad((floor(random() * 10000))::int::text, 4, '0') check (start_code ~ '^[0-9]{4}$'),
  start_code_attempts     smallint not null default 0 check (start_code_attempts >= 0),
  hold_expires_at         timestamptz,
  respond_by              timestamptz,
  confirmed_at            timestamptz,
  started_at              timestamptz,
  completed_at            timestamptz,
  cancelled_at            timestamptz,
  cancelled_by            public.actor_role,
  cancellation_reason     text check (char_length(cancellation_reason) <= 500),
  cancellation_fee_cents  int not null default 0 check (cancellation_fee_cents >= 0),
  refund_cents            int not null default 0 check (refund_cents >= 0),
  reminder_24h_sent_at    timestamptz,
  rebooked_from_id        uuid references public.bookings (id) on delete set null,
  payout_id               uuid references public.payouts (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint bookings_time_order check (ends_at > starts_at),
  constraint bookings_total_matches check (total_cents = service_price_cents + travel_fee_cents + service_fee_cents - discount_cents),
  constraint bookings_discount_le_price check (discount_cents <= service_price_cents),
  -- Hard guarantee against double booking, also under concurrency (SQLSTATE 23P01).
  constraint bookings_no_overlap exclude using gist (
    provider_id with =,
    blocked_range with &&
  ) where (status in ('pending_payment', 'requested', 'confirmed', 'in_progress'))
);
create index bookings_customer_idx on public.bookings (customer_id, starts_at desc);
create index bookings_provider_idx on public.bookings (provider_id, starts_at);
create index bookings_hold_idx on public.bookings (hold_expires_at) where status = 'pending_payment';
create index bookings_respond_idx on public.bookings (respond_by) where status = 'requested';
create index bookings_open_end_idx on public.bookings (ends_at) where status in ('confirmed', 'in_progress');
create index bookings_payout_idx on public.bookings (provider_id, completed_at) where payout_id is null;

create table public.booking_events (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references public.bookings (id) on delete cascade,
  from_status  public.booking_status,
  to_status    public.booking_status not null,
  actor_id     uuid references public.profiles (id) on delete set null,
  actor_role   public.actor_role not null default 'system',
  note         text,
  created_at   timestamptz not null default now()
);
create index booking_events_booking_idx on public.booking_events (booking_id, created_at);

create table public.payments (
  id                     uuid primary key default gen_random_uuid(),
  booking_id             uuid not null unique references public.bookings (id) on delete cascade,
  provider               public.payment_provider not null,
  status                 public.payment_status not null default 'requires_payment_method',
  amount_cents           int not null check (amount_cents >= 0),
  captured_cents         int not null default 0 check (captured_cents >= 0),
  refunded_cents         int not null default 0 check (refunded_cents >= 0),
  application_fee_cents  int not null default 0 check (application_fee_cents >= 0),
  external_id            text unique,
  card_brand             text,
  card_last4             text check (card_last4 ~ '^[0-9]{4}$'),   -- display only; never PAN/CVC
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  check (captured_cents <= amount_cents),
  check (refunded_cents <= captured_cents)
);

create table public.refunds (
  id            uuid primary key default gen_random_uuid(),
  payment_id    uuid not null references public.payments (id) on delete cascade,
  booking_id    uuid not null references public.bookings (id) on delete cascade,
  amount_cents  int not null check (amount_cents > 0),
  reason        text not null check (char_length(reason) <= 500),
  status        public.refund_status not null default 'pending',
  external_id   text,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index refunds_booking_idx on public.refunds (booking_id);

-- ---------------------------------------------------------------------------
-- Reviews, favourites, notifications
-- ---------------------------------------------------------------------------
create table public.reviews (
  id                   uuid primary key default gen_random_uuid(),
  booking_id           uuid not null unique references public.bookings (id) on delete cascade,
  customer_id          uuid not null references public.profiles (id) on delete cascade,
  provider_id          uuid not null references public.providers (id) on delete cascade,
  rating               smallint not null check (rating between 1 and 5),
  comment              text check (char_length(comment) <= 2000),
  tags                 text[] not null default '{}'::text[] check (cardinality(tags) <= 5),
  provider_reply       text check (char_length(provider_reply) <= 1000),
  provider_replied_at  timestamptz,
  is_published         boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index reviews_provider_idx on public.reviews (provider_id, created_at desc) where is_published;

create table public.favorites (
  customer_id  uuid not null references public.profiles (id) on delete cascade,
  provider_id  uuid not null references public.providers (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (customer_id, provider_id)
);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  href        text,
  read_at     timestamptz,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.notification_preferences (
  user_id          uuid primary key references public.profiles (id) on delete cascade,
  email_bookings   boolean not null default true,
  email_reminders  boolean not null default true,
  email_marketing  boolean not null default false,
  sms_reminders    boolean not null default false,
  push_bookings    boolean not null default true,
  updated_at       timestamptz not null default now()
);

create table public.email_outbox (
  id          uuid primary key default gen_random_uuid(),
  to_user_id  uuid references public.profiles (id) on delete cascade,
  template    text not null,
  subject     text not null,
  payload     jsonb not null default '{}'::jsonb,
  status      public.email_status not null default 'queued',
  error       text,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index email_outbox_queued_idx on public.email_outbox (created_at) where status = 'queued';

-- ---------------------------------------------------------------------------
-- Credits & referrals
-- ---------------------------------------------------------------------------
create table public.credit_ledger (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  amount_cents  int not null check (amount_cents <> 0),
  reason        public.credit_reason not null,
  booking_id    uuid references public.bookings (id) on delete set null,
  note          text,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);

create table public.referrals (
  id                    uuid primary key default gen_random_uuid(),
  referrer_id           uuid not null references public.profiles (id) on delete cascade,
  referred_id           uuid not null unique references public.profiles (id) on delete cascade,
  status                public.referral_status not null default 'pending',
  qualified_booking_id  uuid references public.bookings (id) on delete set null,
  rewarded_at           timestamptz,
  created_at            timestamptz not null default now(),
  check (referrer_id <> referred_id)
);
create index referrals_referrer_idx on public.referrals (referrer_id);

-- ---------------------------------------------------------------------------
-- Platform configuration
-- ---------------------------------------------------------------------------
create table public.commission_rules (
  id                  uuid primary key default gen_random_uuid(),
  scope               public.commission_scope not null,
  category_id         uuid references public.categories (id) on delete cascade,
  provider_id         uuid references public.providers (id) on delete cascade,
  rate                numeric(5,4) not null check (rate between 0 and 1),
  repeat_client_rate  numeric(5,4) not null check (repeat_client_rate between 0 and 1),
  own_client_rate     numeric(5,4) not null default 0.05 check (own_client_rate between 0 and 1),
  is_active           boolean not null default true,
  created_by          uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (
    (scope = 'global' and category_id is null and provider_id is null)
    or (scope = 'category' and category_id is not null and provider_id is null)
    or (scope = 'provider' and provider_id is not null and category_id is null)
  )
);
create unique index commission_rules_global_idx on public.commission_rules (scope) where is_active and scope = 'global';
create unique index commission_rules_category_idx on public.commission_rules (category_id) where is_active and scope = 'category';
create unique index commission_rules_provider_idx on public.commission_rules (provider_id) where is_active and scope = 'provider';

create table public.platform_settings (
  key         text primary key check (key ~ '^[a-z0-9_]{2,60}$'),
  value       jsonb not null,
  updated_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);

create table public.disputes (
  id               uuid primary key default gen_random_uuid(),
  booking_id       uuid not null references public.bookings (id) on delete cascade,
  opened_by        uuid not null references public.profiles (id) on delete cascade,
  reason           public.dispute_reason not null,
  description      text not null check (char_length(description) between 10 and 4000),
  status           public.dispute_status not null default 'open',
  refund_cents     int not null default 0 check (refund_cents >= 0),
  resolution_note  text,
  resolved_by      uuid references public.profiles (id) on delete set null,
  resolved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index disputes_booking_idx on public.disputes (booking_id);
create index disputes_open_idx on public.disputes (status) where status in ('open', 'investigating');

-- Demand analytics without PII.
create table public.search_events (
  id              bigserial primary key,
  postal_code     text,
  city_slug       text,
  category_id     uuid references public.categories (id) on delete set null,
  service_id      uuid references public.services (id) on delete set null,
  requested_date  date,
  results_count   int not null default 0,
  created_at      timestamptz not null default now()
);
create index search_events_created_idx on public.search_events (created_at desc);
create index search_events_city_idx on public.search_events (city_slug, created_at desc);

-- "Benachrichtigen, sobald verfügbar" (demand capture when a search is empty).
create table public.waitlist_signups (
  id           uuid primary key default gen_random_uuid(),
  email        extensions.citext not null check (char_length(email::text) between 5 and 254),
  postal_code  text not null check (postal_code ~ '^[0-9]{5}$'),
  category_id  uuid references public.categories (id) on delete set null,
  city_slug    text references public.cities (slug) on delete set null,
  created_at   timestamptz not null default now(),
  notified_at  timestamptz,
  constraint waitlist_unique unique nulls not distinct (email, postal_code, category_id)
);
create index waitlist_city_idx on public.waitlist_signups (city_slug);

create table public.content_blocks (
  key         text primary key check (key ~ '^[a-z0-9_.-]{2,80}$'),
  value       jsonb not null,
  updated_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);

create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'categories', 'services', 'profiles', 'addresses', 'providers', 'provider_services',
    'payouts', 'payments', 'reviews', 'commission_rules', 'disputes'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Derived coordinates: always from the PLZ centroid, never from client input
-- ---------------------------------------------------------------------------
create or replace function public.addresses_set_coordinates() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select pc.lat, pc.lng into new.lat, new.lng
  from public.postal_codes pc where pc.postal_code = new.postal_code;
  return new;
end
$$;

create trigger addresses_set_coordinates
before insert or update of postal_code on public.addresses
for each row execute function public.addresses_set_coordinates();

create or replace function public.providers_set_coordinates() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.base_postal_code is null then
    new.base_lat := null;
    new.base_lng := null;
  else
    select pc.lat, pc.lng into new.base_lat, new.base_lng
    from public.postal_codes pc where pc.postal_code = new.base_postal_code;
  end if;
  return new;
end
$$;

create trigger providers_set_coordinates
before insert or update of base_postal_code on public.providers
for each row execute function public.providers_set_coordinates();
