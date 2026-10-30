import "server-only";

import { z } from "zod";
import { withAnon, type Queryable } from "../db/client";
import type { CancellationPolicyDTO, CoverageDTO, PostalCodeDTO, ProviderCardDTO, RequiredDocumentDTO, Session } from "../dto";
import { listCustomerBookings, rebookOptions } from "./bookings";
import { queryPostalCode } from "./catalog";
import { PROVIDER_CARD_COLUMNS, toProviderCard, type ProviderCardRow } from "./providers";
import { loadSettings, parse, policyToDTO, requireRoleIn } from "./_shared";

/**
 * Discovery & brand surfaces (Agent 3a): read-only helpers for the public
 * marketing / SEO pages that the core catalogue does not cover yet.
 * All reads run as `anon` under RLS (approved providers and active offerings only).
 *
 * Coverage rule is the same as `getCityCategoryCoverage`: a provider serves a
 * city when its base PLZ lies in the city or its radius covers the city centre.
 */

// ---------------------------------------------------------------------------
// Types (import with `import type` from client components)
// ---------------------------------------------------------------------------
export interface DiscoveryProviderDTO extends ProviderCardDTO {
  /** categories the provider actively offers, in catalogue order */
  categories: Array<{ slug: string; name: string }>;
  /** cheapest active offering (in the requested category, if any); excludes travel fee */
  fromPriceCents: number | null;
}

export interface PriceFloorDTO {
  serviceId: string;
  categorySlug: string;
  fromCents: number;
  providerCount: number;
}

export interface PublicTermsDTO {
  cancellationPolicy: CancellationPolicyDTO;
  holdMinutes: number;
  requestResponseHours: number;
  reviewWindowDays: number;
  disputeWindowHours: number;
  payoutHoldHours: number;
  customerServiceFeeCents: number;
  baseRequiredDocuments: RequiredDocumentDTO[];
  coverageMinProviders: number;
  /** days searched when no date is picked ("So bald wie möglich") */
  searchDaysAhead: number;
}

export interface RebookSuggestionDTO {
  bookingId: string;
  providerName: string;
  providerSlug: string;
  providerAvatarUrl: string | null;
  serviceName: string;
  durationMinutes: number;
  providerServiceId: string;
  addressId: string | null;
  postalCode: string;
  /** next bookable slot within 7 days (ISO), null when none */
  nextSlot: string | null;
}

const zSlug = z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/, "Ungültiger Wert.");

/** Coverage predicate for provider `p` and target city `tc` (expects alias `bpc` for the provider's base PLZ). */
function coverage(tx: Queryable) {
  return tx`(bpc.city_slug = tc.slug or public.haversine_km(p.base_lat, p.base_lng, tc.lat, tc.lng) <= p.service_radius_km)`;
}

