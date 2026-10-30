import "server-only";

import { z } from "zod";
import { withAnon, withService, withViewer, type Queryable } from "../db/client";
import type { SlotsByDay } from "../domain/availability";
import { isValidLocalDate } from "../domain/tz";
import type { PortfolioItemDTO, ProviderCardDTO, ProviderProfileDTO, SlotsByDayDTO } from "../dto";
import { ServiceError } from "../errors";
import { loadSettings, mediaUrl, numOrNull, parse, policyToDTO, zUuid } from "./_shared";
import { loadSchedules, rangeForDays, slotsFor, todayBerlin } from "./availability-data";
import { queryProviderReviews } from "./reviews";

/**
 * Public provider reads (approved providers only, enforced by RLS for anon and
 * authenticated viewers).
 */

export interface ProviderCardRow {
  id: string;
  slug: string;
  displayName: string;
  headline: string | null;
  avatarPath: string | null;
  ratingAvg: string | number | null;
  ratingCount: number;
  completedCount: number;
  bookingMode: "instant" | "request";
  languages: string[];
  citySlug: string | null;
  cityName: string | null;
}

export function toProviderCard(r: ProviderCardRow): ProviderCardDTO {
  return {
    providerId: r.id,
    slug: r.slug,
    displayName: r.displayName,
    headline: r.headline,
    avatarUrl: mediaUrl(r.avatarPath),
    ratingAvg: numOrNull(r.ratingAvg),
    ratingCount: r.ratingCount,
    completedCount: r.completedCount,
    bookingMode: r.bookingMode,
    languages: [...r.languages],
    citySlug: r.citySlug,
    cityName: r.cityName,
  };
}

/** SQL fragment columns for ProviderCardRow (expects aliases p = providers, pc = postal_codes, ci = cities). */
export const PROVIDER_CARD_COLUMNS = `p.id, p.slug, p.display_name, p.headline, p.avatar_path, p.rating_avg, p.rating_count,
  p.completed_count, p.booking_mode, p.languages, pc.city_slug, ci.name as city_name`;

export interface OfferingRow {
  providerServiceId: string;
  serviceId: string;
  serviceSlug: string;
  serviceName: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  durationMinutes: number;
  priceCents: number;
}

export async function queryOfferings(tx: Queryable, providerIds: string[]): Promise<Array<OfferingRow & { providerId: string }>> {
  if (providerIds.length === 0) return [];
  return tx<Array<OfferingRow & { providerId: string }>>`
    select ps.provider_id, ps.id as provider_service_id, s.id as service_id, s.slug as service_slug, s.name as service_name,
           c.id as category_id, c.slug as category_slug, c.name as category_name, ps.duration_minutes, ps.price_cents
    from public.provider_services ps
    join public.services s on s.id = ps.service_id and s.is_active
    join public.categories c on c.id = s.category_id and c.is_active
    where ps.provider_id = any(${providerIds}::uuid[]) and ps.is_active
    order by c.sort_order, s.sort_order, ps.duration_minutes`;
}

export async function getProviderProfile(slug: string, viewerId?: string | null, opts: { inviteCode?: string } = {}): Promise<ProviderProfileDTO | null> {
  const s = parse(z.string().trim().min(3).max(80), slug);
  const profile = await withViewer(viewerId, async (tx): Promise<ProviderProfileDTO | null> => {
    const rows = await tx<Array<ProviderCardRow & {
      bio: string | null; yearsExperience: number | null; serviceRadiusKm: string; travelFeeBaseCents: number;
      travelFeeIncludedKm: string; travelFeePerKmCents: number; leadTimeMinutes: number; maxAdvanceDays: number; approvedAt: Date | null;
    }>>`
      select ${tx.unsafe(PROVIDER_CARD_COLUMNS)}, p.bio, p.years_experience, p.service_radius_km, p.travel_fee_base_cents,
             p.travel_fee_included_km, p.travel_fee_per_km_cents, p.lead_time_minutes, p.max_advance_days, p.approved_at
      from public.providers p
      left join public.postal_codes pc on pc.postal_code = p.base_postal_code
      left join public.cities ci on ci.slug = pc.city_slug
      where p.slug = ${s} and p.status = 'approved'`;
    const r = rows[0];
    if (!r) return null;
    const [offerings, portfolio, reviews, settings, fav] = await Promise.all([
      queryOfferings(tx, [r.id]),
      tx<Array<{ id: string; storagePath: string; caption: string | null; categoryId: string | null; sortOrder: number }>>`
        select id, storage_path, caption, category_id, sort_order from public.provider_portfolio
        where provider_id = ${r.id} order by sort_order, created_at`,
      queryProviderReviews(tx, r.id, 1, 5),
      loadSettings(tx),
      viewerId ? tx<{ x: number }[]>`select 1 as x from public.favorites where customer_id = ${viewerId} and provider_id = ${r.id}` : Promise.resolve([]),
    ]);
    const profile: ProviderProfileDTO = {
      ...toProviderCard(r),
      bio: r.bio,
      yearsExperience: r.yearsExperience,
      serviceRadiusKm: Number(r.serviceRadiusKm),
      travelFee: { baseCents: r.travelFeeBaseCents, includedKm: Number(r.travelFeeIncludedKm), perKmCents: r.travelFeePerKmCents },
      leadTimeMinutes: r.leadTimeMinutes,
      maxAdvanceDays: r.maxAdvanceDays,
      approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
      offerings: offerings.map(({ providerId: _p, ...o }) => o),
      portfolio: portfolio.map<PortfolioItemDTO>((p) => ({
        id: p.id, url: mediaUrl(p.storagePath) ?? "", caption: p.caption, categoryId: p.categoryId, sortOrder: p.sortOrder,
      })),
      reviews,
      isFavorite: fav.length > 0,
      cancellationPolicy: policyToDTO(settings.cancellationPolicy),
    };
    return profile;
  });
  if (profile && opts.inviteCode) profile.inviteValid = await isValidInviteCode(profile.providerId, opts.inviteCode);
  return profile;
}

