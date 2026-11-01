"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LayerState = "current" | "entering" | "leaving";
export type Layer<K> = { key: K; state: LayerState; n: number };

/**
 * Image layer swaps for the hero place switch and the 03 preview (spec § 4.1.5 markup contract): a new key enters on
 * top (`data-state="entering"`) while the previous one leaves; the motion layer animates `entering`. The swap settles
 * on the layer's `animationend` (or immediately when no animation applies, or after 1 s). Rapid changes never queue:
 * the running transition snaps to its end and the next one starts.
 */
export function useLayerSwap<K>(active: K) {
  const counter = useRef(0);
  const [layers, setLayers] = useState<Layer<K>[]>([{ key: active, state: "current", n: 0 }]);

  useEffect(() => {
    setLayers((prev) => {
      const top = prev[prev.length - 1];
      if (top.key === active) return prev;
      counter.current += 1;
      return [
        { ...top, state: "leaving" },
        { key: active, state: "entering", n: counter.current },
      ];
    });
  }, [active]);

  const settle = useCallback((n: number) => {
    setLayers((prev) => {
      const top = prev[prev.length - 1];
      if (top.n !== n || top.state !== "entering") return prev;
      return [{ ...top, state: "current" }];
    });
  }, []);

  return { layers, settle, swapped: counter.current > 0 };
}
