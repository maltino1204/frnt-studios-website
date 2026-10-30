import "server-only";

import { z } from "zod";
import { withService } from "../db/client";
import { rethrowDb } from "../db/errors";
import type { BookingStatus, MarketplaceKpisDTO, Session, SupplyDemandRowDTO, TimeSeriesPointDTO } from "../dto";
import { assertAdmin, loadSettings, parse } from "./_shared";
import { loadSchedules, rangeForDays, slotsFor, todayBerlin } from "./availability-data";

/**
 * Marketplace analytics for /admin. Admin-only (assertAdmin re-checks in the DB);
 * aggregates only, no personal data in the results.
 */

const RangeSchema = z.object({
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});

export async function getMarketplaceKpis(session: Session, range: { from?: string; to?: string } = {}): Promise<MarketplaceKpisDTO> {
  const v = parse(RangeSchema, range);
  const to = v.to ? new Date(v.to) : new Date();
  const from = v.from ? new Date(v.from) : new Date(to.getTime() - 30 * 86_400_000);
  // withService: admin analytics across all users (authorised by assertAdmin).
  return withService(async (tx) => {
    await assertAdmin(tx, session);
    const statuses = await tx<{ status: BookingStatus; n: number }[]>`
      select status, count(*)::int as n from public.bookings where created_at >= ${from} and created_at < ${to} group by status`;
    const [money] = await tx<{ gmv: number; net: number; completed: number; repeat: number }[]>`
      select coalesce(sum(total_cents) filter (where status = 'completed'), 0)::int as gmv,
             coalesce(sum(commission_cents + service_fee_cents - discount_cents) filter (where status = 'completed' or (status in ('cancelled', 'no_show') and cancellation_fee_cents > 0)), 0)::int as net,
             count(*) filter (where status = 'completed')::int as completed,
             count(*) filter (where status = 'completed' and commission_tier <> 'base')::int as repeat
      from public.bookings where coalesce(completed_at, cancelled_at, created_at) >= ${from} and coalesce(completed_at, cancelled_at, created_at) < ${to}`;
    const [search] = await tx<{ searches: number; zero: number }[]>`
      select count(*)::int as searches, count(*) filter (where results_count = 0)::int as zero
      from public.search_events where created_at >= ${from} and created_at < ${to}`;
    const [{ created }] = await tx<{ created: number }[]>`
      select count(*)::int as created from public.bookings where created_at >= ${from} and created_at < ${to} and status <> 'expired'`;
    const [{ avgRating }] = await tx<{ avgRating: number | null }[]>`
      select round(avg(rating)::numeric, 2)::float8 as avg_rating from public.reviews where is_published and created_at >= ${from} and created_at < ${to}`;
    const [{ active }] = await tx<{ active: number }[]>`select count(*)::int as active from public.providers where status = 'approved'`;
    const [{ newCustomers }] = await tx<{ newCustomers: number }[]>`
      select count(*)::int as new_customers from public.profiles where role = 'customer' and created_at >= ${from} and created_at < ${to}`;
    const [{ waitlist }] = await tx<{ waitlist: number }[]>`
      select count(*)::int as waitlist from public.waitlist_signups where created_at >= ${from} and created_at < ${to}`;
    // Utilisation: booked minutes / weekly-hour minutes of approved providers over the period.
    const [util] = await tx<{ booked: number; available: number }[]>`
      with days as (select generate_series(${from}::timestamptz, ${to}::timestamptz - interval '1 day', interval '1 day') as d),
      avail as (
        select coalesce(sum(extract(epoch from (h.end_time - h.start_time)) / 60), 0)::float8 as minutes
        from days join public.provider_weekly_hours h on h.weekday = extract(isodow from (days.d at time zone 'Europe/Berlin'))
        join public.providers p on p.id = h.provider_id and p.status = 'approved'
      )
      select coalesce((select sum(duration_minutes) from public.bookings where status in ('confirmed', 'in_progress', 'completed') and starts_at >= ${from} and starts_at < ${to}), 0)::float8 as booked,
             (select minutes from avail) as available`;
    const byStatus: MarketplaceKpisDTO["bookingsByStatus"] = {};
    for (const s of statuses) byStatus[s.status] = s.n;
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      gmvCents: money.gmv,
      netRevenueCents: money.net,
      bookingsByStatus: byStatus,
      bookingsCreated: created,
      completedBookings: money.completed,
      searches: search.searches,
      zeroResultSearches: search.zero,
      conversionRate: search.searches > 0 ? Math.round((created / search.searches) * 10_000) / 10_000 : 0,
      repeatRate: money.completed > 0 ? Math.round((money.repeat / money.completed) * 10_000) / 10_000 : 0,
      avgRating,
      providerUtilisation: util.available > 0 ? Math.round((util.booked / util.available) * 10_000) / 10_000 : 0,
      activeProviders: active,
      newCustomers,
      waitlistSignups: waitlist,
    };
  }).catch(rethrowDb);
}

