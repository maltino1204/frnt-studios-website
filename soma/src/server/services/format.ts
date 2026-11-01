import "server-only";

/** Server-side German formatting for notification texts (Europe/Berlin). */
const dateTime = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
});
const clock = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

/** "Do., 12. Nov., 18:30 Uhr" (BRAND_VOICE § 4), with non-breaking spaces so the date never breaks apart. */
export function formatWhen(d: Date | string): string {
  return `${dateTime.format(new Date(d)).replace(/\s/g, "\u00a0").replace(/,\u00a0(\d{2}:\d{2})$/, ", $1")}\u00a0Uhr`;
}

/** "18:30 Uhr" */
export function formatClock(d: Date | string): string {
  return `${clock.format(new Date(d))}\u00a0Uhr`;
}

export function formatEuro(cents: number): string {
  return euro.format(cents / 100);
}
