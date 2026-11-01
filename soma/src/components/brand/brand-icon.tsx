import { createElement } from "react";
import { MapPin } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { BRAND_ICONS } from "./brand-icons.generated";

/*
 * The ten custom SOMA icons (brand/assets/iconography/ICONOGRAPHY.md § 4): the three places and the seven categories.
 * Same construction as the tuned Lucide set (24 px grid, 1.5 px absolute stroke, round caps, currentColor), so they
 * sit next to <Icon> without a visual seam. Paths come from the masters via scripts/brand/build-icons.cjs.
 * Server-safe (plain SVG). Decorative unless `title` is given.
 */

export type BrandIconName = keyof typeof BRAND_ICONS;
export type PlaceKind = "home" | "hotel" | "office";

const PLACE: Record<PlaceKind, BrandIconName> = { home: "zuhause", hotel: "hotel", office: "buero" };

export function isBrandIconName(name: string | null | undefined): name is BrandIconName {
  return !!name && name in BRAND_ICONS;
}

/** Icon name for a place type ("home" | "hotel" | "office"). */
export function placeIcon(kind: PlaceKind): BrandIconName {
  return PLACE[kind];
}

export function BrandIcon({
  name,
  size = 20,
  strokeWidth = 1.5,
  title,
  className,
}: {
  name: BrandIconName;
  /** 16 inline, 20 default, 24 navigation */
  size?: number;
  /** absolute stroke in px (1.9 for an active nav item) */
  strokeWidth?: number;
  /** accessible name; omit when a visible label is next to it */
  title?: string;
  className?: string;
}) {
  const stroke = Math.round(((strokeWidth * 24) / size) * 1000) / 1000;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={stroke}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={cn("ico shrink-0", className)}
    >
      {BRAND_ICONS[name].map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
}

/** A category icon by slug; renders nothing for an unknown slug (so callers can fall back). */
export function CategoryIcon({ slug, ...props }: { slug: string | null | undefined } & Omit<Parameters<typeof BrandIcon>[0], "name">) {
  return isBrandIconName(slug) ? <BrandIcon name={slug} {...props} /> : null;
}

/** The place icon for an address kind: the custom Zuhause / Hotel / Büro icons, Lucide `MapPin` for any other place. */
export function PlaceIcon({ kind, size = 20, className }: { kind: string; size?: number; className?: string }) {
  if (kind === "home" || kind === "hotel" || kind === "office") return <BrandIcon name={PLACE[kind]} size={size} className={className} />;
  return <Icon icon={MapPin} size={size} className={className} />;
}
