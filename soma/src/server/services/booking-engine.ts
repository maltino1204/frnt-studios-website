import "server-only";

import { setActor, withService, type Tx } from "../db/client";
import {
  assertTransition,
  BookingTransitionError,
  computeRespondBy,
  type Actor,
  type BookingStatus,
} from "../domain/booking-state";
import { computeCancellation, computeNoShowFee, parsePolicy, type CancellationOutcome } from "../domain/cancellation";
import { splitRetainedFee } from "../domain/pricing";
import type { PaymentProviderId } from "../dto";
import { ServiceError } from "../errors";
import { createDevPaymentProvider } from "../payments/dev";
import type { PaymentProvider } from "../payments/provider";
import { createStripePaymentProvider } from "../payments/stripe";
import { loadSettings, type PlatformSettings } from "./_shared";
import { notify } from "./notifications";

/**
 * Booking-engine internals shared by bookings.ts, booking-maintenance.ts and
 * admin.ts. Every function here expects a service transaction (owner rights)
 * and that the caller has already authorised the actor.
 */

export interface BookingRow {
  id: string;
  reference: string;
  customerId: string;
  providerId: string;
  providerServiceId: string;
  serviceId: string;
  categoryId: string;
  serviceName: string;
  durationMinutes: number;
  startsAt: Date;
  endsAt: Date;
  status: BookingStatus;
  bookingMode: "instant" | "request";
  postalCode: string;
  servicePriceCents: number;
  travelFeeCents: number;
  serviceFeeCents: number;
  discountCents: number;
  totalCents: number;
  commissionRate: string;
  commissionCents: number;
  providerPayoutCents: number;
  cancellationPolicy: unknown;
  startCode: string;
  startCodeAttempts: number;
  holdExpiresAt: Date | null;
  respondBy: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
}

export interface PaymentRow {
  id: string;
  provider: PaymentProviderId;
  status: string;
  amountCents: number;
  capturedCents: number;
  refundedCents: number;
  applicationFeeCents: number;
  externalId: string | null;
}

export type PaymentOp =
  | { kind: "capture"; paymentId: string; provider: PaymentProviderId; externalId: string; amountCents: number; applicationFeeCents?: number }
  | { kind: "release"; paymentId: string; provider: PaymentProviderId; externalId: string };

export async function lockBooking(tx: Tx, id: string, scope?: { customerId?: string; providerId?: string }): Promise<BookingRow | null> {
  const rows = await tx<BookingRow[]>`
    select id, reference, customer_id, provider_id, provider_service_id, service_id, category_id, service_name, duration_minutes,
           starts_at, ends_at, status, booking_mode, postal_code, service_price_cents, travel_fee_cents, service_fee_cents,
           discount_cents, total_cents, commission_rate::text as commission_rate, commission_cents, provider_payout_cents,
           cancellation_policy, start_code, start_code_attempts, hold_expires_at, respond_by, completed_at, cancelled_at
    from public.bookings
    where id = ${id}
      ${scope?.customerId ? tx`and customer_id = ${scope.customerId}` : tx``}
      ${scope?.providerId ? tx`and provider_id = ${scope.providerId}` : tx``}
    for update`;
  return rows[0] ?? null;
}

export async function lockPayment(tx: Tx, bookingId: string): Promise<PaymentRow | null> {
  const rows = await tx<PaymentRow[]>`
    select id, provider, status, amount_cents, captured_cents, refunded_cents, application_fee_cents, external_id
    from public.payments where booking_id = ${bookingId} for update`;
  return rows[0] ?? null;
}

const TRANSITION_MESSAGES: Record<BookingTransitionError["reason"], string> = {
  not_allowed: "Diese Aktion ist für den aktuellen Buchungsstatus nicht möglich.",
  actor: "Diese Aktion ist bei dieser Buchung nicht erlaubt.",
  too_early: "Diese Aktion ist zu diesem Zeitpunkt noch nicht möglich.",
};

export function guardTransition(from: BookingStatus, to: BookingStatus, actor: Actor): void {
  try {
    assertTransition(from, to, actor);
  } catch (e) {
    if (e instanceof BookingTransitionError) throw new ServiceError("invalid_state", TRANSITION_MESSAGES[e.reason]);
    throw e;
  }
}

/** Status change + patch in one UPDATE; the DB trigger re-validates and logs booking_events. */
export async function applyTransition(
  tx: Tx,
  b: BookingRow,
  to: BookingStatus,
  actor: Actor,
  actorId: string | null,
  patch: Record<string, string | number | Date | null> = {},
  note?: string | null,
): Promise<void> {
  guardTransition(b.status, to, actor);
  await setActor(tx, { actorId, actorRole: actor, note: note ?? null });
  await tx`update public.bookings set ${tx({ status: to, ...patch })} where id = ${b.id}`;
  b.status = to;
}

export function policyOf(b: BookingRow) {
  return parsePolicy(b.cancellationPolicy);
}

