import { LOCALE, TIME_ZONE } from "@/lib/format";

/** Admin-only formatting helpers on top of @/lib/format (German formats, Europe/Berlin). */

const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const shortDateTimeFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const tzFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, timeZoneName: "short" });

/** "30.10.2026, 13:55" */
export const formatDateTime = (d: string | Date) => dateTimeFmt.format(new Date(d));
/** "30.10., 13:55" */
export const formatShortDateTime = (d: string | Date) => shortDateTimeFmt.format(new Date(d));
/** "MEZ" / "MESZ" for tooltips */
export function tzName(d: string | Date = new Date()): string {
  const part = tzFmt.formatToParts(new Date(d)).find((p) => p.type === "timeZoneName")?.value ?? "";
  return part === "GMT+1" ? "MEZ" : part === "GMT+2" ? "MESZ" : part;
}

/** 0.2 → "20 %", 0.125 → "12,5 %" */
export function formatPercent(ratio: number | null | undefined, digits = 1): string {
  if (ratio == null || !Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toLocaleString(LOCALE, { maximumFractionDigits: digits })} %`;
}

export function formatInt(n: number | null | undefined): string {
  return n == null ? "—" : n.toLocaleString(LOCALE);
}

/** Relative change in percent (current vs previous), null when there is no base. */
export function delta(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** "12,50" / "12.50" / "12" → 1250; null when not a valid amount. */
export function parseEuroInput(value: string): number | null {
  const v = value.trim().replace(/\s|€/g, "");
  if (!v) return null;
  if (!/^\d{1,6}([.,]\d{1,2})?$/.test(v)) return null;
  return Math.round(Number(v.replace(",", ".")) * 100);
}

/** 1250 → "12,50" (value for an amount input) */
export function centsToInput(cents: number): string {
  return (cents / 100).toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });
}

/** "20" / "12,5" → 0.2 / 0.125; null when invalid. */
export function parsePercentInput(value: string): number | null {
  const v = value.trim().replace(/\s|%/g, "").replace(",", ".");
  if (!v || !/^\d{1,3}(\.\d{1,2})?$/.test(v)) return null;
  return Math.round(Number(v) * 100) / 10_000;
}

export function ratioToInput(ratio: number): string {
  return (Math.round(ratio * 10_000) / 100).toLocaleString(LOCALE, { maximumFractionDigits: 2, useGrouping: false });
}

/** "Nora K." for list display */
export function fullName(first: string | null, last: string | null): string {
  return [first, last].filter(Boolean).join(" ") || "—";
}
