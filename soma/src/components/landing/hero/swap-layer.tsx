"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { LayerState } from "./use-layer-swap";

/**
 * One image layer of a swap (`[data-<attr>][data-state]`). Frontend sets the state; the motion layer's CSS animates
 * `entering`. Settles on its own `animationend`, at once when no animation is running (tier none, reduced motion),
 * or after the 1 s fallback.
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
  useLayoutEffect(() => {
    if (state !== "entering") return;
    const el = ref.current;
    if (!el) return;
    const names = getComputedStyle(el).animationName;
    if (!names || names.split(",").every((x) => x.trim() === "none")) {
      onSettle(n);
      return;
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
