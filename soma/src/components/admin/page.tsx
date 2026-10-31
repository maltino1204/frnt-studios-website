import Link from "next/link";
import type { ComponentProps, ElementType, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyArt } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/**
 * Admin page header: roof line + overline (where you are), title in
 * type-heading-l (no display type in /admin), muted description, actions right.
 */
export function AdminPageHeader({
  group,
  title,
  description,
  actions,
  back,
  meta,
  className,
}: {
  group?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between lg:pb-7", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        {back ? (
          <Link
            href={back.href}
            className="group/back -ml-2 inline-flex h-7 w-fit items-center gap-1 rounded-full pr-3 pl-1.5 type-label-s text-ink-muted transition-[background-color,color] duration-fast pressable hover:bg-ink/[0.045] hover:text-ink focus-ring"
          >
            <Icon icon={ChevronLeft} size={16} className="transition-transform duration-fast ease-standard group-hover/back:-translate-x-0.5" />
            {back.label}
          </Link>
        ) : group ? (
          <p className="flex items-center gap-2.5 type-overline text-ink-muted">
            <span aria-hidden className="block h-0.5 w-5 rounded-full bg-aura" />
            {group}
          </p>
        ) : null}
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="min-w-0 type-heading-l">{title}</h1>
          {meta}
        </div>
        {description ? <div className="max-w-3xl type-body-s text-pretty text-ink-muted">{description}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** Section within a page: heading-m title, optional description and actions. Sections are separated by space, not rules. */
export function AdminSection({
  title,
  description,
  actions,
  children,
  className,
  id,
  count,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  /** small muted tabular count after the title */
  count?: ReactNode;
}) {
  return (
    <section aria-labelledby={id ? `${id}-title` : undefined} className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={id ? `${id}-title` : undefined} className="flex items-baseline gap-2 type-heading-m">
            {title}
            {count != null ? <span className="type-label-s font-[520] text-ink-muted num">{count}</span> : null}
          </h2>
          {description ? <p className="max-w-3xl type-body-s text-pretty text-ink-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

/** Raised panel with a compact header row (title + action) and hairline below. */
export function PanelCard({
  title,
  action,
  children,
  className,
  bodyClassName,
  icon,
  count,
  as: As = "section",
}: {
  title: ReactNode;
  /** count pill after the title (the title truncates, the pill never wraps away) */
  count?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** small leading icon (muted) */
  icon?: ReactNode;
  as?: "section" | "div";
}) {
  return (
    <As className={cn("flex min-w-0 flex-col overflow-hidden rounded-card bg-surface-raised shadow-raised", className)}>
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-line px-4 py-2 sm:px-5">
        <h2 className="flex min-w-0 items-center gap-2 type-heading-s">
          {icon ? <span className="inline-flex shrink-0 text-ink-muted [&_svg]:size-4">{icon}</span> : null}
          <span className="min-w-0 truncate">{title}</span>
          {count ? <span className="shrink-0">{count}</span> : null}
        </h2>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </As>
  );
}

/** Level-1 card for grouped content (replaces v1 bordered boxes). */
export function Card<T extends ElementType = "div">({
  as,
  className,
  ...props
}: { as?: T; className?: string } & Omit<ComponentProps<T>, "as" | "className">) {
  const Tag = (as ?? "div") as ElementType;
  return <Tag className={cn("min-w-0 rounded-card bg-surface-raised shadow-raised", className)} {...props} />;
}

/**
 * Dense definition list for detail panels (36px rows, label left, value right,
 * hairlines between). Values wrap; labels never shrink below their text.
 */
export function Facts({ items, className }: { items: Array<{ label: ReactNode; value: ReactNode } | null | false>; className?: string }) {
  return (
    <dl className={cn("divide-y divide-line", className)}>
      {items.filter(Boolean).map((it, i) => {
        const item = it as { label: ReactNode; value: ReactNode };
        return (
          <div key={i} className="flex min-h-10 items-baseline justify-between gap-6 py-2.5">
            <dt className="shrink-0 type-body-s text-ink-muted">{item.label}</dt>
            <dd className="min-w-0 text-right type-body-s text-ink">{item.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Small accent link with a chevron (e.g. "Alle anzeigen"). */
export function MutedLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group/ml -mr-2 inline-flex h-7 items-center gap-0.5 rounded-full pr-1.5 pl-2.5 type-label-s whitespace-nowrap text-accent transition-[background-color,color] duration-fast pressable hover:bg-accent-soft hover:text-accent-hover focus-ring",
        className,
      )}
    >
      {children}
      <Icon icon={ChevronRight} size={14} className="transition-transform duration-fast ease-standard group-hover/ml:translate-x-0.5" />
    </Link>
  );
}

/**
 * Compact empty state inside a section (detail pages, secondary lists): a small seeded
 * aura tile, a heading-s line and an optional muted sentence, on a level-1 card.
 * Full-page empties use the kit EmptyState.
 */
export function SectionEmpty({ title, children, seed, action, className }: { title: ReactNode; children?: ReactNode; seed: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-4 rounded-card bg-surface-raised px-4 py-4 shadow-raised sm:px-5", className)}>
      <EmptyArt seed={seed} className="size-14 rounded-tile shadow-raised" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="type-heading-s text-ink">{title}</p>
        {children ? <div className="type-body-s text-ink-muted">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Em dash for empty values (design-guideline §11). */
export const EMPTY = "—";
