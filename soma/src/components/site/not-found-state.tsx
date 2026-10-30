import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Page-level empty state for not-found routes. Same geometry as the kit's EmptyState
 * (roof line, display-s headline, one or two lines, one action), but the headline is
 * the page's h1, because these states replace the whole page.
 */
export function NotFoundState({ title, children, action, className }: { title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex max-w-reading flex-col items-start gap-4 py-10", className)}>
      <span aria-hidden className="block h-0.5 w-6 bg-ink" />
      <h1 className="type-display-s">{title}</h1>
      {children ? <div className="type-body-s text-ink-muted">{children}</div> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
