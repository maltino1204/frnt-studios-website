"use client";

import Image from "next/image";
import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Callout, Region, ScreenFile } from "./screens";

type Item = Callout & { file: ScreenFile; region: Region };

/** Screen widths (spec § 4.7): 360 px from 1024, 280 px below. The frame heights follow 360 × 760 and 280 × 606. */
const FRAME = { desktop: { w: 360, h: 760 }, mobile: { w: 280, h: 606 } };

/** Top offset (in the screen's own 390 px coordinates) that brings `region` into the frame, a third from the top. */
function offsetFor(file: ScreenFile, region: Region): number {
  const viewport = (FRAME.desktop.h / FRAME.desktop.w) * file.width; // visible height in capture px
  const want = region.y + region.h / 2 - viewport * 0.4;
  return Math.max(0, Math.min(want, file.height - viewport));
}

/**
 * 07 tabs and the floating screen (spec § 4.7): a tablist (vertical from 1024, snap chips below; roving tabindex,
 * arrows / Home / End, activation on focus) and one tabpanel, the screen without a device frame. The screen shows a
 * real capture of the live demo app, moved to the callout's region (`--screen-y`), with a 1.5 px ink ring around it
 * (`data-screen-ring`). Static positions only: the motion layer adds the crossfade and the move.
 */
export function ScreenTabs({ head, items, caption }: { head: ReactNode; items: Item[]; caption: string }) {
  const uid = useId();
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const cur = items[active] ?? items[0];
  const files = [...new Map(items.map((i) => [i.file.id, i.file])).values()];

  const select = (i: number, focus = true) => {
    const n = (i + items.length) % items.length;
    setActive(n);
    if (focus) refs.current[n]?.focus();
  };
  const onKey = (e: KeyboardEvent, i: number) => {
    const map: Record<string, number> = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: items.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    select(map[e.key]);
  };

  const y = offsetFor(cur.file, cur.region);
  const style = {
    "--screen-y": String(y),
    "--screen-w": String(cur.file.width),
    "--ring-x": String(cur.region.x),
    "--ring-y": String(cur.region.y - y),
    "--ring-w": String(cur.region.w),
    "--ring-h": String(cur.region.h),
  } as CSSProperties;

  return (
    <div data-scene="screens" data-active={cur.id} className="lp-screens">
      <div className="lp-screens-head">{head}</div>
      <div role="tablist" aria-label="Deine Buchung" aria-orientation="vertical" className="lp-screens-tabs">
        {items.map((it, i) => {
          const sel = i === active;
          return (
            <button
              key={it.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={`${uid}-tab-${it.id}`}
              type="button"
              role="tab"
              aria-selected={sel}
              aria-controls={`${uid}-panel`}
              tabIndex={sel ? 0 : -1}
              onClick={() => select(i, false)}
              onFocus={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn("lp-screens-tab", sel && "is-selected")}
            >
              <span className="type-heading-m text-ink">{it.title}</span>
              <span className="lp-screens-tab-line type-body-s text-ink-muted">{it.line}</span>
            </button>
          );
        })}
      </div>
      <p aria-hidden className="lp-screens-active-line type-body-s text-ink-muted">
        {cur.line}
      </p>

      <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${cur.id}`} className="lp-screens-panel">
      <figure className="m-0">
        <div className="lp-screen" style={style}>
          <div className="lp-screen-track">
            {files.map((f) => {
              const on = f.id === cur.file.id;
              return (
                <Image
                  key={f.id}
                  src={f.src}
                  alt={on ? cur.alt : ""}
                  aria-hidden={on ? undefined : true}
                  width={f.width}
                  height={f.height}
                  sizes="(min-width: 1024px) 360px, 280px"
                  data-screen-file={f.id}
                  data-state={on ? "current" : "idle"}
                  className="lp-screen-img"
                />
              );
            })}
          </div>
          <span aria-hidden data-screen-ring="" className="lp-screen-ring" />
        </div>
        <figcaption className="mt-4 text-center type-caption text-ink-muted">{caption}</figcaption>
      </figure>
      </div>
    </div>
  );
}
