import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { CityDTO } from "@/server/dto";
import { CategoryPageSkeleton } from "@/components/site/discovery-skeletons";
import { Container, Overline, Section } from "@/components/ui/layout";
import { BookingEntry } from "@/components/site/booking-entry";
import { Breadcrumbs } from "@/components/site/discovery-breadcrumbs";
import { getCityIntro } from "@/components/site/discovery-content";
import { floorsById, fromPrice, splitHeadline, toEntryCatalog } from "@/components/site/discovery-copy";
import { DiscoveryHero, HeroBadge } from "@/components/site/discovery-hero";
import { breadcrumbLd, JsonLd } from "@/components/site/discovery-json-ld";
import { LinkGrid, providerCountLabel } from "@/components/site/discovery-links";
import { Rail } from "@/components/site/discovery-rail";
import { isSlug } from "@/components/site/discovery-slug";
import { CategoryTile, ProviderPortraitCard } from "@/components/site/discovery-tiles";
import { images } from "@/lib/images";
import { routes } from "@/lib/routes";
import { getCity, listCatalog, listCities } from "@/server/services/catalog";
import { getCoverageMatrix, getPriceFloors, listCityPostalExamples, listDiscoveryProviders } from "@/server/services/site-ext";

export const revalidate = 3600;

export async function generateStaticParams() {
  const cities = await listCities();
  return cities.map((c) => ({ stadt: c.slug }));
}

async function loadCity(stadt: string) {
  if (!isSlug(stadt)) return null;
  const city = await getCity(stadt);
  return city && city.isActive ? city : null;
}

export async function generateMetadata({ params }: PageProps<"/staedte/[stadt]">): Promise<Metadata> {
  const { stadt } = await params;
  const city = await loadCity(stadt);
  if (!city) notFound();
  const title = `Beauty & Wellness zu Hause in ${city.name}`;
  const description = `Massage, Maniküre, Kosmetik, Make-up und mehr in ${city.name}: geprüfte Profis kommen zu Ihnen nach Hause, ins Hotel oder ins Büro. Endpreise inklusive Anfahrt.`;
  return { title, description, alternates: { canonical: routes.city(city.slug) }, openGraph: { title, description } };
}

/** The slug is validated before anything suspends (real 404); the rest streams behind a skeleton. */
export default async function StadtPage({ params }: PageProps<"/staedte/[stadt]">) {
  const { stadt } = await params;
  const city = await loadCity(stadt);
  if (!city) notFound();
  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <StadtContent city={city} />
    </Suspense>
  );
}

