"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * 04 step controls for the lite / none layout and the 390 composition (spec § 4.4): three segmented-style anchors
 * (`#schritt-1…3`, so the native snap row still works without JS) that scroll the row and mirror its position
 * (`aria-current="step"`). The list `rowId` sits in a positioned horizontal scroller (its parent). In the full tier the motion layer hides them with the rest of the snap layout.
 */
export function StepButtons({ rowId, steps }: { rowId: string; steps: Array<{ id: string; label: string }> }) {
  const [active, setActive] = useState(0);
  /** the horizontal scroller: the region around the list (`rowId`) */
  const scroller = () => document.getElementById(rowId)?.parentElement ?? null;

  useEffect(() => {
    const row = scroller();
    if (!row || typeof IntersectionObserver === "undefined") return;
    const panels = steps.map((s) => document.getElementById(s.id)).filter((x): x is HTMLElement => !!x);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(panels.indexOf(e.target as HTMLElement));
        }
      },
      { root: row, threshold: 0.6 },
    );
    panels.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, [rowId, steps]);

  return (
    <div className="lp-walk-buttons relative isolate inline-flex w-full max-w-[30rem] rounded-full bg-surface-raised/70 p-[3px] shadow-[inset_0_0_0_1px_var(--color-line-emphasis)] md:w-auto">
      {steps.map((s, i) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-current={i === active ? "step" : undefined}
          onClick={(e) => {
            const row = scroller();
            const panel = document.getElementById(s.id);
            if (!row || !panel) return;
            e.preventDefault();
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            row.scrollTo({ left: panel.offsetLeft, behavior: reduce ? "auto" : "smooth" });
            setActive(i);
          }}
          className={cn(
            "inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 type-label-s whitespace-nowrap max-[359px]:condensed sm:px-4 transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus md:flex-none",
            i === active ? "bg-ink text-ink-inverse" : "text-ink hover:bg-surface-sunken",
          )}
        >
          <span className="num max-[359px]:hidden">{String(i + 1).padStart(2, "0")}</span>
          {s.label}
        </a>
      ))}
    </div>
  );
}
