import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { CategoryDTO, CityDTO } from "@/server/dto";
import { SeoPageSkeleton } from "@/components/site/discovery-skeletons";
import { EmptyState } from "@/components/ui/feedback";
import { AuraArt, AuraBackground } from "@/components/ui/aura";
import { Container, Overline, Section } from "@/components/ui/layout";
import { BookingEntry } from "@/components/site/booking-entry";
import { Breadcrumbs } from "@/components/site/discovery-breadcrumbs";
import { categoryFaq, floorsById, fromPrice, shy, toEntryCatalog } from "@/components/site/discovery-copy";
import { FaqSection } from "@/components/site/discovery-faq";
import { isSlug } from "@/components/site/discovery-slug";
import { aggregateRating, breadcrumbLd, JsonLd, serviceLd } from "@/components/site/discovery-json-ld";
import { LinkGrid, providerCountLabel } from "@/components/site/discovery-links";
import { ServiceList } from "@/components/site/discovery-services";
import { ProviderListRow } from "@/components/site/discovery-tiles";
import { routes } from "@/lib/routes";
import { getCategory, getCity, getCityCategoryCoverage, listCatalog, listCategories, listCities } from "@/server/services/catalog";
import { getCoverageMatrix, getPriceFloors, getPublicTerms, listCityPostalExamples, listDiscoveryProviders } from "@/server/services/site-ext";

export const revalidate = 3600;

export async function generateStaticParams() {
  const [categories, cities] = await Promise.all([listCategories(), listCities()]);
  return categories.flatMap((c) => cities.map((ci) => ({ kategorie: c.slug, stadt: ci.slug })));
}

async function load(kategorie: string, stadt: string) {
  if (!isSlug(kategorie) || !isSlug(stadt)) return null;
  const [category, city] = await Promise.all([getCategory(kategorie), getCity(stadt)]);
  if (!category || !city || !city.isActive) return null;
  return { category, city };
}

export async function generateMetadata({ params }: PageProps<"/behandlungen/[kategorie]/[stadt]">): Promise<Metadata> {
  const { kategorie, stadt } = await params;
  const base = await load(kategorie, stadt);
  if (!base) notFound();
  const { category, city } = base;
  const coverage = await getCityCategoryCoverage(city.slug, category.slug);
  const title = `${category.name} zu Hause in ${city.name}`;
  const description =
    coverage.providerCount > 0
      ? `${category.name} in ${city.name}: ${providerCountLabel(coverage.providerCount)} kommen zu dir nach Hause, ins Hotel oder ins Büro. Geprüft, Endpreis inklusive Anfahrt, kostenlos stornierbar.`
      : `${category.name} zu Hause in ${city.name}: Wir bauen das Angebot gerade auf. Gib deine Postleitzahl ein, dann sagen wir dir Bescheid, sobald es losgeht.`;
  return {
    title,
    description,
    alternates: { canonical: routes.categoryCity(category.slug, city.slug) },
    openGraph: { title, description },
    // Thin pages (fewer providers than coverage_min_providers) stay out of the index.
    robots: coverage.indexable ? undefined : { index: false, follow: true },
  };
}

/** Slugs are validated before anything suspends (real 404); the rest streams behind a skeleton. */
export default async function KategorieStadtPage({ params }: PageProps<"/behandlungen/[kategorie]/[stadt]">) {
  const { kategorie, stadt } = await params;
  const base = await load(kategorie, stadt);
  if (!base) notFound();
  return (
    <Suspense fallback={<SeoPageSkeleton />}>
      <KategorieStadtContent category={base.category} city={base.city} />
    </Suspense>
  );
}

