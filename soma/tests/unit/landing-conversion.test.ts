import { afterEach, describe, expect, it } from "vitest";
import type { CancellationPolicyDTO } from "@/server/dto";
import { buildLandingFaq, cancellationAnswer, faqTrustStrip, liveCityNames } from "@/components/landing/booking/faq-data";
import { heroLead, heroTrustItems, joinGerman, landingDescription, liveCategorySlugs } from "@/components/landing/booking/landing-copy";
import { landingJsonLdGraph } from "@/components/landing/booking/landing-json-ld";
import { getBookingDraft, resetBookingDraft, setBookingDraft } from "@/components/landing/booking/booking-draft";

const NBSP = " ";

/** SOMA Standard (scripts/db/lib/base-seed-data.ts): free ≥ 24 h, 50 % from 2 h, 100 % + travel below 2 h. */
const POLICY: CancellationPolicyDTO = {
  tiers: [
    { minHoursBefore: 24, feePercent: 0, travelFeeRetained: false },
    { minHoursBefore: 2, feePercent: 50, travelFeeRetained: false },
    { minHoursBefore: 0, feePercent: 100, travelFeeRetained: true },
  ],
  noShowFeePercent: 100,
  graceMinutes: 15,
  feeBasis: "service_price",
};

const TERMS = {
  cancellationPolicy: POLICY,
  disputeWindowHours: 48,
  customerServiceFeeCents: 0,
  baseRequiredDocuments: [
    { kind: "id_document", label: "Personalausweis oder Reisepass" },
    { kind: "business_registration", label: "Gewerbeanmeldung" },
    { kind: "insurance", label: "Berufs- bzw. Betriebshaftpflichtversicherung" },
  ],
} as Parameters<typeof buildLandingFaq>[0]["terms"];

const ALL_LIVE = liveCategorySlugs(
  ["massage", "manikuere", "pedikuere", "kosmetik", "make-up", "haare-styling", "brows-lashes"].map((categorySlug) => ({ categorySlug, providerCount: 2 })),
);

describe("landing copy (deck § 0.3, § 01): only what is true", () => {
  it("lists the deck's categories when all are live", () => {
    expect(heroLead(ALL_LIVE)).toBe("Geprüfte Profis für Massage, Nägel, Kosmetik, Haare und Make-up kommen zu dir. Du siehst echte freie Termine – mit Endpreis inklusive Anfahrt.");
  });

  it("drops a word whose categories have no approved Profi, and falls back without any", () => {
    const live = liveCategorySlugs([
      { categorySlug: "massage", providerCount: 3 },
      { categorySlug: "haare-styling", providerCount: 0 },
      { categorySlug: "pedikuere", providerCount: 1 },
    ]);
    expect(heroLead(live)).toBe("Geprüfte Profis für Massage und Nägel kommen zu dir. Du siehst echte freie Termine – mit Endpreis inklusive Anfahrt.");
    expect(heroLead(new Set())).toBe("Geprüfte Profis kommen zu dir – mit Endpreis inklusive Anfahrt.");
  });

  it("binds the cancellation window in the trust row and the description, and drops it without a free tier", () => {
    expect(heroTrustItems(POLICY)).toEqual(["Verifizierte Profis", "Endpreis inkl. Anfahrt", `Kostenlos stornierbar bis 24${NBSP}Std. vorher`]);
    expect(landingDescription(ALL_LIVE, POLICY)).toBe(
      `Geprüfte Profis für Massage, Nägel, Kosmetik, Haare und Make-up kommen zu dir. Endpreis inkl. Anfahrt, kostenlos stornierbar bis 24${NBSP}Std. vorher.`,
    );
    const noFree = { ...POLICY, tiers: POLICY.tiers.filter((t) => t.feePercent > 0) };
    expect(heroTrustItems(noFree)).toHaveLength(2);
    expect(landingDescription(ALL_LIVE, noFree)).not.toContain("storn");
    expect(landingDescription(ALL_LIVE, POLICY).length).toBeLessThanOrEqual(160);
  });

  it("joins lists the German way", () => {
    expect(joinGerman([])).toBe("");
    expect(joinGerman(["A"])).toBe("A");
    expect(joinGerman(["A", "B", "C"])).toBe("A, B und C");
  });
});

