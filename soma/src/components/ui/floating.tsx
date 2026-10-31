import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AuraBackground } from "./aura";
import { surfaceClasses } from "./surface";

/*
 * Product-led hero visuals (design-guideline v2 §9 "Product-led visuals"):
 * real SOMA components as floating, layered cards on an aura. Server
 * components; motion is CSS (scroll-linked parallax, optional slow float).
 */

/**
 * Scroll-linked parallax depth, CSS only (animation-timeline: view()).
 * Positive depth moves against the scroll (feels closer). Off with reduced
 * motion and where unsupported. Keep it small: 8–24 px.
 */
export function Parallax({ depth = 16, className, style, children }: { depth?: number; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={cn("parallax", className)} style={{ ...style, ["--depth" as string]: `${depth}px` }}>
      {children}
    </div>
  );
}

/**
 * The stage for a floating composition: a relative, isolated box with the
 * aura behind. Give it an explicit height (or aspect ratio) so nothing shifts.
 * Decorative by default (aria-hidden + inert): it illustrates the product, the
 * real UI lives elsewhere on the page.
 *
 *   <FloatingStage className="h-[26rem] lg:h-[34rem]">
 *     <FloatingCard className="left-[4%] top-[8%] w-[17rem]" depth={10} tilt={-2}>…</FloatingCard>
 *     <FloatingCard className="right-[2%] top-[38%] w-60" depth={22} glass enter={1}>…</FloatingCard>
 *   </FloatingStage>
 */
export function FloatingStage({
  aura = true,
  placement = "center",
  decorative = true,
  className,
  children,
}: {
  aura?: boolean;
  placement?: "right" | "left" | "top" | "bottom" | "center" | "full";
  decorative?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div aria-hidden={decorative || undefined} inert={decorative || undefined} className={cn("relative isolate", className)}>
      {aura ? <AuraBackground variant="hero" placement={placement} fade="radial" className="inset-x-0 -inset-y-[10%]" /> : null}
      {children}
    </div>
  );
}

/**
 * One floating card. Position it with absolute offsets in `className`.
 * - depth: parallax in px (0 = none)
 * - tilt: resting rotation in degrees (±1–3)
 * - float: very slow 9 s drift (at most two cards per stage)
 * - enter: entrance order (0, 1, 2 …): a transform-only settle, never hides content
 */
export function FloatingCard({
  depth = 0,
  tilt = 0,
  float,
  enter,
  glass,
  elevation = 2,
  radius = "card",
  className,
  cardClassName,
  children,
}: {
  depth?: number;
  tilt?: number;
  float?: boolean;
  enter?: number;
  glass?: boolean;
  elevation?: 1 | 2 | 3;
  radius?: "tile" | "card" | "panel";
  /** positioning and width */
  className?: string;
  /** padding and layout of the card itself */
  cardClassName?: string;
  children: ReactNode;
}) {
  const card = (
    <div
      className={cn(surfaceClasses({ elevation, radius, glass }), "overflow-hidden", enter !== undefined && "animate-float-in", cardClassName)}
      style={{ rotate: tilt ? `${tilt}deg` : undefined, animationDelay: enter ? `${enter * 120}ms` : undefined }}
    >
      {children}
    </div>
  );
  const floated = float ? (
    <div className="ambient animate-float" data-ambient="off" style={{ animationDelay: `${-((depth * 37) % 9)}s` }}>
      {card}
    </div>
  ) : (
    card
  );
  return depth ? (
    <Parallax depth={depth} className={cn("absolute", className)}>
      {floated}
    </Parallax>
  ) : (
    <div className={cn("absolute", className)}>{floated}</div>
  );
}
