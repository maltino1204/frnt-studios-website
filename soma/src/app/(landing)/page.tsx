import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountDeletedToast } from "@/components/site/account-deleted-toast";
import { floorsById, freeCancellationHours, fromPrice, toEntryCatalog } from "@/components/site/discovery-copy";
import { LandingJsonLd } from "@/components/landing/booking/landing-json-ld";
import {
  generateLandingMetadata,
  loadLandingCatalog,
  loadLandingCities,
  loadLandingConversion,
  loadLandingPriceFloors,
  loadLandingTerms,
} from "@/components/landing/booking/metadata";
import type { CategoryItem } from "@/components/landing/behandlungen/types";
import { HeroChapter } from "@/components/landing/chapters/01-hero";
import { IdeeChapter } from "@/components/landing/chapters/02-idee";
import { BehandlungenChapter } from "@/components/landing/chapters/03-behandlungen";
import { AblaufChapter } from "@/components/landing/chapters/04-ablauf";
import { DeinOrtChapter } from "@/components/landing/chapters/05-dein-ort";
import { ProfisChapter } from "@/components/landing/chapters/06-profis";
import { DeineBuchungChapter } from "@/components/landing/chapters/07-deine-buchung";
import { FuerProfisChapter } from "@/components/landing/chapters/08-fuer-profis";
import { FragenChapter } from "@/components/landing/chapters/09-fragen";
import { SomaChapter } from "@/components/landing/chapters/10-soma";
import { imageFocal, images } from "@/lib/images";
import { routes } from "@/lib/routes";
import { searchProviders } from "@/server/services/search";
import { getProviderTerms } from "@/server/services/pro-ext";
import { listCityPostalExamples, listDiscoveryProviders } from "@/server/services/site-ext";
import type { ProviderSearchResult } from "@/server/dto";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateLandingMetadata();
}

/** The launch commission shown on /fuer-profis when no rule is active (spec § 4.8). */
const DEFAULT_COMMISSION = { rate: 0.2, repeatClientRate: 0.12, ownClientRate: 0.05 };

/** One live search in the first launch city for the 04 vignettes (a hint, never a reason to fail the page). */
async function showcaseResult(postalCode: string): Promise<ProviderSearchResult | null> {
  try {
    const res = await searchProviders({ postalCode, pageSize: 8 }, null, { logDemand: false });
    const soon = Date.now() + 2 * 3_600_000;
    const usable = res.results.filter((r) => r.nextSlots.filter((s) => new Date(s).getTime() > soon).length >= 2);
    return usable.find((r) => r.ratingCount >= 3 && r.bookingMode === "instant") ?? usable.find((r) => r.ratingCount >= 3) ?? usable[0] ?? null;
  } catch (e) {
    console.error("[landing] showcase search unavailable", e);
    return null;
  }
}

/**
 * The SOMA landing page (docs/landing/LANDING_DESIGN_SPEC.md): ten chapters, server-rendered from real data in one
 * Promise.all, complete and usable without any motion JS (the "none" tier). Static with hourly ISR.
 */
export default async function LandingPage() {
  const [catalog, floors, terms, cities, examples, providerTerms, providersAll, conv] = await Promise.all([
    loadLandingCatalog(),
    loadLandingPriceFloors(),
    loadLandingTerms(),
    loadLandingCities(),
    listCityPostalExamples(),
    getProviderTerms().catch((e) => {
      console.error("[landing] provider terms unavailable", e);
      return null;
    }),
    listDiscoveryProviders({ limit: 16 }).catch((e) => {
      console.error("[landing] providers unavailable", e);
      return [];
    }),
    loadLandingConversion(),
  ]);

  const firstCity = cities[0];
  const examplePlz = (firstCity && examples[firstCity.slug]) || "10115";
  const result = await showcaseResult(examplePlz);

  // Established profiles (≥ 3 reviews) first, the backend's quality order otherwise (as on the former home).
  const providers = [...providersAll].sort((a, b) => Number(b.ratingCount >= 3) - Number(a.ratingCount >= 3)).slice(0, 8);

  const floorByCategory = new Map<string, number>();
  for (const f of floors) {
    const cur = floorByCategory.get(f.categorySlug);
    if (cur == null || f.fromCents < cur) floorByCategory.set(f.categorySlug, f.fromCents);
  }
  const categories: CategoryItem[] = catalog.map((c) => {
    const image = c.imagePath ?? images.category(c.slug);
    return {
      slug: c.slug,
      name: c.name,
      tagline: c.tagline,
      href: routes.category(c.slug),
      price: fromPrice(floorByCategory.get(c.slug)),
      services: c.services.slice(0, 3).map((s) => s.name),
      image,
      focal: imageFocal(image, "50% 45%"),
    };
  });

  return (
    <>
      <LandingJsonLd description={conv.description} liveCities={conv.liveCities} faq={conv.faq} />

      <HeroChapter
        catalog={toEntryCatalog(catalog, floorsById(floors))}
        postalExample={examplePlz}
        postalExamples={examples}
        lead={conv.heroLead}
        trustItems={conv.heroTrust}
      />
      <Suspense fallback={null}>
        <AccountDeletedToast />
      </Suspense>
      <IdeeChapter />
      <BehandlungenChapter items={categories} />
      <AblaufChapter
        data={{
          plz: examplePlz,
          city: firstCity?.name ?? null,
          categoryName: result?.offering.categoryName ?? catalog[0]?.name ?? null,
          result,
          freeHours: freeCancellationHours(terms.cancellationPolicy),
        }}
      />
      <DeinOrtChapter />
      <ProfisChapter providers={providers} />
      <DeineBuchungChapter />
      <FuerProfisChapter commission={providerTerms?.commission ?? DEFAULT_COMMISSION} payoutHoldHours={terms.payoutHoldHours ?? null} />
      <FragenChapter items={conv.faq} trust={conv.faqTrust} />
      <SomaChapter />
    </>
  );
}
