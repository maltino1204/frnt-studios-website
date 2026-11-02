import "server-only";

/**
 * „Entdecken / Für dich“ (2026-11-02) — pure rules, no I/O.
 *
 * The thresholds are also enforced in Postgres (explore_popular_services, migration 0011): the database never
 * returns a city below 5 bookings or a service below 3, whatever the caller asks. /ranking reads these constants,
 * so the transparency page always describes the code.
 */

/** „Neu auf SOMA“ / „Neu in deiner Nähe“: approved within this many days. */
export const EXPLORE_NEW_DAYS = 60;
/** „Beliebt in <Stadt>“: confirmed, started or completed bookings made in this window. */
export const POPULAR_WINDOW_DAYS = 90;
/** A city shows the section only with at least this many such bookings … */
export const POPULAR_MIN_CITY_BOOKINGS = 5;
/** … and lists only services with at least this many. */
export const POPULAR_MIN_SERVICE_BOOKINGS = 3;
/** Services per city: one row on desktop, so switching the city never changes the section's height. */
export const POPULAR_LIMIT = 4;
/** Cards per „Für dich“ rail. */
export const FOR_YOU_LIMIT = 8;
/** Days of availability computed for „Nächster freier Termin“ (same horizon as „So bald wie möglich“). */
export const FOR_YOU_SLOT_DAYS = 7;
/** A rating is shown from this many published reviews (same rule as `Rating`: fewer reads „Neu auf SOMA“). */
export const MIN_RATING_COUNT = 3;

/** Slugs that would collide with routes under /entdecken or /admin/entdecken. */
export const RESERVED_COLLECTION_SLUGS = ["vorschau", "neu"] as const;
export const COLLECTION_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_COLLECTION_ITEMS = 24;

export type CollectionStatus = "draft" | "scheduled" | "live" | "ended";

type Instant = Date | string | null | undefined;
const ms = (d: Instant) => (d == null ? null : (d instanceof Date ? d : new Date(d)).getTime());

/** Same predicate as the RLS policy explore_collections_read (published and inside [from, until)). */
export function collectionStatus(c: { isPublished: boolean; activeFrom: Instant; activeUntil: Instant }, now: Date = new Date()): CollectionStatus {
  if (!c.isPublished) return "draft";
  const t = now.getTime();
  const from = ms(c.activeFrom);
  const until = ms(c.activeUntil);
  if (until != null && until <= t) return "ended";
  if (from != null && from > t) return "scheduled";
  return "live";
}

export const COLLECTION_STATUS_LABEL: Record<CollectionStatus, string> = {
  draft: "Entwurf",
  scheduled: "Geplant",
  live: "Aktiv",
  ended: "Abgelaufen",
};

/**
 * Round-robin over groups (e.g. one group per booked category, most recent first), so a rail shows variety
 * instead of eight massages. Keeps each group's internal order; stops at `limit`.
 */
export function interleave<T>(groups: T[][], limit: number): T[] {
  const out: T[] = [];
  const queues = groups.map((g) => [...g]);
  while (out.length < limit && queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      const next = q.shift();
      if (next !== undefined) out.push(next);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** A rating worth showing: real, and from enough reviews. */
export function visibleRating(avg: number | string | null | undefined, count: number | null | undefined): { avg: number; count: number } | null {
  const a = avg == null ? null : Number(avg);
  const n = count ?? 0;
  return a != null && Number.isFinite(a) && a > 0 && n >= MIN_RATING_COUNT ? { avg: Math.round(a * 100) / 100, count: n } : null;
}

/** "ab"-price from a set of real prices: the lowest, flagged when there is more than one. */
export function priceFrom(prices: number[]): { cents: number; from: boolean } | null {
  const valid = prices.filter((p) => Number.isInteger(p) && p > 0);
  if (valid.length === 0) return null;
  return { cents: Math.min(...valid), from: new Set(valid).size > 1 };
}
