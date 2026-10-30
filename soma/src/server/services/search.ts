import "server-only";

import { z } from "zod";
import { withService, withViewer } from "../db/client";
import { filterSlotsByTimeOfDay, firstSlot } from "../domain/availability";
import { computeTravelFee } from "../domain/pricing";
import { profileCompleteness, rankScore, sortRanked } from "../domain/ranking";
import { isValidLocalDate } from "../domain/tz";
import type { ProviderSearchResult, SearchInput, SearchResultDTO, Session } from "../dto";
import { ServiceError } from "../errors";
import { loadSettings, paging, parse, zPostalCode } from "./_shared";
import { loadSchedules, rangeForDays, slotsFor, todayBerlin } from "./availability-data";
import { queryPostalCode } from "./catalog";
import { PROVIDER_CARD_COLUMNS, queryOfferings, toProviderCard, type ProviderCardRow } from "./providers";

/**
 * searchProviders: approved providers whose radius covers the PLZ centroid,
 * who offer the service (or category), with at least one real slot on the
 * requested day — or within the next 7 days when no day was picked.
 * Every search is logged to search_events (no PII) for demand analytics.
 */

const SearchSchema = z.object({
  postalCode: zPostalCode,
  categorySlug: z.string().trim().min(1).max(60).optional(),
  serviceId: z.guid().optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  date: z.string().refine(isValidLocalDate, "Ungültiges Datum.").optional(),
  timeOfDay: z.enum(["morning", "afternoon", "evening"]).optional(),
  sort: z.enum(["recommended", "earliest", "price_asc", "rating"]).optional().default("recommended"),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(50).optional().default(20),
  instantOnly: z.boolean().optional().default(false),
  minRating: z.number().min(0).max(5).optional(),
  language: z.string().trim().min(2).max(5).optional(),
});

interface CandidateRow extends ProviderCardRow {
  serviceRadiusKm: string;
  travelFeeBaseCents: number;
  travelFeeIncludedKm: string;
  travelFeePerKmCents: number;
  leadTimeMinutes: number;
  maxAdvanceDays: number;
  travelBufferMinutes: number;
  approvedAt: Date | null;
  bioLength: number;
  portfolioCount: number;
  distanceKm: number;
}

