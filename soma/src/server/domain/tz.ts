import "server-only";

/**
 * Wall-clock <-> instant conversion for IANA time zones using only Intl
 * (no dependencies). SOMA interprets weekly hours in Europe/Berlin.
 *
 * Local dates are 'YYYY-MM-DD' strings, local times are minutes since local
 * midnight (0 … 1440).
 */

export const BERLIN = "Europe/Berlin";

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

export interface WallClock {
  /** local calendar date 'YYYY-MM-DD' */
  date: string;
  /** minutes since local midnight */
  minutes: number;
  /** ISO weekday, 1 = Monday … 7 = Sunday */
  isoWeekday: number;
}

function parts(instant: Date, timeZone: string): { y: number; m: number; d: number; h: number; mi: number; s: number } {
  const out = { y: 0, m: 0, d: 0, h: 0, mi: 0, s: 0 };
  for (const p of formatter(timeZone).formatToParts(instant)) {
    const v = Number(p.value);
    if (p.type === "year") out.y = v;
    else if (p.type === "month") out.m = v;
    else if (p.type === "day") out.d = v;
    else if (p.type === "hour") out.h = v === 24 ? 0 : v;
    else if (p.type === "minute") out.mi = v;
    else if (p.type === "second") out.s = v;
  }
  return out;
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

export function isoWeekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return wd === 0 ? 7 : wd;
}

export function toWallClock(instant: Date, timeZone: string = BERLIN): WallClock {
  const p = parts(instant, timeZone);
  const date = `${pad(p.y, 4)}-${pad(p.m)}-${pad(p.d)}`;
  return { date, minutes: p.h * 60 + p.mi, isoWeekday: isoWeekdayOf(date) };
}

/** Offset of the zone at `instant` in minutes (local - UTC), e.g. +60 / +120 for Berlin. */
export function offsetMinutes(instant: Date, timeZone: string = BERLIN): number {
  const p = parts(instant, timeZone);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${pad(t.getUTCFullYear(), 4)}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function isValidLocalDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

export interface ResolvedWallTime {
  instant: Date;
  /** false when the wall time falls into a DST gap (spring forward) */
  exists: boolean;
  /** true when the wall time occurs twice (fall back); `instant` is the first occurrence */
  ambiguous: boolean;
}

/**
 * Converts a local wall-clock time to an instant. Minutes may be 1440 (= next
 * local midnight). Gap times are shifted forward by the gap length and flagged
 * `exists: false`; ambiguous times resolve to the earlier occurrence.
 */
export function wallTimeToInstant(date: string, minutes: number, timeZone: string = BERLIN): ResolvedWallTime {
  const [y, m, d] = date.split("-").map(Number);
  const naiveUtc = Date.UTC(y, m - 1, d, 0, minutes);
  const offsets = new Set<number>([
    offsetMinutes(new Date(naiveUtc - 14 * 3600_000), timeZone),
    offsetMinutes(new Date(naiveUtc), timeZone),
    offsetMinutes(new Date(naiveUtc + 14 * 3600_000), timeZone),
  ]);
  const target = toWallClock(new Date(naiveUtc), "UTC");
  const matches: number[] = [];
  for (const off of offsets) {
    const candidate = naiveUtc - off * 60_000;
    const wc = toWallClock(new Date(candidate), timeZone);
    if (wc.date === target.date && wc.minutes === target.minutes) matches.push(candidate);
  }
  if (matches.length > 0) {
    matches.sort((a, b) => a - b);
    return { instant: new Date(matches[0]), exists: true, ambiguous: matches.length > 1 };
  }
  // DST gap: use the offset valid before the transition (moves the time forward).
  const before = offsetMinutes(new Date(naiveUtc - 14 * 3600_000), timeZone);
  return { instant: new Date(naiveUtc - before * 60_000), exists: false, ambiguous: false };
}

/** Local calendar date of `instant` in the zone. */
export function localDateOf(instant: Date, timeZone: string = BERLIN): string {
  return toWallClock(instant, timeZone).date;
}

/** Parses 'HH:MM' or 'HH:MM:SS' (also '24:00') into minutes since midnight. */
export function parseTimeOfDay(value: string): number {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!m) throw new Error(`Ungültige Uhrzeit: ${value}`);
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 24 || mi > 59 || (h === 24 && mi !== 0)) throw new Error(`Ungültige Uhrzeit: ${value}`);
  return h * 60 + mi;
}

export function formatTimeOfDay(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}
