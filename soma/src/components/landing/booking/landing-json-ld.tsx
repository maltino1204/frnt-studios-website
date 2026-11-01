/**
 * Landing structured data (Conversion & Integration; INTEGRATION.md § 6.2). Server component, render once in page.tsx:
 *
 *   const conv = await loadLandingConversion();
 *   <LandingJsonLd description={conv.description} liveCities={conv.liveCities} faq={conv.faq} />
 *
 * One graph: Organization, WebSite, WebPage and FAQPage (exactly the visible chapter-09 questions).
 * - No `SearchAction`: /suche takes no free-text query (only plz/kategorie/leistung/…), is noindex and robots-disallowed,
 *   and Google retired the sitelinks search box in 2024. Describing a search the site does not have is not added.
 * - No `aggregateRating` on the Organization: reviews rate Profis, not SOMA (self-serving ratings are not eligible).
 */
import { absoluteUrl, JsonLd } from "@/components/site/discovery-json-ld";
import type { FaqItem } from "@/components/site/discovery-copy";
import { BRAND_NAME, BRAND_TAGLINE, OG_IMAGE, SUPPORT_EMAIL } from "@/lib/brand";
import { LANDING_TITLE } from "./landing-copy";

export function landingJsonLdGraph({ description, liveCities, faq }: { description: string; liveCities: readonly string[]; faq: readonly FaqItem[] }) {
  const home = absoluteUrl("/");
  const org = `${home}#organization`;
  const site = `${home}#website`;
  const page = `${home}#webpage`;
  const realSupport = !/\.example$/i.test(SUPPORT_EMAIL);
  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "Organization",
      "@id": org,
      name: BRAND_NAME,
      url: home,
      logo: { "@type": "ImageObject", url: absoluteUrl("/brand/app-icon-512.png"), width: 512, height: 512 },
      slogan: BRAND_TAGLINE,
      description,
      ...(liveCities.length ? { areaServed: liveCities.map((name) => ({ "@type": "City", name })) } : {}),
      ...(realSupport ? { contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: SUPPORT_EMAIL, availableLanguage: ["de"] } } : {}),
    },
    { "@type": "WebSite", "@id": site, url: home, name: BRAND_NAME, inLanguage: "de-DE", publisher: { "@id": org } },
    {
      "@type": "WebPage",
      "@id": page,
      url: home,
      name: LANDING_TITLE,
      description,
      inLanguage: "de-DE",
      isPartOf: { "@id": site },
      about: { "@id": org },
      primaryImageOfPage: { "@type": "ImageObject", url: absoluteUrl(OG_IMAGE.url), width: OG_IMAGE.width, height: OG_IMAGE.height },
    },
  ];
  if (faq.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${home}#fragen`,
      isPartOf: { "@id": page },
      inLanguage: "de-DE",
      mainEntity: faq.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function LandingJsonLd(props: { description: string; liveCities: readonly string[]; faq: readonly FaqItem[] }) {
  return <JsonLd data={landingJsonLdGraph(props)} />;
}
