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

/**
 * The same detection as an inline script for the landing layout (performance remediation 2): it writes
 * `html[data-motion]` while the document is still parsing, so the first style pass already has the tier. Written
 * after hydration instead, the attribute restyled the whole page in one task (≈ 70–110 ms at 4× CPU) and the hero
 * photo's settle (`html:not([data-motion="none"])`) jumped in late. The loader keeps the attribute when it agrees.
 */
export const TIER_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,m=window.matchMedia,n=navigator,q=new URLSearchParams(location.search).get("motion"),t;if(q==="full"||q==="lite"||q==="none")t=q;else if(m(${JSON.stringify(REDUCED_QUERY)}).matches||n.webdriver)t="none";else if(m(${JSON.stringify(LITE_QUERY)}).matches||(n.connection&&n.connection.saveData)||(n.deviceMemory||8)<4)t="lite";else t="full";d.setAttribute("data-motion",t)}catch(e){}})()`;
