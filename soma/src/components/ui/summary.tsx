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
            <dd className={cn("type-body-s num", l.kind === "credit" ? "font-[520] text-success" : "text-ink")}>
              {l.kind === "credit" ? "−" : ""}
              {formatPriceExact(Math.abs(l.cents))}
            </dd>
          </div>
        ))}
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-dashed border-line-mid pt-3.5">
          <dt className="type-heading-m">{totalLabel}</dt>
          <dd className="type-heading-l num tracking-[-0.025em]">{formatPriceExact(totalCents)}</dd>
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

/** A caption line with a leading check in a soft success disc (e.g. free-cancellation deadline). */
export function CheckLine({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 type-caption text-ink", className)}>
      <span aria-hidden className="mt-px inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
        <Icon icon={Check} size={12} strokeWidth={2} absoluteStrokeWidth={false} />
      </span>
      <span>{children}</span>
    </p>
  );
}

/** Step indicator: 4px pill segments; done ink, current fills with the aura. Labels under segments on desktop. */
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
        <p className="type-caption text-ink-muted num">
          Schritt {current + 1} von {steps.length}
        </p>
        <p className="type-heading-s">{steps[current]}</p>
      </div>
      <ol className="flex gap-1.5">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col gap-2" aria-current={i === current ? "step" : undefined}>
            <span aria-hidden className="relative h-1 w-full overflow-hidden rounded-full bg-line">
              <span
                className={cn(
                  "absolute inset-0 origin-left rounded-full transition-[scale] duration-calm ease-enter",
                  i < current ? "scale-x-100 bg-ink" : i === current ? "scale-x-100 bg-aura" : "scale-x-0 bg-ink",
                )}
              />
            </span>
            <span className="hidden md:block">
              {onStepClick && i < current ? (
                <button type="button" onClick={() => onStepClick(i)} className="rounded-control type-label-s text-ink underline-offset-4 focus-ring hover:underline">
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
