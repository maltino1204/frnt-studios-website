import "server-only";

import type { BookingStatus } from "./booking-state";

/**
 * Cancellation policy "SOMA Standard" (docs/architecture.md §5.5, product spec §8) — pure.
 *
 *  - Bedenkzeit: free within `grace_minutes` (15) after the booking was made, whatever the tier.
 *  - Customer cancels a confirmed booking: the first tier whose `min_hours_before`
 *    is <= the hours left applies:  ≥ 24 h → 0 %,  ≥ 2 h → 50 %,  < 2 h → 100 %.
 *  - Fee basis = the SERVICE PRICE only. The travel fee is refunded for tiers with
 *    `travel_fee_retained: false` (≥ 2 h) and kept in full otherwise (< 2 h, no-show),
 *    because the provider is already on the way.
 *  - No-show: `no_show_fee_percent` (100 %) of the service price + the travel fee.
 *  - Requested (not yet accepted) bookings and holds are always free; provider /
 *    system cancellations are a full refund; admins decide explicitly.
 *
 * Credits (SOMA-Guthaben) are part of the service payment: the cash fee is the
 * percentage of (service price − discount); the same percentage of the credits is
 * kept, the rest is returned (see booking-engine.refundRedeemedCredits).
 */

export interface PolicyTier {
  min_hours_before: number;
  /** percent of the service price */
  fee_percent: number;
  /** keep the travel fee in this tier */
  travel_fee_retained: boolean;
}

export interface CancellationPolicy {
  tiers: PolicyTier[];
  no_show_fee_percent: number;
  provider_cancellation: "full_refund";
  /** free cancellation within this many minutes after booking (0 for legacy snapshots) */
  grace_minutes: number;
  fee_basis: "service_price";
}

export type CancelActor = "customer" | "provider" | "admin" | "system";

export interface CancellableBooking {
  status: BookingStatus;
  startsAt: Date;
  /** when the booking was made (start of the Bedenkzeit) */
  createdAt: Date;
  servicePriceCents: number;
  travelFeeCents: number;
  serviceFeeCents: number;
  discountCents: number;
  totalCents: number;
  cancellationPolicy: CancellationPolicy;
}

export interface CancellationOutcome {
  /** cash amount kept (captured) */
  feeCents: number;
  /** cash amount refunded / released */
  refundCents: number;
  /** percent of the service price kept */
  feePercent: number;
  travelFeeRetained: boolean;
  /** value of the kept service share (basis for commission; includes the credit-funded part) */
  retainedServiceCents: number;
  /** travel fee kept (100 % to the provider) */
  retainedTravelCents: number;
  inGracePeriod: boolean;
  tierLabel: string;
}

const HOUR = 3_600_000;
const MINUTE = 60_000;

export const DEFAULT_GRACE_MINUTES = 15;

