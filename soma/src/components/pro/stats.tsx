import { cn } from "@/lib/cn";
import { FormattedNumber } from "@/components/ui/number";
import { berlinDateKey } from "@/lib/format";
import { addDaysKey, weekdayOfKey } from "./time";

/*
 * Real-data series and value helpers for the /pro KPI tiles and charts.
 * Everything here is derived from service DTOs; nothing is invented.
 */

/** Money, final on the first frame (no count-up): whole euros stay whole, otherwise two decimals (tabular). */
export function MoneyCount({ cents, tile = true, className }: { cents: number; /** sized for a 2-up KPI tile on phones */ tile?: boolean; className?: string }) {
  const whole = cents % 100 === 0;
  const format: Intl.NumberFormatOptions = { style: "currency", currency: "EUR", minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 };
  // Long amounts ("2.561,54 €") step down a size in the 2-up phone grid instead of wrapping the "€".
  const long = new Intl.NumberFormat("de-DE", format).format(cents / 100).length > 8;
  return <FormattedNumber value={cents / 100} format={format} className={cn("whitespace-nowrap", tile && long && "max-sm:text-[1.5rem]", className)} />;
}

/** Monday (Berlin) of the week containing `d`, as "YYYY-MM-DD". */
export function weekKeyOf(d: string | number | Date): string {
  const key = berlinDateKey(d);
  return addDaysKey(key, -(weekdayOfKey(key) - 1));
}

/** "YYYY-MM" in Berlin. */
export function monthKeyOf(d: string | number | Date): string {
  return berlinDateKey(d).slice(0, 7);
}

/** The last `n` week keys ending with the current week (oldest first). */
export function lastWeeks(n: number, now = Date.now()): string[] {
  const cur = weekKeyOf(now);
  return Array.from({ length: n }, (_, i) => addDaysKey(cur, -7 * (n - 1 - i)));
}

/** The last `n` month keys ending with the current month (oldest first). */
export function lastMonths(n: number, now = Date.now()): string[] {
  const [y, m] = monthKeyOf(now).split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const t = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1));
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/** Sum per week over the last `n` weeks for items with a completion date. */
export function weeklySeries<T extends { completedAt: string | null }>(items: T[], n: number, value: (i: T) => number, now = Date.now()): number[] {
  const weeks = lastWeeks(n, now);
  const sums = new Map(weeks.map((w) => [w, 0]));
  for (const i of items) {
    if (!i.completedAt) continue;
    const k = weekKeyOf(i.completedAt);
    if (sums.has(k)) sums.set(k, sums.get(k)! + value(i));
  }
  return weeks.map((w) => sums.get(w)!);
}

/** Sum per month over the last `n` months. */
export function monthlySeries<T extends { completedAt: string | null }>(items: T[], n: number, value: (i: T) => number, now = Date.now()): { key: string; value: number }[] {
  const months = lastMonths(n, now);
  const sums = new Map(months.map((m) => [m, 0]));
  for (const i of items) {
    if (!i.completedAt) continue;
    const k = monthKeyOf(i.completedAt);
    if (sums.has(k)) sums.set(k, sums.get(k)! + value(i));
  }
  return months.map((m) => ({ key: m, value: sums.get(m)! }));
}

/** Mini histogram of the rating distribution (1★ → 5★), for a StatTile's sparkline slot. Decorative. */
export function RatingBars({ distribution }: { distribution: Record<"1" | "2" | "3" | "4" | "5", number> }) {
  const keys = ["1", "2", "3", "4", "5"] as const;
  const max = Math.max(1, ...keys.map((k) => distribution[k]));
  return (
    <span aria-hidden className="relative flex h-full items-end gap-1.5 px-1">
      <span className="absolute inset-x-1 bottom-0 h-px bg-line" />
      {keys.map((k) => (
        <span key={k} className="flex h-full flex-1 items-end justify-center">
          <span
            className={distribution[k] ? "block w-full max-w-5 rounded-t-[5px] rounded-b-[2px] bg-chart-1" : "block h-0.5 w-full max-w-5 rounded-full bg-line-mid"}
            style={distribution[k] ? { height: `${Math.max(10, (distribution[k] / max) * 100)}%` } : undefined}
          />
        </span>
      ))}
    </span>
  );
}
