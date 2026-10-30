import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Overline } from "@/components/ui/layout";
import { cn } from "@/lib/cn";
import type { FaqItem } from "./discovery-copy";
import { faqLd, JsonLd } from "./discovery-json-ld";

/** Native <details> accordion with hairlines. The plus turns into a cross when open (240ms). */
export function FaqList({ items, className }: { items: FaqItem[]; className?: string }) {
  return (
    <div className={cn("border-t border-line", className)}>
      {items.map((it) => (
        <details key={it.q} className="group border-b border-line">
          <summary className="flex min-h-touch cursor-pointer list-none items-start justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
            <span className="type-heading-m text-ink">{it.q}</span>
            <Icon
              icon={Plus}
              className="mt-0.5 shrink-0 text-ink-muted transition-transform duration-base ease-standard group-open:rotate-45"
            />
          </summary>
          <p className="max-w-reading pb-6 type-body text-ink-muted">{it.a}</p>
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
}: {
  items: FaqItem[];
  overline?: string;
  title?: ReactNode;
  aside?: ReactNode;
  id?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div id={id} className="grid gap-10 lg:grid-cols-12 lg:gap-6">
      <div className="flex flex-col gap-4 lg:col-span-4">
        <Overline>{overline}</Overline>
        <h2 className="type-display-l text-ink">{title}</h2>
        {aside ? <div className="pt-2 type-body-s text-ink-muted">{aside}</div> : null}
      </div>
      <FaqList items={items} className="lg:col-span-7 lg:col-start-6" />
      <JsonLd data={faqLd(items)} />
    </div>
  );
}
