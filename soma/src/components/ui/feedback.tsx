import type { ReactNode } from "react";
import { CircleAlert, Info, Check, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { AuraArt } from "./aura";
import { Icon } from "./icon";

/**
 * Skeleton copying final geometry: sunken fill with a soft light sweeping
 * across (transform-only shimmer, static under reduced motion). Default
 * radius 10px; pass a rounded-* class to match the final shape.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative isolate overflow-hidden bg-surface-sunken", !className?.includes("rounded") && "rounded-control", className)}>
      <span className="absolute inset-0 -z-10 animate-skeleton bg-linear-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ["w-full", "w-[92%]", "w-[64%]"];
  return (
    <div aria-hidden className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={cn("relative isolate h-[0.7lh] overflow-hidden rounded-full bg-surface-sunken", widths[i % 3])}>
          <span className="absolute inset-0 -z-10 animate-skeleton bg-linear-to-r from-transparent via-white/70 to-transparent" />
        </div>
      ))}
    </div>
  );
}

/**
 * Illustration-grade empty-state art: a seeded aura tile with two floating
 * glass "cards" (the product, waiting for content). Decorative.
 */
export function EmptyArt({ seed, tone, className }: { seed: string; tone?: string; className?: string }) {
  return (
    <div aria-hidden className={cn("relative size-24 shrink-0 overflow-hidden rounded-card shadow-float", className)}>
      <AuraArt seed={seed} tone={tone} />
      <span className="absolute top-[22%] left-[16%] h-[34%] w-[62%] -rotate-6 rounded-[10px] bg-white/55 shadow-[0_0_0_1px_rgb(255_255_255/0.6),0_6px_16px_-6px_rgb(23_22_31/0.18)] backdrop-blur-sm" />
      <span className="absolute top-[42%] left-[26%] flex h-[36%] w-[60%] rotate-3 flex-col justify-center gap-1.5 rounded-[10px] bg-white/85 px-[9%] shadow-[0_0_0_1px_rgb(255_255_255/0.8),0_8px_20px_-6px_rgb(23_22_31/0.22)]">
        <span className="h-1 w-[70%] rounded-full bg-ink/20" />
        <span className="h-1 w-[45%] rounded-full bg-ink/10" />
      </span>
    </div>
  );
}

/**
 * Empty state: aura art, display-s headline, one or two lines, one action.
 * `art={false}` falls back to the aura line only (dense tables, sheets).
 */
export function EmptyState({
  title,
  children,
  action,
  className,
  art = true,
  seed,
  tone,
  align = "start",
  headingLevel = "h2",
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** "h1" when the empty state is the whole page (e.g. a not-found state) */
  headingLevel?: "h1" | "h2" | "h3";
  art?: boolean;
  /** seeds the artwork; defaults to the title text */
  seed?: string;
  /** category slug for the artwork hues */
  tone?: string;
  align?: "start" | "center";
}) {
  const s = seed ?? (typeof title === "string" ? title : "leer");
  const Heading = headingLevel;
  return (
    <div
      className={cn(
        "flex max-w-reading flex-col gap-4 py-10",
        align === "center" ? "mx-auto items-center text-center" : "items-start",
        className,
      )}
    >
      {art ? <EmptyArt seed={s} tone={tone} className="mb-2" /> : <span aria-hidden className="block h-0.5 w-6 rounded-full bg-aura" />}
      <Heading className="type-display-s">{title}</Heading>
      {children ? <div className="type-body-s text-ink-muted">{children}</div> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}

/** Inline notice: soft tinted tile, tone icon, optional title. */
export function Notice({
  kind = "info",
  title,
  children,
  className,
}: {
  kind?: "info" | "success" | "warning" | "danger";
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "bg-accent-tint text-ink ring-accent/12",
    success: "bg-success-soft text-ink ring-success/15",
    warning: "bg-warning-soft text-ink ring-warning/15",
    danger: "bg-danger-soft text-ink ring-danger/15",
  }[kind];
  const iconColor = { info: "text-accent", success: "text-success", warning: "text-warning", danger: "text-danger" }[kind];
  const I = kind === "success" ? Check : kind === "info" ? Info : kind === "warning" ? TriangleAlert : CircleAlert;
  return (
    <div role={kind === "danger" ? "alert" : undefined} className={cn("flex animate-fade-in gap-3 rounded-tile px-4 py-3.5 ring-1 ring-inset", styles, className)}>
      <Icon icon={I} className={cn("mt-px shrink-0", iconColor)} />
      <div className="flex min-w-0 flex-col gap-1 type-body-s">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-ink-muted [&_a]:text-accent [&_a]:underline">{children}</div> : null}
      </div>
    </div>
  );
}

/**
 * Status: always a dot plus a word (design-guideline v2 §8). Default is a soft
 * pill; `variant="dot"` is the plain dot + ink word for very dense rows.
 */
export type StatusTone = "neutral" | "accent" | "success" | "warning" | "danger";
export function Status({
  tone = "neutral",
  variant = "pill",
  children,
  className,
}: {
  tone?: StatusTone;
  variant?: "pill" | "dot";
  children: ReactNode;
  className?: string;
}) {
  const dot = {
    neutral: "bg-ink-muted",
    accent: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[tone];
  if (variant === "dot") {
    return (
      <span className={cn("inline-flex items-center gap-2 type-label-s text-ink", className)}>
        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dot)} />
        {children}
      </span>
    );
  }
  const pill = {
    neutral: "bg-surface-sunken text-ink-muted",
    accent: "bg-accent-soft text-accent",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
  }[tone];
  return (
    <span className={cn("inline-flex min-h-6 w-fit max-w-full items-center gap-1.5 rounded-[12px] px-2.5 py-[3px] type-label-s", pill, className)}>
      <span aria-hidden className={cn("relative size-1.5 shrink-0 rounded-full", dot)}>
        {tone === "accent" ? <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60 [animation-duration:2.4s]" /> : null}
      </span>
      {children}
    </span>
  );
}

/** Small count pill (tabs, nav). */
export function CountPill({ children, accent, className }: { children: ReactNode; accent?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] leading-none font-[600] num",
        accent ? "bg-accent text-on-accent shadow-[0_1px_4px_-1px_rgb(61_79_240/0.6)]" : "bg-ink text-ink-inverse",
        className,
      )}
    >
      {children}
    </span>
  );
}
