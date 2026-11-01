import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { dateParts } from "@/lib/format";

/*
 * Small /pro building blocks on top of the UI kit. Server-safe: no client state.
 */

/**
 * Progress ring: Oat track, a flat arc with round caps (Espresso by default) that
 * draws itself in once (stroke-dashoffset, final under reduced motion). Decorative; always pair it with the value
 * as text (children or a sibling).
 */
export function ProgressRing({
  value,
  size = 56,
  stroke = 5,
  tone = "ink",
  className,
  children,
}: {
  /** 0–1 */
  value: number;
  size?: number;
  stroke?: number;
  tone?: "ink" | "success" | "warning" | "danger";
  className?: string;
  children?: ReactNode;
}) {
  const v = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2;
  const color = tone === "success" ? "var(--color-success)" : tone === "warning" ? "var(--color-warning)" : tone === "danger" ? "var(--color-danger)" : "var(--color-ink)";
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg aria-hidden viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 size-full -rotate-90 overflow-visible">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        {v > 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${v} 1`}
            className="animate-draw"
          />
        ) : null}
      </svg>
      {children ? <span className="relative flex flex-col items-center justify-center text-center">{children}</span> : null}
    </span>
  );
}

/** Date tile: weekday, day number, month (rounded-tile). Today: an Espresso underline. */
export function DateTile({ date, today = false, size = "m", className }: { date: string | Date; today?: boolean; size?: "s" | "m"; className?: string }) {
  const p = dateParts(date);
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-tile num",
        size === "s" ? "h-12 w-11 gap-0" : "h-14 w-13 gap-0.5",
        today ? "bg-ink text-ink-inverse shadow-ink" : "bg-surface-sunken text-ink inset-shadow-sunken",
        className,
      )}
    >
      <span className={cn("text-[12px] leading-none font-[560] tracking-[0.02em] uppercase", today ? "text-ink-inverse/70" : "text-ink-muted")}>{p.weekday}</span>
      <span className={cn("leading-none font-[620] tracking-[-0.03em]", size === "s" ? "text-[18px]" : "text-[20px]")}>{p.day}</span>
      {size === "m" ? <span className={cn("text-[12px] leading-none font-[520]", today ? "text-ink-inverse/70" : "text-ink-muted")}>{p.month}</span> : null}
      {today ? <span className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-ink" /> : null}
    </span>
  );
}

/** Icon on a soft tile (list leading visuals, settings rows). */
export function IconTile({ icon: I, tone = "neutral", size = 40, className }: { icon: LucideIcon; tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "ink"; size?: 32 | 36 | 40 | 44; className?: string }) {
  const tones = {
    neutral: "bg-surface-sunken text-ink inset-shadow-sunken",
    accent: "bg-surface-sunken text-ink inset-shadow-sunken",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    ink: "bg-ink text-ink-inverse",
  }[tone];
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-[12px]", tones, className)} style={{ width: size, height: size }}>
      <I size={size >= 40 ? 20 : 18} strokeWidth={1.6} absoluteStrokeWidth />
    </span>
  );
}

/** Level-1 card with a heading row (title, optional description and aside). Used for grouped settings and detail blocks. */
export function CardSection({
  title,
  description,
  aside,
  children,
  className,
  bodyClassName,
  id,
  as: Tag = "section",
}: {
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
  as?: "section" | "div";
}) {
  return (
    <Tag id={id} aria-labelledby={id ? `${id}-title` : undefined} className={cn("flex flex-col rounded-card bg-surface-raised shadow-raised", className)}>
      <div className="flex items-start justify-between gap-4 px-5 pt-5 lg:px-6 lg:pt-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={id ? `${id}-title` : undefined} className="type-heading-m">
            {title}
          </h2>
          {description ? <p className="type-body-s text-ink-muted">{description}</p> : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      <div className={cn("flex flex-col px-5 pt-4 pb-5 lg:px-6 lg:pb-6", bodyClassName)}>{children}</div>
    </Tag>
  );
}

/** A small key/value line used in summaries ("Behandlung … 89,00 €"). */
export function MetaRow({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-10 items-center justify-between gap-4 py-2", className)}>
      <dt className="type-body-s text-ink-muted">{label}</dt>
      <dd className="text-right type-body-s text-ink">{value}</dd>
    </div>
  );
}