describe("landing FAQ (deck § 09) with real term bindings", () => {
  it("reproduces the deck's cancellation answer from the SOMA Standard policy", () => {
    expect(cancellationAnswer(POLICY)).toBe(
      `Bis 24${NBSP}Stunden vor dem Termin stornierst du kostenlos, in den ersten 15${NBSP}Minuten nach der Buchung sogar immer. ` +
        `Danach fallen 50${NBSP}% des Behandlungspreises an; die Anfahrt wird nicht berechnet. ` +
        `Weniger als 2${NBSP}Stunden vorher oder wenn du nicht da bist, werden Behandlung und Anfahrt voll berechnet. ` +
        "Offene Anfragen kannst du jederzeit kostenlos zurückziehen. Sagt dein Profi ab, entstehen dir keine Kosten. Die genaue Frist siehst du vor dem Bezahlen – mit Datum und Uhrzeit.",
    );
  });

  it("follows a changed policy instead of repeating the deck's numbers", () => {
    const p: CancellationPolicyDTO = {
      ...POLICY,
      graceMinutes: 0,
      noShowFeePercent: 80,
      tiers: [
        { minHoursBefore: 48, feePercent: 0, travelFeeRetained: false },
        { minHoursBefore: 0, feePercent: 30, travelFeeRetained: true },
      ],
    };
    const a = cancellationAnswer(p);
    expect(a).toContain(`Bis 2${NBSP}Tage vor dem Termin stornierst du kostenlos.`);
    expect(a).toContain(`Danach fallen 30${NBSP}% des Behandlungspreises an; die Anfahrt wird zusätzlich berechnet.`);
    expect(a).toContain(`Wenn du nicht da bist, fallen 80${NBSP}% des Behandlungspreises und die Anfahrt an.`);
    expect(a).not.toMatch(/24|15|50/);
  });

  it("has nine questions with the bound values", () => {
    const faq = buildLandingFaq({ terms: TERMS, liveCities: ["Berlin", "Hamburg", "Frankfurt am Main"] });
    expect(faq).toHaveLength(9);
    expect(faq[1].a).toMatch(/^Aktuell in Berlin, Hamburg und Frankfurt am Main\. /);
    expect(faq[2].a).toContain("prüfen wir Ausweis, Gewerbeanmeldung und Berufshaftpflicht – und je nach Kategorie einen Qualifikationsnachweis, etwa eine Massageausbildung");
    expect(faq[5].a).toContain("Eine Servicegebühr berechnet SOMA nicht.");
    expect(faq[8].a).toContain(`bis 48${NBSP}Stunden nach dem Termin`);
  });

  it("leaves out what is not true: no cities, a service fee, inactive example categories", () => {
    const faq = buildLandingFaq({ terms: { ...TERMS, customerServiceFeeCents: 199 }, liveCities: [], activeCategorySlugs: ["kosmetik"] });
    expect(faq[1].a).not.toContain("Aktuell in");
    expect(faq[5].a).not.toContain("Servicegebühr");
    expect(faq[2].a).not.toContain("etwa");
  });

  it("limits the cities to those with an approved Profi", () => {
    const cities = [
      { slug: "berlin", name: "Berlin" },
      { slug: "koeln", name: "Köln" },
    ];
    expect(liveCityNames(cities, [{ citySlug: "berlin", providerCount: 4 }, { citySlug: "koeln", providerCount: 0 }])).toEqual(["Berlin"]);
  });

  it("binds the guarantee window in the trust strip", () => {
    expect(faqTrustStrip({ disputeWindowHours: 48 })).toContain(`SOMA-Garantie: Problem melden bis 48${NBSP}Std. nach dem Termin`);
    expect(faqTrustStrip({ disputeWindowHours: 0 })).toHaveLength(3);
  });
});

describe("landing JSON-LD", () => {
  const faq = buildLandingFaq({ terms: TERMS, liveCities: ["Berlin"] });
  const ld = landingJsonLdGraph({ description: "D", liveCities: ["Berlin"], faq });
  const graph = ld["@graph"] as Array<Record<string, unknown>>;
  const byType = (t: string) => graph.find((n) => n["@type"] === t);

  it("describes Organization, WebSite, WebPage and the visible FAQ", () => {
    expect(graph.map((n) => n["@type"])).toEqual(["Organization", "WebSite", "WebPage", "FAQPage"]);
    expect((byType("FAQPage")?.mainEntity as unknown[]).length).toBe(faq.length);
  });

  it("claims no search action and no organisation rating", () => {
    expect(JSON.stringify(ld)).not.toContain("SearchAction");
    expect(byType("Organization")).not.toHaveProperty("aggregateRating");
    expect(byType("WebSite")).not.toHaveProperty("potentialAction");
  });

  it("names only the live cities and no placeholder support address", () => {
    expect(byType("Organization")?.areaServed).toEqual([{ "@type": "City", name: "Berlin" }]);
    expect(JSON.stringify(ld)).not.toContain(".example");
  });
});

describe("booking draft store", () => {
  afterEach(() => resetBookingDraft());

  it("records the writer and bumps the version", () => {
    expect(getBookingDraft().version).toBe(0);
    setBookingDraft("hero", { plz: "10115" });
    setBookingDraft("sheet", { plz: "20095", categorySlug: "massage" });
    const s = getBookingDraft();
    expect(s).toMatchObject({ source: "sheet", version: 2, draft: { plz: "20095", categorySlug: "massage" } });
  });
});
