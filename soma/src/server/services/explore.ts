import "server-only";

import { z } from "zod";
import { withAnon, withUser, type Queryable } from "../db/client";
import { firstSlot } from "../domain/availability";
import {
  EXPLORE_NEW_DAYS,
  FOR_YOU_LIMIT,
  FOR_YOU_SLOT_DAYS,
  interleave,
  POPULAR_LIMIT,
  POPULAR_MIN_CITY_BOOKINGS,
  POPULAR_MIN_SERVICE_BOOKINGS,
  POPULAR_WINDOW_DAYS,
  priceFrom,
  visibleRating,
} from "../domain/explore";
import { computeTravelFee } from "../domain/pricing";
import { bayesianRating } from "../domain/ranking";
import { routes } from "@/lib/routes";
import type { Session } from "../dto";
import { ServiceError } from "../errors";
import { loadSettings, mediaUrl, parse, requireRoleIn } from "./_shared";
import { loadSchedules, rangeForDays, slotsFor, todayBerlin, type ProviderSchedule } from "./availability-data";
import { PROVIDER_CARD_COLUMNS, toProviderCard, type ProviderCardRow } from "./providers";

/**
 * „Entdecken / Für dich“ (/entdecken, 2026-11-02).
 *
 * Public reads run as `anon` under RLS: only live collections (migration 0011), approved providers, active offerings.
 * The queries also state those conditions explicitly, so the admin preview (owner connection after assertAdmin,
 * services/explore-admin.ts) resolves items exactly like the public page.
 *
 * „Für dich“ runs as the customer (`withUser`) and reads only their own profile, addresses, bookings and favourites
 * (RLS) plus public catalogue data. With `profiles.personalized_suggestions = false` nothing is computed.
 * „Nächster freier Termin“ comes from the availability engine for the saved address's PLZ and nowhere else.
 */

// ---------------------------------------------------------------------------
// Types (import with `import type` in client components)
// ---------------------------------------------------------------------------
export interface ExploreRatingDTO {
  avg: number;
  count: number;
}

export interface ExplorePersonDTO {
  providerId: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  cityName: string | null;
}

/** One service or category card. Prices exclude travel unless `endPriceCents` is set (PLZ known). */
export interface ExploreCardDTO {
  key: string;
  /** into the existing flow: a profile or /suche */
  href: string;
  title: string;
  /** category name */
  eyebrow: string;
  categorySlug: string;
  note: string | null;
  imagePath: string | null;
  durations: number[];
  price: { cents: number; from: boolean } | null;
  rating: ExploreRatingDTO | null;
  provider: ExplorePersonDTO | null;
  /** „Für dich“ only: Endpreis incl. travel to the saved address */
  endPriceCents?: number;
  /** „Für dich“ only: first slot from the availability engine (next 7 days), ISO */
  nextSlot?: string | null;
}

export interface ExploreCollectionCardDTO {
  id: string;
  slug: string;
  title: string;
  subline: string | null;
  coverImage: string | null;
  /** category wash of the first item, for the empty image slot */
  tone: string;
  itemCount: number;
  isSponsored: boolean;
  sponsorName: string | null;
}

export interface ExploreCollectionDTO extends ExploreCollectionCardDTO {
  items: ExploreCardDTO[];
}

export interface ExploreCityPopularDTO {
  citySlug: string;
  cityName: string;
  cards: ExploreCardDTO[];
}

export interface ExploreProviderDTO {
  providerId: string;
  slug: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  bookingMode: "instant" | "request";
  cityName: string | null;
  categories: Array<{ slug: string; name: string }>;
  approvedAt: string;
  /** cheapest active offering (excl. travel) */
  fromPriceCents: number | null;
  /** „Für dich“ only */
  offering?: { providerServiceId: string; serviceSlug: string; serviceName: string; durationMinutes: number };
  endPriceCents?: number;
  nextSlot?: string | null;
}

export interface ForYouRebookDTO {
  key: string;
  /** last completed booking with this Profi (one-tap rebook); null for a favourite without one */
  bookingId: string | null;
  provider: ExplorePersonDTO;
  serviceName: string | null;
  lastAt: string | null;
  isFavorite: boolean;
  nextSlot: string | null;
}

export interface ForYouPlaceDTO {
  postalCode: string;
  city: string;
  citySlug: string | null;
  label: string | null;
}

export type ForYouDTO =
  | { state: "guest" }
  | { state: "off" }
  | {
      state: "on";
      firstName: string | null;
      /** the default saved address (only its PLZ and city are used) */
      place: ForYouPlaceDTO | null;
      hasHistory: boolean;
      rebook: ForYouRebookDTO[];
      matching: ExploreCardDTO[];
      nearbyNew: ExploreProviderDTO[];
    };

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
const zSlug = z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, "Ungültiger Wert.");
const categoryImage = (slug: string, path: string | null) => path ?? `/images/categories/${slug}.jpg`;
const person = (r: { id: string; slug: string; displayName: string; avatarPath: string | null; cityName: string | null }): ExplorePersonDTO => ({
  providerId: r.id,
  slug: r.slug,
  displayName: r.displayName,
  avatarUrl: mediaUrl(r.avatarPath),
  cityName: r.cityName,
});

