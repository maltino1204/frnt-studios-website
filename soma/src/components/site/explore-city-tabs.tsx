"use client";

import { Check } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { chipClasses } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { usePersonalCity } from "./explore-personal";

/**
 * „Beliebt in <Stadt>“: a small city switch over server-rendered panels (one per city that meets the thresholds).
 * Tabs with roving focus and arrow keys; the hidden panels stay in the HTML, so switching needs no request. A
 * signed-in customer's default-address city is preselected after hydration until they pick one themselves; every
 * panel is one row of cards on desktop and one rail on mobile, so switching never changes the section's height.
 */
export function ExploreCityTabs({
  cities,
  defaultSlug,
  headingId,
  lead,
}: {
  cities: Array<{ slug: string; name: string; panel: ReactNode }>;
  defaultSlug: string;
  headingId: string;
  lead: ReactNode;
}) {
  const base = useId();
  const personal = usePersonalCity();
  const [picked, setPicked] = useState<string | null>(null);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const available = (slug: string | null) => !!slug && cities.some((c) => c.slug === slug);
  // A city the user picked wins; then the customer's own city (once „Für dich“ has loaded); then the default.
  const current = picked ?? (available(personal) ? personal : null) ?? (available(defaultSlug) ? defaultSlug : cities[0]?.slug);
  const active = cities.find((c) => c.slug === current) ?? cities[0];

  if (!active) return null;
  const idx = cities.indexOf(active);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const to = e.key === "Home" ? 0 : e.key === "End" ? cities.length - 1 : step ? (idx + step + cities.length) % cities.length : -1;
    if (to < 0) return;
    e.preventDefault();
    setPicked(cities[to].slug);
    tabs.current[to]?.focus();
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-5">
        <div className="flex max-w-reading flex-col gap-2.5">
          <p className="type-eyebrow text-ink-muted">Beliebt</p>
          <h2 id={headingId} className="type-heading-l text-ink">{`Beliebt in ${active.name}`}</h2>
          <p className="type-body-s text-pretty text-ink-muted">{lead}</p>
        </div>
        {cities.length > 1 ? (
          <div role="tablist" aria-label="Stadt wählen" className="-mx-(--space-gutter) flex gap-2 overflow-x-auto px-(--space-gutter) py-1.5 scrollbar-none md:mx-0 md:flex-wrap md:px-0">
            {cities.map((c, i) => {
              const selected = c.slug === active.slug;
              return (
                <button
                  key={c.slug}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${base}-tab-${c.slug}`}
                  aria-selected={selected}
                  aria-controls={`${base}-panel-${c.slug}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setPicked(c.slug)}
                  onKeyDown={onKey}
                  className={chipClasses(selected)}
                >
                  {selected ? <Icon icon={Check} size={16} className="-ml-0.5" /> : null}
                  {c.name}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {cities.map((c) => (
        <div
          key={c.slug}
          id={`${base}-panel-${c.slug}`}
          role={cities.length > 1 ? "tabpanel" : undefined}
          aria-labelledby={cities.length > 1 ? `${base}-tab-${c.slug}` : headingId}
          hidden={c.slug !== active.slug}
        >
          {c.panel}
        </div>
      ))}
    </div>
  );
}
