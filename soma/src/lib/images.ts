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
};

const byPath = new Map<string, ImageSource>((sources as ImageSource[]).map((s) => [s.path, s]));
const localSet = new Set<string>(local as string[]);

/** Resolve a canonical image path (e.g. "/images/pros/pro-01.jpg") to a loadable URL, or null. */
export function resolveImage(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/api/media/")) return path;
  if (localSet.has(path)) return path;
  return byPath.get(path)?.remote ?? (path.startsWith("/") ? path : null);
}

/** Focal point as CSS object-position. */
export function imageFocal(path: string | null | undefined, fallback = "50% 40%"): string {
  if (!path) return fallback;
  return byPath.get(path)?.focal ?? fallback;
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
