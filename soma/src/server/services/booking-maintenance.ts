import "server-only";

import { withService } from "../db/client";
import { loadSettings } from "./_shared";
import { cancelInTx, completeInTx, lockBooking, runPaymentOps, type PaymentOp } from "./booking-engine";
import { deliverQueuedEmails, notify } from "./notifications";

/**
 * Booking maintenance (docs/architecture.md §5.2):
 *   - expire slot holds (pending_payment past hold_expires_at)      → expired, release
 *   - expire unanswered requests (requested past respond_by)       → expired, release, notify
 *   - auto-complete confirmed/in_progress 24 h after ends_at       → completed, capture
 *   - 24 h reminders
 *   - deliver queued e-mails
 * Called lazily by booking operations/dashboards and by POST /api/cron/booking-maintenance.
 * Every step runs as the system (withService) — it is a maintenance job by definition.
 */

export interface MaintenanceResult {
  expiredHolds: number;
  expiredRequests: number;
  autoCompleted: number;
  reminders: number;
  emailsSent: number;
}

async function dueIds(query: (tx: Parameters<Parameters<typeof withService>[0]>[0]) => Promise<Array<{ id: string }>>): Promise<string[]> {
  // withService: maintenance job selects due bookings across all users.
  return (await withService(query)).map((r) => r.id);
}

export async function runBookingMaintenance(now: Date = new Date()): Promise<MaintenanceResult> {
  const result: MaintenanceResult = { expiredHolds: 0, expiredRequests: 0, autoCompleted: 0, reminders: 0, emailsSent: 0 };
  const ops: Array<PaymentOp | null> = [];

  const holds = await dueIds((tx) => tx<{ id: string }[]>`
    select id from public.bookings where status = 'pending_payment' and hold_expires_at < ${now} order by hold_expires_at limit 500`);
  for (const id of holds) {
    // withService: maintenance job (system actor).
    const done = await withService(async (tx) => {
      const b = await lockBooking(tx, id);
      if (!b || b.status !== "pending_payment" || !b.holdExpiresAt || b.holdExpiresAt >= now) return false;
      const r = await cancelInTx(tx, b, { actor: "system", actorId: null, reason: "payment_timeout", to: "expired", now });
      ops.push(r.op);
      return true;
    });
    if (done) result.expiredHolds += 1;
  }

  const requests = await dueIds((tx) => tx<{ id: string }[]>`
    select id from public.bookings where status = 'requested' and respond_by < ${now} order by respond_by limit 500`);
  for (const id of requests) {
    // withService: maintenance job (system actor).
    const done = await withService(async (tx) => {
      const b = await lockBooking(tx, id);
      if (!b || b.status !== "requested" || !b.respondBy || b.respondBy >= now) return false;
      const r = await cancelInTx(tx, b, { actor: "system", actorId: null, reason: "no_response", to: "expired", now });
      ops.push(r.op);
      return true;
    });
    if (done) result.expiredRequests += 1;
  }

  // withService: maintenance job reads platform settings once.
  const settings = await withService((tx) => loadSettings(tx));
  const completions = await dueIds((tx) => tx<{ id: string }[]>`
    select id from public.bookings
    where status in ('confirmed', 'in_progress')
      and ends_at + make_interval(hours => ${settings.autoCompleteHours}) < ${now}
      and starts_at <= now()
    order by ends_at limit 500`);
  for (const id of completions) {
    // withService: maintenance job (system actor) — auto-completion captures the payment.
    const done = await withService(async (tx) => {
      const b = await lockBooking(tx, id);
      if (!b || (b.status !== "confirmed" && b.status !== "in_progress")) return false;
      ops.push(await completeInTx(tx, b, "system", null, settings));
      return true;
    });
    if (done) result.autoCompleted += 1;
  }

  const reminders = await dueIds((tx) => tx<{ id: string }[]>`
    select id from public.bookings
    where status = 'confirmed' and reminder_24h_sent_at is null
      and starts_at > ${now} and starts_at <= ${now} + interval '24 hours'
    limit 500`);
  for (const id of reminders) {
    // withService: maintenance job writes reminder notifications for both parties.
    await withService(async (tx) => {
      const rows = await tx`update public.bookings set reminder_24h_sent_at = now() where id = ${id} and reminder_24h_sent_at is null returning id`;
      if (rows.length) await notify(tx, "booking.reminder_24h", { bookingId: id });
    });
    result.reminders += 1;
  }

  await runPaymentOps(ops);
  result.emailsSent = await deliverQueuedEmails(100);
  return result;
}

let lastLazyRun = 0;
let running: Promise<unknown> | null = null;

/** Throttled (30 s) in-process trigger used at the start of booking operations and dashboard loads. */
export async function runBookingMaintenanceLazily(): Promise<void> {
  if (running || Date.now() - lastLazyRun < 30_000) return;
  lastLazyRun = Date.now();
  running = runBookingMaintenance()
    .catch((e: unknown) => console.error("[maintenance] failed", e))
    .finally(() => {
      running = null;
    });
  await running;
}

/** Test hook: allow the next lazy run immediately. */
export function resetMaintenanceThrottle(): void {
  lastLazyRun = 0;
}