/** Published-review aggregates per service (explore_service_ratings, migration 0011). */
async function serviceRatings(tx: Queryable, serviceIds: string[], citySlug: string | null = null): Promise<Map<string, ExploreRatingDTO>> {
  if (serviceIds.length === 0) return new Map();
  const rows = await tx<{ serviceId: string; ratingAvg: string; ratingCount: number }[]>`
    select service_id, rating_avg, rating_count from public.explore_service_ratings(${serviceIds}::uuid[], ${citySlug})`;
  const out = new Map<string, ExploreRatingDTO>();
  for (const r of rows) {
    const v = visibleRating(r.ratingAvg, r.ratingCount);
    if (v) out.set(r.serviceId, v);
  }
  return out;
}

/** First portfolio image of each provider in a category (public for approved providers). */
async function portfolioImages(tx: Queryable, pairs: Array<{ providerId: string; categoryId: string }>): Promise<Map<string, string>> {
  if (pairs.length === 0) return new Map();
  const rows = await tx<{ providerId: string; categoryId: string; storagePath: string }[]>`
    select distinct on (pp.provider_id, pp.category_id) pp.provider_id, pp.category_id, pp.storage_path
    from public.provider_portfolio pp
    join public.providers p on p.id = pp.provider_id and p.status = 'approved'
    where pp.provider_id = any(${pairs.map((p) => p.providerId)}::uuid[]) and pp.category_id = any(${pairs.map((p) => p.categoryId)}::uuid[])
    order by pp.provider_id, pp.category_id, pp.sort_order, pp.created_at`;
  return new Map(rows.map((r) => [`${r.providerId}:${r.categoryId}`, mediaUrl(r.storagePath) ?? r.storagePath]));
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------
interface CollectionRow {
  id: string;
  slug: string;
  title: string;
  subline: string | null;
  coverImage: string | null;
  isSponsored: boolean;
  sponsorName: string | null;
}

interface ItemRow {
  id: string;
  collectionId: string;
  kind: "service" | "category";
  title: string | null;
  note: string | null;
  filters: Record<string, unknown>;
  serviceId: string | null;
  serviceSlug: string | null;
  serviceName: string | null;
  durations: number[] | null;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  categoryImage: string | null;
  providerId: string | null;
  providerSlug: string | null;
  providerName: string | null;
  providerAvatar: string | null;
  providerRatingAvg: string | null;
  providerRatingCount: number | null;
  providerCity: string | null;
}

/**
 * Items that can be shown: active service (or category), and a pinned Profi only while approved and offering the
 * service. Explicit conditions, so the owner connection of the admin preview filters exactly like RLS does.
 */
async function queryItems(tx: Queryable, collectionIds: string[]): Promise<ItemRow[]> {
  if (collectionIds.length === 0) return [];
  return tx<ItemRow[]>`
    select i.id, i.collection_id, i.kind, i.title, i.note, i.filters,
           s.id as service_id, s.slug as service_slug, s.name as service_name, s.durations,
           coalesce(sc.id, ic.id) as category_id, coalesce(sc.slug, ic.slug) as category_slug,
           coalesce(sc.name, ic.name) as category_name, coalesce(sc.image_path, ic.image_path) as category_image,
           p.id as provider_id, p.slug as provider_slug, p.display_name as provider_name, p.avatar_path as provider_avatar,
           p.rating_avg::text as provider_rating_avg, p.rating_count as provider_rating_count, ci.name as provider_city
    from public.explore_collection_items i
    left join public.services s on s.id = i.service_id and s.is_active
    left join public.categories sc on sc.id = s.category_id and sc.is_active
    left join public.categories ic on ic.id = i.category_id and ic.is_active
    left join public.providers p on p.id = i.provider_id and p.status = 'approved'
    left join public.postal_codes pc on pc.postal_code = p.base_postal_code
    left join public.cities ci on ci.slug = pc.city_slug
    where i.collection_id = any(${collectionIds}::uuid[])
      and (
        (i.kind = 'service' and s.id is not null and sc.id is not null
          and (i.provider_id is null or (p.id is not null and exists (
            select 1 from public.provider_services ps where ps.provider_id = p.id and ps.service_id = s.id and ps.is_active))))
        or (i.kind = 'category' and ic.id is not null)
      )
    order by i.collection_id, i.position, i.created_at`;
}

const zFilters = z
  .object({
    plz: z.string().regex(/^\d{5}$/).optional(),
    leistung: zSlug.optional(),
    datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    zeit: z.enum(["morgens", "mittags", "abends"]).optional(),
  })
  .catch({});

/** Builds the cards for item rows: real "ab" prices, real ratings, images, links into the existing flow. */
async function itemCards(tx: Queryable, items: ItemRow[]): Promise<Map<string, ExploreCardDTO>> {
  const out = new Map<string, ExploreCardDTO>();
  if (items.length === 0) return out;
  const serviceIds = [...new Set(items.filter((i) => i.kind === "service" && !i.providerId && i.serviceId).map((i) => i.serviceId as string))];
  const categoryIds = [...new Set(items.filter((i) => i.kind === "category").map((i) => i.categoryId))];
  const pinned = items.filter((i) => i.kind === "service" && i.providerId && i.serviceId);

  const [floors, catFloors, pinnedOffers, ratings, images] = await Promise.all([
    serviceIds.length
      ? tx<{ serviceId: string; fromCents: number }[]>`
          select ps.service_id, min(ps.price_cents)::int as from_cents
          from public.provider_services ps
          join public.providers p on p.id = ps.provider_id and p.status = 'approved'
          where ps.is_active and ps.service_id = any(${serviceIds}::uuid[])
          group by ps.service_id`
      : Promise.resolve([]),
    categoryIds.length
      ? tx<{ categoryId: string; fromCents: number }[]>`
          select s.category_id, min(ps.price_cents)::int as from_cents
          from public.provider_services ps
          join public.services s on s.id = ps.service_id and s.is_active
          join public.providers p on p.id = ps.provider_id and p.status = 'approved'
          where ps.is_active and s.category_id = any(${categoryIds}::uuid[])
          group by s.category_id`
      : Promise.resolve([]),
    pinned.length
      ? tx<{ providerId: string; serviceId: string; priceCents: number; durationMinutes: number }[]>`
          select provider_id, service_id, price_cents, duration_minutes from public.provider_services
          where is_active and provider_id = any(${pinned.map((i) => i.providerId as string)}::uuid[])
            and service_id = any(${pinned.map((i) => i.serviceId as string)}::uuid[])`
      : Promise.resolve([]),
    serviceRatings(tx, serviceIds),
    portfolioImages(tx, pinned.map((i) => ({ providerId: i.providerId as string, categoryId: i.categoryId }))),
  ]);
  const floorBy = new Map(floors.map((f) => [f.serviceId, f.fromCents]));
  const catFloorBy = new Map(catFloors.map((f) => [f.categoryId, f.fromCents]));

  for (const i of items) {
    const base = { key: i.id, eyebrow: i.categoryName, categorySlug: i.categorySlug, note: i.note };
    if (i.kind === "category") {
      const f = zFilters.parse(i.filters ?? {});
      const from = catFloorBy.get(i.categoryId);
      out.set(i.id, {
        ...base,
        href: exploreSearch(i.categorySlug, f),
        title: i.title?.trim() || i.categoryName,
        imagePath: categoryImage(i.categorySlug, i.categoryImage),
        durations: [],
        price: from != null ? { cents: from, from: true } : null,
        rating: null,
        provider: null,
      });
      continue;
    }
    if (i.providerId && i.providerSlug && i.providerName) {
      const offers = pinnedOffers.filter((o) => o.providerId === i.providerId && o.serviceId === i.serviceId);
      out.set(i.id, {
        ...base,
        href: routes.provider(i.providerSlug, { leistung: i.serviceSlug ?? undefined }),
        title: i.title?.trim() || (i.serviceName ?? i.categoryName),
        imagePath: images.get(`${i.providerId}:${i.categoryId}`) ?? categoryImage(i.categorySlug, i.categoryImage),
        durations: [...new Set(offers.map((o) => o.durationMinutes))].sort((a, b) => a - b),
        price: priceFrom(offers.map((o) => o.priceCents)),
        rating: visibleRating(i.providerRatingAvg, i.providerRatingCount),
        provider: person({ id: i.providerId, slug: i.providerSlug, displayName: i.providerName, avatarPath: i.providerAvatar, cityName: i.providerCity }),
      });
      continue;
    }
    const from = i.serviceId ? floorBy.get(i.serviceId) : undefined;
    out.set(i.id, {
      ...base,
      href: exploreSearch(i.categorySlug, { leistung: i.serviceSlug ?? undefined }),
      title: i.title?.trim() || (i.serviceName ?? i.categoryName),
      imagePath: categoryImage(i.categorySlug, i.categoryImage),
      durations: [...(i.durations ?? [])].sort((a, b) => a - b),
      price: from != null ? { cents: from, from: true } : null,
      rating: i.serviceId ? ratings.get(i.serviceId) ?? null : null,
      provider: null,
    });
  }
  return out;
}

/** /suche with the existing params (plz, kategorie, leistung, datum, zeit). */
function exploreSearch(categorySlug: string, f: { plz?: string; leistung?: string; datum?: string; zeit?: "morgens" | "mittags" | "abends" }): string {
  return routes.search({ plz: f.plz, kategorie: categorySlug, leistung: f.leistung, datum: f.datum, zeit: f.zeit });
}

function toCollectionCard(c: CollectionRow, items: ItemRow[]): ExploreCollectionCardDTO {
  const own = items.filter((i) => i.collectionId === c.id);
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subline: c.subline,
    coverImage: c.coverImage,
    tone: own[0]?.categorySlug ?? "massage",
    itemCount: own.length,
    isSponsored: c.isSponsored,
    sponsorName: c.isSponsored ? c.sponsorName : null,
  };
}

