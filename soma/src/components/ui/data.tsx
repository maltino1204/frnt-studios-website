import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/** Stat tiles separated by 1px line gaps (gap-px on bg-line). 2×2 on mobile. */
export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4", className)}>{children}</div>;
}

export function StatTile({
  label,
  value,
  delta,
  deltaLabel = "ggü. Vorwoche",
  hint,
  sparkline,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  /** relative change in percent, e.g. 12 or -4 */
  delta?: number | null;
  deltaLabel?: string;
  hint?: ReactNode;
  /** optional 24px sparkline (e.g. <Sparkline values={…} />) */
  sparkline?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 bg-surface-raised p-5 lg:p-6", className)}>
      <p className="type-label-s text-ink-muted">{label}</p>
      <p className="type-stat">{value}</p>
      {delta !== undefined && delta !== null ? (
        <p className="flex flex-wrap items-center gap-1 type-caption">
          <span className={cn("inline-flex items-center gap-0.5 num", delta >= 0 ? "text-success" : "text-danger")}>
            <Icon icon={delta >= 0 ? ArrowUpRight : ArrowDownRight} size={14} />
            {delta >= 0 ? "+" : "−"}
            {Math.abs(delta).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %
          </span>
          <span className="text-ink-muted">{deltaLabel}</span>
        </p>
      ) : hint ? (
        <p className="type-caption text-ink-muted">{hint}</p>
      ) : null}
      {sparkline ? <div className="mt-1 h-6">{sparkline}</div> : null}
    </div>
  );
}

/** 24px sparkline: 1.5px ink line, no fill (design-guideline §8). Decorative; pair with a text value. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const w = 120, h = 24;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden className={cn("h-6 w-full text-ink", className)}>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** Dashboard table on a raised panel. Header 40px, rows 52px (dense 40px), hairline separators. */
export function Table({
  className,
  wrapperClassName,
  dense,
  stickyHeader,
  ...props
}: ComponentProps<"table"> & { dense?: boolean; wrapperClassName?: string; stickyHeader?: boolean }) {
  return (
    <div
      className={cn(
        "overflow-x-auto border border-line bg-surface-raised",
        // Sticky headers need the scroll container to own vertical scrolling too.
        stickyHeader && "max-h-[70dvh] overflow-y-auto [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-surface-raised",
        wrapperClassName,
      )}
    >
      <table
        data-dense={dense ? "" : undefined}
        className={cn(
          "w-full border-collapse text-left type-body-s",
          "[&_th]:h-10 [&_th]:border-b [&_th]:border-line-strong [&_th]:px-4 [&_th]:type-label-s [&_th]:font-[520] [&_th]:whitespace-nowrap [&_th]:text-ink-muted",
          "[&_td]:border-b [&_td]:border-line [&_td]:px-4 [&_tr:last-child_td]:border-b-0",
          dense ? "[&_td]:h-10" : "[&_td]:h-[52px]",
          "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-surface-sunken",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function Num({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("num", className)}>{children}</span>;
}

/** "1–25 von 312" */
export function PaginationLabel({ from, to, total }: { from: number; to: number; total: number }) {
  return (
    <span className="type-caption text-ink-muted num">
      {total === 0 ? "0" : `${from.toLocaleString("de-DE")}–${to.toLocaleString("de-DE")}`} von {total.toLocaleString("de-DE")}
    </span>
  );
}