/** Gives back (a share of) the credits redeemed on this booking. */
export async function refundRedeemedCredits(tx: Tx, b: BookingRow, share: number): Promise<number> {
  if (b.discountCents <= 0 || share <= 0) return 0;
  const amount = Math.round(b.discountCents * Math.min(1, share));
  if (amount <= 0) return 0;
  await tx`
    insert into public.credit_ledger (user_id, amount_cents, reason, booking_id, note)
    values (${b.customerId}, ${amount}, 'booking_refund', ${b.id}, 'Guthaben aus Stornierung zurückgebucht')`;
  return amount;
}

/**
 * Settles the authorization for a fee (partial capture) or releases it.
 * Returns the external operation to execute after commit.
 */
async function settlePayment(tx: Tx, b: BookingRow, feeCents: number, feeCommissionCents: number): Promise<PaymentOp | null> {
  const p = await lockPayment(tx, b.id);
  if (!p) return null;
  if (p.status === "authorized" && feeCents > 0) {
    await tx`update public.payments set status = 'captured', captured_cents = ${feeCents}, application_fee_cents = ${feeCommissionCents} where id = ${p.id}`;
    return p.externalId ? { kind: "capture", paymentId: p.id, provider: p.provider, externalId: p.externalId, amountCents: feeCents, applicationFeeCents: feeCommissionCents } : null;
  }
  if (p.status === "authorized" || p.status === "requires_payment_method") {
    await tx`update public.payments set status = 'cancelled' where id = ${p.id}`;
    return p.externalId ? { kind: "release", paymentId: p.id, provider: p.provider, externalId: p.externalId } : null;
  }
  return null;
}

export interface CancelOptions {
  actor: Actor;
  actorId: string | null;
  reason: string | null;
  now?: Date;
  /** admin only: override the fee (cents retained) */
  feeOverrideCents?: number;
  /** status to move to (cancelled by default; declined/expired use the same settlement) */
  to?: Extract<BookingStatus, "cancelled" | "declined" | "expired">;
}

export interface CancelResult {
  outcome: CancellationOutcome;
  op: PaymentOp | null;
}

/** Cancellation / decline / expiry with policy fees, payment settlement, credits and notifications. */
export async function cancelInTx(tx: Tx, b: BookingRow, opts: CancelOptions): Promise<CancelResult> {
  const to = opts.to ?? "cancelled";
  const now = opts.now ?? new Date();
  guardTransition(b.status, to, opts.actor);
  const base = computeCancellation(
    { status: b.status, startsAt: b.startsAt, totalCents: b.totalCents, serviceFeeCents: b.serviceFeeCents, cancellationPolicy: policyOf(b) },
    now,
    opts.actor,
  );
  const outcome: CancellationOutcome =
    opts.feeOverrideCents != null
      ? { ...base, feeCents: Math.min(b.totalCents, Math.max(0, opts.feeOverrideCents)), refundCents: b.totalCents - Math.min(b.totalCents, Math.max(0, opts.feeOverrideCents)), feePercent: b.totalCents > 0 ? Math.round((Math.max(0, opts.feeOverrideCents) / b.totalCents) * 100) : 0, tierLabel: "Individuell (SOMA)" }
      : base;
  const split = outcome.feeCents > 0 ? splitRetainedFee(outcome.feeCents, Number(b.commissionRate)) : { commissionCents: 0, providerPayoutCents: 0 };
  const op = await settlePayment(tx, b, outcome.feeCents, split.commissionCents);
  await applyTransition(
    tx, b, to, opts.actor, opts.actorId,
    {
      cancelledBy: to === "cancelled" ? opts.actor : to === "declined" ? "provider" : "system",
      cancellationReason: opts.reason,
      cancellationFeeCents: outcome.feeCents,
      refundCents: outcome.refundCents,
      commissionCents: split.commissionCents,
      providerPayoutCents: split.providerPayoutCents,
    },
    opts.reason,
  );
  const share = outcome.feeCents === 0 ? 1 : Math.max(0, 1 - outcome.feePercent / 100);
  await refundRedeemedCredits(tx, b, share);
  await notify(tx, to === "cancelled" ? "booking.cancelled" : to === "declined" ? "booking.declined" : "booking.expired", { bookingId: b.id });
  return { outcome, op };
}

/** No-show: 100 % fee (policy), partial capture, provider share. */
export async function noShowInTx(tx: Tx, b: BookingRow, actor: Actor, actorId: string | null): Promise<CancelResult> {
  guardTransition(b.status, "no_show", actor);
  const outcome = computeNoShowFee({ totalCents: b.totalCents, serviceFeeCents: b.serviceFeeCents, cancellationPolicy: policyOf(b) });
  const split = splitRetainedFee(outcome.feeCents, Number(b.commissionRate));
  const op = await settlePayment(tx, b, outcome.feeCents, split.commissionCents);
  await applyTransition(tx, b, "no_show", actor, actorId, {
    cancellationFeeCents: outcome.feeCents,
    refundCents: outcome.refundCents,
    commissionCents: split.commissionCents,
    providerPayoutCents: split.providerPayoutCents,
    cancellationReason: "Kund:in nicht angetroffen",
  });
  await refundRedeemedCredits(tx, b, Math.max(0, 1 - outcome.feePercent / 100));
  await notify(tx, "booking.no_show", { bookingId: b.id });
  return { outcome, op };
}

