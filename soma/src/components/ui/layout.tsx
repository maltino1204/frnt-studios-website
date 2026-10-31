import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Page container with responsive gutters. `width` maps to the token container widths. */
export function Container({
  width = "page",
  className,
  ...props
}: ComponentProps<"div"> & { width?: "page" | "content" | "reading" | "form" | "dashboard" }) {
  const max = {
    page: "max-w-page",
    content: "max-w-content",
    reading: "max-w-reading",
    form: "max-w-form",
    dashboard: "max-w-dashboard",
  }[width];
  return <div className={cn("mx-auto w-full px-(--space-gutter)", max, className)} {...props} />;
}

/** Vertical rhythm for marketing sections (64/96/128px responsive). */
export function Section({ className, night, ...props }: ComponentProps<"section"> & { night?: boolean }) {
  return (
    <section
      data-theme={night ? "night" : undefined}
      className={cn("py-(--space-section)", className)}
      {...props}
    />
  );
}

/** Overline led by the aura line (the v2 roof line): the "where you are" marker for section labels. */
export function Overline({ children, className, as: As = "p" }: { children: ReactNode; className?: string; as?: "p" | "span" | "h2" | "h3" }) {
  return (
    <As className={cn("flex items-center gap-2.5 type-overline text-ink-muted", className)}>
      <span aria-hidden className="block h-0.5 w-5 shrink-0 rounded-full bg-aura" />
      {children}
    </As>
  );
}

/** Section heading block: overline + display headline + optional lead + action. */
export function SectionHeader({
  overline,
  title,
  lead,
  action,
  className,
  size = "l",
}: {
  overline?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  className?: string;
  size?: "l" | "m";
}) {
  return (
    <div className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex max-w-reading flex-col gap-4">
        {overline ? <Overline className="mb-1">{overline}</Overline> : null}
        <h2 className={size === "l" ? "type-display-l" : "type-display-m"}>{title}</h2>
        {lead ? <p className="type-body-l text-ink-muted">{lead}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** App-area page header (account, pro, admin). */
export function PageHeader({
  title,
  description,
  actions,
  back,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex flex-col gap-2">
        {back}
        <h1 className="type-display-s">{title}</h1>
        {description ? <p className="type-body-s text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

/** Level-1 card: white, 20px radius, layered soft shadow with its own hairline (dashboards, account). */
export function Panel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("bg-surface-raised shadow-raised", !className?.includes("rounded") && "rounded-card", className)} {...props} />;
}

/** Definition list rows for facts (label left, value right). */
export function FactList({ items, className }: { items: { label: ReactNode; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("divide-y divide-line", className)}>
      {items.map((it, i) => (
        <div key={i} className="flex items-baseline justify-between gap-6 py-3">
          <dt className="type-body-s text-ink-muted">{it.label}</dt>
          <dd className="text-right type-body-s text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
