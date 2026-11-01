import { describe, expect, it } from "vitest";
import { generateLandingMetadata, loadLandingConversion } from "@/components/landing/booking/metadata";
import { landingJsonLdGraph } from "@/components/landing/booking/landing-json-ld";

const NBSP = " ";

/**
 * The landing's conversion data from the real services (base seed: categories, cities and platform settings, no
 * approved Profis). Nothing may be claimed that the database does not hold.
 */
describe("landing conversion data (INTEGRATION.md § 5, § 6)", () => {
  it("binds the policy from platform settings and claims no category or city without an approved Profi", async () => {
    const conv = await loadLandingConversion();
    expect(conv.heroLead).toBe("Geprüfte Profis kommen zu dir – mit Endpreis inklusive Anfahrt.");
    expect(conv.description).toBe(`Geprüfte Profis kommen zu dir. Endpreis inkl. Anfahrt, kostenlos stornierbar bis 24${NBSP}Std. vorher.`);
    expect(conv.heroTrust).toEqual(["Verifizierte Profis", "Endpreis inkl. Anfahrt", `Kostenlos stornierbar bis 24${NBSP}Std. vorher`]);
    expect(conv.liveCities).toEqual([]);
    expect(conv.faq).toHaveLength(9);
    expect(conv.faq[1].a).not.toContain("Aktuell in");
    expect(conv.faq[4].a).toContain(`Bis 24${NBSP}Stunden vor dem Termin stornierst du kostenlos, in den ersten 15${NBSP}Minuten nach der Buchung sogar immer.`);
    expect(conv.faq[8].a).toContain(`bis 48${NBSP}Stunden nach dem Termin`);
    expect(conv.faqTrust).toContain(`SOMA-Garantie: Problem melden bis 48${NBSP}Std. nach dem Termin`);
  });

  it("produces the landing metadata without overriding robots", async () => {
    const meta = await generateLandingMetadata();
    expect(meta.title).toEqual({ absolute: "SOMA – Beauty & Wellness bei dir zu Hause, im Hotel und im Büro" });
    expect(meta.alternates?.canonical).toBe("/");
    expect(meta).not.toHaveProperty("robots");
    expect(JSON.stringify(meta.openGraph)).toContain("/brand/og-default.jpg");
  });

  it("emits no areaServed while no city has an approved Profi", async () => {
    const conv = await loadLandingConversion();
    const graph = landingJsonLdGraph({ description: conv.description, liveCities: conv.liveCities, faq: conv.faq })["@graph"];
    expect(graph[0]).not.toHaveProperty("areaServed");
  });
});
