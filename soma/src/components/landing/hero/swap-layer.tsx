"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { LayerState } from "./use-layer-swap";

/**
 * One image layer of a swap (`[data-<attr>][data-state]`). Frontend sets the state; the motion layer's CSS animates
 * `entering`. Settles on its own `animationend`, in the next frame when no animation is running after all, or after
 * the 1 s fallback. Never synchronously from an effect (audit-4 N4-1); without a swap animation `useLayerSwap` does
 * not enter at all.
 */
export function SwapLayer({
  attr,
  state,
  n,
  onSettle,
  className,
  children,
}: {
  attr: "data-place-layer" | "data-preview-layer";
  state: LayerState;
  n: number;
  onSettle: (n: number) => void;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state !== "entering") return;
    const el = ref.current;
    if (!el) return;
    const names = getComputedStyle(el).animationName;
    if (!names || names.split(",").every((x) => x.trim() === "none")) {
      const f = requestAnimationFrame(() => onSettle(n));
      return () => cancelAnimationFrame(f);
    }
    const t = window.setTimeout(() => onSettle(n), 1000);
    return () => window.clearTimeout(t);
  }, [state, n, onSettle]);
  const attrs = { [attr]: "" } as Record<string, string>;
  return (
    <div
      ref={ref}
      {...attrs}
      data-state={state}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && state === "entering") onSettle(n);
      }}
      className={cn("absolute inset-0", className)}
      aria-hidden={state === "leaving" ? true : undefined}
    >
      {children}
    </div>
  );
}
