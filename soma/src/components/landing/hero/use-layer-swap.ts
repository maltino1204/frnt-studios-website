"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LayerState = "current" | "entering" | "leaving";
export type Layer<K> = { key: K; state: LayerState; n: number };

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const tier = () => (typeof document === "undefined" ? "none" : document.documentElement.dataset.motion);

/**
 * Whether a swap animates (`landing-motion.css`, all of it under `prefers-reduced-motion: no-preference`): the hero's
 * place layers rise in the full and lite tiers, the 02 preview only in the full tier.
 */
export const placeLayerAnimates = () => !reducedMotion() && (tier() === "full" || tier() === "lite");
export const previewLayerAnimates = () => !reducedMotion() && tier() === "full";

/**
 * Image layer swaps for the hero place switch and the 02 preview (spec § 4.1.5 markup contract): a new key enters on
 * top (`data-state="entering"`) while the previous one leaves; the motion layer animates `entering`. The swap settles
 * on the layer's `animationend` (or in the next frame when no animation runs after all, or after 1 s). Rapid changes
 * never queue: the running transition snaps to its end and the next one starts.
 *
 * When no swap animation applies (`animates()` false: the tier or reduced motion), the new key replaces the old one
 * directly, with no entering state to settle (audit-4 N4-1: the enter → synchronous settle round trip in a layout
 * effect looped into React #185 in the lite and none tiers). The state updaters are pure: the layer number is taken
 * before the update, so React may run an updater again without changing the result.
 */
export function useLayerSwap<K>(active: K, animates: () => boolean) {
  const counter = useRef(0);
  const shown = useRef(active);
  const [layers, setLayers] = useState<Layer<K>[]>([{ key: active, state: "current", n: 0 }]);

  useEffect(() => {
    if (shown.current === active) return;
    shown.current = active;
    counter.current += 1;
    const n = counter.current;
    const direct = !animates();
    setLayers((prev) => {
      const top = prev[prev.length - 1];
      if (top.key === active) return prev;
      if (direct) return [{ key: active, state: "current", n }];
      return [
        { ...top, state: "leaving" },
        { key: active, state: "entering", n },
      ];
    });
  }, [active, animates]);

  const settle = useCallback((n: number) => {
    setLayers((prev) => {
      const top = prev[prev.length - 1];
      if (top.n !== n || top.state !== "entering") return prev;
      return [{ ...top, state: "current" }];
    });
  }, []);

  return { layers, settle, swapped: layers[layers.length - 1].n > 0 };
}
