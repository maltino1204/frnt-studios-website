import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BarTone = "accent" | "violet" | "success" | "warning" | "danger" | "muted" | "ink";

/** Accent-tinted fills (design-guideline v2 §4.4: chart-1 → chart-2; status series use semantic colours). */
const FILL: Record<BarTone, string> = {
  accent: "bg-linear-to-r from-[color-mix(in_srgb,var(--color-chart-1)_72%,white)] to-chart-1",
  violet: "bg-linear-to-r from-[color-mix(in_srgb,var(--color-chart-2)_65%,white)] to-chart-2",
  success: "bg-linear-to-r from-[color-mix(in_srgb,var(--color-success)_60%,white)] to-success",
  warning: "bg-linear-to-r from-[color-mix(in_srgb,var(--color-warning)_55%,white)] to-warning",
  danger: "bg-linear-to-r from-[color-mix(in_srgb,var(--color-danger)_60%,white)] to-danger",
  muted: "bg-line-strong",
  ink: "bg-ink",
};

/**
 * Horizontal bar list: label, tabular value, a rounded accent-tinted bar on a
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
