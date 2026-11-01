/**
 * Isomorphic formatting helpers. All user-facing output is German (de-DE) and
 * wall-clock times are rendered in Europe/Berlin, regardless of server locale.
 */
export const TIME_ZONE = "Europe/Berlin";
export const LOCALE = "de-DE";

const eur = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "EUR" });
const eurWhole = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 8950 → "89,50 €"; whole euros drop the cents: 9000 → "90 €". Intl joins number and € with a non-breaking space. */
export function formatPrice(cents: number): string {
  return cents % 100 === 0 ? eurWhole.format(cents / 100) : eur.format(cents / 100);
}

/** Always two decimals: 9000 → "90,00 €" (receipts, breakdowns). */
export function formatPriceExact(cents: number): string {
  return eur.format(cents / 100);
}

type DateInput = Date | string | number;
const toDate = (d: DateInput) => (d instanceof Date ? d : new Date(d));

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...opts });

const timeFmt = fmt({ hour: "2-digit", minute: "2-digit" });
const dayFmt = fmt({ weekday: "long", day: "numeric", month: "long" });
const dayShortFmt = fmt({ weekday: "short", day: "numeric", month: "short" });
const dateFmt = fmt({ day: "2-digit", month: "2-digit", year: "numeric" });
const dateLongFmt = fmt({ day: "numeric", month: "long", year: "numeric" });
const weekdayShortFmt = fmt({ weekday: "short" });
const dayNumFmt = fmt({ day: "numeric" });
const monthShortFmt = fmt({ month: "short" });

/** "14:30" */
export const formatTime = (d: DateInput) => timeFmt.format(toDate(d));
/** "Donnerstag, 6. November" */
export const formatDay = (d: DateInput) => dayFmt.format(toDate(d));
/** "Do., 6. Nov." with non-breaking spaces, so a short date never breaks across lines (guideline §3, A5-12). */
export const formatDayShort = (d: DateInput) => dayShortFmt.format(toDate(d)).replace(/ /g, "\u00a0");
/** "06.11.2026" */
export const formatDate = (d: DateInput) => dateFmt.format(toDate(d));
/** "6. November 2026" */
export const formatDateLong = (d: DateInput) => dateLongFmt.format(toDate(d));
/** Parts for date strips: { weekday: "Do", day: "6", month: "Nov" } */
export function dateParts(d: DateInput) {
  const date = toDate(d);
  return {
    weekday: weekdayShortFmt.format(date).replace(".", ""),
    day: dayNumFmt.format(date).replace(".", ""),
    month: monthShortFmt.format(date).replace(".", ""),
  };
}

/** "Do., 6. Nov. · 14:30–15:30" */
export function formatSlotRange(start: DateInput, end: DateInput): string {
  return `${formatDayShort(start)} · ${formatTime(start)}–${formatTime(end)}`;
}

/** Non-breaking space between a number and its unit (brand/BRAND_VOICE.md § 4): "18:30 Uhr", "15 Min.", "84 €". */
export const NBSP = "\u00a0";

/** 90 → "90 Min.", 120 → "2 Std.", 150 → "2 Std. 30 Min." (number and unit joined by a non-breaking space) */
export function formatDuration(minutes: number): string {
  if (minutes < 120) return `${minutes}${NBSP}Min.`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}${NBSP}Std.` : `${h}${NBSP}Std. ${m}${NBSP}Min.`;
}

/** 2.35 → "2,4 km"; < 1 → "< 1 km" (non-breaking spaces) */
export function formatDistance(km: number): string {
  if (km < 1) return `<${NBSP}1${NBSP}km`;
  return `${km.toLocaleString(LOCALE, { maximumFractionDigits: km < 10 ? 1 : 0 })}${NBSP}km`;
}

/** 14:30 → "14:30 Uhr" for running text (chips and tables use formatTime alone). */
export const formatClock = (d: DateInput) => `${formatTime(d)}${NBSP}Uhr`;

/** 4.866 → "4,9" */
export function formatRating(avg: number): string {
  return avg.toLocaleString(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Today's date in Berlin as YYYY-MM-DD (for <input type="date"> defaults and query params). */
export function berlinDateKey(d: DateInput = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(toDate(d));
  return parts; // en-CA yields YYYY-MM-DD
}

/** "vor 3 Tagen", "in 2 Stunden" */
export function formatRelative(d: DateInput, now: Date = new Date()): string {
  const diffMs = toDate(d).getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  const abs = Math.abs(diffMs);
  const min = 60_000, hour = 60 * min, day = 24 * hour;
  if (abs < hour) return rtf.format(Math.round(diffMs / min), "minute");
  if (abs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  if (abs < 30 * day) return rtf.format(Math.round(diffMs / day), "day");
  if (abs < 365 * day) return rtf.format(Math.round(diffMs / (30 * day)), "month");
  return rtf.format(Math.round(diffMs / (365 * day)), "year");
}

/** German plural helper: plural(3, "Bewertung", "Bewertungen") → "3 Bewertungen" */
export function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString(LOCALE)} ${n === 1 ? one : many}`;
}