const COLLECTION_COLUMNS = "c.id, c.slug, c.title, c.subline, c.cover_image, c.is_sponsored, c.sponsor_name";

/** Live collections for /entdecken (RLS: published and inside the active window), in admin sort order. */
export async function listExploreCollections(): Promise<ExploreCollectionCardDTO[]> {
  return withAnon(async (tx) => {
    const rows = await tx<CollectionRow[]>`
      select ${tx.unsafe(COLLECTION_COLUMNS)} from public.explore_collections c
      where c.is_published and (c.active_from is null or c.active_from <= now()) and (c.active_until is null or c.active_until > now())
      order by c.sort_order, c.title`;
    const items = await queryItems(tx, rows.map((r) => r.id));
    return rows.map((r) => toCollectionCard(r, items)).filter((c) => c.itemCount > 0);
  });
}

/** Slugs of live collections (generateStaticParams, sitemap). */
export async function listExploreCollectionSlugs(): Promise<string[]> {
  return (await listExploreCollections()).map((c) => c.slug);
}

/** One live collection with its cards; null when unknown, not live or empty. */
export async function getExploreCollection(slug: string): Promise<ExploreCollectionDTO | null> {
  const s = parse(zSlug, slug);
  return withAnon(async (tx) => {
    const [row] = await tx<CollectionRow[]>`
      select ${tx.unsafe(COLLECTION_COLUMNS)} from public.explore_collections c
      where c.slug = ${s} and c.is_published and (c.active_from is null or c.active_from <= now()) and (c.active_until is null or c.active_until > now())`;
    if (!row) return null;
    const dto = await resolveCollection(tx, row);
    return dto.items.length ? dto : null;
  });
}

