import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Overline } from "@/components/ui/layout";
import { cn } from "@/lib/cn";
import type { FaqItem } from "./discovery-copy";
import { faqLd, JsonLd } from "./discovery-json-ld";

/**
 * Native <details> accordion in a level-1 card (works without JS). Opening and
 * closing animate the height where the browser supports `::details-content`
 * (interpolate-size); the plus turns into a cross on a spring. Reduced motion: instant.
 */
export function FaqList({ items, className }: { items: FaqItem[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line rounded-card bg-surface-raised px-5 shadow-raised md:px-7", className)}>
      {items.map((it) => (
        <details
          key={it.q}
          className={cn(
            "group [interpolate-size:allow-keywords]",
            "details-content:h-0 details-content:overflow-clip open:details-content:h-auto",
            "motion-safe:details-content:transition-[height,content-visibility] motion-safe:details-content:transition-discrete motion-safe:details-content:duration-slow motion-safe:details-content:ease-standard",
          )}
        >
          <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-6 rounded-control py-5 focus-ring [&::-webkit-details-marker]:hidden">
            <span className="type-heading-m text-ink">{it.q}</span>
            <span
              aria-hidden
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink transition-[background-color,color,rotate] duration-spring ease-spring group-open:rotate-45 group-open:bg-ink group-open:text-ink-inverse"
            >
              <Icon icon={Plus} size={16} />
            </span>
          </summary>
          <p className="max-w-reading pr-10 pb-6 type-body text-ink-muted opacity-0 transition-opacity duration-base ease-calm group-open:opacity-100">{it.a}</p>
        </details>
      ))}
    </div>
  );
}

/** FAQ section: heading column + accordion, with FAQPage JSON-LD from exactly the visible items. */
export function FaqSection({
  items,
  overline = "Fragen",
  title = "Gut zu wissen.",
  aside,
  id = "fragen",
  mobileLimit,
}: {
  items: FaqItem[];
  overline?: string;
  title?: ReactNode;
  aside?: ReactNode;
  id?: string;
  /** below md, show only the first n questions (the aside links to all of them) */
  mobileLimit?: 3 | 4;
}) {
  if (items.length === 0) return null;
  return (
    <div id={id} className="grid gap-10 lg:grid-cols-12 lg:gap-6">
      <div className="flex flex-col gap-4 lg:col-span-4">
        <Overline>{overline}</Overline>
        <h2 className="type-display-l text-ink">{title}</h2>
        {aside ? <div className="pt-2 type-body-s text-ink-muted">{aside}</div> : null}
      </div>
      <FaqList
        items={items}
        className={cn(
          "lg:col-span-7 lg:col-start-6",
          mobileLimit === 3 && "max-md:[&>details:nth-of-type(n+4)]:hidden",
          mobileLimit === 4 && "max-md:[&>details:nth-of-type(n+5)]:hidden",
        )}
      />
      <JsonLd data={faqLd(items)} />
    </div>
  );
}