/** Completion: full capture, referral reward, notifications. */
export async function completeInTx(tx: Tx, b: BookingRow, actor: Actor, actorId: string | null, settings?: PlatformSettings): Promise<PaymentOp | null> {
  guardTransition(b.status, "completed", actor);
  const p = await lockPayment(tx, b.id);
  let op: PaymentOp | null = null;
  if (p && p.status === "authorized") {
    const fee = Math.max(0, Math.min(p.amountCents, b.totalCents - b.providerPayoutCents));
    await tx`update public.payments set status = 'captured', captured_cents = amount_cents, application_fee_cents = ${fee} where id = ${p.id}`;
    if (p.externalId && p.amountCents > 0) op = { kind: "capture", paymentId: p.id, provider: p.provider, externalId: p.externalId, amountCents: p.amountCents, applicationFeeCents: fee };
  }
  await applyTransition(tx, b, "completed", actor, actorId, {}, actor === "system" ? "Automatisch abgeschlossen" : null);
  await rewardReferralIfFirstCompletion(tx, b, settings ?? (await loadSettings(tx)));
  await notify(tx, "booking.completed", { bookingId: b.id });
  return op;
}

/** Referral: the referrer earns the reward after the referred customer's first completed booking. */
export async function rewardReferralIfFirstCompletion(tx: Tx, b: BookingRow, settings: PlatformSettings): Promise<boolean> {
  const [ref] = await tx<{ id: string; referrerId: string }[]>`
    select id, referrer_id from public.referrals
    where referred_id = ${b.customerId} and status in ('pending', 'qualified')
    for update`;
  if (!ref) return false;
  const [cnt] = await tx<{ n: number }[]>`select count(*)::int as n from public.bookings where customer_id = ${b.customerId} and status = 'completed'`;
  if (cnt.n !== 1) return false;
  await tx`update public.referrals set status = 'rewarded', qualified_booking_id = ${b.id}, rewarded_at = now() where id = ${ref.id}`;
  if (settings.referralRewardCents > 0) {
    await tx`
      insert into public.credit_ledger (user_id, amount_cents, reason, booking_id, note)
      values (${ref.referrerId}, ${settings.referralRewardCents}, 'referral_reward', ${b.id}, 'Empfehlungsprämie')`;
    await notify(tx, "referral.rewarded", { userId: ref.referrerId, amountCents: settings.referralRewardCents });
  }
  return true;
}

/** pending_payment → requested | confirmed once the payment is authorized. */
export async function authorizeInTx(tx: Tx, b: BookingRow, card: { cardBrand?: string | null; cardLast4?: string | null; externalId?: string | null }, now = new Date()): Promise<BookingStatus> {
  if (b.status !== "pending_payment") return b.status;
  const settings = await loadSettings(tx);
  const p = await lockPayment(tx, b.id);
  if (p) {
    await tx`
      update public.payments
      set status = 'authorized', card_brand = ${card.cardBrand ?? null}, card_last4 = ${card.cardLast4 ?? null},
          external_id = coalesce(${card.externalId ?? null}, external_id)
      where id = ${p.id}`;
  }
  if (b.bookingMode === "request") {
    const respondBy = computeRespondBy(now, b.startsAt, settings.requestResponseHours);
    await applyTransition(tx, b, "requested", "system", null, { respondBy, holdExpiresAt: null }, "Zahlung autorisiert");
    await notify(tx, "booking.requested", { bookingId: b.id });
    return "requested";
  }
  await applyTransition(tx, b, "confirmed", "system", null, { holdExpiresAt: null }, "Zahlung autorisiert");
  await notify(tx, "booking.confirmed", { bookingId: b.id });
  return "confirmed";
}

function providerFor(id: PaymentProviderId): PaymentProvider {
  return id === "stripe" ? createStripePaymentProvider() : createDevPaymentProvider();
}

/** Executes external payment operations after commit; failures are recorded, never silently dropped. */
export async function runPaymentOps(ops: Array<PaymentOp | null | undefined>): Promise<void> {
  for (const op of ops) {
    if (!op) continue;
    try {
      const provider = providerFor(op.provider);
      if (op.kind === "capture") await provider.capture(op.externalId, op.amountCents, op.applicationFeeCents);
      else await provider.release(op.externalId);
    } catch (e) {
      console.error(`[payments] ${op.kind} failed for ${op.externalId}`, e);
      // withService: system bookkeeping of a failed external payment operation.
      await withService(async (tx) => {
        if (op.kind === "capture") await tx`update public.payments set status = 'failed' where id = ${op.paymentId}`;
        await tx`
          insert into public.audit_log (actor_id, action, entity, entity_id, data)
          values (null, ${`payment.${op.kind}_failed`}, 'payment', ${op.paymentId},
                  ${tx.json({ externalId: op.externalId, error: e instanceof Error ? e.message : "unknown" })})`;
      });
    }
  }
}
