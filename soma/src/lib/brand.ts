/**
 * Brand constants. SOMA is a working title — renaming means changing this file,
 * the wordmark SVG (public/brand + src/components/brand/logo.tsx) and the
 * manifest. See docs/design-guideline.md §2 "Renaming".
 */
export const BRAND_NAME = "SOMA";
export const BRAND_TAGLINE = "Your wellness. Your place.";
export const BRAND_PROMISE = "Professionelle Beauty- und Wellness-Behandlungen – bei Ihnen zu Hause, im Hotel oder im Büro.";
export const SITE_URL = process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SUPPORT_EMAIL = "hallo@soma.example";
export const DEMO_MODE = process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