// ---------------------------------------------------------------------------
// Providers for discovery rows (home, category, city, SEO pages)
// ---------------------------------------------------------------------------
export async function listDiscoveryProviders(opts: { categorySlug?: string; citySlug?: string; limit?: number } = {}): Promise<DiscoveryProviderDTO[]> {
  const cat = opts.categorySlug ? parse(zSlug, opts.categorySlug) : null;
  const city = opts.citySlug ? parse(zSlug, opts.citySlug) : null;
  const limit = Math.min(48, Math.max(1, Math.floor(opts.limit ?? 12)));
  return withAnon(async (tx) => {
    const rows = await tx<Array<ProviderCardRow & { fromPrice: number | null }>>`
      with eligible as (
        select p.id, min(ps.price_cents)::int as from_price
        from public.providers p
        join public.provider_services ps on ps.provider_id = p.id and ps.is_active
        join public.services s on s.id = ps.service_id and s.is_active
        join public.categories c on c.id = s.category_id and c.is_active
        ${city ? tx`join public.cities tc on tc.slug = ${city} left join public.postal_codes bpc on bpc.postal_code = p.base_postal_code` : tx``}
        where p.status = 'approved'
          ${cat ? tx`and c.slug = ${cat}` : tx``}
          ${city ? tx`and p.base_lat is not null and ${coverage(tx)}` : tx``}
        group by p.id
      )
      select ${tx.unsafe(PROVIDER_CARD_COLUMNS)}, e.from_price
      from eligible e
      join public.providers p on p.id = e.id
      left join public.postal_codes pc on pc.postal_code = p.base_postal_code
      left join public.cities ci on ci.slug = pc.city_slug
      order by ((5 * 4.6 + coalesce(p.rating_avg, 0) * p.rating_count) / (5 + p.rating_count)) desc, p.completed_count desc, p.slug
      limit ${limit}`;
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const cats = await tx<Array<{ providerId: string; slug: string; name: string }>>`
      select ps.provider_id, c.slug, c.name
      from public.provider_services ps
      join public.services s on s.id = ps.service_id and s.is_active
      join public.categories c on c.id = s.category_id and c.is_active
      where ps.provider_id = any(${ids}::uuid[]) and ps.is_active
      group by ps.provider_id, c.slug, c.name, c.sort_order
      order by c.sort_order`;
    return rows.map((r) => ({
      ...toProviderCard(r),
      categories: cats.filter((c) => c.providerId === r.id).map((c) => ({ slug: c.slug, name: c.name })),
      fromPriceCents: r.fromPrice ?? null,
    }));
  });
}

/** Real "ab" prices: the cheapest active offering per service (optionally within a category and/or city). */
export async function getPriceFloors(opts: { categorySlug?: string; citySlug?: string } = {}): Promise<PriceFloorDTO[]> {
  const cat = opts.categorySlug ? parse(zSlug, opts.categorySlug) : null;
  const city = opts.citySlug ? parse(zSlug, opts.citySlug) : null;
  return withAnon((tx) => tx<PriceFloorDTO[]>`
    select s.id as service_id, c.slug as category_slug, min(ps.price_cents)::int as from_cents, count(distinct p.id)::int as provider_count
    from public.providers p
    join public.provider_services ps on ps.provider_id = p.id and ps.is_active
    join public.services s on s.id = ps.service_id and s.is_active
    join public.categories c on c.id = s.category_id and c.is_active
    ${city ? tx`join public.cities tc on tc.slug = ${city} left join public.postal_codes bpc on bpc.postal_code = p.base_postal_code` : tx``}
    where p.status = 'approved'
      ${cat ? tx`and c.slug = ${cat}` : tx``}
      ${city ? tx`and p.base_lat is not null and ${coverage(tx)}` : tx``}
    group by s.id, c.slug`);
}

/** Provider counts for every active city × category pair in one round trip (sitemap, city hubs, link lists). */
export async function getCoverageMatrix(): Promise<CoverageDTO[]> {
  return withAnon(async (tx) => {
    const settings = await loadSettings(tx);
    const rows = await tx<Array<{ citySlug: string; categorySlug: string; providerCount: number }>>`
      select tc.slug as city_slug, c.slug as category_slug, count(distinct p.id)::int as provider_count
      from public.cities tc
      cross join public.categories c
      left join public.services s on s.category_id = c.id and s.is_active
      left join public.provider_services ps on ps.service_id = s.id and ps.is_active
      left join public.providers p on p.id = ps.provider_id and p.status = 'approved' and p.base_lat is not null
        and (exists (select 1 from public.postal_codes bpc where bpc.postal_code = p.base_postal_code and bpc.city_slug = tc.slug)
             or public.haversine_km(p.base_lat, p.base_lng, tc.lat, tc.lng) <= p.service_radius_km)
      where tc.is_active and c.is_active
      group by tc.slug, tc.sort_order, c.slug, c.sort_order
      order by tc.sort_order, c.sort_order`;
    return rows.map((r) => ({ ...r, indexable: r.providerCount >= settings.coverageMinProviders }));
  });
}

