import type { ReactNode } from "react";
import { CircleAlert, Info, Check, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { ArchLine } from "./motif";

/**
 * Skeleton copying final geometry (brand § 9.3 "Loading"): Linen with a slow, quiet shimmer (1.8 s,
 * transform-only). Default radius 8 px; pass a rounded-* or `arch` class to match the final shape.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative isolate overflow-hidden bg-surface-sunken", !className?.includes("rounded") && "rounded-control", className)}>
      <span className="absolute inset-0 -z-10 animate-skeleton bg-linear-to-r from-transparent via-surface-raised/70 to-transparent" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ["w-full", "w-[92%]", "w-[64%]"];
  return (
    <div aria-hidden className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={cn("relative isolate h-[0.7lh] overflow-hidden rounded-full bg-surface-sunken", widths[i % 3])}>
          <span className="absolute inset-0 -z-10 animate-skeleton bg-linear-to-r from-transparent via-surface-raised/70 to-transparent" />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty-state mark (brand § 9.3): a 72 px arch outline in stone-deep. Decorative. `seed` and `tone` are kept
 * for API compatibility and ignored: the outline is the same everywhere.
 */
export function EmptyArt({ className }: { seed?: string; tone?: string; className?: string }) {
  return <ArchLine className={cn("text-(--soma-stone-deep)", className)} />;
}

/**
 * Empty state (brand § 9.3): a 72 px arch outline, the title in Newsreader 26 (the view's one serif), one or two
 * lines, one action. `art={false}` drops the outline (dense tables, sheets).
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
      {art ? <EmptyArt seed={s} tone={tone} className="mb-1" /> : null}
      <Heading className="type-title-serif">{title}</Heading>
      {children ? <div className="type-body-s text-ink-muted">{children}</div> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}

/**
 * Inline notice (brand § 9.3): soft status background, a 1 px status border, the icon and the bold word in the
 * status colour, then the explanation in Espresso. Never colour alone; danger is vermilion, never Oxblood.
 */
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
    info: "bg-info-soft text-ink ring-info-line",
    success: "bg-success-soft text-ink ring-success-line",
    warning: "bg-warning-soft text-ink ring-warning-line",
    danger: "bg-danger-soft text-ink ring-danger-line",
  }[kind];
  const iconColor = { info: "text-info", success: "text-success", warning: "text-warning", danger: "text-danger" }[kind];
  const I = kind === "success" ? Check : kind === "info" ? Info : kind === "warning" ? TriangleAlert : CircleAlert;
  return (
    <div role={kind === "danger" ? "alert" : undefined} className={cn("flex animate-fade-in gap-3 rounded-tile px-4 py-3.5 ring-1 ring-inset", styles, className)}>
      <Icon icon={I} className={cn("mt-px shrink-0", iconColor)} />
      <div className="flex min-w-0 flex-col gap-1 type-body-s">
        {title ? <p className={cn("font-semibold", iconColor)}>{title}</p> : null}
        {children ? <div className="text-ink [&_a]:text-ink [&_a]:underline [&_a]:decoration-line-strong [&_a]:underline-offset-[0.2em] [&_a:hover]:text-link-hover">{children}</div> : null}
      </div>
    </div>
  );
}

/**
 * Status: always a dot plus a word (brand § 9.3), never colour alone. Default is a soft pill; `variant="dot"` is
 * the plain dot + ink word for dense rows. `accent` (in progress: "Läuft", "In Prüfung") renders in slate:
 * Oxblood never marks a status.
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
    accent: "bg-info",
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
    accent: "bg-info-soft text-info",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
  }[tone];
  return (
    <span className={cn("inline-flex min-h-6 w-fit max-w-full items-center gap-1.5 rounded-[12px] px-2.5 py-[3px] type-label-s", pill, className)}>
      <span aria-hidden className={cn("relative size-1.5 shrink-0 rounded-full", dot)} />
      {children}
    </span>
  );
}

/** Small count pill (tabs, nav): Espresso with a Bone figure. `accent` is kept for API compatibility (counts are never Oxblood). */
export function CountPill({ children, accent, className }: { children: ReactNode; accent?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[12px] leading-none font-[600] num",
        accent ? "bg-ink text-ink-inverse ring-2 ring-surface-raised" : "bg-ink text-ink-inverse",
        className,
      )}
    >
      {children}
    </span>
  );
}
