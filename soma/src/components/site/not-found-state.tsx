import type { ReactNode } from "react";
import { EmptyArt } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

/**
 * Page-level empty state for not-found routes. Same geometry as the kit's EmptyState
 * (seeded aura art, display-s headline, one or two lines, one action), but the headline
 * is the page's h1, because these states replace the whole page.
 */
export function NotFoundState({
  title,
  children,
  action,
  className,
  seed,
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** seeds the artwork; defaults to the title text */
  seed?: string;
}) {
  return (
    <div className={cn("flex max-w-reading flex-col items-start gap-4 py-10", className)}>
      <EmptyArt seed={seed ?? (typeof title === "string" ? title : "nicht-gefunden")} className="mb-2" />
      <h1 className="type-display-s">{title}</h1>
      {children ? <div className="type-body-s text-ink-muted">{children}</div> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
