import "server-only";

/** Server-side German formatting for notification texts (Europe/Berlin). */
const dateTime = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin", weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
});
const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export function formatWhen(d: Date | string): string {
  return `${dateTime.format(new Date(d)).replace(",", ",")} Uhr`;
}

export function formatEuro(cents: number): string {
  return euro.format(cents / 100);
}
