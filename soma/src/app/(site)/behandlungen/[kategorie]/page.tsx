import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { CategoryDTO } from "@/server/dto";
import { CategoryPageSkeleton } from "@/components/site/discovery-skeletons";
import { Container, Overline, Section } from "@/components/ui/layout";
import { BookingEntry } from "@/components/site/booking-entry";
import { Breadcrumbs } from "@/components/site/discovery-breadcrumbs";
import { capitalize, categoryFaq, floorsById, fromPrice, numberWord, shy } from "@/components/site/discovery-copy";
import { entryCatalog } from "@/components/site/entry-catalog";
import { FaqSection } from "@/components/site/discovery-faq";
import { isSlug } from "@/components/site/discovery-slug";
import { DiscoveryHero, HeroBadge } from "@/components/site/discovery-hero";
import { aggregateRating, breadcrumbLd, JsonLd, serviceLd } from "@/components/site/discovery-json-ld";
import { LinkGrid, providerCountLabel } from "@/components/site/discovery-links";
import { Rail } from "@/components/site/discovery-rail";
import { ServiceList } from "@/components/site/discovery-services";
import { ProviderPortraitCard } from "@/components/site/discovery-tiles";
import { Star } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/motion";
import { formatRating } from "@/lib/format";
import { images } from "@/lib/images";
import { routes } from "@/lib/routes";
import { getCategory, listCatalog, listCategories, listCities } from "@/server/services/catalog";
import { getCoverageMatrix, getPriceFloors, getPublicTerms, listCityPostalExamples, listDiscoveryProviders } from "@/server/services/site-ext";

