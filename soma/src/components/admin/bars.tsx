import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Horizontal bar list: label, tabular value, flat ink bar on a sunken track.
 * Values are always printed, so the bar never carries meaning alone.
 */
export function BarList({
  rows,
  max,
  className,
  valueClassName,
}: {
  rows: Array<{ key: string; label: ReactNode; value: number; display?: ReactNode; tone?: "ink" | "accent" | "danger" | "muted" }>;
  max?: number;
  className?: string;
  valueClassName?: string;
}) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className={cn("flex flex-col", className)}>
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-2">
          <span className="min-w-0 truncate type-body-s text-ink">{r.label}</span>
          <span className={cn("text-right type-label-s text-ink num", valueClassName)}>{r.display ?? r.value.toLocaleString("de-DE")}</span>
          <span aria-hidden className="col-span-2 block h-1 bg-surface-sunken">
            <span
              className={cn(
                "block h-full",
                r.tone === "accent" ? "bg-accent" : r.tone === "danger" ? "bg-danger" : r.tone === "muted" ? "bg-line-strong" : "bg-ink",
              )}
              style={{ width: `${Math.max(r.value > 0 ? 1.5 : 0, (r.value / top) * 100)}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Inline bar for table cells (fixed 96px track). */
export function InlineBar({ value, max, tone = "ink", className }: { value: number; max: number; tone?: "ink" | "danger" | "muted" | "accent"; className?: string }) {
  const pct = max > 0 ? Math.max(value > 0 ? 3 : 0, (value / max) * 100) : 0;
  return (
    <span aria-hidden className={cn("inline-block h-1 w-24 bg-surface-sunken align-middle", className)}>
      <span
        className={cn("block h-full", tone === "danger" ? "bg-danger" : tone === "muted" ? "bg-line-strong" : tone === "accent" ? "bg-accent" : "bg-ink")}
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}
