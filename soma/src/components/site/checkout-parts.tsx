"use client";

import { Check, CreditCard, TriangleAlert, type LucideIcon } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/*
 * Local building blocks of the v2 checkout (design-guideline v2 §7, §8, §10):
 * a refined node stepper, elevated step cards, tactile address options and the
 * payment-method tile. Kit primitives stay untouched; these compose them.
 */

/** A check that draws itself in (stroke-dashoffset), for done steps. */
function DrawnCheck({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={cn("size-3.5", className)}>
      <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="animate-draw" />
    </svg>
  );
}

/** Step node: ink + drawn check when done, aura ring when current, sunken number when upcoming. */
export function StepNode({ index, state, size = "m" }: { index: number; state: "done" | "current" | "upcoming"; size?: "s" | "m" }) {
  const box = size === "s" ? "size-6 text-[12px]" : "size-7 text-[13px]";
  if (state === "done") {
    return (
      <span aria-hidden className={cn("inline-flex shrink-0 animate-pop items-center justify-center rounded-full bg-ink text-ink-inverse shadow-ink", box)}>
        <DrawnCheck />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-surface-raised font-[600] text-ink shadow-[inset_0_0_0_1.5px_var(--color-ink)] num", box)}>
        {index + 1}
      </span>
    );
  }
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-surface-sunken font-[560] text-ink-muted ring-1 ring-line-mid ring-inset num", box)}>
      {index + 1}
    </span>
  );
}

/**
 * Checkout stepper: nodes joined by hairlines that fill with ink as steps are
 * completed. Glass pill (sticky on desktop). On phones only the current label
 * is shown; the others stay available to screen readers.
 */
