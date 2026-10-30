import { BRAND_NAME, SITE_URL } from "@/lib/brand";
import type { FaqItem } from "./discovery-copy";

/** Renders structured data. `<` is escaped so user content cannot break out of the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function breadcrumbLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

/** FAQPage built only from the FAQ items that are visible on the page. */
export function faqLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } })),
  };
}

export function organizationLd() {
  return { "@type": "Organization", name: BRAND_NAME, url: absoluteUrl("/") };
}

/**
 * Service with areaServed. `rating` is only passed when it is aggregated from
 * real published reviews (ratingAvg × ratingCount of the listed providers).
 */
export function serviceLd(opts: {
  name: string;
  description?: string | null;
  path: string;
  areaServed: string[];
  offers?: { lowPriceCents: number } | null;
  rating?: { value: number; count: number } | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    serviceType: opts.name,
    description: opts.description ?? undefined,
    url: absoluteUrl(opts.path),
    provider: organizationLd(),
    areaServed: opts.areaServed.map((name) => ({ "@type": "City", name })),
    offers: opts.offers
      ? { "@type": "AggregateOffer", priceCurrency: "EUR", lowPrice: (opts.offers.lowPriceCents / 100).toFixed(2) }
      : undefined,
    aggregateRating:
      opts.rating && opts.rating.count >= 3
        ? { "@type": "AggregateRating", ratingValue: opts.rating.value.toFixed(2), reviewCount: opts.rating.count, bestRating: 5, worstRating: 1 }
        : undefined,
  };
}

/** Aggregates real provider ratings (weighted by review count); null when there are none. */
export function aggregateRating(providers: Array<{ ratingAvg: number | null; ratingCount: number }>): { value: number; count: number } | null {
  let sum = 0;
  let count = 0;
  for (const p of providers) {
    if (p.ratingAvg != null && p.ratingCount > 0) {
      sum += p.ratingAvg * p.ratingCount;
      count += p.ratingCount;
    }
  }
  return count > 0 ? { value: sum / count, count } : null;
}
