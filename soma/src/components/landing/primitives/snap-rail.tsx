import { Children, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IslandBoundary } from "./island-boundary";
import { RailArrows } from "./rail-arrows";

/**
 * The landing's horizontal snap rail (the kit Rail's markup and look, server-rendered): native scroll snapping works
 * without JS, only the lg arrow buttons hydrate (RailArrows). Bleeds to the right viewport edge from lg.
 */
export function SnapRail({
  id,
  label,
  header,
  perView,
  className,
  itemClassName,
  children,
}: {
  id: string;
  label: string;
  header?: ReactNode;
  /** cards fully in view from lg; arrows only when there are more */
  perView: number;
  className?: string;
  itemClassName: string;
  children: ReactNode;
}) {
  const items = Children.toArray(children);
  const arrows = items.length > perView;
  return (
    <div className={className}>
      {header || arrows ? (
        <div className="mb-8 flex items-end justify-between gap-6 lg:mb-10">
          <div className="min-w-0 flex-1">{header}</div>
          {arrows ? (
            <IslandBoundary name={`${label} arrows`}>
              <RailArrows target={id} step={Math.max(1, perView - 1)} />
            </IslandBoundary>
          ) : null}
        </div>
      ) : null}
      <ul
        id={id}
        aria-label={label}
        data-rail=""
        className={cn(
          "-mx-(--space-gutter) -my-4 flex snap-x snap-mandatory scroll-px-(--space-gutter) gap-3 overflow-x-auto px-(--space-gutter) pt-4 pb-10 scrollbar-none md:gap-5 lg:gap-6",
          "lg:mr-[calc((100vw-min(100vw,var(--container-page)))/-2-var(--space-gutter))] lg:pr-[calc((100vw-min(100vw,var(--container-page)))/2+var(--space-gutter))]",
        )}
      >
        {items.map((child, i) => (
          <li key={i} className={cn("shrink-0 snap-start", itemClassName)}>
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
}
