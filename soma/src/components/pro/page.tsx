import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Provider app page frame. /pro titles use type-heading-l (design-guideline §11:
 * the only Newsreader moments are the greeting on "Heute" and stat values).
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
    <div className="mx-auto w-full max-w-[72rem] px-(--space-gutter) pt-6 lg:pt-10">
      <div className={cn("flex w-full flex-col gap-8 lg:gap-10", width === "narrow" && "max-w-[46rem]", className)}>{children}</div>
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
      <div className="flex min-w-0 flex-col gap-2">
        {back ? (
          <Link href={back.href} className="-ml-1 inline-flex h-touch items-center gap-1 self-start type-label-s text-ink-muted hover:text-ink">
            <ChevronLeft size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            {back.label}
          </Link>
        ) : null}
        {overline ? <p className="type-overline text-ink-muted">{overline}</p> : null}
        <h1 className="type-heading-l">{title}</h1>
        {description ? <p className="max-w-reading type-body-s text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
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
    <section id={id} className={cn("flex flex-col gap-4", className)} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="flex min-h-touch items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
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

/** Text link with chevron used for "Alle anzeigen" asides. */
export function AsideLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-touch items-center type-label-s text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover">
      {children}
    </Link>
  );
}
