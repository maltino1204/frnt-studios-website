import type { SearchParams } from "@/lib/routes";

/*
 * What BookingEntry (booking-entry.tsx) and its lazily loaded pickers (booking-entry-pickers.tsx) share: the draft
 * types, the time windows and the date arithmetic.
 */
export type TimeWindow = NonNullable<SearchParams["zeit"]>;
export type WhenMode = "asap" | "today" | "tomorrow" | "date";
export type When = { mode: WhenMode; date: string | null; window: TimeWindow | null };
/** What the visitor has entered so far; shared between entries on one page (landing hero ↔ booking bar/sheet). */
export type BookingDraft = { plz: string; categorySlug: string | null; serviceId: string | null; when: When };

/** The middle dot with a no-break space on both sides (brand § 4.4: Instrument Sans sets "·" tight). */
export const DOT = "\u00a0·\u00a0";
export const HORIZON_DAYS = 60;

export const WINDOWS: Array<{ value: TimeWindow; label: string; range: string }> = [
  { value: "morgens", label: "Morgens", range: "7–12" },
  { value: "mittags", label: "Nachmittags", range: "12–17" },
  { value: "abends", label: "Abends", range: "17–22" },
];

export function addDays(key: string, n: number): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
