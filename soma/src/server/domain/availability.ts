import "server-only";

import { earliestRequestStart } from "./booking-state";
import { addDays, BERLIN, parseTimeOfDay, toWallClock, wallTimeToInstant } from "./tz";

/**
 * Slot computation (docs/architecture.md §5.3). Pure, no I/O.
 *
 *   slots = weekly_hours(date, Europe/Berlin) − time_off − busy ranges
 *           filtered by lead time, max advance days, step
 *
 * A slot start S is valid iff
 *   [S, S + duration)          lies inside one working window (wall clock), and
 *   [S, S + duration + buffer) overlaps no busy range and no time off.
 *
 * Busy ranges are the bookings' blocked ranges [start, end + buffer), so two
 * bookings of a provider are always at least `buffer` apart, in both directions.
 * All ranges are half-open.
 */

export interface WeeklyWindow {
  /** ISO weekday 1 = Monday … 7 = Sunday */
  weekday: number;
  /** 'HH:MM' or 'HH:MM:SS' local time; end may be '24:00' */
  start: string;
  end: string;
}

export interface Interval {
  start: Date;
  end: Date;
}

export interface AvailabilityRules {
  durationMinutes: number;
  bufferMinutes: number;
  leadTimeMinutes: number;
  maxAdvanceDays: number;
  stepMinutes: number;
  weeklyHours: WeeklyWindow[];
  timeOff: Interval[];
  busy: Interval[];
  now: Date;
  timeZone?: string;
  /**
   * Request-mode providers: only offer slots that leave the provider at least
   * 30 business minutes to answer (see computeRespondBy).
   */
  requestResponseHours?: number | null;
}

export interface AvailabilityInput extends AvailabilityRules {
  /** first local date 'YYYY-MM-DD' */
  fromDate: string;
  days: number;
}

export interface SlotsByDay {
  /** local date 'YYYY-MM-DD' (Europe/Berlin) */
  date: string;
  weekday: number;
  /** slot starts as ISO-8601 UTC strings, ascending */
  slots: string[];
}

const MINUTE = 60_000;

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

interface ParsedWindow {
  startMin: number;
  endMin: number;
}

function windowsFor(weekday: number, weeklyHours: WeeklyWindow[]): ParsedWindow[] {
  return weeklyHours
    .filter((w) => w.weekday === weekday)
    .map((w) => ({ startMin: parseTimeOfDay(w.start), endMin: parseTimeOfDay(w.end) }))
    .filter((w) => w.endMin > w.startMin)
    .sort((a, b) => a.startMin - b.startMin);
}

function blockedBy(candidate: Interval, rules: AvailabilityRules): boolean {
  for (const r of rules.busy) if (overlaps(candidate, r)) return true;
  for (const r of rules.timeOff) if (overlaps(candidate, r)) return true;
  return false;
}

function earliestStart(rules: AvailabilityRules): number {
  return rules.now.getTime() + rules.leadTimeMinutes * MINUTE;
}

function latestStart(rules: AvailabilityRules): number {
  return rules.now.getTime() + rules.maxAdvanceDays * 24 * 60 * MINUTE;
}

/** Slots for one local date. */
export function slotsForDate(date: string, rules: AvailabilityRules): SlotsByDay {
  const tz = rules.timeZone ?? BERLIN;
  const weekday = toWallClock(wallTimeToInstant(date, 12 * 60, tz).instant, tz).isoWeekday;
  const slots: string[] = [];
  const seen = new Set<number>();
  let minStart = earliestStart(rules);
  const maxStart = latestStart(rules);
  if (rules.requestResponseHours != null) {
    const earliest = earliestRequestStart(rules.now, rules.requestResponseHours);
    if (!earliest) return { date, weekday, slots: [] };
    minStart = Math.max(minStart, earliest.getTime());
  }
  const step = Math.max(5, rules.stepMinutes);

  for (const w of windowsFor(weekday, rules.weeklyHours)) {
    const windowEnd = wallTimeToInstant(date, w.endMin, tz).instant.getTime();
    // Candidates are aligned to the step relative to local midnight (:00/:30 …).
    const firstAligned = Math.ceil(w.startMin / step) * step;
    for (let m = firstAligned; m + rules.durationMinutes <= w.endMin; m += step) {
      const resolved = wallTimeToInstant(date, m, tz);
      if (!resolved.exists) continue; // DST gap: this wall time does not exist
      const start = resolved.instant.getTime();
      if (seen.has(start)) continue;
      const end = start + rules.durationMinutes * MINUTE;
      if (end > windowEnd) continue;
      if (start < minStart || start > maxStart) continue;
      const candidate = { start: new Date(start), end: new Date(end + rules.bufferMinutes * MINUTE) };
      if (blockedBy(candidate, rules)) continue;
      seen.add(start);
      slots.push(new Date(start).toISOString());
    }
  }
  slots.sort();
  return { date, weekday, slots };
}

export function computeAvailability(input: AvailabilityInput): SlotsByDay[] {
  const days = Math.max(0, Math.min(input.days, 62));
  const out: SlotsByDay[] = [];
  for (let i = 0; i < days; i += 1) out.push(slotsForDate(addDays(input.fromDate, i), input));
  return out;
}

/**
 * Validates a single start instant with the same rules the slot generator uses
 * (used by createBooking before the insert; the DB trigger re-checks).
 */
export function isSlotAvailable(start: Date, rules: AvailabilityRules): boolean {
  const tz = rules.timeZone ?? BERLIN;
  const local = toWallClock(start, tz);
  const day = slotsForDate(local.date, rules);
  return day.slots.includes(start.toISOString());
}

export type TimeOfDay = "morning" | "afternoon" | "evening";

/** morning < 12:00 ≤ afternoon < 17:00 ≤ evening (local time). */
export function timeOfDayOf(instant: Date, timeZone: string = BERLIN): TimeOfDay {
  const { minutes } = toWallClock(instant, timeZone);
  if (minutes < 12 * 60) return "morning";
  if (minutes < 17 * 60) return "afternoon";
  return "evening";
}

export function filterSlotsByTimeOfDay(days: SlotsByDay[], tod: TimeOfDay | undefined, timeZone: string = BERLIN): SlotsByDay[] {
  if (!tod) return days;
  return days.map((d) => ({ ...d, slots: d.slots.filter((s) => timeOfDayOf(new Date(s), timeZone) === tod) }));
}

export function firstSlot(days: SlotsByDay[]): string | null {
  for (const d of days) if (d.slots.length > 0) return d.slots[0];
  return null;
}
