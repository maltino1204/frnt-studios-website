import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { auraBackground, auraBlobs, auraColor, auraPalette } from "@/lib/aura";
import { Ambient } from "./motion";

/*
 * The SOMA aura (design-guideline v2 §4 "Aura" and §9 "Imagery").
 * Server components: no client JS. Ambient drift is pure CSS and is paused
 * offscreen (the <Ambient> gate, hydration-safe) and in hidden tabs
 * (html[data-hidden], set by <MotionRoot>).
 */

/**
 * Generative artwork for a seed (slug, name, id): layered radial gradients in
 * category hues plus fine film grain. Deterministic, so the same profile always
 * gets the same art. Decorative (aria-hidden); render the real label as text.
 * Fills its positioned parent (absolute inset-0).
 */
export function AuraArt({
  seed,
  tone,
  animate,
  grain = true,
  className,
  style,
  children,
}: {
  seed: string;
  /** category slug (massage, kosmetik, …) or "nacht"; omit for a person palette from the seed */
  tone?: string | null;
  /** slow ambient drift (use for one hero-sized artwork per view, not for lists) */
  animate?: boolean;
  grain?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const { backgroundColor, backgroundImage, base } = auraBackground(seed, tone);
  if (!animate) {
    return (
      <div aria-hidden className={cn("absolute inset-0 overflow-hidden", grain && "grain", className)} style={{ backgroundColor, backgroundImage, ...style }}>
        {children}
      </div>
    );
  }
  const palette = auraPalette(tone, seed);
  const blobs = auraBlobs(seed, palette);
  return (
    <Ambient
      aria-hidden
      className={cn("absolute inset-0 overflow-hidden", grain && "grain", className)}
      style={{ backgroundColor, backgroundImage: base, ...style }}
    >
      {blobs.map((b, i) => (
        <span
          key={i}
          className={cn("ambient absolute rounded-full", i % 2 ? "animate-aura-drift-2" : "animate-aura-drift")}
          style={{
            left: `${b.x - b.w / 2}%`,
            top: `${b.y - b.h / 2}%`,
            width: `${b.w}%`,
            height: `${b.h}%`,
            background: `radial-gradient(closest-side, ${auraColor(b.color, b.opacity)}, ${auraColor(b.color, b.opacity * 0.35)} 55%, transparent)`,
            animationDelay: `${-i * 7}s`,
          }}
        />
      ))}
      {children}
    </Ambient>
  );
}

type Placement = "right" | "left" | "top" | "bottom" | "center" | "full";
type Variant = "hero" | "section" | "subtle" | "night";

/* Blob layout per placement: [left%, top%, size%, colour, alpha-scale]. */
const LAYOUTS: Record<Placement, Array<[number, number, number, number]>> = {
  right: [[52, -18, 70, 0], [70, 18, 60, 1], [40, 40, 62, 2], [78, 58, 46, 3]],
  left: [[-22, -14, 70, 0], [-6, 22, 58, 1], [20, 44, 60, 2], [-12, 60, 46, 3]],
  top: [[-10, -40, 70, 0], [30, -34, 62, 1], [60, -30, 64, 2], [10, -20, 50, 3]],
  bottom: [[-12, 50, 70, 0], [28, 58, 60, 1], [58, 46, 66, 2], [80, 62, 44, 3]],
  center: [[8, -8, 64, 0], [36, 10, 56, 1], [22, 34, 60, 2], [54, 30, 46, 3]],
  full: [[-12, -30, 54, 0], [52, -26, 46, 1], [62, 44, 50, 2], [-6, 50, 42, 3]],
};

/* Peak alpha per aura stop and variant (blue, violet, peach, apricot). Tuned so
   muted text stays ≥ 4.5:1 on "subtle" and "section"; on "hero" put muted text
   away from the blue/violet peaks or on a surface (see guideline §4 table). */
const INTENSITY: Record<Variant, [number, number, number, number]> = {
  hero: [0.3, 0.28, 0.42, 0.5],
  section: [0.14, 0.16, 0.3, 0.4],
  subtle: [0.1, 0.12, 0.22, 0.3],
  night: [0.5, 0.42, 0.3, 0.2],
};

const STOPS = ["#5466ff", "#9f8bff", "#ffa894", "#ffd3b8"];

/**
 * Decorative aura wash behind a section or hero. Place inside a `relative`
 * (and ideally `isolate`) container; it sits at z-index -1, never captures
 * pointer events and never widens the page (overflow clip).
 *
 *   <section className="relative isolate overflow-clip">
 *     <AuraBackground placement="right" />
 *     …
 *   </section>
 */
export function AuraBackground({
  variant = "hero",
  placement = "right",
  animate = true,
  grain = true,
  fade = "bottom",
  className,
}: {
  variant?: Variant;
  placement?: Placement;
  /** slow drift and breathe (20–40 s loops), paused offscreen and with reduced motion */
  animate?: boolean;
  grain?: boolean;
  /** dissolve the wash into the page: at an edge, radially (floating stages) or not at all (inside a clipped panel) */
  fade?: "bottom" | "top" | "both" | "radial" | "none";
  className?: string;
}) {
  const alphas = INTENSITY[variant];
  const mask =
    fade === "bottom"
      ? "linear-gradient(to bottom, #000 55%, transparent)"
      : fade === "top"
        ? "linear-gradient(to top, #000 55%, transparent)"
        : fade === "both"
          ? "linear-gradient(to bottom, transparent, #000 22%, #000 70%, transparent)"
          : fade === "radial"
            ? "radial-gradient(closest-side, #000 55%, transparent)"
            : undefined;
  const Root = animate ? Ambient : "div";
  return (
    <Root
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        variant === "night" && "bg-night",
        grain && "grain",
        className,
      )}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
    >
      {LAYOUTS[placement].map(([left, top, size, stop], i) => (
        <span
          key={i}
          className={cn(
            "absolute aspect-square rounded-full",
            animate && "ambient",
            animate && (i === 1 ? "animate-aura-breathe" : i % 2 ? "animate-aura-drift-2" : "animate-aura-drift"),
          )}
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${size}%`,
            minWidth: variant === "hero" || variant === "night" ? "22rem" : "14rem",
            background: `radial-gradient(closest-side, ${auraColor(STOPS[stop], alphas[stop])}, ${auraColor(STOPS[stop], alphas[stop] * 0.4)} 50%, transparent)`,
            animationDelay: `${-i * 9}s`,
          }}
        />
      ))}
    </Root>
  );
}

/** Thin aura-gradient bar: the v2 roof line (Dachlinie) for overlines and "where you are". */
export function AuraLine({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block h-0.5 w-6 rounded-full bg-aura", className)} />;
}
