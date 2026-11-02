"use client";

import { useRef, type PointerEvent } from "react";
import { LandingArch } from "../primitives/landing-arch";
import { LandingImg, type LandingImgAttrs } from "../primitives/landing-img";
import { Ortszeile } from "../primitives/ortszeile";
import { HERO_FIGURE_ID, PLACES, type PlaceId } from "./places";
import { prefetchPlaces, registerPlaceImages, setPlace, usePlace } from "./place-store";
import { SwapLayer } from "./swap-layer";
import { placeLayerAnimates, useLayerSwap } from "./use-layer-swap";

/**
 * The hero arch, „Fenster“ (spec § 4.1.2, § 4.1.5): stacked place layers `[data-place-layer][data-state]` inside one
 * arch, the Ortszeile under it. The first layer is the LCP image: preloaded, `data-lcp`, painted at opacity 1 (only
 * the motion layer's settle may run on it). A horizontal swipe (> 40 px, < 30°) changes the place; `touch-action:
 * pan-y`, so vertical scrolling is never captured. The photos' attributes come from the server (`images`, built with
 * `getImageProps()` in chapters/01-hero.tsx), so this island loads neither `next/image` nor the image registry.
 */
export function HeroArch({ images, className }: { images: Record<PlaceId, LandingImgAttrs>; className?: string }) {
  registerPlaceImages(images);
  const place = usePlace();
  const places = PLACES;
  const prefetch = prefetchPlaces;
  const { layers, settle, swapped } = useLayerSwap(place.id, placeLayerAnimates);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    prefetch();
  };
  const onUp = (e: PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) <= 40 || Math.abs(dy) > Math.abs(dx) * Math.tan(Math.PI / 6)) return;
    const i = places.findIndex((p) => p.id === place.id);
    const next = places[(i + (dx < 0 ? 1 : -1) + places.length) % places.length];
    setPlace(next.id);
  };

  return (
    <figure id={HERO_FIGURE_ID} className={className}>
      <div className="lp-hero-arch-wrap touch-pan-y" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => (start.current = null)}>
        <LandingArch aspect="fill" tone="massage" className="lp-hero-arch">
          {layers.map((l) => {
            const p = places.find((x) => x.id === l.key)!;
            const lcp = l.n === 0 && p.id === "zuhause";
            return (
              <SwapLayer key={l.n} attr="data-place-layer" state={l.state} n={l.n} onSettle={settle}>
                <LandingImg
                  img={lcp ? images[p.id] : { ...images[p.id], fetchPriority: undefined }}
                  alt={l.state === "leaving" ? "" : p.alt}
                  data-lcp={lcp ? "" : undefined}
                  className="object-cover"
                />
              </SwapLayer>
            );
          })}
        </LandingArch>
      </div>
      <figcaption className="mt-3">
        <Ortszeile key={place.id} text={place.place} data-state={swapped ? "entering" : "current"} />
      </figcaption>
    </figure>
  );
}