/** Resolves a collection row into cards (public page and admin preview). */
export async function resolveCollection(tx: Queryable, row: CollectionRow): Promise<ExploreCollectionDTO> {
  const items = await queryItems(tx, [row.id]);
  const cards = await itemCards(tx, items);
  return { ...toCollectionCard(row, items), items: items.map((i) => cards.get(i.id)).filter((c): c is ExploreCardDTO => !!c) };
}
export type { CollectionRow as ExploreCollectionRow };

// ---------------------------------------------------------------------------
// „Beliebt in <Stadt>“
// ---------------------------------------------------------------------------
/**
 * Per active city: the services with the most confirmed, started or completed bookings made in the last 90 days
 * (explore_popular_services: only cities with ≥ 5 such bookings, only services with ≥ 3). A service is listed only
 * while someone in the city offers it; the "ab" price and the rating are the city's own. No counts are returned.
 */
export async function listPopularByCity(): Promise<ExploreCityPopularDTO[]> {
  return withAnon(async (tx) => {
    const cities = await tx<{ slug: string; name: string }[]>`select slug, name from public.cities where is_active order by sort_order, name`;
    const out: ExploreCityPopularDTO[] = [];
    for (const city of cities) {
      const top = await tx<{ serviceId: string }[]>`
        select service_id from public.explore_popular_services(
          ${city.slug}, ${POPULAR_WINDOW_DAYS}, ${POPULAR_MIN_CITY_BOOKINGS}, ${POPULAR_MIN_SERVICE_BOOKINGS}, ${POPULAR_LIMIT * 2})`;
      if (top.length === 0) continue;
      const ids = top.map((t) => t.serviceId);
      const [services, floors, ratings] = await Promise.all([
        tx<{ id: string; slug: string; name: string; durations: number[]; categorySlug: string; categoryName: string; categoryImage: string | null }[]>`
          select s.id, s.slug, s.name, s.durations, c.slug as category_slug, c.name as category_name, c.image_path as category_image
          from public.services s join public.categories c on c.id = s.category_id and c.is_active
          where s.id = any(${ids}::uuid[]) and s.is_active`,
        tx<{ serviceId: string; fromCents: number }[]>`
          select ps.service_id, min(ps.price_cents)::int as from_cents
          from public.provider_services ps
          join public.providers p on p.id = ps.provider_id and p.status = 'approved' and p.base_lat is not null
          join public.cities tc on tc.slug = ${city.slug}
          left join public.postal_codes bpc on bpc.postal_code = p.base_postal_code
          where ps.is_active and ps.service_id = any(${ids}::uuid[])
            and (bpc.city_slug = tc.slug or public.haversine_km(p.base_lat, p.base_lng, tc.lat, tc.lng) <= p.service_radius_km)
          group by ps.service_id`,
        serviceRatings(tx, ids, city.slug),
      ]);
      const svc = new Map(services.map((s) => [s.id, s]));
      const floor = new Map(floors.map((f) => [f.serviceId, f.fromCents]));
      const cards: ExploreCardDTO[] = [];
      for (const id of ids) {
        const s = svc.get(id);
        const from = floor.get(id);
        if (!s || from == null) continue;
        cards.push({
          key: `${city.slug}:${s.id}`,
          href: exploreSearch(s.categorySlug, { leistung: s.slug }),
          title: s.name,
          eyebrow: s.categoryName,
          categorySlug: s.categorySlug,
          note: null,
          imagePath: categoryImage(s.categorySlug, s.categoryImage),
          durations: [...s.durations].sort((a, b) => a - b),
          price: { cents: from, from: true },
          rating: ratings.get(s.id) ?? null,
          provider: null,
        });
        if (cards.length >= POPULAR_LIMIT) break;
      }
      if (cards.length) out.push({ citySlug: city.slug, cityName: city.name, cards });
    }
    return out;
  });
}

