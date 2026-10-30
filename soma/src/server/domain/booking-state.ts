import "server-only";

import { addDays, BERLIN, toWallClock, wallTimeToInstant } from "./tz";

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

// ---------------------------------------------------------------------------
// Response deadline for request-mode bookings (product spec §7, audit-1 R9)
// ---------------------------------------------------------------------------
export interface ResponseWindowOptions {
  /** local business hours in minutes since midnight (default 08:00–21:00) */
  dayStartMinutes?: number;
  dayEndMinutes?: number;
  /** deadline is at the latest this long before the start (default 2 h) */
  startBufferMinutes?: number;
  timeZone?: string;
}

export const RESPONSE_DAY_START = 8 * 60;
export const RESPONSE_DAY_END = 21 * 60;
export const RESPONSE_START_BUFFER_MINUTES = 120;
/** Request-mode slots whose response window would be shorter are not offered. */
export const MIN_RESPONSE_WINDOW_MINUTES = 30;

function businessDay(date: string, o: Required<ResponseWindowOptions>): { start: number; end: number } {
  return {
    start: wallTimeToInstant(date, o.dayStartMinutes, o.timeZone).instant.getTime(),
    end: wallTimeToInstant(date, o.dayEndMinutes, o.timeZone).instant.getTime(),
  };
}

function withDefaults(o: ResponseWindowOptions = {}): Required<ResponseWindowOptions> {
  return {
    dayStartMinutes: o.dayStartMinutes ?? RESPONSE_DAY_START,
    dayEndMinutes: o.dayEndMinutes ?? RESPONSE_DAY_END,
    startBufferMinutes: o.startBufferMinutes ?? RESPONSE_START_BUFFER_MINUTES,
    timeZone: o.timeZone ?? BERLIN,
  };
}

/** `from` + `minutes`, counting only local business hours (DST-safe). */
export function addBusinessMinutes(from: Date, minutes: number, opts?: ResponseWindowOptions): Date {
  const o = withDefaults(opts);
  let t = from.getTime();
  let remaining = Math.max(0, minutes) * 60_000;
  let date = toWallClock(from, o.timeZone).date;
  for (let i = 0; i < 400; i += 1) {
    const day = businessDay(date, o);
    if (t < day.start) t = day.start;
    if (t < day.end) {
      const available = day.end - t;
      if (remaining <= available) return new Date(t + remaining);
      remaining -= available;
    }
    date = addDays(date, 1);
    t = businessDay(date, o).start;
  }
  return new Date(t + remaining);
}

/** Minutes of local business hours inside [a, b). */
export function businessMinutesBetween(a: Date, b: Date, opts?: ResponseWindowOptions): number {
  const o = withDefaults(opts);
  if (b.getTime() <= a.getTime()) return 0;
  let total = 0;
  let date = toWallClock(a, o.timeZone).date;
  const end = b.getTime();
  for (let i = 0; i < 400; i += 1) {
    const day = businessDay(date, o);
    if (day.start >= end) break;
    total += Math.max(0, Math.min(day.end, end) - Math.max(day.start, a.getTime()));
    date = addDays(date, 1);
  }
  return Math.floor(total / 60_000);
}

/**
 * respond_by = the earlier of
 *   (a) requestedAt + responseHours, counted only within 08:00–21:00 Europe/Berlin, and
 *   (b) startsAt − 2 h,
 * never before requestedAt.
 */
export function computeRespondBy(requestedAt: Date, startsAt: Date, responseHours: number, opts?: ResponseWindowOptions): Date {
  const o = withDefaults(opts);
  const byBusinessHours = addBusinessMinutes(requestedAt, responseHours * 60, o).getTime();
  const cap = startsAt.getTime() - o.startBufferMinutes * 60_000;
  return new Date(Math.max(requestedAt.getTime(), Math.min(byBusinessHours, cap)));
}

/** Business minutes the provider has to answer a request made at `requestedAt`. */
export function responseWindowMinutes(requestedAt: Date, startsAt: Date, responseHours: number, opts?: ResponseWindowOptions): number {
  return businessMinutesBetween(requestedAt, computeRespondBy(requestedAt, startsAt, responseHours, opts), opts);
}

/**
 * Earliest slot start that still leaves MIN_RESPONSE_WINDOW_MINUTES business
 * minutes to answer: (requestedAt + 30 business minutes) + 2 h. Equivalent to
 * responseWindowMinutes(...) >= 30, but O(1) per slot. null = no slot possible
 * (response time setting below 30 minutes).
 */
export function earliestRequestStart(requestedAt: Date, responseHours: number, opts?: ResponseWindowOptions): Date | null {
  const o = withDefaults(opts);
  if (responseHours * 60 < MIN_RESPONSE_WINDOW_MINUTES) return null;
  return new Date(addBusinessMinutes(requestedAt, MIN_RESPONSE_WINDOW_MINUTES, o).getTime() + o.startBufferMinutes * 60_000);
}

export function hasSufficientResponseWindow(requestedAt: Date, startsAt: Date, responseHours: number, opts?: ResponseWindowOptions): boolean {
  const earliest = earliestRequestStart(requestedAt, responseHours, opts);
  return earliest !== null && startsAt.getTime() >= earliest.getTime();
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
