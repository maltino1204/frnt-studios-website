import type { ReactNode } from "react";
import { CircleAlert, Info, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/** Skeleton copying final geometry: sunken surface, square corners, opacity pulse. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-skeleton bg-surface-sunken", className)} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ["w-full", "w-[92%]", "w-[64%]"];
  return (
    <div aria-hidden className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={cn("h-[0.7lh] animate-skeleton bg-surface-sunken", widths[i % 3])} />
      ))}
    </div>
  );
}

/** Left-aligned empty state: roof line, display-s headline, one or two lines, one action. No illustration. */
export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex max-w-reading flex-col items-start gap-4 py-10", className)}>
      <span aria-hidden className="block h-0.5 w-6 bg-ink" />
      <h2 className="type-display-s">{title}</h2>
      {children ? <div className="type-body-s text-ink-muted">{children}</div> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}

/** Inline notice (no boxes-in-boxes): a hairline left rule and an icon. */
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
    info: "bg-surface-sunken text-ink",
    success: "bg-success-soft text-ink",
    warning: "bg-warning-soft text-ink",
    danger: "bg-danger-soft text-ink",
  }[kind];
  const iconColor = { info: "text-ink-muted", success: "text-success", warning: "text-warning", danger: "text-danger" }[kind];
  const I = kind === "success" ? Check : kind === "info" ? Info : CircleAlert;
  return (
    <div role={kind === "danger" ? "alert" : undefined} className={cn("flex gap-3 px-4 py-3.5", styles, className)}>
      <Icon icon={I} className={cn("mt-px shrink-0", iconColor)} />
      <div className="flex flex-col gap-1 type-body-s">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-ink-muted [&_a]:text-accent [&_a]:underline">{children}</div> : null}
      </div>
    </div>
  );
}

/** Status: always an 8px dot plus a word (design-guideline §11). */
export type StatusTone = "neutral" | "accent" | "success" | "warning" | "danger";
export function Status({ tone = "neutral", children, className }: { tone?: StatusTone; children: ReactNode; className?: string }) {
  const dot = {
    neutral: "bg-ink-muted",
    accent: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-2 type-label-s text-ink", className)}>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dot)} />
      {children}
    </span>
  );
}

/** Small count pill (tabs, nav). */
export function CountPill({ children, accent, className }: { children: ReactNode; accent?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 type-caption num leading-none",
        accent ? "bg-accent text-on-accent" : "bg-ink text-ink-inverse",
        className,
      )}
    >
      {children}
    </span>
  );
}
