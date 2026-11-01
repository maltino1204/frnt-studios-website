import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BarTone = "accent" | "violet" | "success" | "warning" | "danger" | "muted" | "ink";

/**
 * Flat fills (brand § 3.7 charts; no gradients). The console has no Oxblood moment, so the primary series is
 * Espresso; status series use the functional colours, always next to a printed value.
 */
const FILL: Record<BarTone, string> = {
  accent: "bg-ink",
  violet: "bg-chart-2",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  muted: "bg-line-strong",
  ink: "bg-ink",
};

/**
 * Horizontal bar list: label, tabular value, a rounded flat bar on a
 * sunken track. Values are always printed, so the bar never carries meaning alone.
 * Bars grow in once from the left (transform only, off with reduced motion).
 */
export function BarList({
  rows,
  max,
  className,
  valueClassName,
}: {
  rows: Array<{ key: string; label: ReactNode; value: number; display?: ReactNode; tone?: BarTone; sub?: ReactNode }>;
  max?: number;
  className?: string;
  valueClassName?: string;
}) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className={cn("flex flex-col", className)}>
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-2.5">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="min-w-0 truncate type-body-s text-ink">{r.label}</span>
            {r.sub ? <span className="shrink-0 type-caption text-ink-muted num">{r.sub}</span> : null}
          </span>
          <span className={cn("text-right type-label-s text-ink num", valueClassName)}>{r.display ?? r.value.toLocaleString("de-DE")}</span>
          <span aria-hidden className="col-span-2 block h-1.5 overflow-hidden rounded-full bg-surface-sunken">
            <span
              className={cn(
                "block h-full origin-left rounded-full transition-[scale] duration-calm ease-enter starting:scale-x-0",
                FILL[r.tone ?? "accent"],
              )}
              style={{ width: `${Math.max(r.value > 0 ? 1.5 : 0, Math.min(100, (r.value / top) * 100))}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Inline bar for table cells (fixed 80px track). */
export function InlineBar({ value, max, tone = "accent", className }: { value: number; max: number; tone?: BarTone; className?: string }) {
  const pct = max > 0 ? Math.max(value > 0 ? 3 : 0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <span aria-hidden className={cn("inline-block h-1.5 w-20 overflow-hidden rounded-full bg-surface-sunken align-middle", className)}>
      <span className={cn("block h-full rounded-full", FILL[tone])} style={{ width: `${pct}%` }} />
    </span>
  );
}
