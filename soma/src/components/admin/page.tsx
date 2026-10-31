import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
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
    <header className={cn("flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        {back ? (
          <Link href={back.href} className="-ml-1 inline-flex w-fit items-center gap-1 rounded-full py-1 pr-2.5 pl-1 type-label-s text-ink-muted transition-colors hover:bg-ink/[0.04] hover:text-ink focus-ring">
            <Icon icon={ChevronLeft} size={16} />
            {back.label}
          </Link>
        ) : group ? (
          <p className="flex items-center gap-2.5 type-overline text-ink-muted">
            <span aria-hidden className="block h-0.5 w-5 rounded-full bg-aura" />
            {group}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="type-heading-l">{title}</h1>
          {meta}
        </div>
        {description ? <div className="type-body-s text-ink-muted">{description}</div> : null}
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
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section aria-labelledby={id ? `${id}-title` : undefined} className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={id ? `${id}-title` : undefined} className="type-heading-m">
            {title}
          </h2>
          {description ? <p className="type-body-s text-ink-muted">{description}</p> : null}
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
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col overflow-hidden rounded-card bg-surface-raised shadow-raised", className)}>
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-line px-5 py-2">
        <h2 className="flex items-center gap-2 type-heading-s">{title}</h2>
        {action}
      </div>
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Small muted inline link (e.g. "Alle anzeigen"). */
export function MutedLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("rounded-control type-label-s text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover focus-ring", className)}>
      {children}
    </Link>
  );
}

/** Em dash for empty values (design-guideline §11). */
export const EMPTY = "—";
