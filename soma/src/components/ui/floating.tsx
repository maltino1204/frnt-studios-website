import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { surfaceClasses } from "./surface";

/*
 * Product-led compositions: real SOMA components as layered Paper cards. In the brand nothing is tilted, nothing
 * floats in a loop and nothing sits on an aura (BRAND_GUIDELINES § 5.2, § 8): `tilt`, `float` and the stage's
 * `aura` are kept for API compatibility and ignored. Cards arrive once (rise, 640 ms) and rest.
 */

/**
 * Formerly scroll-linked parallax. The brand's motion is arrival, then rest ("no loop and no parallax",
 * BRAND_GUIDELINES § 5.1), so this is a plain wrapper; `depth` is kept for API compatibility.
 */
export function Parallax({ className, style, children }: { depth?: number; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

/**
 * The stage for a product composition: a relative, isolated box (no aura). Give it an explicit height (or aspect
 * ratio) so nothing shifts.
 * Decorative by default (aria-hidden + inert): it illustrates the product, the
 * real UI lives elsewhere on the page.
 *
 *   <FloatingStage className="h-[26rem] lg:h-[34rem]">
 *     <FloatingCard className="left-[4%] top-[8%] w-[17rem]" enter={0}>…</FloatingCard>
 *     <FloatingCard className="right-[2%] top-[38%] w-60" enter={1}>…</FloatingCard>
 *   </FloatingStage>
 */
export function FloatingStage({
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
      {children}
    </div>
  );
}

/**
 * One layered card. Position it with absolute offsets in `className`.
 * - enter: entrance order (0, 1, 2 …): rises once and rests (120 ms stagger)
 * - depth, tilt, float: ignored (no parallax, no rotation, no loops in the brand)
 */
export function FloatingCard({
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
      style={{ animationDelay: enter ? `${enter * 120}ms` : undefined }}
    >
      {children}
    </div>
  );
  return <div className={cn("absolute", className)}>{card}</div>;
}
