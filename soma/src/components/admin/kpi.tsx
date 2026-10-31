import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/** Delta pill (success / danger soft, same recipe as the kit StatTile), "±0 %" neutral. */
export function DeltaPill({ value, className }: { value: number; className?: string }) {
  const flat = Math.abs(value) < 0.05;
  const up = value > 0;
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-0.5 rounded-full pr-1.5 pl-1 type-caption font-[560] whitespace-nowrap num",
        flat ? "bg-surface-sunken text-ink-muted" : up ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
        className,
      )}
    >
      <Icon icon={flat ? Minus : up ? ArrowUpRight : ArrowDownRight} size={14} />
      {flat ? "±" : up ? "+" : "−"}
      {Math.abs(value).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %
    </span>
  );
}

/**
 * Compact KPI tile for secondary metrics (dense admin rows): muted label, a
 * heading-l tabular value and the delta pill (or a hint when there is no base).
 */
export function MetricTile({
  label,
  value,
  delta,
  deltaLabel = "ggü. Vorperiode",
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: number | null;
  deltaLabel?: string;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5 rounded-card bg-surface-raised px-4 py-3.5 shadow-raised lg:px-5 lg:py-4", className)}>
      <p className="truncate type-label-s text-ink-muted" title={label}>
        {label}
      </p>
      <p className="type-heading-l text-ink num">{value}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 type-caption text-ink-muted">
        {delta != null ? (
          <>
            <DeltaPill value={delta} />
            <span className="max-sm:sr-only">{deltaLabel}</span>
          </>
        ) : hint ? (
          <span className="truncate">{hint}</span>
        ) : (
          <span>ohne Vergleichswert</span>
        )}
      </div>
    </div>
  );
}
