import { describe, expect, it } from "vitest";
import { generateLandingMetadata, loadLandingConversion } from "@/components/landing/booking/metadata";
import { landingJsonLdGraph } from "@/components/landing/booking/landing-json-ld";
import { PROMISE_WORDS } from "@/components/landing/booking/landing-copy";
import { freeCancellationHours } from "@/components/site/discovery-copy";
import { listCities } from "@/server/services/catalog";
import { getCoverageMatrix, getPriceFloors, getPublicTerms } from "@/server/services/site-ext";

const NBSP = " ";

/**
 * The landing's conversion data from the real services. The shared test database may or may not hold approved Profis
 * (other files approve some), so every expectation is derived from the database itself: nothing may be claimed that
 * the database does not hold.
 */
describe("landing conversion data (INTEGRATION.md § 5, § 6)", () => {
  it("names only categories and cities with an approved Profi, and binds the policy from platform settings", async () => {
    const [conv, floors, coverage, cities, terms] = await Promise.all([loadLandingConversion(), getPriceFloors(), getCoverageMatrix(), listCities(), getPublicTerms()]);

    const live = new Set(floors.filter((f) => f.providerCount > 0).map((f) => f.categorySlug));
    for (const { word, slugs } of PROMISE_WORDS) {
      const claimed = new RegExp(`(für |, | und )${word}( |,)`).test(conv.heroLead);
      expect(claimed, word).toBe(slugs.some((s) => live.has(s)));
    }
    if (!live.size) expect(conv.heroLead).toBe("Geprüfte Profis kommen zu dir – mit Endpreis inklusive Anfahrt.");

    const liveCitySlugs = new Set(coverage.filter((c) => c.providerCount > 0).map((c) => c.citySlug));
    expect(conv.liveCities).toEqual(cities.filter((c) => liveCitySlugs.has(c.slug)).map((c) => c.name));
    if (conv.liveCities.length) expect(conv.faq[1].a).toContain(`Aktuell in `);
    else expect(conv.faq[1].a).not.toContain("Aktuell in");

    const free = freeCancellationHours(terms.cancellationPolicy);
    expect(conv.faq).toHaveLength(9);
    if (free) {
      expect(conv.description).toContain(`kostenlos stornierbar bis ${free}${NBSP}Std. vorher`);
      expect(conv.heroTrust).toContain(`Kostenlos stornierbar bis ${free}${NBSP}Std. vorher`);
    }
    expect(conv.faq[8].a).toContain(`bis ${terms.disputeWindowHours}${NBSP}Stunden nach dem Termin`);
    expect(conv.faqTrust).toContain(`SOMA-Garantie: Problem melden bis ${terms.disputeWindowHours}${NBSP}Std. nach dem Termin`);
  });

  it("produces the landing metadata without overriding robots", async () => {
    const meta = await generateLandingMetadata();
    expect(meta.title).toEqual({ absolute: "SOMA – Beauty & Wellness bei dir zu Hause, im Hotel und im Büro" });
    expect(meta.alternates?.canonical).toBe("/");
    expect(meta).not.toHaveProperty("robots");
    expect(JSON.stringify(meta.openGraph)).toContain("/brand/og-default.jpg");
  });

  it("lists exactly the live cities as areaServed", async () => {
    const conv = await loadLandingConversion();
    const graph = landingJsonLdGraph({ description: conv.description, liveCities: conv.liveCities, faq: conv.faq })["@graph"];
    const served = (graph[0].areaServed as Array<{ name: string }> | undefined)?.map((c) => c.name) ?? [];
    expect(served).toEqual(conv.liveCities);
  });
});