export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await listCategories();
  return categories.map((c) => ({ kategorie: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/behandlungen/[kategorie]">): Promise<Metadata> {
  const { kategorie } = await params;
  const category = isSlug(kategorie) ? await getCategory(kategorie) : null;
  if (!category) notFound();
  return {
    title: category.seoTitle ?? `${category.name} zu Hause buchen`,
    description: category.seoDescription ?? category.description ?? undefined,
    alternates: { canonical: routes.category(category.slug) },
    openGraph: { title: category.seoTitle ?? `${category.name} zu Hause buchen`, description: category.seoDescription ?? undefined },
  };
}

/**
 * The slug is validated before anything suspends, so unknown categories get a
 * real 404; the rest of the page streams behind a skeleton of the same geometry.
 */
export default async function KategoriePage({ params }: PageProps<"/behandlungen/[kategorie]">) {
  const { kategorie } = await params;
  const category = isSlug(kategorie) ? await getCategory(kategorie) : null;
  if (!category) notFound();
  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <KategorieContent category={category} />
    </Suspense>
  );
}

async function KategorieContent({ category }: { category: CategoryDTO }) {
  const [catalog, cities, floors, providers, coverage, terms, examples] = await Promise.all([
    listCatalog(),
    listCities(),
    getPriceFloors(),
    listDiscoveryProviders({ categorySlug: category.slug, limit: 48 }),
    getCoverageMatrix(),
    getPublicTerms(),
    listCityPostalExamples(),
  ]);

  const fm = floorsById(floors);
  const services = catalog.find((c) => c.slug === category.slug)?.services ?? [];
  const prices = services.map((s) => fm[s.id]).filter((n): n is number => typeof n === "number");
  const from = prices.length ? Math.min(...prices) : null;
  const cityRows = cities.map((c) => ({ city: c, n: coverage.find((x) => x.citySlug === c.slug && x.categorySlug === category.slug)?.providerCount ?? 0 }));
  const liveCities = cityRows.filter((r) => r.n > 0);
  const faq = categoryFaq(category, { baseDocuments: terms.baseRequiredDocuments, policy: terms.cancellationPolicy, fromCents: from });
  const crumbs = [
    { name: "Start", path: routes.home() },
    { name: "Behandlungen", path: routes.categories() },
    { name: category.name, path: routes.category(category.slug) },
  ];
  const firstCity = cities[0]?.slug;
  const rating = aggregateRating(providers);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd(crumbs),
          serviceLd({
            name: category.name,
            description: category.description,
            path: routes.category(category.slug),
            areaServed: liveCities.map((r) => r.city.name),
            offers: from != null ? { lowPriceCents: from } : null,
            rating,
          }),
        ]}
      />
      <DiscoveryHero
        size="m"
        breadcrumbs={<Breadcrumbs items={crumbs} />}
        overline={liveCities.length ? `${category.name} · ${numberWord(liveCities.length)} ${liveCities.length === 1 ? "Stadt" : "Städte"}` : category.name}
        title={`${shy(category.name)}.`}
        emphasis="Bei dir zu Hause."
        lead={category.description ?? category.tagline ?? undefined}
        photo={{ src: category.imagePath ?? images.category(category.slug), alt: "", tone: category.slug, word: category.name }}
        badges={
          <>
            {from != null ? (
              <HeroBadge>
                <span className="flex flex-col">
                  <span className="type-heading-l num">{fromPrice(from)}</span>
                  <span className="type-caption text-ink-muted">günstigstes Angebot, zzgl. Anfahrt</span>
                </span>
              </HeroBadge>
            ) : null}
            {rating && rating.count >= 3 ? (
              <HeroBadge>
                <Icon icon={Star} size={18} className="fill-ink text-ink" />
                <span className="flex flex-col">
                  <span className="type-heading-s num">{formatRating(rating.value)}</span>
                  <span className="type-caption text-ink num">{`${rating.count.toLocaleString("de-DE")} Bewertungen`}</span>
                </span>
              </HeroBadge>
            ) : null}
          </>
        }
      >
        <BookingEntry
          catalog={entryCatalog(catalog, fm)}
          defaultCategory={category.slug}
          postalExample={(firstCity && examples[firstCity]) || "10115"}
        />
      </DiscoveryHero>

      {/* Services */}
      <Section aria-labelledby="leistungen-titel" className="max-md:py-14">
        <Container>
          <Reveal className="grid gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="flex flex-col gap-4 lg:col-span-4">
              <Overline>Leistungen</Overline>
              <h2 id="leistungen-titel" className="type-display-l">
                {services.length === 1 ? "Eine Leistung." : `${capitalize(numberWord(services.length))} Leistungen.`}{" "}
                Dein Preis.
              </h2>
              <p className="type-body text-ink-muted">
                Die Profis legen ihre Preise selbst fest. „ab“ ist das günstigste aktuelle Angebot ohne Anfahrt; den Endpreis für deine Adresse siehst du in der Suche.
              </p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              {services.length ? (
                <ServiceList services={services} floors={fm} categorySlug={category.slug} />
              ) : (
                <p className="type-body text-ink-muted">Für diese Behandlung sind gerade keine Leistungen eingetragen.</p>
              )}
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Providers in the category */}
      {providers.length > 0 ? (
        <Section aria-labelledby="profis-titel" className="pt-0">
          <Container>
            <Rail
              label={`Profis für ${category.name}`}
              header={
                <div className="flex max-w-reading flex-col gap-4">
                  <Overline>Profis</Overline>
                  <h2 id="profis-titel" className="type-display-l">
                    Profis für {category.name}.
                  </h2>
                  <p className="type-body-l text-ink-muted">Geprüft, bewertet nach echten Terminen und mit eigenem Preis.</p>
                </div>
              }
            >
              {providers.slice(0, 12).map((p) => (
                <ProviderPortraitCard key={p.providerId} provider={p} categorySlug={category.slug} showFromPrice />
              ))}
            </Rail>
          </Container>
        </Section>
      ) : null}

      {/* Cities */}
      <Section aria-labelledby="staedte-titel" className="pt-0">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="flex flex-col gap-4 lg:col-span-4">
              <Overline>Städte</Overline>
              <h2 id="staedte-titel" className="type-display-l">
                {category.name} in deiner Stadt.
              </h2>
            </div>
            <LinkGrid
              className="lg:col-span-8"
              items={cityRows.map((r) => ({
                href: routes.categoryCity(category.slug, r.city.slug),
                name: r.city.name,
                meta: providerCountLabel(r.n),
                muted: r.n === 0,
              }))}
            />
          </div>
        </Container>
      </Section>

      <Section aria-label="Häufige Fragen" className="pt-0">
        <Container>
          <FaqSection items={faq} title={<>Gut zu wissen.</>} />
        </Container>
      </Section>
    </>
  );
}
