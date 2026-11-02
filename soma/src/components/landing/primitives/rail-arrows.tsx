"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

/**
 * The arrow buttons of a landing rail (from lg; the kit Rail's look). They never read layout at mount (audit-1 PT-2):
 * the edges are measured when the rail comes into view (IntersectionObserver, after layout) and on scroll.
 */
export function RailArrows({ target, step = 3 }: { target: string; /** cards per click */ step?: number }) {
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = document.getElementById(target);
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    el.addEventListener("scroll", update, { passive: true });
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && update()) : null;
    io?.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      io?.disconnect();
    };
  }, [target]);

  const scroll = (dir: 1 | -1) => {
    const el = document.getElementById(target);
    if (!el) return;
    const item = el.querySelector("li");
    const w = item ? item.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * w * step, behavior: reduce ? "auto" : "smooth" });
  };

  const cls =
    "inline-flex size-touch items-center justify-center rounded-full bg-surface-raised text-ink shadow-raised pressable focus-ring hover:-translate-y-px hover:shadow-float disabled:pointer-events-none disabled:bg-transparent disabled:text-ink-disabled disabled:shadow-none disabled:ring-1 disabled:ring-line";
  return (
    <div className="hidden shrink-0 gap-2 lg:flex">
      <button type="button" aria-label="Zurück" aria-controls={target} disabled={edges.start} onClick={() => scroll(-1)} className={cls}>
        <Icon icon={ArrowLeft} />
      </button>
      <button type="button" aria-label="Weiter" aria-controls={target} disabled={edges.end} onClick={() => scroll(1)} className={cls}>
        <Icon icon={ArrowRight} />
      </button>
    </div>
  );
}