function toNumber(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/**
 * Normalises a stored policy (platform setting or booking snapshot). Older
 * snapshots without `travel_fee_retained` / `grace_minutes` are read as:
 * travel retained in 100 % tiers, no Bedenkzeit.
 */
export function parsePolicy(value: unknown): CancellationPolicy {
  const v = (value ?? {}) as Record<string, unknown>;
  const rawTiers = Array.isArray(v.tiers) ? (v.tiers as Array<Record<string, unknown>>) : [];
  const tiers = rawTiers
    .filter((t) => typeof t?.min_hours_before === "number" && typeof t?.fee_percent === "number")
    .map((t) => {
      const fee = Math.min(100, Math.max(0, t.fee_percent as number));
      return {
        min_hours_before: t.min_hours_before as number,
        fee_percent: fee,
        travel_fee_retained: typeof t.travel_fee_retained === "boolean" ? t.travel_fee_retained : fee >= 100,
      };
    });
  if (tiers.length === 0) throw new Error("Stornobedingungen ohne Staffeln");
  return {
    tiers: [...tiers].sort((a, b) => b.min_hours_before - a.min_hours_before),
    no_show_fee_percent: Math.min(100, Math.max(0, toNumber(v.no_show_fee_percent, 100))),
    provider_cancellation: "full_refund",
    grace_minutes: Math.max(0, toNumber(v.grace_minutes, 0)),
    fee_basis: "service_price",
  };
}

export function tierLabel(feePercent: number, travelFeeRetained = false): string {
  if (feePercent <= 0 && !travelFeeRetained) return "Kostenlose Stornierung";
  if (travelFeeRetained) return feePercent > 0 ? `${feePercent}\u00a0% des Behandlungspreises zzgl. Anfahrt` : "Anfahrt wird berechnet";
  return `${feePercent}\u00a0% des Behandlungspreises, Anfahrt wird erstattet`;
}

export const GRACE_LABEL = "Kostenlose Stornierung (Bedenkzeit)";

/** Tier that applies when the customer cancels at `now`. */
export function applicableTier(policy: CancellationPolicy, startsAt: Date, now: Date): PolicyTier {
  const hoursBefore = (startsAt.getTime() - now.getTime()) / HOUR;
  const tiers = [...policy.tiers].sort((a, b) => b.min_hours_before - a.min_hours_before);
  for (const t of tiers) if (hoursBefore >= t.min_hours_before) return t;
  // Past the start (negative hours): the strictest tier.
  return tiers[tiers.length - 1];
}

/** End of the Bedenkzeit (createdAt + grace), never after the start. */
export function graceEndsAt(policy: CancellationPolicy, createdAt: Date, startsAt: Date): Date | null {
  if (policy.grace_minutes <= 0) return null;
  return new Date(Math.min(createdAt.getTime() + policy.grace_minutes * MINUTE, startsAt.getTime()));
}

export function isInGracePeriod(policy: CancellationPolicy, createdAt: Date, startsAt: Date, now: Date): boolean {
  const end = graceEndsAt(policy, createdAt, startsAt);
  return end !== null && now.getTime() <= end.getTime();
}

function outcomeFor(b: CancellableBooking, feePercent: number, travelRetained: boolean, label: string, inGrace = false): CancellationOutcome {
  const retainedService = Math.round((b.servicePriceCents * feePercent) / 100);
  const cashService = Math.round((Math.max(0, b.servicePriceCents - b.discountCents) * feePercent) / 100);
  const retainedTravel = travelRetained ? b.travelFeeCents : 0;
  const fee = Math.min(b.totalCents, cashService + retainedTravel);
  return {
    feeCents: fee,
    refundCents: b.totalCents - fee,
    feePercent,
    travelFeeRetained: travelRetained && b.travelFeeCents > 0,
    retainedServiceCents: retainedService,
    retainedTravelCents: retainedTravel,
    inGracePeriod: inGrace,
    tierLabel: label,
  };
}

function free(b: CancellableBooking, inGrace = false): CancellationOutcome {
  return outcomeFor(b, 0, false, inGrace ? GRACE_LABEL : tierLabel(0), inGrace);
}

export function computeCancellation(b: CancellableBooking, now: Date, actor: CancelActor): CancellationOutcome {
  if (b.status === "pending_payment" || b.status === "requested") return free(b);
  if (actor !== "customer") return free(b); // provider / system: full refund; admin decides explicitly
  if (b.status !== "confirmed") return free(b);
  if (isInGracePeriod(b.cancellationPolicy, b.createdAt, b.startsAt, now)) return free(b, true);
  const tier = applicableTier(b.cancellationPolicy, b.startsAt, now);
  return outcomeFor(b, tier.fee_percent, tier.travel_fee_retained, tierLabel(tier.fee_percent, tier.travel_fee_retained));
}

/** No-show: no_show_fee_percent of the service price plus the full travel fee. */
export function computeNoShowFee(b: Omit<CancellableBooking, "status" | "startsAt" | "createdAt">): CancellationOutcome {
  const pct = b.cancellationPolicy.no_show_fee_percent;
  return outcomeFor({ ...b, status: "confirmed", startsAt: new Date(0), createdAt: new Date(0) }, pct, true, tierLabel(pct, true));
}

export interface PolicyScheduleEntry {
  /** tier applies from this instant (ISO) … null = any time before */
  from: string | null;
  /** … until this instant (ISO); null = and afterwards */
  until: string | null;
  feePercent: number;
  travelFeeRetained: boolean;
  label: string;
}

/**
 * Concrete schedule for display ("Kostenlos stornierbar bis Mi, 18:30 Uhr").
 * With `createdAt` (booking time; use "now" for a quote) the Bedenkzeit extends
 * the free period when it ends later than the 24-h deadline.
 */
export function policySchedule(policy: CancellationPolicy, startsAt: Date, createdAt?: Date): PolicyScheduleEntry[] {
  const tiers = [...policy.tiers].sort((a, b) => b.min_hours_before - a.min_hours_before);
  const raw = tiers.map((t, i) => ({
    from: i === 0 ? null : startsAt.getTime() - tiers[i - 1].min_hours_before * HOUR,
    until: i === tiers.length - 1 && t.min_hours_before <= 0 ? null : startsAt.getTime() - t.min_hours_before * HOUR,
    feePercent: t.fee_percent,
    travelFeeRetained: t.travel_fee_retained,
    label: tierLabel(t.fee_percent, t.travel_fee_retained),
  }));
  const graceEnd = createdAt ? graceEndsAt(policy, createdAt, startsAt) : null;
  let entries = raw;
  if (graceEnd) {
    const g = graceEnd.getTime();
    const firstFree = raw[0].feePercent === 0 && !raw[0].travelFeeRetained ? raw[0] : null;
    const freeUntil = firstFree?.until ?? null;
    if (freeUntil === null || g > freeUntil) {
      // The Bedenkzeit outlasts the regular free tier: free until graceEnd, then the tier in force.
      const rest = raw
        .filter((e) => e.until === null || e.until > g)
        .filter((e) => !(e.feePercent === 0 && !e.travelFeeRetained))
        .map((e) => ({ ...e, from: e.from === null || e.from < g ? g : e.from }));
      entries = [{ from: null, until: g, feePercent: 0, travelFeeRetained: false, label: GRACE_LABEL }, ...rest];
    }
  }
  return entries.map((e) => ({
    from: e.from === null ? null : new Date(e.from).toISOString(),
    until: e.until === null ? null : new Date(e.until).toISOString(),
    feePercent: e.feePercent,
    travelFeeRetained: e.travelFeeRetained,
    label: e.label,
  }));
}

/** Last instant a customer can still cancel for free (regular free tier or Bedenkzeit), or null. */
export function freeCancellationUntil(policy: CancellationPolicy, startsAt: Date, createdAt?: Date): string | null {
  const freeTiers = policy.tiers.filter((t) => t.fee_percent === 0 && !t.travel_fee_retained);
  const byTier = freeTiers.length ? startsAt.getTime() - Math.min(...freeTiers.map((t) => t.min_hours_before)) * HOUR : null;
  const grace = createdAt ? graceEndsAt(policy, createdAt, startsAt)?.getTime() ?? null : null;
  const best = Math.max(byTier ?? -Infinity, grace ?? -Infinity);
  return Number.isFinite(best) ? new Date(best).toISOString() : null;
}