async function KategorieStadtContent({ category, city }: { category: CategoryDTO; city: CityDTO }) {
  const [catalog, cityFloors, providers, coverage, terms, examples, cities] = await Promise.all([
    listCatalog(),
    getPriceFloors({ citySlug: city.slug }),
    listDiscoveryProviders({ categorySlug: category.slug, citySlug: city.slug, limit: 48 }),
    getCoverageMatrix(),
    getPublicTerms(),
    listCityPostalExamples(),
    listCities(),
  ]);

  const fm = floorsById(cityFloors.filter((f) => f.categorySlug === category.slug));
  const services = catalog.find((c) => c.slug === category.slug)?.services ?? [];
  const prices = Object.values(fm);
  const from = prices.length ? Math.min(...prices) : null;
  const n = providers.length;
  const otherCategories = catalog
    .filter((c) => c.slug !== category.slug)
    .map((c) => ({ c, n: coverage.find((x) => x.citySlug === city.slug && x.categorySlug === c.slug)?.providerCount ?? 0 }));
  const otherCities = cities
    .filter((c) => c.slug !== city.slug)
    .map((c) => ({ c, n: coverage.find((x) => x.citySlug === c.slug && x.categorySlug === category.slug)?.providerCount ?? 0 }));
  const faq = categoryFaq(category, { baseDocuments: terms.baseRequiredDocuments, policy: terms.cancellationPolicy, fromCents: from, cityName: city.name });
  const crumbs = [
    { name: "Start", path: routes.home() },
    { name: "Behandlungen", path: routes.categories() },
    { name: category.name, path: routes.category(category.slug) },
    { name: city.name, path: routes.categoryCity(category.slug, city.slug) },
  ];
  const fullCatalog = toEntryCatalog(catalog, floorsById(cityFloors));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd(crumbs),
          serviceLd({
            name: `${category.name} zu Hause in ${city.name}`,
            description: category.description,
            path: routes.categoryCity(category.slug, city.slug),
            areaServed: [city.name],
            offers: from != null ? { lowPriceCents: from } : null,
            rating: aggregateRating(providers),
          }),
        ]}
      />
      <div className="relative isolate overflow-clip">
        <AuraBackground placement="right" variant="section" fade="both" className="max-h-[44rem]" />
      <Container className="pt-5 md:pt-7">
        <Breadcrumbs items={crumbs} />
        <div className="grid gap-10 pt-6 pb-(--space-section) md:pt-10 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-0">
          <header className="flex flex-col gap-5 lg:col-span-7 lg:row-start-1">
            <Overline>
              {category.name} · {city.name}
            </Overline>
            <h1 className="type-display-m">
              {shy(category.name)} zu Hause <em>in {city.name}.</em>
            </h1>
            <p className="max-w-[36rem] type-body-l text-ink-muted">
              {n > 0
                ? `${providerCountLabel(n)} für ${category.name} ${n === 1 ? "kommt" : "kommen"} in ${city.name} zu dir – nach Hause, ins Hotel oder ins Büro.${from != null ? ` Leistungen ${fromPrice(from)}, zuzüglich Anfahrt.` : ""}`
                : `Für ${category.name} in ${city.name} bauen wir das Angebot gerade auf.`}
            </p>
          </header>

          {/* One booking entry: below the intro on mobile, a sticky side column from lg. */}
          <aside aria-label="Termin finden" className="lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1 lg:self-start lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
            <div className="mb-4 hidden items-center gap-3 lg:flex">
              <span aria-hidden className="relative size-10 shrink-0 overflow-hidden rounded-tile shadow-raised">
                <AuraArt seed={`${category.slug}:${city.slug}`} tone={category.slug} grain={false} />
              </span>
              <p className="type-heading-m">
                {category.name} in {city.name} buchen
              </p>
            </div>
            <BookingEntry catalog={fullCatalog} defaultCategory={category.slug} postalExample={examples[city.slug] ?? "10115"} variant="compact" />
          </aside>

          <div className="flex flex-col gap-14 md:gap-20 lg:col-span-7 lg:row-start-2 lg:pt-16">
            {n > 0 ? (
              <section aria-labelledby="profis-titel">
                <h2 id="profis-titel" className="type-heading-l">
                  Profis für {category.name} in {city.name}
                </h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {providers.map((p) => (
                    <ProviderListRow key={p.providerId} provider={p} categorySlug={category.slug} />
                  ))}
                </ul>
                <p className="mt-4 type-caption text-ink-muted">
                  „ab“ ist das günstigste Angebot des Profis ohne Anfahrt. Freie Termine und den Endpreis für deine Adresse siehst du nach Eingabe der Postleitzahl.
                </p>
              </section>
            ) : (
              // EmptyState renders its own h2.
              <EmptyState title={`${category.name} in ${city.name} ist bald da.`} seed={`${category.slug}:${city.slug}`} tone={category.slug} className="rounded-card bg-surface-raised p-6 shadow-raised md:p-8">
                Gib deine Postleitzahl ein: Wir zeigen dir Profis, die zu dir kommen, oder sagen dir Bescheid, sobald es in deiner Gegend losgeht.
              </EmptyState>
            )}

            {services.length ? (
              <section aria-labelledby="leistungen-titel">
                <h2 id="leistungen-titel" className="type-heading-l">
                  Leistungen in {city.name}
                </h2>
                <div className="mt-5">
                  <ServiceList services={services} floors={fm} categorySlug={category.slug} emptyPriceLabel={n > 0 ? `Noch nicht in ${city.name}` : ""} />
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </Container>
      </div>

      <Section aria-labelledby="mehr-titel" className="pt-0">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="flex flex-col gap-4 lg:col-span-4">
              <Overline>{city.name}</Overline>
              <h2 id="mehr-titel" className="type-display-l">
                Mehr in <em>{city.name}.</em>
              </h2>
            </div>
            <LinkGrid
              className="lg:col-span-8"
              items={otherCategories.map(({ c, n: k }) => ({
                href: routes.categoryCity(c.slug, city.slug),
                name: c.name,
                meta: providerCountLabel(k),
                muted: k === 0,
              }))}
            />
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="andere-staedte-titel" className="pt-0">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="flex flex-col gap-4 lg:col-span-4">
              <Overline>{category.name}</Overline>
              <h2 id="andere-staedte-titel" className="type-display-l">
                {category.name} in <em>anderen Städten.</em>
              </h2>
            </div>
            <LinkGrid
              className="lg:col-span-8"
              items={otherCities.map(({ c, n: k }) => ({
                href: routes.categoryCity(category.slug, c.slug),
                name: c.name,
                meta: providerCountLabel(k),
                muted: k === 0,
              }))}
            />
          </div>
        </Container>
      </Section>

      <Section aria-label="Häufige Fragen" className="pt-0">
        <Container>
          <FaqSection items={faq} />
        </Container>
      </Section>
    </>
  );
}
