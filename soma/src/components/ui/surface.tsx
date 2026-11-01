import type { ComponentProps, ElementType } from "react";
import { cn } from "@/lib/cn";

/*
 * Surfaces (brand/BRAND_GUIDELINES.md § 9.2 "Elevation"). Level 0 sits in the page (Linen), 1 rests (Paper cards,
 * `raised`), 2 floats (hover, popovers), 3 overlays (dialogs). Each level carries its own warm hairline, so surfaces
 * never need a border, and no level glows. Glass is reserved for the sticky header, bottom bars and sheets: the
 * `glass` option on a card now renders the same solid Paper surface.
 */

export type Elevation = 0 | 1 | 2 | 3;
export type SurfaceRadius = "tile" | "card" | "panel";

const ELEVATION: Record<Elevation, string> = {
  0: "bg-surface-sunken",
  1: "bg-surface-raised shadow-raised",
  2: "bg-surface-raised shadow-float",
  3: "bg-surface-raised shadow-overlay",
};
const GLASS: Record<Elevation, string> = ELEVATION;
const RADIUS: Record<SurfaceRadius, string> = {
  tile: "rounded-tile",
  card: "rounded-card",
  panel: "rounded-panel",
};

export type SurfaceOptions = {
  elevation?: Elevation;
  radius?: SurfaceRadius;
  /** @deprecated cards are solid Paper in the brand; kept for API compatibility */
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

/** Formerly a glass panel; now a level-2 Paper surface (the brand keeps glass for the header and sheets only). */
export function GlassPanel<T extends ElementType = "div">({
  elevation = 2,
  ...props
}: SurfaceOptions & { as?: T } & Omit<ComponentProps<T>, "as" | keyof SurfaceOptions>) {
  const SurfaceAny = Surface as (p: Record<string, unknown>) => ReturnType<typeof Surface>;
  return <SurfaceAny glass elevation={elevation} {...props} />;
}