// ---------------------------------------------------------------------------
// „Neu auf SOMA“
// ---------------------------------------------------------------------------
interface NewProviderRow extends ProviderCardRow {
  approvedAt: Date;
}

async function enrichProviders(tx: Queryable, rows: NewProviderRow[]): Promise<ExploreProviderDTO[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const offers = await tx<{ providerId: string; providerServiceId: string; serviceSlug: string; serviceName: string; durationMinutes: number; priceCents: number; categorySlug: string; categoryName: string; categorySort: number }[]>`
    select ps.provider_id, ps.id as provider_service_id, s.slug as service_slug, s.name as service_name, ps.duration_minutes, ps.price_cents,
           c.slug as category_slug, c.name as category_name, c.sort_order as category_sort
    from public.provider_services ps
    join public.services s on s.id = ps.service_id and s.is_active
    join public.categories c on c.id = s.category_id and c.is_active
    where ps.is_active and ps.provider_id = any(${ids}::uuid[])
    order by c.sort_order, s.sort_order, ps.price_cents`;
  return rows
    .map((r) => {
      const own = offers.filter((o) => o.providerId === r.id);
      const card = toProviderCard(r);
      const cats = [...new Map(own.map((o) => [o.categorySlug, { slug: o.categorySlug, name: o.categoryName }])).values()];
      return {
        providerId: card.providerId,
        slug: card.slug,
        displayName: card.displayName,
        headline: card.headline,
        avatarUrl: card.avatarUrl,
        ratingAvg: card.ratingAvg,
        ratingCount: card.ratingCount,
        bookingMode: card.bookingMode,
        cityName: card.cityName,
        categories: cats,
        approvedAt: r.approvedAt.toISOString(),
        fromPriceCents: own.length ? Math.min(...own.map((o) => o.priceCents)) : null,
      };
    })
    .filter((p) => p.categories.length > 0);
}

/** Profis approved in the last 60 days, newest first. */
export async function listNewProviders(opts: { limit?: number } = {}): Promise<ExploreProviderDTO[]> {
  const limit = Math.min(12, Math.max(1, Math.floor(opts.limit ?? 8)));
  return withAnon(async (tx) => {
    const rows = await tx<NewProviderRow[]>`
      select ${tx.unsafe(PROVIDER_CARD_COLUMNS)}, p.approved_at
      from public.providers p
      left join public.postal_codes pc on pc.postal_code = p.base_postal_code
      left join public.cities ci on ci.slug = pc.city_slug
      where p.status = 'approved' and p.approved_at >= now() - make_interval(days => ${EXPLORE_NEW_DAYS})
        and exists (select 1 from public.provider_services ps join public.services s on s.id = ps.service_id and s.is_active
                    where ps.provider_id = p.id and ps.is_active)
      order by p.approved_at desc, p.slug
      limit ${limit}`;
    return enrichProviders(tx, rows);
  });
}

// ---------------------------------------------------------------------------
// „Für dich“ (customer, own data only)
// ---------------------------------------------------------------------------
export async function getPersonalizedSuggestions(session: Session): Promise<boolean> {
  const s = requireRoleIn(session, "customer");
  return withUser(s.userId, async (tx) => {
    const [row] = await tx<{ personalizedSuggestions: boolean }[]>`select personalized_suggestions from public.profiles where id = ${s.userId}`;
    if (!row) throw new ServiceError("not_found", "Profil nicht gefunden.");
    return row.personalizedSuggestions;
  });
}

