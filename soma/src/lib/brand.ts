/**
 * Brand constants. SOMA is a working title — renaming means changing this file,
 * the wordmark SVG (public/brand + src/components/brand/logo.tsx) and the
 * manifest. See docs/design-guideline.md §2 "Renaming".
 */
export const BRAND_NAME = "SOMA";
/** Primary tagline (brand/BRAND_STRATEGY.md § 8): always English, never translated; mark it lang="en". */
export const BRAND_TAGLINE = "Your body. Your place.";
/** English descriptor for brand lockups only. */
export const BRAND_DESCRIPTOR_EN = "Beauty & Wellness, wherever you are.";
/** German product descriptor: <title> suffix, meta, PWA, footer. */
export const BRAND_DESCRIPTOR = "Beauty & Wellness. Bei dir.";
/** German signature line: "how it works", campaigns, provider-neutral explanations. */
export const BRAND_SIGNATURE = "Du bleibst. Dein Profi kommt.";
/** Supporting line (BRAND_STRATEGY § 8.1): hero lead, meta description. */
export const BRAND_PROMISE = "Geprüfte Profis für Massage, Nägel, Kosmetik, Haare und Make-up kommen zu dir – nach Hause, ins Hotel oder ins Büro.";
export const SITE_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "http://localhost:3000";
/** Support address shown in the footer and account texts; set NEXT_PUBLIC_SUPPORT_EMAIL (check:launch blocks the placeholder). */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hallo@soma.example";
export const DEMO_MODE = process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
