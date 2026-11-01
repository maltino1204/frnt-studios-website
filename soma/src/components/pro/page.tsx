import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { AuraLine } from "@/components/ui/aura";
import { cn } from "@/lib/cn";

/**
 * Provider app page frame (design-guideline v2 §12): Kalk page, level-1 cards,
 * generous rhythm. Titles are type-display-s; sections type-heading-m.
 */
export function ProPage({
  children,
  width = "wide",
  className,
}: {
  children: ReactNode;
  width?: "wide" | "narrow";
  className?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[74rem] px-(--space-gutter) pt-6 lg:pt-10">
      <div className={cn("flex w-full flex-col gap-8 lg:gap-10", width === "narrow" && "max-w-[48rem]", className)}>{children}</div>
    </div>
  );
}

export function ProHeader({
  title,
  description,
  actions,
  back,
  overline,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  overline?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-2.5">
        {back ? (
          <Link
            href={back.href}
            className="group -ml-2 inline-flex h-9 items-center gap-1 self-start rounded-full pr-3 pl-1.5 type-label-s text-ink-muted transition-colors duration-fast pressable focus-ring hover:bg-ink/[0.04] hover:text-ink"
          >
            <Icon icon={ChevronLeft} size={16} strokeWidth={1.6} className="transition-transform duration-fast group-hover:-translate-x-0.5" />
            {back.label}
          </Link>
        ) : null}
        {overline ? (
          typeof overline === "string" ? (
            <p className="flex items-center gap-2.5 type-overline text-ink-muted">
              <AuraLine className="w-5" />
              {overline}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">{overline}</div>
          )
        ) : null}
        <h1 className="type-display-s">{title}</h1>
        {description ? <p className="max-w-reading type-body-s text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** Section within a pro page: heading-m title, optional aside link, content below. */
export function ProSection({
  title,
  description,
  aside,
  children,
  className,
  id,
}: {
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("flex min-w-0 flex-col gap-4", className)} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="flex min-h-9 items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={id ? `${id}-title` : undefined} className="type-heading-m">
            {title}
          </h2>
          {description ? <p className="type-body-s text-ink-muted">{description}</p> : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

/** Quiet text link with an arrow, used for "Alle ansehen" asides (44px hit area). */
export function AsideLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group relative -mr-2 inline-flex h-9 items-center gap-1 rounded-full px-2.5 type-label-s text-ink underline decoration-line-strong underline-offset-4 transition-colors duration-fast pressable focus-ring hover:bg-surface-sunken hover:decoration-current before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']"
    >
      {children}
      <Icon icon={ArrowRight} size={14} strokeWidth={1.8} className="transition-transform duration-fast group-hover:translate-x-0.5" />
    </Link>
  );
}