/** Supply vs demand per launch city (and per category inside each city). */
export async function getSupplyDemandByCity(session: Session, opts: { days?: number } = {}): Promise<SupplyDemandRowDTO[]> {
  const days = parse(z.number().int().min(1).max(365), opts.days ?? 30);
  // withService: admin analytics across all users (authorised by assertAdmin).
  return withService(async (tx) => {
    await assertAdmin(tx, session);
    const since = new Date(Date.now() - days * 86_400_000);
    const cities = await tx<{ slug: string; name: string }[]>`select slug, name from public.cities where is_active order by sort_order`;
    const categories = await tx<{ id: string; slug: string; name: string }[]>`select id, slug, name from public.categories where is_active order by sort_order`;
    const searches = await tx<{ citySlug: string; categoryId: string | null; n: number; zero: number }[]>`
      select city_slug, category_id, count(*)::int as n, count(*) filter (where results_count = 0)::int as zero
      from public.search_events where created_at >= ${since} and city_slug is not null group by city_slug, category_id`;
    const waitlist = await tx<{ citySlug: string; categoryId: string | null; n: number }[]>`
      select city_slug, category_id, count(*)::int as n from public.waitlist_signups where city_slug is not null group by city_slug, category_id`;
    const supply = await tx<{ citySlug: string; categoryId: string; n: number }[]>`
      select pc.city_slug, s.category_id, count(distinct p.id)::int as n
      from public.providers p join public.postal_codes pc on pc.postal_code = p.base_postal_code
      join public.provider_services ps on ps.provider_id = p.id and ps.is_active join public.services s on s.id = ps.service_id
      where p.status = 'approved' and pc.city_slug is not null group by pc.city_slug, s.category_id`;
    const providers = await tx<{ id: string; citySlug: string; leadTimeMinutes: number; maxAdvanceDays: number; travelBufferMinutes: number; bookingMode: "instant" | "request" }[]>`
      select p.id, pc.city_slug, p.lead_time_minutes, p.max_advance_days, p.travel_buffer_minutes, p.booking_mode
      from public.providers p join public.postal_codes pc on pc.postal_code = p.base_postal_code where p.status = 'approved' and pc.city_slug is not null`;
    const bookings = await tx<{ citySlug: string; n: number }[]>`
      select pc.city_slug, count(*)::int as n from public.bookings b join public.postal_codes pc on pc.postal_code = b.postal_code
      where b.created_at >= ${since} and b.status not in ('expired', 'pending_payment') and pc.city_slug is not null group by pc.city_slug`;

    const settings = await loadSettings(tx);
    const today = todayBerlin();
    const r7 = rangeForDays(today, 7);
    const schedules = await loadSchedules(tx, providers, r7.from, r7.to);
    const now = new Date();
    const openHours = new Map<string, number>();
    for (const p of providers) {
      const sch = schedules.get(p.id);
      if (!sch) continue;
      // open hours ≈ number of 60-minute slots in the next 7 days (step = setting)
      const slots = slotsFor(sch, 60, settings.slotStepMinutes, now, today, 7).reduce((a, d) => a + d.slots.length, 0);
      openHours.set(p.citySlug, (openHours.get(p.citySlug) ?? 0) + (slots * settings.slotStepMinutes) / 60);
    }

    return cities.map((c) => {
      const cs = searches.filter((s) => s.citySlug === c.slug);
      const cw = waitlist.filter((w) => w.citySlug === c.slug);
      return {
        citySlug: c.slug,
        cityName: c.name,
        searches: cs.reduce((a, s) => a + s.n, 0),
        zeroResultSearches: cs.reduce((a, s) => a + s.zero, 0),
        waitlistSignups: cw.reduce((a, w) => a + w.n, 0),
        approvedProviders: providers.filter((p) => p.citySlug === c.slug).length,
        bookings: bookings.find((b) => b.citySlug === c.slug)?.n ?? 0,
        openSlotHours7d: Math.round(openHours.get(c.slug) ?? 0),
        byCategory: categories.map((cat) => ({
          categorySlug: cat.slug,
          categoryName: cat.name,
          providers: supply.find((s) => s.citySlug === c.slug && s.categoryId === cat.id)?.n ?? 0,
          searches: cs.filter((s) => s.categoryId === cat.id).reduce((a, s) => a + s.n, 0),
          waitlist: cw.filter((w) => w.categoryId === cat.id).reduce((a, w) => a + w.n, 0),
        })),
      };
    });
  }).catch(rethrowDb);
}

export async function getTimeSeries(session: Session, opts: { days?: number } = {}): Promise<TimeSeriesPointDTO[]> {
  const days = parse(z.number().int().min(1).max(365), opts.days ?? 30);
  // withService: admin analytics across all users (authorised by assertAdmin).
  return withService(async (tx) => {
    await assertAdmin(tx, session);
    // Same window as getMarketplaceKpis / getSupplyDemandByCity: the last `days` × 24 h, so the chart totals
    // match the KPI tiles (audit-3 F8). That window touches days + 1 local dates; the first and the last
    // (today) bucket are partial.
    const rows = await tx<Array<{ date: string; bookings: number; completed: number; gmvCents: number; searches: number }>>`
      with w as (select now() - make_interval(days => ${days}) as since),
      d as (
        select generate_series((select (since at time zone 'Europe/Berlin')::date from w), (now() at time zone 'Europe/Berlin')::date, interval '1 day')::date as day
      )
      select to_char(d.day, 'YYYY-MM-DD') as date,
        (select count(*)::int from public.bookings b where (b.created_at at time zone 'Europe/Berlin')::date = d.day and b.created_at >= w.since and b.status <> 'expired') as bookings,
        (select count(*)::int from public.bookings b where (b.completed_at at time zone 'Europe/Berlin')::date = d.day and b.completed_at >= w.since) as completed,
        (select coalesce(sum(total_cents), 0)::int from public.bookings b where b.status = 'completed' and (b.completed_at at time zone 'Europe/Berlin')::date = d.day and b.completed_at >= w.since) as gmv_cents,
        (select count(*)::int from public.search_events s where (s.created_at at time zone 'Europe/Berlin')::date = d.day and s.created_at >= w.since) as searches
      from d cross join w order by d.day`;
    return rows;
  }).catch(rethrowDb);
}
