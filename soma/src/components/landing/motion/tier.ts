/**
 * Motion tiers (docs/landing/LANDING_DESIGN_SPEC.md § 8.1):
 * - `none`: prefers-reduced-motion, or automation (navigator.webdriver) without the QA override;
 * - `lite`: narrow (< 1024), coarse pointer, no hover, Save-Data or < 4 GB device memory;
 * - `full`: everything else.
 * `?motion=full|lite|none` always wins (also under webdriver), so QA and the auditor can check each tier.
 */
export type MotionTier = "full" | "lite" | "none";

export const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
export const NARROW_QUERY = "(max-width: 1023px)";
const LITE_QUERY = `${NARROW_QUERY}, (pointer: coarse), (hover: none)`;

type NavigatorHints = Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };

export function tierOverride(): MotionTier | null {
  const q = new URLSearchParams(location.search).get("motion");
  return q === "full" || q === "lite" || q === "none" ? q : null;
}

export function detectTier(): MotionTier {
  const forced = tierOverride();
  if (forced) return forced;
  const nav = navigator as NavigatorHints;
  if (matchMedia(REDUCED_QUERY).matches || nav.webdriver) return "none";
  if (matchMedia(LITE_QUERY).matches || nav.connection?.saveData || (nav.deviceMemory ?? 8) < 4) return "lite";
  return "full";
}
