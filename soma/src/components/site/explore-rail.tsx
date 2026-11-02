import { Children, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * /entdecken lists: a horizontal snap rail below 768 px (touch), a grid from md. Pure CSS, so it ships no client
 * code and server-rendered cards stay server-rendered. Every card is a link or holds one: tabbing through the rail
 * scrolls the focused card into view (scroll padding keeps it clear of the edge), so the rail is keyboard-scrollable
 * without an extra tab stop. The vertical padding inside the scroller leaves room for the focus ring and the lift.
 */
export function ExploreRail({
  label,
  children,
  columns = 4,
  className,
}: {
  /** accessible name of the list, e.g. „Von SOMA ausgewählt“ */
  label: string;
  children: ReactNode;
  /** grid columns from lg (md shows two) */
  columns?: 3 | 4;
  className?: string;
}) {
  const items = Children.toArray(children);
  return (
    <ul
      aria-label={label}
      className={cn(
        "-mx-(--space-gutter) -my-3 flex snap-x snap-mandatory scroll-px-(--space-gutter) gap-3 overflow-x-auto px-(--space-gutter) py-3 scrollbar-none",
        "md:mx-0 md:my-0 md:grid md:gap-5 md:overflow-visible md:px-0 md:py-0 lg:gap-6",
        // two columns from md: four cards make 2 + 2 there, never 3 + 1 (review R6)
        columns === 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((child, i) => (
        <li key={i} className="flex w-[min(78vw,19rem)] shrink-0 snap-start md:w-auto md:min-w-0">
          {child}
        </li>
      ))}
    </ul>
  );
}

/**
 * Section header for /entdecken: overline, sans title (the page's one serif headline is the h1), an optional lead
 * and a trailing slot (info link, city switch).
 */
export function ExploreSectionHeader({
  id,
  overline,
  title,
  lead,
  aside,
  className,
}: {
  id: string;
  overline?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between md:gap-8", className)}>
      <div className="flex max-w-reading min-w-0 flex-col gap-2.5">
        {overline ? <p className="type-eyebrow text-ink-muted">{overline}</p> : null}
        <h2 id={id} className="type-heading-l text-balance text-ink">
          {title}
        </h2>
        {lead ? <div className="type-body-s text-pretty text-ink-muted">{lead}</div> : null}
      </div>
      {aside ? <div className="min-w-0 shrink-0">{aside}</div> : null}
    </div>
  );
}
