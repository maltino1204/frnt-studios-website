import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { smoothPath } from "./chart";
import { Icon } from "./icon";

/** Stat tiles: floating level-1 cards, 2×2 on mobile, 4 across from lg. */
export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4", className)}>{children}</div>;
}

/**
 * KPI tile: label, tabular value, delta pill and an optional sparkline.
 * Pass `spark={[…]}` for the built-in gradient sparkline, or any node as `sparkline`.
 * For a count-up, pass `value={<CountUp value={38} />}`.
 */
export function StatTile({
  label,
  value,
  delta,
  deltaLabel = "ggü. Vorwoche",
  hint,
  sparkline,
  spark,
  icon,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  /** relative change in percent, e.g. 12 or -4 */
  delta?: number | null;
  deltaLabel?: string;
  hint?: ReactNode;
  /** optional sparkline node (e.g. <Sparkline values={…} />) */
  sparkline?: ReactNode;
  /** shorthand: values for the built-in sparkline */
  spark?: number[];
  /** small leading icon next to the label */
  icon?: ReactNode;
  className?: string;
}) {
  const up = (delta ?? 0) >= 0;
  const line = sparkline ?? (spark && spark.length > 1 ? <Sparkline values={spark} className={up ? "text-accent" : "text-ink-muted"} /> : null);
  return (
    <div className={cn("relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-card bg-surface-raised p-4 shadow-raised sm:p-5 lg:p-6", className)}>
      <p className="flex items-center gap-2 type-label-s text-ink-muted [&_svg]:size-4">
        {icon}
        <span className="min-w-0 truncate">{label}</span>
      </p>
      <p className="type-stat text-ink">{value}</p>
      {delta !== undefined && delta !== null ? (
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 type-caption">
          <span
            className={cn(
              "inline-flex h-5 items-center gap-0.5 rounded-full pr-1.5 pl-1 font-[560] num",
              up ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
            )}
          >
            <Icon icon={up ? ArrowUpRight : ArrowDownRight} size={14} />
            {up ? "+" : "−"}
            {Math.abs(delta).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %
          </span>
          <span className="text-ink-muted">{deltaLabel}</span>
        </p>
      ) : hint ? (
        <p className="type-caption text-ink-muted">{hint}</p>
      ) : null}
      {line ? <div className="-mx-1 mt-1 h-10">{line}</div> : null}
    </div>
  );
}

/**
 * Sparkline: smooth 1.75px line in currentColor with a gradient fill fading
 * to transparent, and a dot on the last value. Decorative; pair with a text value.
 */
export function Sparkline({ values, className, fill = true }: { values: number[]; className?: string; fill?: boolean }) {
  const id = useId().replace(/:/g, "");
  if (values.length < 2) return null;
  const w = 120,
    h = 40;
  const min = Math.min(...values),
    max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 4 - ((v - min) / span) * (h - 10)] as [number, number]);
  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  return (
    <span aria-hidden className={cn("relative block h-full w-full text-accent", className)}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        {fill ? (
          <>
            <defs>
              <linearGradient id={`${id}-sp`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.22} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={`${line}L${w},${h}L0,${h}Z`} fill={`url(#${id}-sp)`} />
          </>
        ) : null}
        <path d={line} fill="none" stroke="currentColor" strokeWidth={1.75} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span
        className="absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current shadow-[0_0_0_3px_var(--color-surface-raised)]"
        style={{ left: `${(last[0] / w) * 100}%`, top: `${(last[1] / h) * 100}%` }}
      />
    </span>
  );
}

/**
 * Dashboard table on a level-1 card. Header 40px (muted, sticky optional, glass),
 * rows 52px (dense 40px), hairline separators, tinted row hover.
 */
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
        "overflow-x-auto rounded-card bg-surface-raised shadow-raised",
        // Sticky headers need the scroll container to own vertical scrolling too.
        stickyHeader &&
          "max-h-[70dvh] overflow-y-auto [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-surface-raised/85 [&_thead_th]:backdrop-blur-md",
        wrapperClassName,
      )}
    >
      <table
        data-dense={dense ? "" : undefined}
        className={cn(
          "w-full border-collapse text-left type-body-s",
          "[&_th]:h-10 [&_th]:border-b [&_th]:border-line [&_th]:bg-surface/60 [&_th]:px-4 [&_th]:type-label-s [&_th]:font-[520] [&_th]:whitespace-nowrap [&_th]:text-ink-muted",
          "[&_td]:border-b [&_td]:border-line [&_td]:px-4 [&_tr:last-child_td]:border-b-0",
          dense ? "[&_td]:h-10" : "[&_td]:h-[52px]",
          "[&_tbody_tr]:transition-colors [&_tbody_tr]:duration-fast [&_tbody_tr:hover]:bg-accent-tint",
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
