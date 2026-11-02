/**
 * Landing metadata and server data for conversion (Conversion & Integration; INTEGRATION.md § 5.2, § 6.1).
 * Server-only. Usage in `src/app/(landing)/page.tsx`:
 *
 *   export const revalidate = 3600;
 *   export { generateLandingMetadata as generateMetadata } from "@/components/landing/booking/metadata";
 *   const conv = await loadLandingConversion();   // hero lead, trust rows, FAQ, JSON-LD inputs
 *
 * The loaders are wrapped in React `cache()`, so `generateMetadata` and the page share one query each per render.
 * Use `loadLandingCatalog()` etc. in the page's own `Promise.all` to profit from the same dedupe.
 * No `robots` here: metadata merges shallowly, and the root layout's DEMO_MODE noindex must win.
 */
import "server-only";

import type { Metadata } from "next";
import { cache } from "react";
import { BRAND_NAME, OG_IMAGE } from "@/lib/brand";
import { listCatalog, listCities } from "@/server/services/catalog";
import { getCoverageMatrix, getPriceFloors, getPublicTerms } from "@/server/services/site-ext";
import type { FaqItem } from "@/components/site/discovery-copy";
import { landingFaq, liveCityNames } from "./faq-data";
import { heroLead, heroTrustItems, LANDING_OG_TITLE, LANDING_TITLE, landingDescription, liveCategorySlugs } from "./landing-copy";

export const loadLandingCatalog = cache(() => listCatalog());
export const loadLandingPriceFloors = cache(() => getPriceFloors());
export const loadLandingTerms = cache(() => getPublicTerms());
export const loadLandingCities = cache(() => listCities());
export const loadLandingCoverage = cache(() => getCoverageMatrix());

export type LandingConversionData = {
  /** chapter 01 lead (deck § 01, live categories only) */
  heroLead: string;
  /** chapter 01 trust row */
  heroTrust: string[];
  /** meta description, also Organization.description */
  description: string;
  /** chapter 06: the five questions; render all of them, they feed the FAQPage JSON-LD */
  faq: FaqItem[];
  /** cities with at least one approved Profi (FAQ 2, areaServed) */
  liveCities: string[];
  liveCitySlugs: string[];
};

/** Everything conversion-related the landing renders, from real data; every source fails soft. */
export const loadLandingConversion = cache(async (): Promise<LandingConversionData> => {
  const [catalog, floors, terms, cities, coverage] = await Promise.all([
    loadLandingCatalog().catch(() => null),
    loadLandingPriceFloors().catch(() => []),
    loadLandingTerms().catch(() => null),
    loadLandingCities().catch(() => []),
    loadLandingCoverage().catch(() => []),
  ]);
  const live = liveCategorySlugs(floors);
  const liveCities = liveCityNames(cities, coverage);
  const liveSlugs = new Set(coverage.filter((c) => c.providerCount > 0).map((c) => c.citySlug));
  return {
    heroLead: heroLead(live),
    heroTrust: heroTrustItems(terms?.cancellationPolicy),
    description: landingDescription(live, terms?.cancellationPolicy),
    faq: terms ? landingFaq({ terms, liveCities, activeCategorySlugs: catalog?.map((c) => c.slug) }) : [],
    liveCities,
    liveCitySlugs: cities.filter((c) => liveSlugs.has(c.slug)).map((c) => c.slug),
  };
});

export function buildLandingMetadata(description: string): Metadata {
  return {
    // absolute: the root template "%s · SOMA" would repeat the brand
    title: { absolute: LANDING_TITLE },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      siteName: BRAND_NAME,
      locale: "de_DE",
      title: LANDING_OG_TITLE,
      description,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: LANDING_OG_TITLE, description, images: [{ url: OG_IMAGE.url, alt: OG_IMAGE.alt }] },
  };
}

export async function generateLandingMetadata(): Promise<Metadata> {
  const { description } = await loadLandingConversion();
  return buildLandingMetadata(description);
}
