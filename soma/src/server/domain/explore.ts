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

/**
 * Editorial texts must not promise availability (review R1): only the availability engine may say a slot is free,
 * and on /entdecken only „Für dich“ shows one. Matches „freie Termine“, „noch frei“, „sofort verfügbar“,
 * „heute frei“, „kurzfristig buchbar“ and similar. Returns the matched phrase or null.
 */
const SLOT_PROMISES: RegExp[] = [
  /\bfreie?[nrs]?\s+(Termin|Zeit|Slot|Platz|Plätze)/i,
  /\b(noch|wieder|immer|garantiert)\s+(frei|verfügbar|buchbar)\b/i,
  /\b(sofort|heute|morgen|kurzfristig|jederzeit|spontan)\s+(noch\s+)?(frei|verfügbar|buchbar)\b/i,
  /\b(frei|verfügbar|buchbar)\s+(ab|um|heute|morgen|noch)\b/i,
  /\bTermine?\s+(frei|verfügbar|garantiert)\b/i,
  /\bTermingarantie\b/i,
];

export function findSlotPromise(text: string | null | undefined): string | null {
  if (!text) return null;
  for (const re of SLOT_PROMISES) {
    const m = re.exec(text);
    if (m) return m[0];
  }
  return null;
}

export const SLOT_PROMISE_MESSAGE = "Bitte keine Aussagen zu freien Terminen: Ob und wann ein Termin frei ist, zeigt nur die Suche.";

// ---------------------------------------------------------------------------
// Images per card (review R5): the photo must fit the service, and a list never shows the same photo twice.
// ---------------------------------------------------------------------------
/**
 * Portfolio captions that show one particular service (the same table the demo seed uses to hand out portfolio
 * images). A caption matching a rule fits only those services; any other caption is neutral for its category.
 */
const CAPTION_SERVICES: Array<[RegExp, string[]]> = [
  [/Sportmassage/i, ["sportmassage"]],
  [/Massagestuhl|im Büro|im Sitzen/i, ["ruecken-nacken-massage"]],
  [/Hot.?Stone|Steine/i, ["hot-stone-massage"]],
  [/Thai/i, ["thai-massage"]],
  [/Herrenmaniküre/i, ["herrenmanikuere"]],
  [/Gel\b|Gel,/i, ["gelnaegel-neumodellage", "gelnaegel-auffuellen", "shellac-manikuere"]],
  [/Shellac/i, ["shellac-manikuere", "pedikuere-shellac"]],
  [/Fade|Bart|Seitenscheitel/i, ["herrenhaarschnitt"]],
  [/Brautdutt|Hochzeit|Hochsteck|Pferdeschwanz|Box Braids/i, ["hochsteckfrisur"]],
  [/Föhn|Wellen|Volumen/i, ["foehnen-styling"]],
  [/Pixie|Bob\b|Lockenschnitt|Spitzen schneiden|Kurzhaarschnitt/i, ["damenhaarschnitt", "herrenhaarschnitt"]],
  [/Braut-Make-up/i, ["braut-make-up", "braut-make-up-probe"]],
  [/Abend|Smokey|Editorial|Fotoshooting/i, ["event-make-up", "braut-make-up"]],
  [/Tages-Make-up/i, ["tages-make-up"]],
  [/Lash Lift|Wimpern färben|Wimpernlifting/i, ["wimpernlifting"]],
  [/Wimpernverlängerung/i, ["wimpernverlaengerung-neuset", "wimpernverlaengerung-auffuellen"]],
  [/Brow Lamination/i, ["brow-lamination"]],
  [/Brauen (färben|mit dem Faden)|Brow Mapping|zupfen/i, ["brauen-zupfen-faerben", "brow-lamination"]],
  [/Waxing/i, ["waxing-beine"]],
];

/** 2 = the caption shows this service, 1 = neutral for the category, 0 = it shows another service. */
export function captionFit(caption: string | null | undefined, serviceSlug: string | null | undefined): 0 | 1 | 2 {
  const rule = caption ? CAPTION_SERVICES.find(([re]) => re.test(caption)) : undefined;
  if (!rule) return 1;
  return serviceSlug && rule[1].includes(serviceSlug) ? 2 : 0;
}

export interface PortfolioCandidate {
  providerId: string;
  path: string;
  caption: string | null;
}

/**
 * The photos a card may show, best first: work photos whose caption names the service, then the category photo,
 * then neutral work photos. Photos that show another service are left out. `providerIds` limits the work photos
 * (the pinned Profi, or the Profis offering the service), in their order.
 */
export function imageCandidates(opts: { serviceSlug: string | null; categoryImage: string; pool: PortfolioCandidate[]; providerIds?: string[] }): string[] {
  const order = opts.providerIds ? new Map(opts.providerIds.map((id, i) => [id, i])) : null;
  const own = opts.pool
    .filter((p) => !order || order.has(p.providerId))
    .map((p, i) => ({ p, i, fit: captionFit(p.caption, opts.serviceSlug), rank: order?.get(p.providerId) ?? 0 }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i);
  return [
    ...new Set([
      ...own.filter((x) => x.fit === 2).map((x) => x.p.path),
      opts.categoryImage,
      ...own.filter((x) => x.fit === 1).map((x) => x.p.path),
    ]),
  ];
}

/** One photo per card, never twice in one list: each card takes its best candidate not used above it. */
export function assignDistinct(candidates: string[][]): string[] {
  const used = new Set<string>();
  return candidates.map((list) => {
    const pick = list.find((p) => !used.has(p)) ?? list[0] ?? "";
    used.add(pick);
    return pick;
  });
}
