import "server-only";

import { z } from "zod";
import { withAnon, withService } from "../db/client";
import { parse, zPostalCode } from "./_shared";

/**
 * Discovery & brand surfaces, second wave (audit-1 R14, R15): real aggregates for
 * the home page proof band and the live demand per launch city on /fuer-profis.
 * Read-only; no personal data leaves this file (counts, first name + initial only).
 */

// ---------------------------------------------------------------------------
// Types (import with `import type` from client components)
// ---------------------------------------------------------------------------
export interface ReviewQuoteDTO {
  id: string;
  rating: number;
  comment: string;
  /** "Julia M." (public_reviews already reduces the surname to its initial) */
  authorName: string;
  serviceName: string;
  providerName: string;
  providerSlug: string;
  /** city of the provider's base PLZ, null when unknown */
  cityName: string | null;
}

export interface SocialProofDTO {
  /** published, verified reviews (public_reviews) */
  reviewCount: number;
  /** mean of those reviews, null without reviews */
  ratingAvg: number | null;
  approvedProviders: number;
  /** active launch cities with at least one approved provider */
  cities: number;
  quotes: ReviewQuoteDTO[];
}

export interface CityDemandDTO {
  citySlug: string;
  cityName: string;
  /** searches in this city in the last `days` days */
  searches: number;
  /** waitlist sign-ups for this city (people who found nothing yet) */
  waitlistSignups: number;
  approvedProviders: number;
}

export interface DemandByCityDTO {
  days: number;
  cities: CityDemandDTO[];
}

// ---------------------------------------------------------------------------
// Home: proof band (R14)
// ---------------------------------------------------------------------------
const zLimit = z.number().int().min(1).max(6);

/**
 * Aggregates for "4,5 ★ aus 105 verifizierten Bewertungen · 28 geprüfte Profis in 6 Städten"
 * plus up to `quoteLimit` real quotes: published, rating ≥ 4, with a comment of readable
 * length, one per provider, newest first. Runs as `anon` (public_reviews is the public view).
 */
export async function getSocialProof(opts: { quoteLimit?: number } = {}): Promise<SocialProofDTO> {
  const limit = parse(zLimit, opts.quoteLimit ?? 3);
  return withAnon(async (tx) => {
    const [agg] = await tx<{ reviewCount: number; ratingAvg: string | null }[]>`
      select count(*)::int as review_count, avg(rating)::numeric(4, 2)::text as rating_avg from public.public_reviews`;
    const [supply] = await tx<{ approvedProviders: number; cities: number }[]>`
      select count(*)::int as approved_providers,
             count(distinct c.slug) filter (where c.slug is not null)::int as cities
      from public.providers p
      left join public.postal_codes pc on pc.postal_code = p.base_postal_code
      left join public.cities c on c.slug = pc.city_slug and c.is_active
      where p.status = 'approved'`;
    const quotes = await tx<ReviewQuoteDTO[]>`
      select q.id, q.rating, q.comment, q.author_name, q.service_name, q.provider_name, q.provider_slug, q.city_name
      from (
        select distinct on (r.provider_id)
               r.id, r.rating, btrim(r.comment) as comment, r.author_name, r.service_name, r.created_at,
               p.display_name as provider_name, p.slug as provider_slug, c.name as city_name
        from public.public_reviews r
        join public.providers p on p.id = r.provider_id
        left join public.postal_codes pc on pc.postal_code = p.base_postal_code
        left join public.cities c on c.slug = pc.city_slug
        where r.rating >= 4 and r.author_name is not null
          and char_length(btrim(coalesce(r.comment, ''))) between 40 and 180
        order by r.provider_id, r.rating desc, r.created_at desc
      ) q
      order by q.rating desc, q.created_at desc
      limit ${limit}`;
    return {
      reviewCount: agg?.reviewCount ?? 0,
      ratingAvg: agg?.ratingAvg != null ? Number(agg.ratingAvg) : null,
      approvedProviders: supply?.approvedProviders ?? 0,
      cities: supply?.cities ?? 0,
      quotes,
    };
  });
}

// ---------------------------------------------------------------------------
// /fuer-profis: live demand per launch city (R15)
// ---------------------------------------------------------------------------
const zDays = z.number().int().min(7).max(90);

