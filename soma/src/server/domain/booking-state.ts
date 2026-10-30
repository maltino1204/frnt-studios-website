import "server-only";

/**
 * Booking state machine (docs/architecture.md §5.2) — pure.
 * Mirrored in Postgres by public.booking_transition_allowed() + the
 * enforce_booking_transition trigger (the DB has the final word).
 */

export const BOOKING_STATUSES = [
  "pending_payment",
  "requested",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "declined",
  "expired",
  "no_show",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type Actor = "customer" | "provider" | "admin" | "system";

/** Statuses that block the provider's calendar (exclusion constraint predicate). */
export const BLOCKING_STATUSES: readonly BookingStatus[] = ["pending_payment", "requested", "confirmed", "in_progress"];
export const TERMINAL_STATUSES: readonly BookingStatus[] = ["completed", "cancelled", "declined", "expired", "no_show"];

const TRANSITIONS: Record<string, readonly Actor[]> = {
  "pending_payment>requested": ["system"],
  "pending_payment>confirmed": ["system"],
  "pending_payment>expired": ["system"],
  "pending_payment>cancelled": ["customer", "admin", "system"],
  "requested>confirmed": ["provider", "admin"],
  "requested>declined": ["provider", "admin"],
  "requested>expired": ["system"],
  "requested>cancelled": ["customer", "admin", "system"],
  "confirmed>in_progress": ["provider", "admin"],
  "confirmed>completed": ["provider", "admin", "system"],
  "confirmed>no_show": ["provider", "admin"],
  "confirmed>cancelled": ["customer", "provider", "admin", "system"],
  "in_progress>completed": ["provider", "admin", "system"],
  "in_progress>cancelled": ["admin"],
};

export class BookingTransitionError extends Error {
  constructor(
    public readonly from: BookingStatus,
    public readonly to: BookingStatus,
    public readonly actor: Actor,
    public readonly reason: "not_allowed" | "actor" | "too_early",
  ) {
    super(`Ungültiger Statuswechsel ${from} → ${to} (${actor}, ${reason})`);
    this.name = "BookingTransitionError";
  }
}

export function isBlocking(status: BookingStatus): boolean {
  return BLOCKING_STATUSES.includes(status);
}

export function isTerminal(status: BookingStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Pure graph check, independent of the actor (same table as the DB function). */
export function isTransitionAllowed(from: BookingStatus, to: BookingStatus): boolean {
  return `${from}>${to}` in TRANSITIONS;
}

export function canTransition(from: BookingStatus, to: BookingStatus, actor: Actor): boolean {
  const actors = TRANSITIONS[`${from}>${to}`];
  return actors !== undefined && actors.includes(actor);
}

export function assertTransition(from: BookingStatus, to: BookingStatus, actor: Actor): void {
  const actors = TRANSITIONS[`${from}>${to}`];
  if (!actors) throw new BookingTransitionError(from, to, actor, "not_allowed");
  if (!actors.includes(actor)) throw new BookingTransitionError(from, to, actor, "actor");
}

export const START_WINDOW_MINUTES = 30;
export const NO_SHOW_AFTER_MINUTES = 15;

export interface TimingContext {
  startsAt: Date;
  endsAt: Date;
  now: Date;
}

/** Time guards: start from starts_at − 30 min, no-show from starts_at + 15 min, completion not before the start. */
export function assertTransitionTiming(from: BookingStatus, to: BookingStatus, actor: Actor, ctx: TimingContext): void {
  const now = ctx.now.getTime();
  const start = ctx.startsAt.getTime();
  if (to === "in_progress" && now < start - START_WINDOW_MINUTES * 60_000) {
    throw new BookingTransitionError(from, to, actor, "too_early");
  }
  if (to === "no_show" && now < start + NO_SHOW_AFTER_MINUTES * 60_000) {
    throw new BookingTransitionError(from, to, actor, "too_early");
  }
  if (to === "completed" && now < start) {
    throw new BookingTransitionError(from, to, actor, "too_early");
  }
}

/** respond_by = now + response hours, capped at starts_at − 1 h (never before now). */
export function computeRespondBy(now: Date, startsAt: Date, responseHours: number): Date {
  const byHours = now.getTime() + responseHours * 3_600_000;
  const cap = startsAt.getTime() - 3_600_000;
  return new Date(Math.max(now.getTime(), Math.min(byHours, cap)));
}

/** German status labels for UI badges. */
export const STATUS_LABELS_DE: Record<BookingStatus, string> = {
  pending_payment: "Zahlung ausstehend",
  requested: "Angefragt",
  confirmed: "Bestätigt",
  in_progress: "Läuft",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
  declined: "Abgelehnt",
  expired: "Abgelaufen",
  no_show: "Nicht angetroffen",
};
