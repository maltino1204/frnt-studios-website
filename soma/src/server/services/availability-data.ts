import "server-only";

import type { Queryable } from "../db/client";
import { computeAvailability, type AvailabilityRules, type Interval, type SlotsByDay, type WeeklyWindow } from "../domain/availability";
import { addDays, localDateOf } from "../domain/tz";

/**
 * Loads the inputs of the pure availability function from the database.
 * Works under anon/authenticated (weekly hours are public for approved
 * providers; busy ranges come from provider_busy_ranges(), which returns time
 * ranges only — never customer data).
 */

export interface ProviderSchedule {
  providerId: string;
  bookingMode: "instant" | "request";
  /** platform setting request_response_hours (used for request-mode providers) */
  requestResponseHours: number;
  leadTimeMinutes: number;
  maxAdvanceDays: number;
  travelBufferMinutes: number;
  weeklyHours: WeeklyWindow[];
  busy: Interval[];
  timeOff: Interval[];
}

export async function loadSchedules(
  tx: Queryable,
  providers: Array<{ id: string; leadTimeMinutes: number; maxAdvanceDays: number; travelBufferMinutes: number; bookingMode?: "instant" | "request" }>,
  from: Date,
  to: Date,
): Promise<Map<string, ProviderSchedule>> {
  const out = new Map<string, ProviderSchedule>();
  if (providers.length === 0) return out;
  const ids = providers.map((p) => p.id);
  let responseHours = 4;
  if (providers.some((p) => p.bookingMode === "request")) {
    const [row] = await tx<{ value: unknown }[]>`select value from public.platform_settings where key = 'request_response_hours'`;
    if (typeof row?.value === "number" && Number.isFinite(row.value)) responseHours = row.value;
  }
  for (const p of providers) {
    out.set(p.id, {
      providerId: p.id,
      bookingMode: p.bookingMode ?? "instant",
      requestResponseHours: responseHours,
      leadTimeMinutes: p.leadTimeMinutes,
      maxAdvanceDays: p.maxAdvanceDays,
      travelBufferMinutes: p.travelBufferMinutes,
      weeklyHours: [],
      busy: [],
      timeOff: [],
    });
  }
  const [hours, ranges] = await Promise.all([
    tx<{ providerId: string; weekday: number; startTime: string; endTime: string }[]>`
      select provider_id, weekday, start_time::text as start_time, end_time::text as end_time
      from public.provider_weekly_hours where provider_id = any(${ids}::uuid[])`,
    tx<{ providerId: string; startsAt: Date; endsAt: Date; kind: "booking" | "time_off" }[]>`
      select provider_id, starts_at, ends_at, kind from public.provider_busy_ranges(${ids}::uuid[], ${from}, ${to})`,
  ]);
  for (const h of hours) out.get(h.providerId)?.weeklyHours.push({ weekday: h.weekday, start: h.startTime, end: h.endTime });
  for (const r of ranges) {
    const s = out.get(r.providerId);
    if (!s) continue;
    (r.kind === "booking" ? s.busy : s.timeOff).push({ start: r.startsAt, end: r.endsAt });
  }
  return out;
}

export function rulesFor(schedule: ProviderSchedule, durationMinutes: number, stepMinutes: number, now: Date): AvailabilityRules {
  return {
    durationMinutes,
    bufferMinutes: schedule.travelBufferMinutes,
    leadTimeMinutes: schedule.leadTimeMinutes,
    maxAdvanceDays: schedule.maxAdvanceDays,
    stepMinutes,
    weeklyHours: schedule.weeklyHours,
    timeOff: schedule.timeOff,
    busy: schedule.busy,
    now,
    // Request mode: only slots that leave the provider ≥ 30 business minutes to answer (R9).
    requestResponseHours: schedule.bookingMode === "request" ? schedule.requestResponseHours : null,
  };
}

/** Range of instants covering local dates [fromDate, fromDate + days) with a margin. */
export function rangeForDays(fromDate: string, days: number): { from: Date; to: Date } {
  const from = new Date(`${fromDate}T00:00:00Z`);
  from.setUTCHours(from.getUTCHours() - 14);
  const to = new Date(`${addDays(fromDate, days)}T00:00:00Z`);
  to.setUTCHours(to.getUTCHours() + 14);
  return { from, to };
}

export function todayBerlin(now: Date = new Date()): string {
  return localDateOf(now);
}

export function slotsFor(schedule: ProviderSchedule, durationMinutes: number, stepMinutes: number, now: Date, fromDate: string, days: number): SlotsByDay[] {
  return computeAvailability({ ...rulesFor(schedule, durationMinutes, stepMinutes, now), fromDate, days });
}
