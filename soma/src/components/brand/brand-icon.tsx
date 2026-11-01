import { MapPin } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { SOMA_ICON_NODES, SomaIcon, type SomaIconName } from "./icons";

/*
 * App helpers on top of the Identity Designer's icon module (`./icons`, a copy of
 * brand/assets/iconography/react/soma-icons.tsx; ICONOGRAPHY.md § 4): the three places and the seven categories,
 * 24 px grid, 1.5 px absolute stroke, currentColor. Decorative unless `title` is given.
 */

export type BrandIconName = SomaIconName;
export type PlaceKind = "home" | "hotel" | "office";

const PLACE: Record<PlaceKind, SomaIconName> = { home: "zuhause", hotel: "hotel", office: "buero" };

export function isBrandIconName(name: string | null | undefined): name is SomaIconName {
  return !!name && name in SOMA_ICON_NODES;
}

/** A custom SOMA icon by name (16 inline, 20 default, 24 navigation). */
export function BrandIcon({ name, size = 20, strokeWidth = 1.5, title, className }: { name: SomaIconName; size?: number; strokeWidth?: number; title?: string; className?: string }) {
  return <SomaIcon name={name} size={size} strokeWidth={strokeWidth} title={title} className={cn("shrink-0", className)} />;
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