/** true when `code` is the provider's personal invite code (case-insensitive). */
export async function isValidInviteCode(providerId: string, code: string): Promise<boolean> {
  const c = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6,16}$/.test(c)) return false;
  // withService: invite_code is not column-granted to API roles; only a boolean is returned.
  const rows = await withService((tx) => tx<{ x: number }[]>`
    select 1 as x from public.providers where id = ${providerId} and invite_code = ${c} and status = 'approved'`);
  return rows.length > 0;
}

/** Top providers by Bayesian-ish quality (rating, then completed count), optionally in one city. */
export async function listFeaturedProviders(citySlug?: string, limit = 8): Promise<ProviderCardDTO[]> {
  const city = citySlug ? parse(z.string().trim().min(1).max(40), citySlug) : null;
  const n = Math.min(24, Math.max(1, limit));
  return withAnon(async (tx) => {
    const rows = await tx<ProviderCardRow[]>`
      select ${tx.unsafe(PROVIDER_CARD_COLUMNS)}
      from public.providers p
      left join public.postal_codes pc on pc.postal_code = p.base_postal_code
      left join public.cities ci on ci.slug = pc.city_slug
      where p.status = 'approved' ${city ? tx`and pc.city_slug = ${city}` : tx``}
      order by ((5 * 4.6 + coalesce(p.rating_avg, 0) * p.rating_count) / (5 + p.rating_count)) desc, p.completed_count desc, p.slug
      limit ${n}`;
    return rows.map(toProviderCard);
  });
}

const AvailabilitySchema = z.object({
  providerId: zUuid,
  providerServiceId: zUuid,
  from: z.string().refine(isValidLocalDate, "Ungültiges Datum."),
  days: z.number().int().min(1).max(31),
});

/**
 * Bookable slots of one offering, per local day. `from` = 'YYYY-MM-DD'
 * (Europe/Berlin); dates before today are clamped to today.
 */
export async function getProviderAvailability(providerId: string, providerServiceId: string, from: string, days: number): Promise<SlotsByDayDTO[]> {
  const input = parse(AvailabilitySchema, { providerId, providerServiceId, from, days });
  return withAnon((tx) => queryAvailability(tx, input.providerId, input.providerServiceId, input.from, input.days, new Date()));
}

export async function queryAvailability(tx: Queryable, providerId: string, providerServiceId: string, from: string, days: number, now: Date): Promise<SlotsByDay[]> {
  const rows = await tx<{ id: string; leadTimeMinutes: number; maxAdvanceDays: number; travelBufferMinutes: number; durationMinutes: number; bookingMode: "instant" | "request" }[]>`
    select p.id, p.lead_time_minutes, p.max_advance_days, p.travel_buffer_minutes, ps.duration_minutes, p.booking_mode
    from public.providers p
    join public.provider_services ps on ps.provider_id = p.id and ps.id = ${providerServiceId} and ps.is_active
    where p.id = ${providerId}`;
  const p = rows[0];
  if (!p) throw new ServiceError("not_found", "Dieses Angebot ist nicht verfügbar.");
  const today = todayBerlin(now);
  const fromDate = from < today ? today : from;
  const settings = await loadSettings(tx);
  const range = rangeForDays(fromDate, days);
  const schedules = await loadSchedules(tx, [p], range.from, range.to);
  const schedule = schedules.get(p.id);
  if (!schedule) return [];
  return slotsFor(schedule, p.durationMinutes, settings.slotStepMinutes, now, fromDate, days);
}


/** Today's local date in Europe/Berlin ('YYYY-MM-DD'), e.g. for getProviderAvailability(…, todayBerlin(), 7). */
export { todayBerlin } from "./availability-data";
