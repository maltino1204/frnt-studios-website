import "server-only";

import { z } from "zod";
import { withService, type Fragment, type Queryable, type Tx } from "../db/client";
import { rethrowDb } from "../db/errors";
import { STATUS_LABELS_DE } from "../domain/booking-state";
import { computeCancellation, parsePolicy, policySchedule } from "../domain/cancellation";
import { findContactDetails } from "../domain/content-lint";
import type {
  AdminBookingListItemDTO,
  AdminPaymentDTO,
  AdminReviewDTO,
  AdminReviewFilter,
  AdminUserDetailDTO,
  AdminUserDTO,
  CreditLedgerEntryDTO,
  AppRole,
  AuditLogEntryDTO,
  BookingStatus,
  CancellationPolicyDTO,
  Paginated,
  PaymentProviderId,
  PaymentStatus,
  PolicyScheduleEntryDTO,
  Session,
} from "../dto";
import { assertAdmin, CREDIT_REASON_LABELS, loadSettings, mediaUrl, paging, parse, policyToDTO, zLocalDate, zUuid } from "./_shared";
import { queryAnonymizeBlockers } from "./privacy";

/**
 * Admin read models that the admin console needs beyond services/admin.ts
 * (Agent 5b, minimal extension). Read-only: every write still goes through
 * services/admin.ts (audited there). Every function runs assertAdmin (session
 * role + DB re-check) inside the same service transaction before any query.
 */

