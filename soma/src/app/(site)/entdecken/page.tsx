import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { accentLinkClass } from "@/components/site/discovery-styles";
import { breadcrumbLd, JsonLd } from "@/components/site/discovery-json-ld";
import { ExploreAccountBar } from "@/components/site/explore-account-bar";
import { CollectionCard, ExploreCard, ExploreProviderCard } from "@/components/site/explore-cards";
import { ExploreCityTabs } from "@/components/site/explore-city-tabs";
import { collectionLabel, EDITORIAL_LABEL, SELECTION_WHY_HREF } from "@/components/site/explore-copy";
import { ForYouSlot } from "@/components/site/explore-for-you";
import { ExploreRail, ExploreSectionHeader } from "@/components/site/explore-rail";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/ui/layout";
import { BRAND_NAME, OG_IMAGE } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { EXPLORE_NEW_DAYS, POPULAR_WINDOW_DAYS } from "@/server/domain/explore";
import { listExploreCollections, listNewProviders, listPopularByCity } from "@/server/services/explore";

/** Static (ISR). Admin writes revalidate it at once; scheduled collections appear within 15 minutes of their start. */
export const revalidate = 900;

const title = "Entdecken";
const description = `Ausgewählte Behandlungen, beliebte Termine in deiner Stadt und neue Profis auf ${BRAND_NAME}. Gebucht wird mit echten freien Terminen und Endpreis inklusive Anfahrt.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: routes.explore() },
  openGraph: { title: `${title} · ${BRAND_NAME}`, description, images: [OG_IMAGE] },
};

/**
 * /entdecken ("Explore / For you"), client request 2026-11-02. Public sections are server-rendered and static:
 * „Von SOMA ausgewählt“ (admin collections), „Beliebt in <Stadt>“ (real bookings, thresholds in the database) and
 * „Neu auf SOMA“. „Für dich“ loads after hydration for signed-in customers (ForYouSlot); it sits below the
 * collections, so its arrival never moves anything on the first screen.
 */
export default async function EntdeckenPage() {
  const [collections, popular, fresh] = await Promise.all([listExploreCollections(), listPopularByCity(), listNewProviders({ limit: 8 })]);
  const sponsoredOnPage = collections.some((c) => c.isSponsored);
  const editorialInfo = collectionLabel({ isSponsored: false, sponsorName: null }).info;

  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Start", path: routes.home() }, { name: "Entdecken", path: routes.explore() }])} />
      <Container className="pt-8 pb-12 md:pt-12 md:pb-16">
        <header className="flex max-w-[44rem] flex-col gap-5">
          <p className="type-eyebrow text-ink-muted">Entdecken</p>
          <h1 className="type-display-m text-balance">
            Ideen für <em>deinen nächsten Termin.</em>
          </h1>
          <p className="max-w-[36rem] type-lead text-ink-muted">Ausgewählte Behandlungen, beliebte Termine in deiner Stadt und neue Profis. Gebucht wird wie immer: mit echten freien Terminen.</p>
        </header>
      </Container>

      {collections.length ? (
        <section id="auswahl" aria-labelledby="auswahl-titel" className="scroll-mt-24 pb-(--space-section)">
          <Container>
            <ExploreSectionHeader
              id="auswahl-titel"
              overline="Themen"
              title={EDITORIAL_LABEL}
              lead={sponsoredOnPage ? `${editorialInfo} Bezahlte Platzierungen tragen den Hinweis „Anzeige“.` : editorialInfo}
              aside={
                <Link href={SELECTION_WHY_HREF} className={`${accentLinkClass} -my-2`}>
                  <Icon icon={Info} size={16} />
                  So wählen wir aus
                </Link>
              }
            />
            <ExploreRail label={EDITORIAL_LABEL} columns={3}>
              {collections.map((c, i) => (
                <CollectionCard key={c.id} collection={c} priority={i === 0} />
              ))}
            </ExploreRail>
          </Container>
        </section>
      ) : null}

      <ForYouSlot />

      {popular.length ? (
        <section id="beliebt" aria-labelledby="beliebt-titel" className="scroll-mt-24 pb-(--space-section)">
          <Container>
            <ExploreCityTabs
              headingId="beliebt-titel"
              defaultSlug="berlin"
              lead={`Am häufigsten gebucht in den letzten ${POPULAR_WINDOW_DAYS}\u00a0Tagen. Freie Termine und den Endpreis zeigt dir die Suche.`}
              cities={popular.map((city) => ({
                slug: city.citySlug,
                name: city.cityName,
                panel: (
                  <ExploreRail label={`Beliebt in ${city.cityName}`}>
                    {city.cards.map((card) => (
                      <ExploreCard key={card.key} card={card} headingLevel="h3" />
                    ))}
                  </ExploreRail>
                ),
              }))}
            />
          </Container>
        </section>
      ) : null}

      {fresh.length ? (
        <section id="neu" aria-labelledby="neu-titel" className="scroll-mt-24 pb-(--space-section)">
          <Container>
            <ExploreSectionHeader
              id="neu-titel"
              overline="Neu"
              title={`Neu auf ${BRAND_NAME}`}
              lead={`Profis, die in den letzten ${EXPLORE_NEW_DAYS}\u00a0Tagen freigeschaltet wurden – geprüft wie alle anderen.`}
            />
            <ExploreRail label={`Neu auf ${BRAND_NAME}`}>
              {fresh.map((p) => (
                <ExploreProviderCard key={p.providerId} provider={p} />
              ))}
            </ExploreRail>
          </Container>
        </section>
      ) : null}

      <ExploreAccountBar />
    </>
  );
}