export async function searchProviders(raw: SearchInput, session?: Session | null, opts: { logDemand?: boolean; now?: Date } = {}): Promise<SearchResultDTO> {
  const input = parse(SearchSchema, raw);
  const now = opts.now ?? new Date();
  const viewerId = session?.role === "customer" ? session.userId : null;

  const outcome = await withViewer(viewerId, async (tx) => {
    const location = await queryPostalCode(tx, input.postalCode);
    if (!location) throw new ServiceError("validation", "Diese Postleitzahl kennen wir leider nicht.", { postalCode: "Unbekannte Postleitzahl." });
    const settings = await loadSettings(tx);

    let categoryId: string | null = null;
    let serviceId: string | null = null;
    if (input.serviceId) {
      const [svc] = await tx<{ id: string; categoryId: string }[]>`select id, category_id from public.services where id = ${input.serviceId} and is_active`;
      if (!svc) throw new ServiceError("not_found", "Diese Behandlung gibt es nicht (mehr).");
      serviceId = svc.id;
      categoryId = svc.categoryId;
    } else if (input.categorySlug) {
      const [cat] = await tx<{ id: string }[]>`select id from public.categories where slug = ${input.categorySlug} and is_active`;
      if (!cat) throw new ServiceError("not_found", "Diese Kategorie gibt es nicht (mehr).");
      categoryId = cat.id;
    }

    const candidates = await tx<CandidateRow[]>`
      select ${tx.unsafe(PROVIDER_CARD_COLUMNS)},
             p.service_radius_km::text as service_radius_km, p.travel_fee_base_cents, p.travel_fee_included_km::text as travel_fee_included_km,
             p.travel_fee_per_km_cents, p.lead_time_minutes, p.max_advance_days, p.travel_buffer_minutes, p.approved_at,
             coalesce(char_length(p.bio), 0)::int as bio_length,
             (select count(*)::int from public.provider_portfolio pp where pp.provider_id = p.id) as portfolio_count,
             public.haversine_km(p.base_lat, p.base_lng, ${location.lat}, ${location.lng}) as distance_km
      from public.providers p
      left join public.postal_codes pc on pc.postal_code = p.base_postal_code
      left join public.cities ci on ci.slug = pc.city_slug
      where p.status = 'approved' and p.base_lat is not null
        and public.haversine_km(p.base_lat, p.base_lng, ${location.lat}, ${location.lng}) <= p.service_radius_km
        ${input.instantOnly ? tx`and p.booking_mode = 'instant'` : tx``}
        ${input.minRating != null ? tx`and p.rating_avg >= ${input.minRating}` : tx``}
        ${input.language ? tx`and ${input.language} = any(p.languages)` : tx``}
        and exists (
          select 1 from public.provider_services ps join public.services s on s.id = ps.service_id and s.is_active
          where ps.provider_id = p.id and ps.is_active
            ${serviceId ? tx`and s.id = ${serviceId}` : categoryId ? tx`and s.category_id = ${categoryId}` : tx``}
            ${input.durationMinutes ? tx`and ps.duration_minutes = ${input.durationMinutes}` : tx``}
        )`;

    const offerings = await queryOfferings(tx, candidates.map((c) => c.id));
    const fromDate = input.date && input.date >= todayBerlin(now) ? input.date : todayBerlin(now);
    const days = input.date ? 1 : settings.searchDaysAhead;
    const range = rangeForDays(fromDate, days);
    const schedules = await loadSchedules(tx, candidates.map((c) => ({ id: c.id, leadTimeMinutes: c.leadTimeMinutes, maxAdvanceDays: c.maxAdvanceDays, travelBufferMinutes: c.travelBufferMinutes, bookingMode: c.bookingMode })), range.from, range.to);
    const favorites = viewerId
      ? new Set((await tx<{ providerId: string }[]>`select provider_id from public.favorites where customer_id = ${viewerId}`).map((f) => f.providerId))
      : new Set<string>();

    const results: ProviderSearchResult[] = [];
    for (const c of candidates) {
      const own = offerings.filter(
        (o) => o.providerId === c.id && (!serviceId || o.serviceId === serviceId) && (serviceId || !categoryId || o.categoryId === categoryId) && (!input.durationMinutes || o.durationMinutes === input.durationMinutes),
      );
      if (own.length === 0) continue;
      const offering = [...own].sort((a, b) => a.priceCents - b.priceCents)[0];
      const schedule = schedules.get(c.id);
      if (!schedule) continue;
      const slotDays = filterSlotsByTimeOfDay(slotsFor(schedule, offering.durationMinutes, settings.slotStepMinutes, now, fromDate, days), input.timeOfDay);
      const first = firstSlot(slotDays);
      if (!first) continue;
      const distanceKm = Math.round(c.distanceKm * 100) / 100;
      const travelFeeCents = computeTravelFee(distanceKm, { baseCents: c.travelFeeBaseCents, includedKm: Number(c.travelFeeIncludedKm), perKmCents: c.travelFeePerKmCents });
      const card = toProviderCard(c);
      const score = rankScore({
        ratingAvg: card.ratingAvg, ratingCount: card.ratingCount, distanceKm, radiusKm: Number(c.serviceRadiusKm),
        firstSlot: new Date(first), now, instant: c.bookingMode === "instant", completedCount: c.completedCount, approvedAt: c.approvedAt,
        profileCompleteness: profileCompleteness({ hasAvatar: !!c.avatarPath, bioLength: c.bioLength, portfolioCount: c.portfolioCount, languageCount: c.languages.length }),
      });
      const { providerId: _omit, ...offeringDto } = offering;
      void _omit;
      results.push({
        ...card,
        distanceKm,
        travelFeeCents,
        offering: offeringDto,
        totalPriceCents: offering.priceCents + travelFeeCents,
        nextSlots: slotDays.flatMap((d) => d.slots).slice(0, 6),
        firstSlot: first,
        isFavorite: favorites.has(c.id),
        score: Math.round(score * 10_000) / 10_000,
      });
    }

    const sorted = sortRanked(results.map((r) => ({ ...r, id: r.providerId })), input.sort).map(({ id: _id, ...r }) => r);
    const pg = paging(input.page, input.pageSize);
    return {
      location,
      results: sorted.slice(pg.offset, pg.offset + pg.pageSize),
      total: sorted.length,
      page: pg.page,
      pageSize: pg.pageSize,
      categoryId,
      serviceId,
      date: input.date ?? null,
    };
  });

  let demandLogged = false;
  if (opts.logDemand !== false) {
    try {
      // withService: anonymous demand analytics (no PII); API roles have no write grant on search_events.
      await withService((tx) => tx`
        insert into public.search_events (postal_code, city_slug, category_id, service_id, requested_date, results_count)
        values (${input.postalCode}, ${outcome.location.citySlug}, ${outcome.categoryId}, ${outcome.serviceId}, ${outcome.date}, ${outcome.total})`);
      demandLogged = true;
    } catch (e) {
      console.error("[search] demand logging failed", e);
    }
  }

  return {
    location: {
      postalCode: outcome.location.postalCode, lat: outcome.location.lat, lng: outcome.location.lng,
      citySlug: outcome.location.citySlug, cityName: outcome.location.cityName, isLaunchCity: outcome.location.isLaunchCity,
    },
    results: outcome.results,
    total: outcome.total,
    page: outcome.page,
    pageSize: outcome.pageSize,
    demandLogged,
    date: outcome.date,
  };
}

const WaitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email("Bitte geben Sie eine gültige E-Mail-Adresse ein.").max(254),
  postalCode: zPostalCode,
  categorySlug: z.string().trim().min(1).max(60).optional(),
});

/**
 * "Benachrichtigen, sobald verfügbar" — demand capture for empty searches.
 * Idempotent per (email, PLZ, category). Anonymous callers allowed.
 */
export async function joinWaitlist(input: { email: string; postalCode: string; categorySlug?: string }): Promise<{ joined: true }> {
  const v = parse(WaitlistSchema, input);
  // withService: anon may only insert through this service; waitlist_signups has no API grants (no reads of e-mails).
  await withService(async (tx) => {
    const [pc] = await tx<{ citySlug: string | null }[]>`select city_slug from public.postal_codes where postal_code = ${v.postalCode}`;
    if (!pc) throw new ServiceError("validation", "Diese Postleitzahl kennen wir leider nicht.", { postalCode: "Unbekannte Postleitzahl." });
    const [cat] = v.categorySlug ? await tx<{ id: string }[]>`select id from public.categories where slug = ${v.categorySlug}` : [];
    await tx`
      insert into public.waitlist_signups (email, postal_code, category_id, city_slug)
      values (${v.email}, ${v.postalCode}, ${cat?.id ?? null}, ${pc.citySlug})
      on conflict on constraint waitlist_unique do nothing`;
  });
  return { joined: true };
}
