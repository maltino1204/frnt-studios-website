import type { ComponentProps, ElementType } from "react";
import { cn } from "@/lib/cn";

/*
 * Surfaces (design-guideline v2 §7 "Elevation" and "Glass").
 * Level 0 sits in the page (sunken), 1 rests (cards), 2 floats (hover,
 * popovers, hero cards), 3 overlays (dialogs). Each level carries its own
 * hairline, so surfaces never need a border.
 */

export type Elevation = 0 | 1 | 2 | 3;
export type SurfaceRadius = "tile" | "card" | "panel";

const ELEVATION: Record<Elevation, string> = {
  0: "bg-surface-sunken",
  1: "bg-surface-raised shadow-raised",
  2: "bg-surface-raised shadow-float",
  3: "bg-surface-raised shadow-overlay",
};
const GLASS: Record<Elevation, string> = {
  0: "glass glass-edge",
  1: "glass glass-edge shadow-raised",
  2: "glass-strong glass-edge shadow-float",
  3: "glass-strong glass-edge shadow-overlay",
};
const RADIUS: Record<SurfaceRadius, string> = {
  tile: "rounded-tile",
  card: "rounded-card",
  panel: "rounded-panel",
};

export type SurfaceOptions = {
  elevation?: Elevation;
  radius?: SurfaceRadius;
  /** translucent white + blur; for layers over content or aura */
  glass?: boolean;
  /** hover lift (level 1 → 2), press scale and focus glow; use on whole-card links */
  interactive?: boolean;
  className?: string;
};

export function surfaceClasses({ elevation = 1, radius = "card", glass, interactive, className }: SurfaceOptions = {}) {
  return cn(glass ? GLASS[elevation] : ELEVATION[elevation], RADIUS[radius], interactive && "lift focus-ring", className);
}

/**
 * A card-like surface. Polymorphic: `as="article"`, `as="li"`, `as={Link}`.
 *
 *   <Surface className="p-5">…</Surface>
 *   <Surface as={Link} href="/profis/anna" interactive className="p-4">…</Surface>
 */
export function Surface<T extends ElementType = "div">({
  as,
  elevation,
  radius,
  glass,
  interactive,
  className,
  ...props
}: SurfaceOptions & { as?: T } & Omit<ComponentProps<T>, "as" | keyof SurfaceOptions>) {
  const Tag = (as ?? "div") as ElementType;
  return <Tag className={surfaceClasses({ elevation, radius, glass, interactive, className })} {...props} />;
}

/** Glass panel: level 2 glass by default (sticky bars, floating hero cards, overlays on aura). */
export function GlassPanel<T extends ElementType = "div">({
  elevation = 2,
  ...props
}: SurfaceOptions & { as?: T } & Omit<ComponentProps<T>, "as" | keyof SurfaceOptions>) {
  const SurfaceAny = Surface as (p: Record<string, unknown>) => ReturnType<typeof Surface>;
  return <SurfaceAny glass elevation={elevation} {...props} />;
}
