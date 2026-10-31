"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/**
 * Horizontal snap rail (design-guideline §6 "Category entry"): 2.3 items on
 * mobile, `perView` items from lg, bleeding to the right viewport edge.
 * Manual only: arrow buttons from lg, never auto-advancing.
 */
export function Rail({
  children,
  label,
  header,
  perView = 4,
  className,
}: {
  children: ReactNode;
  label: string;
  /** section heading; the lg arrow buttons sit to its right */
  header?: ReactNode;
  perView?: 3 | 4 | 5;
  className?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const item = el.querySelector("li");
    const step = item ? item.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step * Math.max(1, perView - 1), behavior: reduce ? "auto" : "smooth" });
  };

  const width = {
    3: "lg:w-[calc((100%-2*1.5rem)/3)]",
    4: "lg:w-[calc((100%-3*1.5rem)/4)]",
    5: "lg:w-[calc((100%-4*1.5rem)/5)]",
  }[perView];

  const count = Children.count(children);
  const scrollable = count > perView;

  return (
    <div className={className}>
      {header || scrollable ? (
        <div className="mb-8 flex items-end justify-between gap-6 lg:mb-10">
          <div className="min-w-0 flex-1">{header}</div>
          {scrollable ? (
            <div className="hidden shrink-0 gap-2 lg:flex">
              <RailButton label="Zurück" disabled={edges.start} onClick={() => scroll(-1)} icon={ArrowLeft} />
              <RailButton label="Weiter" disabled={edges.end} onClick={() => scroll(1)} icon={ArrowRight} />
            </div>
          ) : null}
        </div>
      ) : null}
      <ul
        ref={ref}
        aria-label={label}
        className={cn(
          // Vertical padding gives the cards' lift and float shadow room inside the scroller (overflow clips both axes).
          "-mx-(--space-gutter) -my-4 flex snap-x snap-mandatory scroll-px-(--space-gutter) gap-3 overflow-x-auto px-(--space-gutter) pt-4 pb-10 scrollbar-none md:gap-5 lg:gap-6",
          // From lg the rail runs to the right viewport edge, aligned left with the container.
          "lg:mr-[calc((100vw-min(100vw,var(--container-page)))/-2-var(--space-gutter))] lg:pr-[calc((100vw-min(100vw,var(--container-page)))/2+var(--space-gutter))]",
        )}
      >
        {Children.map(children, (child) => (
          <li className={cn("w-[calc((100%-2*0.75rem)/2.15)] shrink-0 snap-start md:w-[calc((100%-2*1.25rem)/3.3)]", width)}>{child}</li>
        ))}
      </ul>
    </div>
  );
}

function RailButton({ label, disabled, onClick, icon }: { label: string; disabled: boolean; onClick: () => void; icon: typeof ArrowLeft }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-touch items-center justify-center rounded-full bg-surface-raised text-ink shadow-raised pressable focus-ring hover:-translate-y-px hover:shadow-float disabled:pointer-events-none disabled:bg-transparent disabled:text-ink-disabled disabled:shadow-none disabled:ring-1 disabled:ring-line"
    >
      <Icon icon={icon} />
    </button>
  );
}
