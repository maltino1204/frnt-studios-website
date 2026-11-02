"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SwapLayer } from "../hero/swap-layer";
import { previewLayerAnimates, useLayerSwap } from "../hero/use-layer-swap";
import { LandingArch } from "../primitives/landing-arch";
import { IslandBoundary } from "../primitives/island-boundary";
import { LandingImg, type LandingImgAttrs } from "../primitives/landing-img";
import { IndexRow, StaticIndex } from "./index-row";
import type { CategoryItem } from "./types";
/** Intent delay, so rows crossed by the pointer do not flicker (spec § 4.3). */
const INTENT_MS = 80;

/**
 * 02 on desktop with a fine pointer (spec § 4.3): the editorial index (one link per row, sans list titles) and a
 * sticky preview arch that mirrors the row under the pointer or focus (keyboard parity). The preview is
 * `aria-hidden`; its image layers swap like the hero (`[data-preview-layer][data-state]`), the caption is keyed
 * (`data-preview-caption`, `data-state="entering"` after a swap). The preview photos' attributes come from the server
 * (`previews`, `getImageProps()` in chapters/02-behandlungen.tsx), so this island loads no `next/image`.
 */
export function IndexList({ items, previews }: { items: CategoryItem[]; previews: Record<string, LandingImgAttrs> }) {
  const [active, setActive] = useState(items[0]?.slug ?? "");
  const { layers, settle, swapped } = useLayerSwap(active, previewLayerAnimates);
  const timer = useRef(0);
  const fetched = useRef(false);

  const intend = useCallback((slug: string) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setActive(slug), INTENT_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const prefetch = () => {
    if (fetched.current) return;
    fetched.current = true;
    for (const it of items.slice(1)) {
      const attrs = previews[it.slug];
      if (!attrs) continue;
      const img = new window.Image();
      if (attrs.sizes) img.sizes = attrs.sizes;
      if (attrs.srcSet) img.srcset = attrs.srcSet;
      img.src = attrs.src;
    }
  };

  const current = items.find((i) => i.slug === active) ?? items[0];
  if (!current) return null;

  return (
    <div data-scene="index-preview" data-active={active} className="lp-cat-index">
      <ol className="lp-cat-list border-t border-line" onPointerEnter={prefetch} onFocus={prefetch}>
        {items.map((it, i) => (
          <IndexRow key={it.slug} item={it} i={i} onIntent={intend} />
        ))}
      </ol>

      <div aria-hidden className="lp-cat-preview">
        <LandingArch tone={current.slug} reveal="arch">
          {layers.map((l) => {
            const it = items.find((x) => x.slug === l.key) ?? current;
            return (
              <SwapLayer key={l.n} attr="data-preview-layer" state={l.state} n={l.n} onSettle={settle}>
                {previews[it.slug] ? <LandingImg img={previews[it.slug]} alt="" className="object-cover" /> : null}
              </SwapLayer>
            );
          })}
        </LandingArch>
        <div key={current.slug} data-preview-caption="" data-state={swapped ? "entering" : "current"} className="mt-4 flex flex-col gap-1.5">
          <p className="type-heading-m text-ink">{current.name}</p>
          {current.services.length ? <p className="type-body-s text-ink-muted">{current.services.join(" · ")}</p> : null}
          {current.price ? (
            <p className="type-label-s text-ink num">
              {current.price} <span className="type-caption text-ink-muted">· zzgl. Anfahrt</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * The index island inside its error boundary (audit-4 R4-1): if it fails, the static rows (links, no preview) take
 * its place. Built here, on the client, from the same `items`, so the page's payload carries them once.
 */
export function IndexListIsland(props: { items: CategoryItem[]; previews: Record<string, LandingImgAttrs> }) {
  return (
    <IslandBoundary name="02 index" fallback={<StaticIndex items={props.items} />}>
      <IndexList {...props} />
    </IslandBoundary>
  );
}