/** Lowest PLZ per launch city, used as a realistic input example ("z. B. 10115"). */
export async function listCityPostalExamples(): Promise<Record<string, string>> {
  return withAnon(async (tx) => {
    const rows = await tx<Array<{ citySlug: string; postalCode: string }>>`
      select city_slug, min(postal_code) as postal_code from public.postal_codes where city_slug is not null group by city_slug`;
    return Object.fromEntries(rows.map((r) => [r.citySlug, r.postalCode]));
  });
}

/** Public platform terms for the cancellation and help pages (platform_settings is anon-readable). */
export async function getPublicTerms(): Promise<PublicTermsDTO> {
  return withAnon(async (tx) => {
    const s = await loadSettings(tx);
    return {
      cancellationPolicy: policyToDTO(s.cancellationPolicy),
      holdMinutes: s.holdMinutes,
      requestResponseHours: s.requestResponseHours,
      reviewWindowDays: s.reviewWindowDays,
      disputeWindowHours: s.disputeWindowHours,
      payoutHoldHours: s.payoutHoldHours,
      customerServiceFeeCents: s.customerServiceFeeCents,
      baseRequiredDocuments: s.baseRequiredDocuments,
      coverageMinProviders: s.coverageMinProviders,
      searchDaysAhead: s.searchDaysAhead,
    };
  });
}

const zGeo = z.object({
  lat: z.number().min(47).max(55.2, "Dieser Standort liegt außerhalb Deutschlands."),
  lng: z.number().min(5.5).max(15.5, "Dieser Standort liegt außerhalb Deutschlands."),
});

/** "Standort verwenden": nearest known PLZ centroid to a browser geolocation. */
export async function nearestPostalCode(lat: number, lng: number): Promise<PostalCodeDTO | null> {
  const g = parse(zGeo, { lat, lng });
  return withAnon(async (tx) => {
    const [row] = await tx<{ postalCode: string }[]>`
      select postal_code from public.postal_codes
      where lat between ${g.lat - 0.5} and ${g.lat + 0.5} and lng between ${g.lng - 0.8} and ${g.lng + 0.8}
      order by public.haversine_km(lat, lng, ${g.lat}, ${g.lng}) limit 1`;
    return row ? queryPostalCode(tx, row.postalCode) : null;
  });
}

/** Approved provider slugs for the sitemap. */
export async function listPublicProviderSlugs(): Promise<Array<{ slug: string; updatedAt: string | null }>> {
  return withAnon(async (tx) => {
    const rows = await tx<Array<{ slug: string; approvedAt: Date | null }>>`
      select slug, approved_at from public.providers where status = 'approved' order by slug`;
    return rows.map((r) => ({ slug: r.slug, updatedAt: r.approvedAt ? r.approvedAt.toISOString() : null }));
  });
}

/**
 * "Erneut buchen" row on the home page: the customer's most recent completed
 * booking whose provider is still bookable, with the next free slot (7 days).
 * Returns null instead of throwing for anything that is not a clean match.
 */
export async function getRebookSuggestion(session: Session): Promise<RebookSuggestionDTO | null> {
  const s = requireRoleIn(session, "customer");
  const past = await listCustomerBookings(s, "past", 1, 6);
  const last = past.items.find((b) => b.status === "completed");
  if (!last) return null;
  try {
    const opts = await rebookOptions(s, last.id);
    const nextSlot = opts.slots.flatMap((d) => d.slots)[0] ?? null;
    return {
      bookingId: last.id,
      providerName: opts.provider.displayName,
      providerSlug: opts.provider.slug,
      providerAvatarUrl: opts.provider.avatarUrl,
      serviceName: opts.serviceName,
      durationMinutes: opts.durationMinutes,
      providerServiceId: opts.providerServiceId,
      addressId: opts.addressId,
      postalCode: opts.postalCode,
      nextSlot,
    };
  } catch {
    return null;
  }
}