export function CheckoutStepper({
  steps,
  current,
  onStepClick,
  className,
}: {
  steps: readonly string[];
  current: number;
  onStepClick: (index: number) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Fortschritt" className={cn("rounded-full bg-surface-raised px-2 py-1.5 shadow-raised", className)}>
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {steps.map((s, i) => {
          const state = i < current ? "done" : i === current ? "current" : "upcoming";
          return (
            <li key={s} aria-current={state === "current" ? "step" : undefined} className={cn("flex min-w-0 items-center gap-1.5 sm:gap-2", i < steps.length - 1 && "flex-1")}>
              <button
                type="button"
                onClick={() => onStepClick(i)}
                className="inline-flex min-h-touch shrink-0 items-center gap-2 rounded-full pr-2 pl-1 pressable focus-ring hover:bg-ink/[0.04]"
              >
                <StepNode index={i} state={state} />
                <span className={cn("type-label-s whitespace-nowrap", state === "upcoming" ? "text-ink-muted" : "text-ink", state !== "current" && "sr-only sm:not-sr-only")}>
                  {s}
                  {state === "done" ? <span className="sr-only">, erledigt</span> : null}
                </span>
              </button>
              {i < steps.length - 1 ? (
                <span aria-hidden className="relative h-0.5 min-w-3 flex-1 overflow-hidden rounded-full bg-line">
                  <span className={cn("absolute inset-0 origin-left rounded-full bg-ink transition-[scale] duration-calm ease-enter", i < current ? "scale-x-100" : "scale-x-0")} />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** One checkout step as an elevated card (level 1) with its own completion node. */
export function StepCard({
  id,
  index,
  done,
  title,
  description,
  aside,
  children,
  className,
}: {
  id: string;
  index: number;
  done: boolean;
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titel`}
      className={cn("flex scroll-mt-24 flex-col gap-5 rounded-card bg-surface-raised p-5 shadow-raised md:p-7 lg:scroll-mt-40", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="pt-px">
            <StepNode index={index} state={done ? "done" : "upcoming"} size="s" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={`${id}-titel`} className="type-heading-m">
              {title}
            </h2>
            {description ? <p className="type-body-s text-ink-muted">{description}</p> : null}
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/**
 * A selectable card on a native radio (saved address, "Neue Adresse").
 * The radio carries a short accessible name; the address is its description.
 * Selected: ink ring, the icon tile turns ink, the card settles on a spring.
 */
export function OptionCard({
  icon,
  title,
  badge,
  description,
  dashed,
  accessibleName,
  className,
  ...input
}: {
  icon: LucideIcon;
  title: ReactNode;
  badge?: ReactNode;
  description?: ReactNode;
  dashed?: boolean;
  accessibleName: string;
  className?: string;
} & Omit<ComponentProps<"input">, "type" | "className">) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "group relative flex min-h-[4.5rem] cursor-pointer items-start gap-3 rounded-tile p-3.5 ring-inset select-none",
        "transition-[box-shadow,background-color,border-color,scale] duration-base ease-standard active:scale-[0.985] active:duration-instant",
        dashed
          ? "border border-dashed border-line-strong bg-surface-raised/60 hover:bg-surface-raised has-checked:border-transparent has-checked:bg-surface-raised"
          : "bg-surface-raised ring-1 ring-line-mid hover:ring-line-strong",
        "has-checked:animate-settle has-checked:shadow-float has-checked:ring-2 has-checked:ring-ink",
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink transition-[background-color,color] duration-base group-has-checked:bg-ink group-has-checked:text-ink-inverse"
      >
        <Icon icon={icon} size={18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 type-label text-ink">
          {title}
          {badge}
        </span>
        {description ? (
          <span id={`${id}-d`} className="type-caption text-ink-muted">
            {description}
          </span>
        ) : null}
      </span>
      <input
        id={id}
        type="radio"
        aria-label={accessibleName}
        aria-describedby={description ? `${id}-d` : undefined}
        className="mt-2.5 size-5 shrink-0 cursor-pointer appearance-none rounded-full border border-line-strong bg-surface-raised inset-shadow-field transition-[border-width,border-color,scale] duration-spring ease-spring checked:border-[6px] checked:border-ink focus-visible:outline-none active:scale-90"
        {...input}
      />
    </label>
  );
}

/** A small card artwork for the payment method: an Espresso card with a chip and a line. Decorative. */
export function CardArt({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-flex h-9 w-14 shrink-0 overflow-hidden rounded-[7px] bg-ink shadow-[0_1px_2px_rgb(37_33_31/0.18)]", className)}>
      <span className="absolute top-2 left-2 h-2 w-3 rounded-[2px] bg-(--soma-stone-deep)" />
      <span className="absolute right-2 bottom-2 h-1 w-5 rounded-full bg-ink-inverse/50" />
    </span>
  );
}

/**
 * Payment method tile. Test mode is stated plainly in the tile (warning band
 * with the exact wording), never hidden behind a tooltip.
 */
export function PaymentTile({
  title,
  meta,
  badge,
  notice,
  noticeTitle,
  stripe,
}: {
  title: ReactNode;
  meta: ReactNode;
  badge?: ReactNode;
  /** test-mode explanation (dev payments) */
  notice?: ReactNode;
  noticeTitle?: ReactNode;
  stripe?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-tile bg-surface-raised ring-2 ring-ink ring-inset shadow-raised">
      <div className="flex items-center gap-3.5 p-3.5">
        {stripe ? (
          <span aria-hidden className="inline-flex h-9 w-14 shrink-0 items-center justify-center rounded-[7px] bg-surface-sunken text-ink ring-1 ring-line-mid ring-inset">
            <Icon icon={CreditCard} size={18} />
          </span>
        ) : (
          <CardArt />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="type-label text-ink num">{title}</p>
          <p className="type-caption text-ink-muted">{meta}</p>
        </div>
        {badge}
        <span aria-hidden className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-ink text-ink-inverse">
          <Icon icon={Check} size={12} strokeWidth={2.4} absoluteStrokeWidth={false} />
        </span>
      </div>
      {notice ? (
        <div className="flex gap-3 bg-warning-soft px-3.5 py-3 shadow-[inset_0_1px_0_var(--color-warning-line)]">
          <Icon icon={TriangleAlert} size={18} className="mt-px shrink-0 text-warning" />
          <div className="flex min-w-0 flex-col gap-0.5 type-body-s">
            {noticeTitle ? <p className="font-semibold text-ink">{noticeTitle}</p> : null}
            <p className="text-ink-muted">{notice}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Text that cross-fades when it changes (loading phases). Announced politely. */
export function MorphText({ text, className }: { text: string; className?: string }) {
  return (
    <span aria-live="polite" className={cn("inline-grid", className)}>
      <span key={text} className="col-start-1 row-start-1 animate-fade-in">
        {text}
      </span>
    </span>
  );
}