/**
 * Searches (last `days` days) and waitlist sign-ups per active launch city, with the
 * number of approved providers based there. Same counting rules as the admin view
 * (analytics.getSupplyDemandByCity), so both show the same numbers.
 */
export async function getDemandByCity(opts: { days?: number } = {}): Promise<DemandByCityDTO> {
  const days = parse(zDays, opts.days ?? 30);
  // withService: search_events and waitlist_signups have no API grants (anonymous demand
  // analytics, waitlist e-mails). Only per-city counts are returned — no rows, no e-mails.
  const cities = await withService((tx) => tx<CityDemandDTO[]>`
    select c.slug as city_slug, c.name as city_name,
           (select count(*)::int from public.search_events se
             where se.city_slug = c.slug and se.created_at >= now() - make_interval(days => ${days})) as searches,
           (select count(*)::int from public.waitlist_signups w where w.city_slug = c.slug) as waitlist_signups,
           (select count(*)::int from public.providers p join public.postal_codes pc on pc.postal_code = p.base_postal_code
             where p.status = 'approved' and pc.city_slug = c.slug) as approved_providers
    from public.cities c
    where c.is_active
    order by c.sort_order, c.name`);
  return { days, cities };
}

// ---------------------------------------------------------------------------
// /suche: thin results → neighbouring PLZ with more coverage (audit-2 N13)
// ---------------------------------------------------------------------------
export interface NearbyPostalCodeDTO {
  postalCode: string;
  distanceKm: number;
}

const NearbySchema = z.object({
  postalCode: zPostalCode,
  serviceId: z.guid().optional(),
  categorySlug: z.string().trim().min(1).max(60).optional(),
  limit: z.number().int().min(1).max(4).optional().default(2),
});

/**
 * Up to `limit` neighbouring PLZ (same launch city, ≤ 4 km) that more approved providers
 * offering the service/category cover than the searched PLZ. Coverage only (radius and
 * offering, no slot computation), so it stays one cheap query; the link to the search for
 * that PLZ then shows real availability. Runs as `anon` (approved providers, public PLZ data).
 */
export async function listNearbyPostalCodes(raw: { postalCode: string; serviceId?: string; categorySlug?: string; limit?: number }): Promise<NearbyPostalCodeDTO[]> {
  const v = parse(NearbySchema, raw);
  return withAnon((tx) => tx<NearbyPostalCodeDTO[]>`
    with here as (
      select pc.lat, pc.lng, pc.city_slug from public.postal_codes pc
      join public.cities c on c.slug = pc.city_slug and c.is_active
      where pc.postal_code = ${v.postalCode}
    ),
    pros as (
      select p.id, p.base_lat, p.base_lng, p.service_radius_km
      from public.providers p
      where p.status = 'approved' and p.base_lat is not null
        and exists (
          select 1 from public.provider_services ps
          join public.services s on s.id = ps.service_id and s.is_active
          join public.categories cat on cat.id = s.category_id and cat.is_active
          where ps.provider_id = p.id and ps.is_active
            ${v.serviceId ? tx`and s.id = ${v.serviceId}` : v.categorySlug ? tx`and cat.slug = ${v.categorySlug}` : tx``}
        )
    ),
    covered_here as (
      select count(*)::int as n from pros, here where public.haversine_km(pros.base_lat, pros.base_lng, here.lat, here.lng) <= pros.service_radius_km
    ),
    cand as (
      select pc.postal_code, public.haversine_km(pc.lat, pc.lng, here.lat, here.lng) as distance_km, pc.lat, pc.lng
      from public.postal_codes pc, here
      where pc.city_slug = here.city_slug and pc.postal_code <> ${v.postalCode}
        and public.haversine_km(pc.lat, pc.lng, here.lat, here.lng) <= 4
    )
    select cand.postal_code, round(cand.distance_km::numeric, 1)::float as distance_km
    from cand
    join pros on public.haversine_km(pros.base_lat, pros.base_lng, cand.lat, cand.lng) <= pros.service_radius_km
    group by cand.postal_code, cand.distance_km
    having count(pros.id) > (select n from covered_here)
    order by count(pros.id) desc, cand.distance_km
    limit ${v.limit}`);
}
