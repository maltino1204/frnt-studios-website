/**
 * Image registry. Every photo has a canonical local path under /public/images.
 * Until `npm run images:fetch` has stored it locally, the app falls back to the
 * remote source URL. If neither loads, components render the designed
 * tone-on-tone fallback panel (docs/art-direction.md §5).
 */
import sources from "../../scripts/images/sources.json";
import local from "./images.local.json";

export type ImageSource = {
  path: string;
  remote: string;
  ratio: string;
  width: number;
  height: number;
  focal: string;
  /** Set by the photo audit (brand/photography/AUDIT.md): the image is retired and served as this replacement. */
  replacedBy?: string;
  /** Portraits: a head-and-shoulders square crop of this image, for avatars and portraits ≤ 96 px (review R7). */
  avatar?: string;
};

const byPath = new Map<string, ImageSource>((sources as ImageSource[]).map((s) => [s.path, s]));
const localSet = new Set<string>(local as string[]);

/** How many `replacedBy` hops are followed (v1 → v2 → v3 → v4 uses 3; room for later photo rounds). */
export const MAX_REPLACEMENT_HOPS = 8;

/**
 * Follows `replacedBy`, so retired images (and seed/DB rows that still point at them) show their replacement.
 * Stops at a missing target, after MAX_REPLACEMENT_HOPS, or on a cycle (never loops).
 */
export function currentImagePath(path: string): string {
  let p = path;
  const seen = new Set([p]);
  for (let i = 0; i < MAX_REPLACEMENT_HOPS; i++) {
    const next = byPath.get(p)?.replacedBy;
    if (!next || !byPath.has(next) || seen.has(next)) break;
    seen.add(next);
    p = next;
  }
  return p;
}

/**
 * The crop for small portraits: follow `replacedBy` to the current image, then use its `avatar` (a head-and-shoulders
 * crop) when the registry has one, else the current image itself. Pure over a registry map, so it is testable.
 */
export function avatarPathIn(registry: ReadonlyMap<string, Pick<ImageSource, "replacedBy" | "avatar">>, path: string): string {
  let p = path;
  for (let i = 0; i < 3; i++) {
    const next = registry.get(p)?.replacedBy;
    if (!next || !registry.has(next)) break;
    p = next;
  }
  return registry.get(p)?.avatar || p;
}

/** Avatar crop path for a portrait (uploads and remote URLs pass through); null without a photo. */
export function avatarImagePath(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/api/media/")) return path;
  return avatarPathIn(byPath, path);
}

/** Loadable URL of the avatar crop (falls back to the portrait itself until a crop is registered). */
export function resolveAvatar(path: string | null | undefined): string | null {
  return resolveImage(avatarImagePath(path));
}

/** Resolve a canonical image path (e.g. "/images/pros/pro-01.jpg") to a loadable URL, or null. */
export function resolveImage(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/api/media/")) return path;
  const p = currentImagePath(path);
  if (localSet.has(p)) return p;
  return byPath.get(p)?.remote ?? (p.startsWith("/") ? p : null);
}

/**
 * Every image in the registry (`scripts/images/sources.json`, served from /public/images) is an AI-generated development
 * asset (brand/photography/PHOTOGRAPHY.md § 0). Uploaded media (/api/media, remote URLs) is not.
 */
export function isAiImage(path: string | null | undefined): boolean {
  if (!path || path.startsWith("http") || path.startsWith("/api/media/")) return false;
  return byPath.has(currentImagePath(path)) || path.startsWith("/images/");
}

/** The product's AI disclosure texts (PHOTOGRAPHY.md § 0, BRAND_GUIDELINES.md § 10.1). */
export const AI_PORTRAIT_LABEL = "Demo-Profil · Foto KI-generiert";
export const AI_IMAGE_LABEL = "Bild KI-generiert";
export const AI_IMAGES_LABEL = "Bilder KI-generiert";

/** Focal point as CSS object-position. */
export function imageFocal(path: string | null | undefined, fallback = "50% 40%"): string {
  if (!path) return fallback;
  return byPath.get(currentImagePath(path))?.focal ?? fallback;
}

export const images = {
  hero: "/images/hero/home.jpg",
  category: (slug: string) => `/images/categories/${slug}.jpg`,
  editorial: {
    arrival: "/images/editorial/arrival.jpg",
    setup: "/images/editorial/setup.jpg",
    after: "/images/editorial/after.jpg",
    hotel: "/images/editorial/hotel.jpg",
    office: "/images/editorial/office.jpg",
    details: "/images/editorial/details.jpg",
    providerCta: "/images/editorial/provider-cta.jpg",
  },
  og: "/images/og-default.jpg",
} as const;

/** Category slugs that have a placeholder tone (bg-tone-*) in tokens.css. */
const TONES = new Set(["massage", "manikuere", "pedikuere", "kosmetik", "make-up", "haare-styling", "brows-lashes"]);
export function toneFor(slug: string | null | undefined): string {
  return slug && TONES.has(slug) ? slug : "massage";
}