/** „Persönliche Vorschläge“ on/off (the customer's own row; column grant + profiles_update_own). */
export async function setPersonalizedSuggestions(session: Session, enabled: boolean): Promise<boolean> {
  const s = requireRoleIn(session, "customer");
  const v = parse(z.boolean(), enabled);
  return withUser(s.userId, async (tx) => {
    const [row] = await tx<{ personalizedSuggestions: boolean }[]>`
      update public.profiles set personalized_suggestions = ${v} where id = ${s.userId} returning personalized_suggestions`;
    if (!row) throw new ServiceError("not_found", "Profil nicht gefunden.");
    return row.personalizedSuggestions;
  });
}

interface ScheduleProviderRow {
  id: string;
  leadTimeMinutes: number;
  maxAdvanceDays: number;
  travelBufferMinutes: number;
  bookingMode: "instant" | "request";
}

interface CandidateOfferRow extends ProviderCardRow {
  providerServiceId: string;
  serviceId: string;
  serviceSlug: string;
  serviceName: string;
  durationMinutes: number;
  priceCents: number;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  categoryImage: string | null;
  leadTimeMinutes: number;
  maxAdvanceDays: number;
  travelBufferMinutes: number;
  travelFeeBaseCents: number;
  travelFeeIncludedKm: string;
  travelFeePerKmCents: number;
  distanceKm: number;
  approvedAt: Date | null;
}

const OFFER_COLUMNS = `ps.id as provider_service_id, ps.service_id, s.slug as service_slug, s.name as service_name, ps.duration_minutes, ps.price_cents,
  c.id as category_id, c.slug as category_slug, c.name as category_name, c.image_path as category_image,
  p.lead_time_minutes, p.max_advance_days, p.travel_buffer_minutes, p.travel_fee_base_cents,
  p.travel_fee_included_km::text as travel_fee_included_km, p.travel_fee_per_km_cents, p.approved_at`;

/**
 * „Für dich“ for the signed-in customer:
 *  - rebook: their regular Profis (last completed booking per approved Profi) and favourites;
 *  - matching: services in categories they booked, from Profis serving their default address's PLZ
 *    (not the Profi–service pairs they already booked), one per service, varied across categories;
 *  - nearbyNew: Profis approved in the last 60 days who serve that PLZ.
 * Opted out → `{ state: "off" }` before anything else is read.
 */
