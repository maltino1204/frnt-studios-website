-- =============================================================================
-- SOMA 0011 — "Entdecken / Für dich" (2026-11-02)
--
--  * explore_collections + explore_collection_items: admin-curated collections
--    ("Themenwelten") on /entdecken. An item is a catalog service (optionally
--    pinned to one Profi) or a category with search filters.
--    anon/authenticated read only collections that are live right now
--    (published and inside their optional active window) and their items;
--    admins read everything. There are no API write grants: admins write through
--    src/server/services/explore-admin.ts (withService after assertAdmin, every
--    write audited), like content_blocks.
--  * is_sponsored + sponsor_name: future paid placements. The UI labels them
--    „Anzeige“ with the sponsor (UWG § 5a Abs. 4, DSA Art. 26). The demo seeds none.
--  * profiles.personalized_suggestions (default on): the customer's own opt-out
--    for „Für dich“. Owned by the customer (column grant + profiles_update_own).
--  * explore_popular_services(): „Beliebt in <Stadt>“ as an aggregate with hard
--    floors (≥ 5 confirmed/completed bookings in the city in the window, ≥ 3 per
--    service), so small counts never leave the database, whatever the caller asks.
--  * explore_service_ratings(): published-review aggregates per service.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Collections
-- ---------------------------------------------------------------------------
create table public.explore_collections (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique
                check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 60 and slug not in ('vorschau', 'neu')),
  title         text not null check (char_length(btrim(title)) between 2 and 80),
  subline       text check (char_length(subline) <= 140),
  cover_image   text check (cover_image ~ '^/images/[A-Za-z0-9/_.-]+\.(jpg|jpeg|png|webp|avif)$'),
  is_published  boolean not null default false,
  active_from   timestamptz,
  active_until  timestamptz,
  sort_order    integer not null default 100 check (sort_order between 0 and 10000),
  is_sponsored  boolean not null default false,
  sponsor_name  text check (char_length(sponsor_name) <= 80),
  created_by    uuid references public.profiles (id) on delete set null,
  updated_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint explore_collections_window check (active_until is null or active_from is null or active_until > active_from),
  -- A paid placement must name who it is shown for (DSA Art. 26 Abs. 1 lit. b/c).
  constraint explore_collections_sponsor check (not is_sponsored or char_length(btrim(coalesce(sponsor_name, ''))) >= 2)
);
create index explore_collections_order_idx on public.explore_collections (sort_order, title);

comment on table public.explore_collections is
  'Admin-curated collections on /entdecken. Public reads: published and inside [active_from, active_until).';
comment on column public.explore_collections.is_sponsored is
  'Paid placement: shown as „Anzeige“ with sponsor_name (UWG § 5a Abs. 4, DSA Art. 26). Editorial otherwise („Von SOMA ausgewählt“).';

create trigger explore_collections_set_updated_at
before update on public.explore_collections
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Items
-- ---------------------------------------------------------------------------
create table public.explore_collection_items (
  id             uuid primary key default gen_random_uuid(),
  collection_id  uuid not null references public.explore_collections (id) on delete cascade,
  position       integer not null default 0 check (position between 0 and 999),
  kind           text not null check (kind in ('service', 'category')),
  service_id     uuid references public.services (id) on delete cascade,
  provider_id    uuid references public.providers (id) on delete cascade,
  category_id    uuid references public.categories (id) on delete cascade,
  -- search filters of a category item, the existing /suche params: { plz?, leistung?, datum?, zeit? }
  filters        jsonb not null default '{}'::jsonb check (jsonb_typeof(filters) = 'object'),
  title          text check (char_length(title) <= 80),
  note           text check (char_length(note) <= 140),
  created_at     timestamptz not null default now(),
  constraint explore_items_shape check (
    (kind = 'service' and service_id is not null and category_id is null)
    or (kind = 'category' and category_id is not null and service_id is null and provider_id is null)
  )
);
create index explore_collection_items_order_idx on public.explore_collection_items (collection_id, position);

-- ---------------------------------------------------------------------------
-- RLS: public reads only what is live now; no API writes at all
-- ---------------------------------------------------------------------------
alter table public.explore_collections enable row level security;
alter table public.explore_collection_items enable row level security;

revoke all on public.explore_collections, public.explore_collection_items from public, anon, authenticated;
grant select on public.explore_collections, public.explore_collection_items to anon, authenticated;

create policy explore_collections_read on public.explore_collections for select to anon, authenticated
  using (
    (is_published
      and (active_from is null or active_from <= now())
      and (active_until is null or active_until > now()))
    or public.is_admin()
  );

-- The sub-select is itself filtered by explore_collections_read: an item is visible exactly when its collection is.
create policy explore_collection_items_read on public.explore_collection_items for select to anon, authenticated
  using (exists (select 1 from public.explore_collections c where c.id = collection_id));

-- ---------------------------------------------------------------------------
-- Opt-out for „Für dich“ (customer-owned)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column personalized_suggestions boolean not null default true;

comment on column public.profiles.personalized_suggestions is
  '„Persönliche Vorschläge“ on /entdecken, from the customer''s own bookings, favourites and default address. Off: nothing is computed.';

grant update (personalized_suggestions) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- „Beliebt in <Stadt>“: aggregate with hard floors
-- ---------------------------------------------------------------------------
create or replace function public.explore_popular_services(
  p_city_slug text,
  p_days integer default 90,
  p_min_city integer default 5,
  p_min_service integer default 3,
  p_limit integer default 8
) returns table (service_id uuid, booking_count integer)
language sql stable
security definer
set search_path = ''
as $$
  with b as (
    select bk.service_id
    from public.bookings bk
    join public.postal_codes pc on pc.postal_code = bk.postal_code
    where pc.city_slug = p_city_slug
      and bk.status in ('confirmed', 'in_progress', 'completed')
      and bk.created_at >= now() - make_interval(days => least(greatest(coalesce(p_days, 90), 30), 180))
  ),
  total as (select count(*) as n from b)
  select s.id, count(*)::int
  from b
  join public.services s on s.id = b.service_id and s.is_active
  join public.categories c on c.id = s.category_id and c.is_active
  where (select n from total) >= greatest(coalesce(p_min_city, 5), 5)
  group by s.id, s.sort_order
  having count(*) >= greatest(coalesce(p_min_service, 3), 3)
  order by count(*) desc, s.sort_order, s.id
  limit least(greatest(coalesce(p_limit, 8), 1), 12)
$$;

revoke execute on function public.explore_popular_services(text, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.explore_popular_services(text, integer, integer, integer, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Ratings per service from published reviews (optionally of bookings in one city)
-- ---------------------------------------------------------------------------
create or replace function public.explore_service_ratings(p_service_ids uuid[], p_city_slug text default null)
returns table (service_id uuid, rating_avg numeric, rating_count integer)
language sql stable
security definer
set search_path = ''
as $$
  select b.service_id, round(avg(r.rating)::numeric, 2), count(*)::int
  from public.reviews r
  join public.bookings b on b.id = r.booking_id
  join public.providers p on p.id = r.provider_id and p.status = 'approved'
  left join public.postal_codes pc on pc.postal_code = b.postal_code
  where r.is_published
    and b.service_id = any(p_service_ids)
    and (p_city_slug is null or pc.city_slug = p_city_slug)
  group by b.service_id
$$;

revoke execute on function public.explore_service_ratings(uuid[], text) from public, anon, authenticated;
grant execute on function public.explore_service_ratings(uuid[], text) to anon, authenticated;
