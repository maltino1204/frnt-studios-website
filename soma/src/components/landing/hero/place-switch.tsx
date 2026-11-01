"use client";

import { Fragment, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { ArchMark } from "../primitives/arch-mark";
import { usePlace } from "./hero-place-stage";
import { HERO_FIGURE_ID } from "./hero-arch";

/**
 * The place switch (spec § 4.1.5): a radiogroup „Ort“ of three text radios in the eyebrow style, ≥ 44 px tall,
 * roving tabindex, arrows / Home / End (selection follows focus). Selected: ink plus the 14 × 7 arch mark under the
 * label (`data-place-mark`, one per radio; the motion layer may slide the visible one with a FLIP).
 */
export function PlaceSwitch({ className }: { className?: string }) {
  const { place, places, setPlace, prefetch } = usePlace();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (i: number) => {
    const p = places[(i + places.length) % places.length];
    setPlace(p.id);
    refs.current[(i + places.length) % places.length]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const map: Record<string, number> = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: places.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    select(map[e.key]);
  };

  return (
    <div role="radiogroup" aria-label="Ort" onPointerEnter={prefetch} onFocus={prefetch} className={cn("-ml-1 flex flex-wrap items-center", className)}>
      {places.map((p, i) => {
        const selected = p.id === place.id;
        return (
          <Fragment key={p.id}>
            {i > 0 ? (
              <span aria-hidden className="type-eyebrow text-ink-muted">
                ·
              </span>
            ) : null}
            <button
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-controls={HERO_FIGURE_ID}
              tabIndex={selected ? 0 : -1}
              onClick={() => setPlace(p.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "lp-place-radio relative inline-flex min-h-touch items-center rounded-control px-1.5 type-eyebrow transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus",
                selected ? "text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {p.label}
              <ArchMark data-place-mark={selected ? "on" : "off"} className={cn("absolute bottom-[3px] left-[calc(50%-7px)] text-ink", !selected && "invisible")} />
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