export async function getForYou(session: Session, opts: { now?: Date } = {}): Promise<ForYouDTO> {
  const s = requireRoleIn(session, "customer");
  const now = opts.now ?? new Date();
  return withUser(s.userId, async (tx) => {
    const [me] = await tx<{ personalizedSuggestions: boolean; firstName: string | null }[]>`
      select personalized_suggestions, first_name from public.profiles where id = ${s.userId}`;
    if (!me) throw new ServiceError("not_found", "Profil nicht gefunden.");
    if (!me.personalizedSuggestions) return { state: "off" as const };

    const [addr] = await tx<{ label: string | null; postalCode: string; city: string; citySlug: string | null; lat: number; lng: number }[]>`
      select a.label, a.postal_code, a.city, ci.slug as city_slug, pc.lat, pc.lng
      from public.addresses a
      join public.postal_codes pc on pc.postal_code = a.postal_code
      left join public.cities ci on ci.slug = pc.city_slug and ci.is_active
      where a.user_id = ${s.userId}
      order by a.is_default desc, a.created_at
      limit 1`;

    const booked = await tx<{ providerId: string; providerServiceId: string; serviceId: string; serviceName: string; categoryId: string; status: string; startsAt: Date; id: string }[]>`
      select b.id, b.provider_id, b.provider_service_id, b.service_id, b.service_name, b.category_id, b.status, b.starts_at
      from public.bookings b
      where b.customer_id = ${s.userId} and b.status in ('confirmed', 'in_progress', 'completed')
      order by b.starts_at desc`;
    const completed = booked.filter((b) => b.status === "completed");
    const favorites = await tx<{ providerId: string; createdAt: Date }[]>`
      select provider_id, created_at from public.favorites where customer_id = ${s.userId} order by created_at desc`;

    // --- rebook: last completed booking per Profi, then favourites without one ---------------------------------
    const lastByProvider = new Map<string, (typeof completed)[number]>();
    for (const b of completed) if (!lastByProvider.has(b.providerId)) lastByProvider.set(b.providerId, b);
    const favIds = new Set(favorites.map((f) => f.providerId));
    const rebookIds = [...new Set([...lastByProvider.keys(), ...favorites.map((f) => f.providerId)])];
    const rebookProviders = rebookIds.length
      ? await tx<Array<ProviderCardRow & ScheduleProviderRow>>`
          select ${tx.unsafe(PROVIDER_CARD_COLUMNS)}, p.lead_time_minutes, p.max_advance_days, p.travel_buffer_minutes
          from public.providers p
          left join public.postal_codes pc on pc.postal_code = p.base_postal_code
          left join public.cities ci on ci.slug = pc.city_slug
          where p.id = any(${rebookIds}::uuid[]) and p.status = 'approved'`
      : [];
    const rebookOffers = lastByProvider.size
      ? await tx<{ id: string; providerId: string; serviceId: string; durationMinutes: number }[]>`
          select id, provider_id, service_id, duration_minutes from public.provider_services
          where is_active and provider_id = any(${[...lastByProvider.keys()]}::uuid[])`
      : [];

    // --- matching + nearby new (need the default address) ------------------------------------------------------
    const categoryOrder: string[] = [];
    for (const b of booked) if (!categoryOrder.includes(b.categoryId)) categoryOrder.push(b.categoryId);
    const donePairs = new Set(completed.map((b) => `${b.providerId}:${b.serviceId}`));
    let candidates: CandidateOfferRow[] = [];
    let fresh: CandidateOfferRow[] = [];
    if (addr) {
      if (categoryOrder.length) {
        candidates = await tx<CandidateOfferRow[]>`
          select ${tx.unsafe(PROVIDER_CARD_COLUMNS)}, ${tx.unsafe(OFFER_COLUMNS)},
                 public.haversine_km(p.base_lat, p.base_lng, ${addr.lat}, ${addr.lng}) as distance_km
          from public.provider_services ps
          join public.services s on s.id = ps.service_id and s.is_active
          join public.categories c on c.id = s.category_id and c.is_active
          join public.providers p on p.id = ps.provider_id and p.status = 'approved' and p.base_lat is not null
          left join public.postal_codes pc on pc.postal_code = p.base_postal_code
          left join public.cities ci on ci.slug = pc.city_slug
          where ps.is_active and c.id = any(${categoryOrder}::uuid[])
            and public.haversine_km(p.base_lat, p.base_lng, ${addr.lat}, ${addr.lng}) <= p.service_radius_km`;
        candidates = candidates.filter((c) => !donePairs.has(`${c.id}:${c.serviceId}`));
      }
      fresh = await tx<CandidateOfferRow[]>`
        select ${tx.unsafe(PROVIDER_CARD_COLUMNS)}, ${tx.unsafe(OFFER_COLUMNS)},
               public.haversine_km(p.base_lat, p.base_lng, ${addr.lat}, ${addr.lng}) as distance_km
        from public.providers p
        join public.provider_services ps on ps.provider_id = p.id and ps.is_active
        join public.services s on s.id = ps.service_id and s.is_active
        join public.categories c on c.id = s.category_id and c.is_active
        left join public.postal_codes pc on pc.postal_code = p.base_postal_code
        left join public.cities ci on ci.slug = pc.city_slug
        where p.status = 'approved' and p.base_lat is not null
          and p.approved_at >= ${new Date(now.getTime() - EXPLORE_NEW_DAYS * 86_400_000)}
          and public.haversine_km(p.base_lat, p.base_lng, ${addr.lat}, ${addr.lng}) <= p.service_radius_km
        order by p.approved_at desc, ps.price_cents`;
    }

    // --- availability (one load for every Profi involved) ----------------------------------------------------
    const schedRows = new Map<string, ScheduleProviderRow>();
    for (const r of [...rebookProviders, ...candidates, ...fresh]) {
      if (!schedRows.has(r.id)) schedRows.set(r.id, { id: r.id, leadTimeMinutes: r.leadTimeMinutes, maxAdvanceDays: r.maxAdvanceDays, travelBufferMinutes: r.travelBufferMinutes, bookingMode: r.bookingMode });
    }
    const today = todayBerlin(now);
    const settings = await loadSettings(tx);
    const range = rangeForDays(today, FOR_YOU_SLOT_DAYS);
    const schedules: Map<string, ProviderSchedule> = await loadSchedules(tx, [...schedRows.values()], range.from, range.to);
    const nextSlotOf = (providerId: string, durationMinutes: number): string | null => {
      const sch = schedules.get(providerId);
      return sch ? firstSlot(slotsFor(sch, durationMinutes, settings.slotStepMinutes, now, today, FOR_YOU_SLOT_DAYS)) : null;
    };
    const travel = (c: CandidateOfferRow) =>
      computeTravelFee(Math.round(c.distanceKm * 100) / 100, { baseCents: c.travelFeeBaseCents, includedKm: Number(c.travelFeeIncludedKm), perKmCents: c.travelFeePerKmCents });

    // rebook items
    const provById = new Map(rebookProviders.map((p) => [p.id, p]));
    const rebook: ForYouRebookDTO[] = [];
    const lastOrdered = [...lastByProvider.values()].sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
    for (const b of lastOrdered) {
      const p = provById.get(b.providerId);
      if (!p) continue;
      const offer = rebookOffers.find((o) => o.id === b.providerServiceId) ?? rebookOffers.find((o) => o.providerId === b.providerId && o.serviceId === b.serviceId);
      rebook.push({
        key: `rebook:${p.id}`,
        bookingId: b.id,
        provider: person({ id: p.id, slug: p.slug, displayName: p.displayName, avatarPath: p.avatarPath, cityName: p.cityName }),
        serviceName: b.serviceName,
        lastAt: b.startsAt.toISOString(),
        isFavorite: favIds.has(p.id),
        nextSlot: offer ? nextSlotOf(p.id, offer.durationMinutes) : null,
      });
    }
    // favourites first among the regulars, then favourites without a completed booking
    rebook.sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite));
    for (const f of favorites) {
      if (lastByProvider.has(f.providerId)) continue;
      const p = provById.get(f.providerId);
      if (!p) continue;
      rebook.push({
        key: `fav:${p.id}`,
        bookingId: null,
        provider: person({ id: p.id, slug: p.slug, displayName: p.displayName, avatarPath: p.avatarPath, cityName: p.cityName }),
        serviceName: null,
        lastAt: null,
        isFavorite: true,
        nextSlot: null,
      });
    }

    // matching: best offer per service (bookable within 7 days, Bayesian rating, then the earlier slot)
    const bestByService = new Map<string, { row: CandidateOfferRow; slot: string; score: number }>();
    for (const c of candidates) {
      const slot = nextSlotOf(c.id, c.durationMinutes);
      if (!slot) continue;
      const score = bayesianRating(c.ratingAvg == null ? null : Number(c.ratingAvg), c.ratingCount);
      const prev = bestByService.get(c.serviceId);
      if (!prev || score > prev.score + 1e-9 || (Math.abs(score - prev.score) <= 1e-9 && slot < prev.slot)) bestByService.set(c.serviceId, { row: c, slot, score });
    }
    const groups = categoryOrder.map((cat) =>
      [...bestByService.values()].filter((v) => v.row.categoryId === cat).sort((a, b) => b.score - a.score || a.slot.localeCompare(b.slot)),
    );
    const picked = interleave(groups, FOR_YOU_LIMIT);
    const pics = await portfolioImages(tx, picked.map((p) => ({ providerId: p.row.id, categoryId: p.row.categoryId })));
    const matching: ExploreCardDTO[] = picked.map(({ row: c, slot }) => ({
      key: `match:${c.providerServiceId}`,
      href: routes.provider(c.slug, { leistung: c.serviceSlug, dauer: c.durationMinutes, plz: addr?.postalCode }),
      title: c.serviceName,
      eyebrow: c.categoryName,
      categorySlug: c.categorySlug,
      note: null,
      imagePath: pics.get(`${c.id}:${c.categoryId}`) ?? categoryImage(c.categorySlug, c.categoryImage),
      durations: [c.durationMinutes],
      price: { cents: c.priceCents, from: false },
      rating: visibleRating(c.ratingAvg, c.ratingCount),
      provider: person({ id: c.id, slug: c.slug, displayName: c.displayName, avatarPath: c.avatarPath, cityName: c.cityName }),
      endPriceCents: c.priceCents + travel(c),
      nextSlot: slot,
    }));

    // nearby new: one card per Profi, the cheapest offering (rows are ordered by approval, then price)
    const seen = new Set<string>();
    const nearbyRows: CandidateOfferRow[] = [];
    for (const r of fresh) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      nearbyRows.push(r);
      if (nearbyRows.length >= 6) break;
    }
    const nearbyBase = await enrichProviders(tx, nearbyRows.map((r) => ({ ...r, approvedAt: r.approvedAt ?? now })));
    const nearbyNew = nearbyBase.map((p) => {
      const r = nearbyRows.find((x) => x.id === p.providerId) as CandidateOfferRow;
      return {
        ...p,
        offering: { providerServiceId: r.providerServiceId, serviceSlug: r.serviceSlug, serviceName: r.serviceName, durationMinutes: r.durationMinutes },
        endPriceCents: r.priceCents + travel(r),
        nextSlot: nextSlotOf(r.id, r.durationMinutes),
      };
    });

    return {
      state: "on" as const,
      firstName: me.firstName,
      place: addr ? { postalCode: addr.postalCode, city: addr.city, citySlug: addr.citySlug, label: addr.label } : null,
      hasHistory: booked.length > 0,
      rebook: rebook.slice(0, 6),
      matching,
      nearbyNew,
    };
  });
}
