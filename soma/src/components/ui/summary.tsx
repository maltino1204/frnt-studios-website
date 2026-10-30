import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatPriceExact } from "@/lib/format";
import { Icon } from "./icon";

export type PriceLine = { label: ReactNode; detail?: ReactNode; cents: number; kind?: "credit" };

/** Price breakdown: 36px rows, muted labels, right-aligned tabular amounts, hairline, total. No box. */
export function PriceBreakdown({
  lines,
  totalCents,
  totalLabel = "Gesamtpreis",
  notes,
  className,
}: {
  lines: PriceLine[];
  totalCents: number;
  totalLabel?: string;
  notes?: ReactNode[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <dl className="flex flex-col">
        {lines.map((l, i) => (
          <div key={i} className="flex min-h-9 items-baseline justify-between gap-4 py-1.5">
            <dt className="type-body-s text-ink-muted">
              {l.label}
              {l.detail ? <span className="block type-caption">{l.detail}</span> : null}
            </dt>
            <dd className={cn("type-body-s num", l.kind === "credit" ? "text-success" : "text-ink")}>
              {l.kind === "credit" ? "−" : ""}
              {formatPriceExact(Math.abs(l.cents))}
            </dd>
          </div>
        ))}
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-3">
          <dt className="type-heading-m">{totalLabel}</dt>
          <dd className="type-heading-m num">{formatPriceExact(totalCents)}</dd>
        </div>
      </dl>
      {notes?.length ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {notes.map((n, i) => (
            <li key={i} className="type-caption text-ink-muted">
              {n}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** A caption line with a leading ink check (e.g. free-cancellation deadline). */
export function CheckLine({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start gap-1.5 type-caption text-ink", className)}>
      <Icon icon={Check} size={16} className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Step indicator: segments 2px tall, done + current ink. Labels under segments on desktop. */
export function StepIndicator({
  steps,
  current,
  className,
  onStepClick,
}: {
  steps: string[];
  current: number;
  className?: string;
  onStepClick?: (index: number) => void;
}) {
  return (
    <nav aria-label="Fortschritt" className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between md:hidden">
        <p className="type-caption text-ink-muted">
          Schritt {current + 1} von {steps.length}
        </p>
        <p className="type-heading-s">{steps[current]}</p>
      </div>
      <ol className="flex gap-1">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col gap-2" aria-current={i === current ? "step" : undefined}>
            <span aria-hidden className={cn("h-0.5 w-full", i <= current ? "bg-ink" : "bg-line")} />
            <span className="hidden md:block">
              {onStepClick && i < current ? (
                <button type="button" onClick={() => onStepClick(i)} className="type-label-s text-ink underline-offset-4 hover:underline">
                  {s}
                </button>
              ) : (
                <span className={cn("type-label-s", i <= current ? "text-ink" : "text-ink-muted")}>{s}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