async function StadtContent({ city }: { city: CityDTO }) {
  const [catalog, cities, floors, providers, coverage, examples, intro] = await Promise.all([
    listCatalog(),
    listCities(),
    getPriceFloors({ citySlug: city.slug }),
    listDiscoveryProviders({ citySlug: city.slug, limit: 12 }),
    getCoverageMatrix(),
    listCityPostalExamples(),
    getCityIntro(city.slug),
  ]);

  const fm = floorsById(floors);
  const count = (cat: string) => coverage.find((x) => x.citySlug === city.slug && x.categorySlug === cat)?.providerCount ?? 0;
  const categoryFrom = (slug: string) => {
    const p = floors.filter((f) => f.categorySlug === slug).map((f) => f.fromCents);
    return p.length ? Math.min(...p) : null;
  };
  const liveCount = catalog.filter((c) => count(c.slug) > 0).length;
  const cityFrom = floors.length ? Math.min(...floors.map((f) => f.fromCents)) : null;
  const [title, emphasis] = splitHeadline(intro.title ? `${intro.title}.` : `Beauty & Wellness zu Hause. In ${city.name}.`);
  const crumbs = [
    { name: "Start", path: routes.home() },
    { name: "Städte", path: "/staedte" },
    { name: city.name, path: routes.city(city.slug) },
  ];

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <DiscoveryHero
        size="m"
        breadcrumbs={<Breadcrumbs items={crumbs} />}
        ambient={false}
        overline={city.state && city.state !== city.name ? `${city.name} · ${city.state}` : `Stadt · ${city.name}`}
        title={title}
        emphasis={emphasis}
        lead={intro.body ?? `Geprüfte Profis kommen in ${city.name} zu Ihnen – nach Hause, ins Hotel oder ins Büro.`}
        photo={{ src: images.editorial.arrival, alt: "", word: `${city.name}.`, tone: "brows-lashes", seed: `stadt:${city.slug}` }}
        badges={
          <>
            <HeroBadge className="top-[10%] -left-2 sm:-left-6 lg:-left-10">
              <span className="flex flex-col">
                <span className="type-heading-l num">{`${liveCount} von ${catalog.length}`}</span>
                <span className="type-caption text-ink-muted">Behandlungen buchbar</span>
              </span>
            </HeroBadge>
            {cityFrom != null ? (
              <HeroBadge glass className="right-4 bottom-[12%] hidden sm:flex lg:-right-6">
                <span className="flex flex-col">
                  <span className="type-heading-s num">{fromPrice(cityFrom)}</span>
                  <span className="type-caption text-ink">zzgl. Anfahrt</span>
                </span>
              </HeroBadge>
            ) : null}
          </>
        }
      >
        <BookingEntry catalog={toEntryCatalog(catalog, fm)} postalExample={examples[city.slug] ?? "10115"} />
      </DiscoveryHero>

      <Section aria-labelledby="behandlungen-titel">
        <Container>
          <Rail
            label={`Behandlungen in ${city.name}`}
            header={
              <div className="flex max-w-reading flex-col gap-4">
                <Overline>Behandlungen</Overline>
                <h2 id="behandlungen-titel" className="type-display-l">
                  Was in {city.name} <em>zu Ihnen kommt.</em>
                </h2>
              </div>
            }
          >
            {catalog.map((c) => {
              const n = count(c.slug);
              const from = categoryFrom(c.slug);
              return (
                <CategoryTile
                  key={c.slug}
                  category={c}
                  href={routes.categoryCity(c.slug, city.slug)}
                  meta={n > 0 ? [providerCountLabel(n), fromPrice(from)].filter(Boolean).join(" · ") : "Bald verfügbar"}
                />
              );
            })}
          </Rail>
        </Container>
      </Section>

      {providers.length > 0 ? (
        <Section aria-labelledby="profis-titel" className="pt-0">
          <Container>
            <Rail
              label={`Profis in ${city.name}`}
              header={
                <div className="flex max-w-reading flex-col gap-4">
                  <Overline>Profis</Overline>
                  <h2 id="profis-titel" className="type-display-l">
                    Profis in <em>{city.name}.</em>
                  </h2>
                  <p className="type-body-l text-ink-muted">Verifiziert und bewertet von Kundschaft, die wirklich gebucht hat.</p>
                </div>
              }
            >
              {providers.map((p) => (
                <ProviderPortraitCard key={p.providerId} provider={p} showFromPrice />
              ))}
            </Rail>
          </Container>
        </Section>
      ) : null}

      <Section aria-labelledby="andere-titel" className="pt-0">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="flex flex-col gap-4 lg:col-span-4">
              <Overline>Städte</Overline>
              <h2 id="andere-titel" className="type-display-l">
                Auch in <em>diesen Städten.</em>
              </h2>
            </div>
            <LinkGrid
              className="lg:col-span-8"
              items={cities
                .filter((c) => c.slug !== city.slug)
                .map((c) => {
                  const live = coverage.filter((x) => x.citySlug === c.slug && x.providerCount > 0).length;
                  return { href: routes.city(c.slug), name: c.name, meta: `${live} von ${catalog.length} Behandlungen` };
                })}
            />
          </div>
        </Container>
      </Section>
    </>
  );
}