async function asAdmin<T>(session: Session, fn: (tx: Tx) => Promise<T>): Promise<T> {
  // withService: admin read model across users, authorised by assertAdmin() in the same transaction.
  return withService(async (tx) => {
    await assertAdmin(tx, session);
    return fn(tx);
  }).catch(rethrowDb);
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

const BOOKING_STATUSES = ["pending_payment", "requested", "confirmed", "in_progress", "completed", "cancelled", "declined", "expired", "no_show"] as const;

// ---------------------------------------------------------------------------
// Bookings: list with city / date / provider filters
// ---------------------------------------------------------------------------
export interface AdminBookingFilter {
  status?: BookingStatus;
  q?: string;
  citySlug?: string;
  providerId?: string;
  /** local dates (Europe/Berlin), inclusive, on starts_at */
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function listAdminBookingsFiltered(session: Session, opts: AdminBookingFilter = {}): Promise<Paginated<AdminBookingListItemDTO>> {
  const v = parse(
    z.object({
      status: z.enum(BOOKING_STATUSES).optional(),
      q: z.string().trim().max(60).optional(),
      citySlug: z.string().trim().regex(/^[a-z0-9-]{2,40}$/).optional(),
      providerId: zUuid.optional(),
      from: zLocalDate.optional(),
      to: zLocalDate.optional(),
    }),
    { status: opts.status, q: opts.q || undefined, citySlug: opts.citySlug || undefined, providerId: opts.providerId || undefined, from: opts.from || undefined, to: opts.to || undefined },
  );
  const pg = paging(opts.page, opts.pageSize, 25);
  return asAdmin(session, async (tx) => {
    const cond = (t: Queryable): Fragment => t`true
      ${v.status ? t`and b.status = ${v.status}` : t``}
      ${v.q ? t`and (b.reference ilike ${`%${v.q}%`} or pr.display_name ilike ${`%${v.q}%`} or cp.last_name ilike ${`%${v.q}%`} or b.service_name ilike ${`%${v.q}%`})` : t``}
      ${v.citySlug ? t`and pc.city_slug = ${v.citySlug}` : t``}
      ${v.providerId ? t`and b.provider_id = ${v.providerId}` : t``}
      ${v.from ? t`and (b.starts_at at time zone 'Europe/Berlin')::date >= ${v.from}::date` : t``}
      ${v.to ? t`and (b.starts_at at time zone 'Europe/Berlin')::date <= ${v.to}::date` : t``}`;
    const rows = await tx<Array<{ id: string; reference: string; status: BookingStatus; startsAt: Date; serviceName: string; customerName: string; providerName: string; city: string; totalCents: number; commissionCents: number; createdAt: Date; hasOpenDispute: boolean }>>`
      select b.id, b.reference, b.status, b.starts_at, b.service_name,
             trim(coalesce(cp.first_name, '') || ' ' || coalesce(cp.last_name, '')) as customer_name, pr.display_name as provider_name,
             b.city, b.total_cents, b.commission_cents, b.created_at,
             exists (select 1 from public.disputes d where d.booking_id = b.id and d.status in ('open', 'investigating')) as has_open_dispute
      from public.bookings b
      join public.profiles cp on cp.id = b.customer_id
      join public.providers pr on pr.id = b.provider_id
      left join public.postal_codes pc on pc.postal_code = b.postal_code
      where ${cond(tx)}
      order by b.starts_at desc limit ${pg.pageSize} offset ${pg.offset}`;
    const [{ total }] = await tx<{ total: number }[]>`
      select count(*)::int as total from public.bookings b
      join public.profiles cp on cp.id = b.customer_id join public.providers pr on pr.id = b.provider_id
      left join public.postal_codes pc on pc.postal_code = b.postal_code where ${cond(tx)}`;
    return {
      items: rows.map((r) => ({ ...r, startsAt: r.startsAt.toISOString(), createdAt: r.createdAt.toISOString() })),
      total,
      page: pg.page,
      pageSize: pg.pageSize,
    };
  });
}

// ---------------------------------------------------------------------------
// Booking detail: operational context (policy outcome, refundable, payout state)
// ---------------------------------------------------------------------------
export type AdminPayoutState = "none" | "on_hold" | "eligible" | "disputed" | "in_batch" | "paid";

export interface AdminBookingOpsDTO {
  bookingId: string;
  citySlug: string | null;
  respondBy: string | null;
  holdExpiresAt: string | null;
  confirmedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  /** policy snapshotted at booking time */
  policy: CancellationPolicyDTO;
  schedule: PolicyScheduleEntryDTO[];
  /** what the snapshotted policy would charge if the customer cancelled right now (null when the customer could not cancel) */
  customerCancelNow: { feeCents: number; refundCents: number; feePercent: number; tierLabel: string } | null;
  /** status allows an admin cancellation */
  adminCancellable: boolean;
  /** maximum the admin can still refund (captured − refunded), 0 when nothing was captured */
  refundableCents: number;
  payout: { state: AdminPayoutState; payoutId: string | null; availableAt: string | null; holdHours: number };
}

const ADMIN_CANCELLABLE: BookingStatus[] = ["pending_payment", "requested", "confirmed", "in_progress"];

export async function getAdminBookingOps(session: Session, bookingId: string): Promise<AdminBookingOpsDTO | null> {
  const id = parse(zUuid, bookingId);
  return asAdmin(session, async (tx) => {
    const [b] = await tx<Array<{
      id: string; status: BookingStatus; startsAt: Date; createdAt: Date; servicePriceCents: number; travelFeeCents: number; discountCents: number;
      totalCents: number; serviceFeeCents: number; cancellationPolicy: unknown;
      respondBy: Date | null; holdExpiresAt: Date | null; confirmedAt: Date | null; startedAt: Date | null; completedAt: Date | null; cancelledAt: Date | null;
      cancellationFeeCents: number; providerPayoutCents: number; payoutId: string | null; payoutStatus: string | null; citySlug: string | null; disputed: boolean;
    }>>`
      select b.id, b.status, b.starts_at, b.created_at, b.service_price_cents, b.travel_fee_cents, b.discount_cents,
             b.total_cents, b.service_fee_cents, b.cancellation_policy, b.respond_by, b.hold_expires_at,
             b.confirmed_at, b.started_at, b.completed_at, b.cancelled_at, b.cancellation_fee_cents, b.provider_payout_cents, b.payout_id,
             po.status as payout_status, pc.city_slug,
             exists (select 1 from public.disputes d where d.booking_id = b.id and d.status in ('open', 'investigating')) as disputed
      from public.bookings b
      left join public.payouts po on po.id = b.payout_id
      left join public.postal_codes pc on pc.postal_code = b.postal_code
      where b.id = ${id}`;
    if (!b) return null;
    const [p] = await tx<{ status: PaymentStatus; capturedCents: number; refundedCents: number }[]>`
      select status, captured_cents, refunded_cents from public.payments where booking_id = ${id}`;
    const settings = await loadSettings(tx);
    const policy = parsePolicy(b.cancellationPolicy);
    const now = new Date();
    const customerCancelNow = b.status === "confirmed" || b.status === "requested" || b.status === "pending_payment"
      ? (() => {
          const o = computeCancellation(
            {
              status: b.status, startsAt: b.startsAt, createdAt: b.createdAt, servicePriceCents: b.servicePriceCents, travelFeeCents: b.travelFeeCents,
              serviceFeeCents: b.serviceFeeCents, discountCents: b.discountCents, totalCents: b.totalCents, cancellationPolicy: policy,
            },
            now,
            "customer",
          );
          return { feeCents: o.feeCents, refundCents: o.refundCents, feePercent: o.feePercent, tierLabel: o.tierLabel };
        })()
      : null;
    const done = b.completedAt ?? (b.cancellationFeeCents > 0 ? b.cancelledAt : null);
    const retains = b.status === "completed" || ((b.status === "cancelled" || b.status === "no_show") && b.cancellationFeeCents > 0);
    let state: AdminPayoutState = "none";
    let availableAt: string | null = null;
    if (b.payoutId) state = b.payoutStatus === "paid" ? "paid" : "in_batch";
    else if (retains && b.providerPayoutCents > 0 && done) {
      const at = new Date(done.getTime() + settings.payoutHoldHours * 3_600_000);
      availableAt = at.toISOString();
      state = b.disputed ? "disputed" : at <= now ? "eligible" : "on_hold";
    }
    return {
      bookingId: b.id,
      citySlug: b.citySlug,
      respondBy: iso(b.respondBy),
      holdExpiresAt: iso(b.holdExpiresAt),
      confirmedAt: iso(b.confirmedAt),
      startedAt: iso(b.startedAt),
      completedAt: iso(b.completedAt),
      cancelledAt: iso(b.cancelledAt),
      policy: policyToDTO(policy),
      schedule: policySchedule(policy, b.startsAt, b.createdAt),
      customerCancelNow,
      adminCancellable: ADMIN_CANCELLABLE.includes(b.status),
      refundableCents: p && (p.status === "captured" || p.status === "partially_refunded") ? Math.max(0, p.capturedCents - p.refundedCents) : 0,
      payout: { state, payoutId: b.payoutId, availableAt, holdHours: settings.payoutHoldHours },
    };
  });
}

// ---------------------------------------------------------------------------
// Overview work queues
// ---------------------------------------------------------------------------
export interface ExpiringRequestDTO {
  id: string;
  reference: string;
  serviceName: string;
  providerName: string;
  customerName: string;
  startsAt: string;
  respondBy: string | null;
}

export interface FailedPaymentDTO {
  id: string;
  bookingId: string;
  bookingReference: string;
  provider: PaymentProviderId;
  status: PaymentStatus;
  amountCents: number;
  customerName: string;
  createdAt: string;
}

export interface OpsQueuesDTO {
  expiringRequests: ExpiringRequestDTO[];
  openRequests: number;
  failedPayments: FailedPaymentDTO[];
  failedPaymentsTotal: number;
}

export async function getOpsQueues(session: Session, opts: { limit?: number } = {}): Promise<OpsQueuesDTO> {
  const limit = parse(z.number().int().min(1).max(50), opts.limit ?? 6);
  return asAdmin(session, async (tx) => {
    const requests = await tx<Array<{ id: string; reference: string; serviceName: string; providerName: string; customerName: string; startsAt: Date; respondBy: Date | null }>>`
      select b.id, b.reference, b.service_name, pr.display_name as provider_name,
             trim(coalesce(cp.first_name, '') || ' ' || left(coalesce(cp.last_name, ''), 1) || '.') as customer_name, b.starts_at, b.respond_by
      from public.bookings b join public.providers pr on pr.id = b.provider_id join public.profiles cp on cp.id = b.customer_id
      where b.status = 'requested' order by b.respond_by nulls last, b.starts_at limit ${limit}`;
    const [{ open }] = await tx<{ open: number }[]>`select count(*)::int as open from public.bookings where status = 'requested'`;
    const failed = await tx<Array<{ id: string; bookingId: string; bookingReference: string; provider: PaymentProviderId; status: PaymentStatus; amountCents: number; customerName: string; createdAt: Date }>>`
      select p.id, p.booking_id, b.reference as booking_reference, p.provider, p.status, p.amount_cents,
             trim(coalesce(cp.first_name, '') || ' ' || coalesce(cp.last_name, '')) as customer_name, p.created_at
      from public.payments p join public.bookings b on b.id = p.booking_id join public.profiles cp on cp.id = b.customer_id
      where p.status = 'failed' order by p.created_at desc limit ${limit}`;
    const [{ failedTotal }] = await tx<{ failedTotal: number }[]>`select count(*)::int as failed_total from public.payments where status = 'failed'`;
    return {
      expiringRequests: requests.map((r) => ({ ...r, startsAt: r.startsAt.toISOString(), respondBy: iso(r.respondBy) })),
      openRequests: open,
      failedPayments: failed.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
      failedPaymentsTotal: failedTotal,
    };
  });
}

// ---------------------------------------------------------------------------
// Payments (status / provider filter), refunds, payout preview (48 h rule)
// ---------------------------------------------------------------------------
const PAYMENT_STATUSES = ["requires_payment_method", "authorized", "captured", "partially_refunded", "refunded", "cancelled", "failed"] as const;

export async function listPaymentsFiltered(session: Session, opts: { status?: PaymentStatus; provider?: PaymentProviderId; page?: number; pageSize?: number } = {}): Promise<Paginated<AdminPaymentDTO>> {
  const v = parse(z.object({ status: z.enum(PAYMENT_STATUSES).optional(), provider: z.enum(["dev", "stripe"]).optional() }), { status: opts.status, provider: opts.provider });
  const pg = paging(opts.page, opts.pageSize, 25);
  return asAdmin(session, async (tx) => {
    const cond = (t: Queryable): Fragment => t`true ${v.status ? t`and p.status = ${v.status}` : t``} ${v.provider ? t`and p.provider = ${v.provider}` : t``}`;
    const rows = await tx<Array<Omit<AdminPaymentDTO, "createdAt"> & { createdAt: Date }>>`
      select p.id, p.booking_id, b.reference as booking_reference, p.provider, p.status, p.amount_cents, p.captured_cents, p.refunded_cents,
             p.application_fee_cents, p.created_at
      from public.payments p join public.bookings b on b.id = p.booking_id where ${cond(tx)}
      order by p.created_at desc limit ${pg.pageSize} offset ${pg.offset}`;
    const [{ total }] = await tx<{ total: number }[]>`select count(*)::int as total from public.payments p where ${cond(tx)}`;
    return { items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, page: pg.page, pageSize: pg.pageSize };
  });
}

export interface AdminRefundDTO {
  id: string;
  bookingId: string;
  bookingReference: string;
  amountCents: number;
  reason: string;
  status: string;
  createdByName: string | null;
  createdAt: string;
}

export async function listRefunds(session: Session, opts: { page?: number; pageSize?: number } = {}): Promise<Paginated<AdminRefundDTO>> {
  const pg = paging(opts.page, opts.pageSize, 25);
  return asAdmin(session, async (tx) => {
    const rows = await tx<Array<Omit<AdminRefundDTO, "createdAt"> & { createdAt: Date }>>`
      select r.id, r.booking_id, b.reference as booking_reference, r.amount_cents, r.reason, r.status,
             nullif(trim(coalesce(a.first_name, '') || ' ' || coalesce(a.last_name, '')), '') as created_by_name, r.created_at
      from public.refunds r join public.bookings b on b.id = r.booking_id left join public.profiles a on a.id = r.created_by
      order by r.created_at desc limit ${pg.pageSize} offset ${pg.offset}`;
    const [{ total }] = await tx<{ total: number }[]>`select count(*)::int as total from public.refunds`;
    return { items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, page: pg.page, pageSize: pg.pageSize };
  });
}

export interface PayoutPreviewRowDTO {
  providerId: string;
  providerName: string;
  payoutsEnabled: boolean;
  /** payable now: done ≥ hold hours ago, no open dispute */
  eligibleCents: number;
  eligibleCount: number;
  /** done < hold hours ago */
  onHoldCents: number;
  onHoldCount: number;
  nextAvailableAt: string | null;
  /** open / investigating dispute */
  disputedCents: number;
  disputedCount: number;
}

export interface PayoutPreviewDTO {
  holdHours: number;
  rows: PayoutPreviewRowDTO[];
  totals: { eligibleCents: number; eligibleCount: number; onHoldCents: number; disputedCents: number; providers: number };
}

/** Mirrors the eligibility rule of createPayoutBatch (services/admin.ts) without writing anything. */
export async function getPayoutPreview(session: Session): Promise<PayoutPreviewDTO> {
  return asAdmin(session, async (tx) => {
    const settings = await loadSettings(tx);
    const rows = await tx<Array<{ providerId: string; providerName: string; payoutsEnabled: boolean; eligibleCents: number; eligibleCount: number; onHoldCents: number; onHoldCount: number; nextDoneAt: Date | null; disputedCents: number; disputedCount: number }>>`
      with open as (
        select b.provider_id, b.provider_payout_cents as cents, coalesce(b.completed_at, b.cancelled_at) as done_at,
               exists (select 1 from public.disputes d where d.booking_id = b.id and d.status in ('open', 'investigating')) as disputed
        from public.bookings b
        where b.payout_id is null and b.provider_payout_cents > 0
          and (b.status = 'completed' or (b.status in ('cancelled', 'no_show') and b.cancellation_fee_cents > 0))
      )
      select o.provider_id, pr.display_name as provider_name, pr.payouts_enabled,
             coalesce(sum(o.cents) filter (where not o.disputed and o.done_at <= now() - make_interval(hours => ${settings.payoutHoldHours})), 0)::int as eligible_cents,
             count(*) filter (where not o.disputed and o.done_at <= now() - make_interval(hours => ${settings.payoutHoldHours}))::int as eligible_count,
             coalesce(sum(o.cents) filter (where not o.disputed and o.done_at > now() - make_interval(hours => ${settings.payoutHoldHours})), 0)::int as on_hold_cents,
             count(*) filter (where not o.disputed and o.done_at > now() - make_interval(hours => ${settings.payoutHoldHours}))::int as on_hold_count,
             min(o.done_at) filter (where not o.disputed and o.done_at > now() - make_interval(hours => ${settings.payoutHoldHours})) as next_done_at,
             coalesce(sum(o.cents) filter (where o.disputed), 0)::int as disputed_cents,
             count(*) filter (where o.disputed)::int as disputed_count
      from open o join public.providers pr on pr.id = o.provider_id
      group by o.provider_id, pr.display_name, pr.payouts_enabled
      order by eligible_cents desc, on_hold_cents desc, pr.display_name`;
    const out = rows.map((r) => ({
      providerId: r.providerId,
      providerName: r.providerName,
      payoutsEnabled: r.payoutsEnabled,
      eligibleCents: r.eligibleCents,
      eligibleCount: r.eligibleCount,
      onHoldCents: r.onHoldCents,
      onHoldCount: r.onHoldCount,
      nextAvailableAt: r.nextDoneAt ? new Date(r.nextDoneAt.getTime() + settings.payoutHoldHours * 3_600_000).toISOString() : null,
      disputedCents: r.disputedCents,
      disputedCount: r.disputedCount,
    }));
    return {
      holdHours: settings.payoutHoldHours,
      rows: out,
      totals: {
        eligibleCents: out.reduce((a, r) => a + r.eligibleCents, 0),
        eligibleCount: out.reduce((a, r) => a + r.eligibleCount, 0),
        onHoldCents: out.reduce((a, r) => a + r.onHoldCents, 0),
        disputedCents: out.reduce((a, r) => a + r.disputedCents, 0),
        providers: out.filter((r) => r.eligibleCents > 0).length,
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Regions: demand vs supply per PLZ region (two-digit Leitregion)
// ---------------------------------------------------------------------------
export interface PostalRegionRowDTO {
  region: string;
  citySlug: string | null;
  cityName: string | null;
  searches: number;
  zeroResultSearches: number;
  waitlistSignups: number;
  /** approved providers based in the region */
  providers: number;
  bookings: number;
}

export async function getDemandByPostalRegion(session: Session, opts: { days?: number } = {}): Promise<PostalRegionRowDTO[]> {
  const days = parse(z.number().int().min(1).max(365), opts.days ?? 30);
  return asAdmin(session, async (tx) => {
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await tx<PostalRegionRowDTO[]>`
      with s as (
        select left(postal_code, 2) as region, count(*)::int as n, count(*) filter (where results_count = 0)::int as zero
        from public.search_events where created_at >= ${since} and postal_code ~ '^[0-9]{5}$' group by 1
      ), w as (
        select left(postal_code, 2) as region, count(*)::int as n from public.waitlist_signups group by 1
      ), p as (
        select left(base_postal_code, 2) as region, count(*)::int as n from public.providers where status = 'approved' and base_postal_code is not null group by 1
      ), b as (
        select left(postal_code, 2) as region, count(*)::int as n from public.bookings
        where created_at >= ${since} and status not in ('expired', 'pending_payment') group by 1
      ), regions as (
        select region from s union select region from w union select region from p union select region from b
      ), city as (
        select distinct on (left(pc.postal_code, 2)) left(pc.postal_code, 2) as region, pc.city_slug, c.name as city_name
        from public.postal_codes pc join public.cities c on c.slug = pc.city_slug
        group by 1, pc.city_slug, c.name order by left(pc.postal_code, 2), count(*) desc
      )
      select r.region, city.city_slug, city.city_name, coalesce(s.n, 0) as searches, coalesce(s.zero, 0) as zero_result_searches,
             coalesce(w.n, 0) as waitlist_signups, coalesce(p.n, 0) as providers, coalesce(b.n, 0) as bookings
      from regions r left join s using (region) left join w using (region) left join p using (region) left join b using (region)
      left join city using (region)
      order by coalesce(s.n, 0) + coalesce(w.n, 0) desc, r.region`;
    return rows;
  });
}

// ---------------------------------------------------------------------------
// Users with status filter
// ---------------------------------------------------------------------------
export async function listUsersFiltered(session: Session, opts: { q?: string; role?: AppRole; status?: "active" | "blocked"; page?: number; pageSize?: number } = {}): Promise<Paginated<AdminUserDTO>> {
  const v = parse(
    z.object({ q: z.string().trim().max(100).optional(), role: z.enum(["customer", "provider", "admin"]).optional(), status: z.enum(["active", "blocked"]).optional() }),
    { q: opts.q || undefined, role: opts.role, status: opts.status },
  );
  const pg = paging(opts.page, opts.pageSize, 25);
  return asAdmin(session, async (tx) => {
    const cond = (t: Queryable): Fragment => t`true
      ${v.role ? t`and p.role = ${v.role}` : t``}
      ${v.status === "blocked" ? t`and p.blocked_at is not null` : v.status === "active" ? t`and p.blocked_at is null` : t``}
      ${v.q ? t`and (u.email ilike ${`%${v.q}%`} or p.first_name ilike ${`%${v.q}%`} or p.last_name ilike ${`%${v.q}%`})` : t``}`;
    const rows = await tx<Array<Omit<AdminUserDTO, "createdAt" | "blockedAt"> & { createdAt: Date; blockedAt: Date | null }>>`
      select p.id, u.email, p.role, p.first_name, p.last_name, p.phone, p.created_at, p.blocked_at,
             (select count(*)::int from public.bookings b where b.customer_id = p.id or b.provider_id = p.id) as bookings_count,
             pr.status as provider_status
      from public.profiles p join auth.users u on u.id = p.id left join public.providers pr on pr.id = p.id
      where ${cond(tx)} order by p.created_at desc limit ${pg.pageSize} offset ${pg.offset}`;
    const [{ total }] = await tx<{ total: number }[]>`select count(*)::int as total from public.profiles p join auth.users u on u.id = p.id where ${cond(tx)}`;
    return { items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), blockedAt: iso(r.blockedAt) })), total, page: pg.page, pageSize: pg.pageSize };
  });
}

// ---------------------------------------------------------------------------
// Audit log with entity / action / actor filters
// ---------------------------------------------------------------------------
export async function listAuditLogFiltered(session: Session, opts: { entity?: string; action?: string; actorId?: string; page?: number; pageSize?: number } = {}): Promise<Paginated<AuditLogEntryDTO>> {
  const v = parse(
    z.object({ entity: z.string().trim().max(60).optional(), action: z.string().trim().max(80).optional(), actorId: zUuid.optional() }),
    { entity: opts.entity || undefined, action: opts.action || undefined, actorId: opts.actorId || undefined },
  );
  const pg = paging(opts.page, opts.pageSize, 50);
  return asAdmin(session, async (tx) => {
    const cond = (t: Queryable): Fragment => t`true
      ${v.entity ? t`and a.entity = ${v.entity}` : t``}
      ${v.action ? t`and a.action ilike ${`${v.action}%`}` : t``}
      ${v.actorId ? t`and a.actor_id = ${v.actorId}` : t``}`;
    const rows = await tx<Array<Omit<AuditLogEntryDTO, "createdAt"> & { createdAt: Date }>>`
      select a.id, a.actor_id, trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) as actor_name, a.action, a.entity, a.entity_id, a.data, a.created_at
      from public.audit_log a left join public.profiles p on p.id = a.actor_id
      where ${cond(tx)} order by a.created_at desc limit ${pg.pageSize} offset ${pg.offset}`;
    const [{ total }] = await tx<{ total: number }[]>`select count(*)::int as total from public.audit_log a where ${cond(tx)}`;
    return { items: rows.map((r) => ({ ...r, id: String(r.id), actorName: r.actorName || null, createdAt: r.createdAt.toISOString() })), total, page: pg.page, pageSize: pg.pageSize };
  });
}

export async function listAuditFacets(session: Session): Promise<{ entities: string[]; actions: string[]; actors: Array<{ id: string; name: string }> }> {
  return asAdmin(session, async (tx) => {
    const entities = await tx<{ entity: string }[]>`select distinct entity from public.audit_log order by entity`;
    const actions = await tx<{ action: string }[]>`select distinct action from public.audit_log order by action`;
    const actors = await tx<{ id: string; name: string }[]>`
      select distinct a.actor_id as id, trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) as name
      from public.audit_log a join public.profiles p on p.id = a.actor_id where a.actor_id is not null order by 2`;
    return { entities: entities.map((e) => e.entity), actions: actions.map((a) => a.action), actors };
  });
}

// ---------------------------------------------------------------------------
// Review moderation list (audit-1 R20); writes go through admin.moderateReview
// ---------------------------------------------------------------------------
const ReviewFilterSchema = z.object({
  visibility: z.enum(["published", "hidden"]).optional(),
  rating: z.union([z.number().int().min(1).max(5), z.literal("critical")]).optional(),
  q: z.string().trim().max(100).optional(),
  providerId: zUuid.optional(),
  flagged: z.boolean().optional(),
});

export async function listReviewsAdmin(session: Session, opts: AdminReviewFilter = {}): Promise<Paginated<AdminReviewDTO>> {
  const v = parse(ReviewFilterSchema, { visibility: opts.visibility, rating: opts.rating, q: opts.q || undefined, providerId: opts.providerId, flagged: opts.flagged });
  const pg = paging(opts.page, opts.pageSize, 25);
  return asAdmin(session, async (tx) => {
    const cond = (t: Queryable): Fragment => t`true
      ${v.visibility === "published" ? t`and r.is_published` : v.visibility === "hidden" ? t`and not r.is_published` : t``}
      ${v.rating === "critical" ? t`and r.rating <= 2` : typeof v.rating === "number" ? t`and r.rating = ${v.rating}` : t``}
      ${v.providerId ? t`and r.provider_id = ${v.providerId}` : t``}
      ${v.q ? t`and (r.comment ilike ${`%${v.q}%`} or r.provider_reply ilike ${`%${v.q}%`} or pr.display_name ilike ${`%${v.q}%`} or b.reference ilike ${`%${v.q}%`})` : t``}`;
    type Row = Omit<AdminReviewDTO, "createdAt" | "providerRepliedAt" | "contactFlags" | "customerName"> & {
      createdAt: Date; providerRepliedAt: Date | null; customerFirstName: string | null; customerLastName: string | null;
    };
    const select = (t: Queryable, limit: Fragment) => t<Row[]>`
      select r.id, r.booking_id, b.reference as booking_reference, r.rating, r.comment, r.tags, b.service_name,
             r.provider_id, pr.display_name as provider_name, pr.slug as provider_slug, r.customer_id,
             cp.first_name as customer_first_name, cp.last_name as customer_last_name,
             r.provider_reply, r.provider_replied_at, r.is_published, r.created_at
      from public.reviews r
      join public.bookings b on b.id = r.booking_id
      join public.providers pr on pr.id = r.provider_id
      join public.profiles cp on cp.id = r.customer_id
      where ${cond(t)}
      order by r.created_at desc ${limit}`;
    const toDto = (r: Row): AdminReviewDTO => {
      const { customerFirstName, customerLastName, ...rest } = r;
      const flags = [...findContactDetails(r.comment), ...findContactDetails(r.providerReply)].map((f) => f.match);
      return {
        ...rest,
        tags: [...r.tags],
        customerName: customerFirstName ? `${customerFirstName}${customerLastName ? ` ${customerLastName.charAt(0)}.` : ""}` : null,
        providerRepliedAt: iso(r.providerRepliedAt),
        createdAt: r.createdAt.toISOString(),
        contactFlags: [...new Set(flags)],
      };
    };
    if (v.flagged) {
      // Contact lint runs in TypeScript: scan the (bounded) filtered set, then page in memory.
      const all = (await select(tx, tx`limit 2000`)).map(toDto).filter((r) => r.contactFlags.length > 0);
      return { items: all.slice(pg.offset, pg.offset + pg.pageSize), total: all.length, page: pg.page, pageSize: pg.pageSize };
    }
    const rows = await select(tx, tx`limit ${pg.pageSize} offset ${pg.offset}`);
    const [{ total }] = await tx<{ total: number }[]>`
      select count(*)::int as total from public.reviews r join public.bookings b on b.id = r.booking_id join public.providers pr on pr.id = r.provider_id
      where ${cond(tx)}`;
    return { items: rows.map(toDto), total, page: pg.page, pageSize: pg.pageSize };
  });
}

// ---------------------------------------------------------------------------
// User detail (credits, bookings, privacy actions) — audit-1 R20
// ---------------------------------------------------------------------------
export async function getUserForAdmin(session: Session, userId: string): Promise<AdminUserDetailDTO | null> {
  const id = parse(zUuid, userId);
  return withService(async (tx) => {
    // withService: admin read model across users, authorised by assertAdmin() in the same transaction.
    const admin = await assertAdmin(tx, session);
    const [u] = await tx<Array<Omit<AdminUserDTO, "createdAt" | "blockedAt"> & {
      createdAt: Date; blockedAt: Date | null; avatarPath: string | null; marketingOptIn: boolean; referralCode: string; lastSignInAt: Date | null;
      anonymizedAt: Date | null; providerSlug: string | null;
    }>>`
      select p.id, u.email, p.role, p.first_name, p.last_name, p.phone, p.created_at, p.blocked_at, p.avatar_path, p.marketing_opt_in,
             p.referral_code, u.last_sign_in_at, p.anonymized_at, pr.slug as provider_slug,
             (select count(*)::int from public.bookings b where b.customer_id = p.id or b.provider_id = p.id) as bookings_count,
             pr.status as provider_status
      from public.profiles p join auth.users u on u.id = p.id left join public.providers pr on pr.id = p.id
      where p.id = ${id}`;
    if (!u) return null;
    const ledger = await tx<Array<{ id: string; amountCents: number; reason: CreditLedgerEntryDTO["reason"]; bookingId: string | null; bookingReference: string | null; note: string | null; createdAt: Date; createdByName: string | null }>>`
      select l.id, l.amount_cents, l.reason, l.booking_id, b.reference as booking_reference, l.note, l.created_at,
             nullif(trim(coalesce(cb.first_name, '') || ' ' || coalesce(cb.last_name, '')), '') as created_by_name
      from public.credit_ledger l
      left join public.bookings b on b.id = l.booking_id
      left join public.profiles cb on cb.id = l.created_by
      where l.user_id = ${id} order by l.created_at desc limit 100`;
    const [{ balance }] = await tx<{ balance: number }[]>`select coalesce(sum(amount_cents), 0)::int as balance from public.credit_ledger where user_id = ${id}`;
    const bookings = await tx<Array<{ id: string; reference: string; status: BookingStatus; startsAt: Date; serviceName: string; totalCents: number; asRole: "customer" | "provider"; counterpartName: string | null }>>`
      select b.id, b.reference, b.status, b.starts_at, b.service_name, b.total_cents,
             case when b.customer_id = ${id} then 'customer' else 'provider' end as as_role,
             case when b.customer_id = ${id} then pr.display_name
                  else nullif(trim(coalesce(cp.first_name, '') || ' ' || coalesce(left(cp.last_name, 1) || '.', '')), '') end as counterpart_name
      from public.bookings b
      join public.providers pr on pr.id = b.provider_id
      join public.profiles cp on cp.id = b.customer_id
      where b.customer_id = ${id} or b.provider_id = ${id}
      order by b.starts_at desc limit 20`;
    const [counts] = await tx<{ addresses: number; reviews: number; active: number; disputes: number }[]>`
      select (select count(*)::int from public.addresses where user_id = ${id}) as addresses,
             (select count(*)::int from public.reviews where customer_id = ${id} or provider_id = ${id}) as reviews,
             (select count(*)::int from public.bookings where (customer_id = ${id} or provider_id = ${id})
                and status in ('pending_payment', 'requested', 'confirmed', 'in_progress')) as active,
             (select count(*)::int from public.disputes d join public.bookings b on b.id = d.booking_id
                where (b.customer_id = ${id} or b.provider_id = ${id}) and d.status in ('open', 'investigating')) as disputes`;
    const { avatarPath, marketingOptIn, referralCode, lastSignInAt, anonymizedAt, providerSlug, ...user } = u;
    return {
      user: { ...user, createdAt: user.createdAt.toISOString(), blockedAt: iso(user.blockedAt) },
      avatarUrl: mediaUrl(avatarPath),
      marketingOptIn,
      referralCode,
      lastSignInAt: iso(lastSignInAt),
      anonymizedAt: iso(anonymizedAt),
      providerSlug,
      addressesCount: counts.addresses,
      reviewsCount: counts.reviews,
      credits: {
        balanceCents: balance,
        entries: ledger.map((l) => ({ ...l, reasonLabel: CREDIT_REASON_LABELS[l.reason] ?? l.reason, createdAt: l.createdAt.toISOString() })),
      },
      bookings: bookings.map((b) => ({ ...b, statusLabel: STATUS_LABELS_DE[b.status], startsAt: b.startsAt.toISOString() })),
      activeBookings: counts.active,
      openDisputes: counts.disputes,
      anonymizeBlockers: await queryAnonymizeBlockers(tx, id, { isSelf: id === admin.userId }),
    };
  }).catch(rethrowDb);
}
