import "server-only";

import type { BookingStatus } from "./booking-state";

/**
 * Cancellation policy (docs/architecture.md §5.5) — pure.
 *
 * Fee = fee_percent of (total_cents − service_fee_cents) by the first tier whose
 * `min_hours_before` is <= the hours left until the start. Requested (not yet
 * accepted) bookings and holds are always free; provider/system cancellations
 * are a full refund. Admins decide the refund themselves (default: full).
 */

export interface PolicyTier {
  min_hours_before: number;
  fee_percent: number;
}

export interface CancellationPolicy {
  tiers: PolicyTier[];
  no_show_fee_percent: number;
  provider_cancellation: "full_refund";
}

export type CancelActor = "customer" | "provider" | "admin" | "system";

export interface CancellableBooking {
  status: BookingStatus;
  startsAt: Date;
  totalCents: number;
  serviceFeeCents: number;
  cancellationPolicy: CancellationPolicy;
}

export interface CancellationOutcome {
  feeCents: number;
  refundCents: number;
  feePercent: number;
  tierLabel: string;
}

const HOUR = 3_600_000;

export function parsePolicy(value: unknown): CancellationPolicy {
  const v = (value ?? {}) as Partial<CancellationPolicy>;
  const tiers = Array.isArray(v.tiers)
    ? v.tiers
        .filter((t): t is PolicyTier => typeof t?.min_hours_before === "number" && typeof t?.fee_percent === "number")
        .map((t) => ({ min_hours_before: t.min_hours_before, fee_percent: Math.min(100, Math.max(0, t.fee_percent)) }))
    : [];
  if (tiers.length === 0) throw new Error("Stornobedingungen ohne Staffeln");
  return {
    tiers: [...tiers].sort((a, b) => b.min_hours_before - a.min_hours_before),
    no_show_fee_percent: typeof v.no_show_fee_percent === "number" ? v.no_show_fee_percent : 100,
    provider_cancellation: "full_refund",
  };
}

export function tierLabel(feePercent: number): string {
  if (feePercent <= 0) return "Kostenlose Stornierung";
  return `${feePercent} % Stornogebühr`;
}

function chargeable(b: CancellableBooking): number {
  return Math.max(0, b.totalCents - b.serviceFeeCents);
}

/** Tier that applies when the customer cancels at `now`. */
export function applicableTier(policy: CancellationPolicy, startsAt: Date, now: Date): PolicyTier {
  const hoursBefore = (startsAt.getTime() - now.getTime()) / HOUR;
  const tiers = [...policy.tiers].sort((a, b) => b.min_hours_before - a.min_hours_before);
  for (const t of tiers) if (hoursBefore >= t.min_hours_before) return t;
  // Past the start (negative hours): the strictest tier.
  return tiers[tiers.length - 1];
}

export function computeCancellation(b: CancellableBooking, now: Date, actor: CancelActor): CancellationOutcome {
  const free: CancellationOutcome = { feeCents: 0, refundCents: b.totalCents, feePercent: 0, tierLabel: tierLabel(0) };
  if (b.status === "pending_payment" || b.status === "requested") return free;
  if (actor !== "customer") return free; // provider / system: full refund; admin decides explicitly
  if (b.status !== "confirmed") return free;
  const tier = applicableTier(b.cancellationPolicy, b.startsAt, now);
  const fee = Math.round((chargeable(b) * tier.fee_percent) / 100);
  return { feeCents: fee, refundCents: b.totalCents - fee, feePercent: tier.fee_percent, tierLabel: tierLabel(tier.fee_percent) };
}

export function computeNoShowFee(b: Pick<CancellableBooking, "totalCents" | "serviceFeeCents" | "cancellationPolicy">): CancellationOutcome {
  const pct = b.cancellationPolicy.no_show_fee_percent;
  const fee = Math.round((chargeable(b as CancellableBooking) * pct) / 100);
  return { feeCents: fee, refundCents: b.totalCents - fee, feePercent: pct, tierLabel: tierLabel(pct) };
}

export interface PolicyScheduleEntry {
  /** customer cancels before this instant (ISO) … */
  until: string | null;
  /** … and from this instant on (ISO) */
  from: string | null;
  feePercent: number;
  label: string;
}

/**
 * Concrete schedule for display ("Kostenlos stornierbar bis Mi, 18:30 Uhr"):
 * one entry per tier with the instant from which it applies.
 */
export function policySchedule(policy: CancellationPolicy, startsAt: Date): PolicyScheduleEntry[] {
  const tiers = [...policy.tiers].sort((a, b) => b.min_hours_before - a.min_hours_before);
  return tiers.map((t, i) => {
    const from = i === 0 ? null : new Date(startsAt.getTime() - tiers[i - 1].min_hours_before * HOUR).toISOString();
    const until = t.min_hours_before > 0 || i < tiers.length - 1
      ? new Date(startsAt.getTime() - t.min_hours_before * HOUR).toISOString()
      : null;
    return { from, until, feePercent: t.fee_percent, label: tierLabel(t.fee_percent) };
  });
}

/** Last instant at which a customer can still cancel for free, or null if never free. */
export function freeCancellationUntil(policy: CancellationPolicy, startsAt: Date): string | null {
  const freeTiers = policy.tiers.filter((t) => t.fee_percent === 0);
  if (freeTiers.length === 0) return null;
  const minHours = Math.min(...freeTiers.map((t) => t.min_hours_before));
  return new Date(startsAt.getTime() - minHours * HOUR).toISOString();
}
