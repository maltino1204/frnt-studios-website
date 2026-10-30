import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container, Overline, Section } from "@/components/ui/layout";
import { Photo } from "@/components/ui/photo";
import { VerifiedBadge } from "@/components/ui/trust";
import { BookingEntry } from "@/components/site/booking-entry";
import { getHeroCopy, getHomeFaq, getHowItWorks } from "@/components/site/discovery-content";
import {
  capitalize,
  floorsById,
  freeCancellationSentence,
  numberWord,
  PLACE_LINES,
  splitHeadline,
  toEntryCatalog,
} from "@/components/site/discovery-copy";
import { FaqSection } from "@/components/site/discovery-faq";
import { DiscoveryHero } from "@/components/site/discovery-hero";
import { absoluteUrl, JsonLd } from "@/components/site/discovery-json-ld";
import { LinkGrid } from "@/components/site/discovery-links";
import { Rail } from "@/components/site/discovery-rail";
import { AccountDeletedToast } from "@/components/site/account-deleted-toast";
import { ProofBand } from "@/components/site/discovery-proof";
import { RebookRow } from "@/components/site/discovery-rebook";
import { CategoryTile, ProviderPortraitCard } from "@/components/site/discovery-tiles";
import { BRAND_NAME, BRAND_PROMISE, BRAND_TAGLINE } from "@/lib/brand";
import { images } from "@/lib/images";
import { routes } from "@/lib/routes";
import { listCatalog, listCities } from "@/server/services/catalog";
import { getCoverageMatrix, getPriceFloors, getPublicTerms, listCityPostalExamples, listDiscoveryProviders } from "@/server/services/site-ext";
import { getSocialProof } from "@/server/services/site-ext-2";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [catalog, cities, featuredAll, floors, coverage, terms, examples, hero, steps, faq, proof] = await Promise.all([
    listCatalog(),
    listCities(),
    listDiscoveryProviders({ limit: 16 }),
    getPriceFloors(),
    getCoverageMatrix(),
    getPublicTerms(),
    listCityPostalExamples(),
    getHeroCopy(),
    getHowItWorks(),
    getHomeFaq(),
    // The proof band must never take the home page down: render the guarantee alone.
    getSocialProof().catch((e) => {
      console.error("[home] social proof unavailable", e);
      return null;
    }),
  ]);

  const [heroTitle, heroEmphasis] = splitHeadline(hero.title);
  // Editorial row: lead with established profiles (≥ 3 reviews), keep the backend's quality order otherwise.
  const featured = [...featuredAll].sort((a, b) => Number(b.ratingCount >= 3) - Number(a.ratingCount >= 3)).slice(0, 8);
  const entryCatalog = toEntryCatalog(catalog, floorsById(floors));
  const stepPhotos = [
    { src: images.editorial.arrival, tone: "massage", word: "Klingeln.", place: PLACE_LINES.arrival, alt: "Eine Masseurin mit zusammengeklappter Liege an der Wohnungstür eines Altbaus" },
    { src: images.editorial.setup, tone: "pedikuere", word: "Aufbauen.", place: PLACE_LINES.setup, alt: "Hände klappen eine mobile Massageliege auf dem Parkett eines Wohnzimmers auf" },
    { src: images.editorial.after, tone: "haare-styling", word: "Bleiben.", place: PLACE_LINES.after, alt: "Eine Kundin sitzt nach der Behandlung mit einer Tasse Tee auf dem Sofa" },
  ];
  const firstCity = cities[0]?.slug;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: BRAND_NAME,
          url: absoluteUrl("/"),
          slogan: BRAND_TAGLINE,
          description: BRAND_PROMISE,
          areaServed: cities.map((c) => ({ "@type": "City", name: c.name })),
        }}
      />

      <DiscoveryHero
        overline={hero.overline}
        title={heroTitle}
        emphasis={heroEmphasis}
        lead={hero.lead}
        photo={{
          src: images.hero,
          alt: "Eine Masseurin massiert die Schultern einer Kundin im Wohnzimmer einer Berliner Altbauwohnung",
          word: "Schon da.",
          placeLine: PLACE_LINES.home,
        }}
      >
        <RebookRow />
        <BookingEntry catalog={entryCatalog} postalExample={(firstCity && examples[firstCity]) || "10115"} />
      </DiscoveryHero>

      <Suspense fallback={null}>
        <AccountDeletedToast />
      </Suspense>

      {/* Proof band (R14): real numbers, real quotes, SOMA-Garantie */}
      <ProofBand proof={proof} disputeWindowHours={terms.disputeWindowHours} />

      {/* Categories */}
      <Section aria-labelledby="behandlungen-titel" className="max-md:py-12">
        <Container>
          <Rail
            label="Behandlungen"
            header={
              <div className="flex max-w-reading flex-col gap-4">
                <Overline>Behandlungen</Overline>
                <h2 id="behandlungen-titel" className="type-display-l">
                  {capitalize(numberWord(catalog.length))} Behandlungen. <em>Ein Ort: Ihrer.</em>
                </h2>
                <p className="type-body-l text-ink-muted">Jede Behandlung von geprüften Profis, die alles mitbringen – von der Liege bis zum Handtuch.</p>
              </div>
            }
          >
            {catalog.map((c) => (
              <CategoryTile key={c.slug} category={c} />
            ))}
          </Rail>
          <Link href={routes.categories()} className="mt-8 inline-flex min-h-touch items-center gap-2 type-label text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover">
            Alle Behandlungen und Leistungen
            <Icon icon={ArrowRight} size={16} />
          </Link>
        </Container>
      </Section>

      {/* How it works */}
      <Section aria-labelledby="ablauf-titel" className="pt-0 max-md:pb-12">
        <Container>
          <div className="flex max-w-reading flex-col gap-4">
            <Overline>So funktioniert&apos;s</Overline>
            <h2 id="ablauf-titel" className="type-display-l">
              {capitalize(numberWord(steps.length))} Schritte. <em>Kein Weg.</em>
            </h2>
          </div>
          <ol className="mt-8 grid gap-8 md:mt-12 md:grid-cols-3 md:gap-5 lg:mt-16 lg:gap-6">
            {steps.map((s, i) => {
              const ph = stepPhotos[i % stepPhotos.length];
              return (
                <li key={s.title} className={i === 1 ? "md:mt-16 lg:mt-24" : i === 2 ? "md:mt-32 lg:mt-48" : undefined}>
                  <figure className="hidden flex-col gap-3 md:flex">
                    <Photo src={ph.src} alt={ph.alt} tone={ph.tone} word={ph.word} wordSize="s" sizes="(min-width: 768px) 32vw, 100vw" className="aspect-[3/2] w-full" />
                    <figcaption className="type-caption text-ink-muted">{ph.place}</figcaption>
                  </figure>
                  <div className="flex flex-col gap-3 md:mt-6">
                    <p className="type-overline text-ink-muted num">Schritt {i + 1}</p>
                    <h3 className="type-heading-l">{s.title}</h3>
                    <p className="max-w-[26rem] type-body text-ink-muted">{s.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Container>
      </Section>

      {/* Places: home, hotel, office */}
      <Section night aria-labelledby="orte-titel" className="max-md:py-12">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
            <div className="flex flex-col gap-5 lg:col-span-5 lg:pt-8">
              <Overline>Ihr Ort</Overline>
              <h2 id="orte-titel" className="type-display-l">
                Zu&nbsp;Hause. Im&nbsp;Hotel. <em>Im&nbsp;Büro.</em>
              </h2>
              <p className="max-w-[30rem] type-body-l text-ink-muted">
                Sie bleiben, wo Sie sind. Ihr Profi kommt mit allem, was es braucht, und hinterlässt den Raum, wie er war.
              </p>
              <dl className="mt-6 flex max-w-[30rem] flex-col border-t border-line">
                {[
                  { k: "Zu Hause", v: "Wohnung, Etage, Klingelname – mehr braucht es nicht." },
                  { k: "Im Hotel", v: "Hotel, Zimmernummer und der Name an der Rezeption – Ihr Profi kommt direkt zu Ihnen." },
                  { k: "Im Büro", v: "Firma und Empfang angeben. Ideal für die Mittagspause." },
                ].map((row) => (
                  <div key={row.k} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-line py-3 md:py-4">
                    <dt className="type-heading-s text-ink">{row.k}</dt>
                    <dd className="type-body-s text-ink-muted">{row.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex flex-col gap-10 lg:col-span-7">
              <figure className="flex flex-col gap-3">
                <Photo
                  src={images.editorial.hotel}
                  alt="Ein Masseur massiert einen Geschäftsreisenden am Abend in einer Frankfurter Hotelsuite"
                  tone="brows-lashes"
                  word="Im Hotel."
                  wordSize="m"
                  sizes="(min-width: 1024px) 56vw, 100vw"
                  className="aspect-[3/2] w-full"
                />
                <figcaption className="type-caption text-ink-muted">{PLACE_LINES.hotel}</figcaption>
              </figure>
              <figure className="hidden flex-col gap-3 md:ml-auto md:flex md:w-2/3">
                <Photo
                  src={images.editorial.office}
                  alt="Schulter- und Nackenmassage auf einem Massagestuhl in einem Hamburger Besprechungsraum"
                  tone="brows-lashes"
                  word="Im Büro."
                  wordSize="s"
                  sizes="(min-width: 1024px) 38vw, (min-width: 768px) 66vw, 100vw"
                  className="aspect-[3/2] w-full"
                />
                <figcaption className="type-caption text-ink-muted">{PLACE_LINES.office}</figcaption>
              </figure>
            </div>
          </div>
        </Container>
      </Section>

      {/* Trust */}
      <Section aria-labelledby="vertrauen-titel" className="max-md:py-12">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
            <div className="flex flex-col gap-5 lg:col-span-5">
              <Overline>Vertrauen</Overline>
              <h2 id="vertrauen-titel" className="type-display-l">
                Geprüft, <em>bevor es klingelt.</em>
              </h2>
              <p className="max-w-[28rem] type-body-l text-ink-muted">
                Wer zu Ihnen nach Hause kommt, muss mehr vorweisen als gute Fotos. Das prüfen wir – und das garantieren wir.
              </p>
            </div>
            <ul className="border-t border-line lg:col-span-7 lg:col-start-6">
              <TrustItem title="Jeder Profi ist verifiziert." badge>
                Bevor jemand buchbar ist, prüfen wir {listSentence(terms.baseRequiredDocuments.map((d) => d.label)) || "Identität, Gewerbe und Versicherung"} – und
                für jede angebotene Behandlung die Qualifikation.
              </TrustItem>
              <TrustItem title="Endpreis inklusive Anfahrt.">
                In der Suche sehen Sie für jeden Profi den Gesamtpreis inklusive Anfahrt, bevor Sie buchen.
                {terms.customerServiceFeeCents === 0 ? " Eine Servicegebühr gibt es nicht." : null}
              </TrustItem>
              <TrustItem title="Kostenlos stornieren.">
                {freeCancellationSentence(terms.cancellationPolicy)} Solange eine Anfrage noch nicht bestätigt ist, ist sie immer kostenlos.{" "}
                <Link href="/stornierung" className="text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover">
                  Stornobedingungen
                </Link>
              </TrustItem>
              <TrustItem title={`Bezahlt wird nur über ${BRAND_NAME}.`}>
                Ihre Karte wird bei der Buchung reserviert und erst nach dem Termin belastet. Bis {terms.disputeWindowHours} Stunden danach halten wir die Auszahlung an den
                Profi zurück – so greift die {BRAND_NAME}-Garantie, wenn etwas nicht stimmt.
              </TrustItem>
            </ul>
          </div>
        </Container>
      </Section>

      {/* Featured professionals */}
      {featured.length > 0 ? (
        <Section aria-labelledby="profis-titel" className="pt-0 max-md:pb-12">
          <Container>
            <Rail
              label="Ausgewählte Profis"
              header={
                <div className="flex max-w-reading flex-col gap-4">
                  <Overline>Profis</Overline>
                  <h2 id="profis-titel" className="type-display-l">
                    Wer bei Ihnen <em>klingelt.</em>
                  </h2>
                  <p className="type-body-l text-ink-muted">
                    Selbstständige Fachkräfte mit eigener Handschrift. Bewertet wird nur nach einem echten Termin.
                  </p>
                </div>
              }
            >
              {featured.map((p) => (
                <ProviderPortraitCard key={p.providerId} provider={p} />
              ))}
            </Rail>
          </Container>
        </Section>
      ) : null}

      {/* Cities */}
      {cities.length > 0 ? (
        <Section aria-labelledby="staedte-titel" className="pt-0 max-md:pb-12">
          <Container>
            <div className="grid gap-8 md:gap-12 lg:grid-cols-12 lg:gap-6">
              <div className="flex flex-col gap-5 lg:col-span-4">
                <Overline>Städte</Overline>
                <h2 id="staedte-titel" className="type-display-l">
                  Jetzt in {numberWord(cities.length)} Städten.
                </h2>
                <p className="type-body text-ink-muted">
                  Ihre Stadt ist noch nicht dabei? Geben Sie oben Ihre Postleitzahl ein – wir melden uns, sobald es losgeht.
                </p>
              </div>
              <LinkGrid
                className="max-md:grid-cols-2 max-md:gap-x-4 lg:col-span-8"
                items={cities.map((c) => {
                  const live = coverage.filter((x) => x.citySlug === c.slug && x.providerCount > 0).length;
                  return {
                    href: routes.city(c.slug),
                    name: c.name,
                    meta: live === catalog.length ? `Alle ${live} Behandlungen` : `${live} von ${catalog.length} Behandlungen`,
                  };
                })}
              />
            </div>
          </Container>
        </Section>
      ) : null}

      {/* For professionals */}
      <section data-theme="night" aria-labelledby="fuer-profis-titel" className="relative overflow-hidden lg:flex lg:min-h-[40rem] lg:items-center">
        <figure className="relative lg:absolute lg:inset-y-0 lg:right-0 lg:left-[calc(41.666%+0.75rem)]">
          <Photo
            src={images.editorial.providerCta}
            alt="Ein Friseurprofi mit Arbeitstasche geht die Treppe eines Altbaus hinauf"
            tone="brows-lashes"
            word="Unterwegs."
            wordSize="l"
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="aspect-[16/9] w-full md:aspect-[2/1] lg:aspect-auto lg:h-full"
          />
          <figcaption className="absolute top-5 left-5 bg-scrim px-2 py-1 type-caption text-ink-muted lg:top-7 lg:left-auto lg:right-7">
            {PLACE_LINES.pros}
          </figcaption>
        </figure>
        <Container className="relative py-(--space-section) max-md:py-12 lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col gap-5 lg:col-span-5">
            <Overline>Für Profis</Overline>
            <h2 id="fuer-profis-titel" className="type-display-l">
              Selbstständig, <em>aber nicht allein.</em>
            </h2>
            <p className="max-w-[28rem] type-body-l text-ink-muted">
              Profis legen Preise, Zeiten und Einsatzgebiet selbst fest. {BRAND_NAME} bringt neue Kundschaft und sichert die Zahlung – auszahlbar{" "}
              {terms.payoutHoldHours} Stunden nach dem Termin.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <ButtonLink href={routes.forPros()} size="l" iconRight={<Icon icon={ArrowRight} />}>
                Mehr für Profis
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      {faq.length > 0 ? (
        <Section aria-label="Häufige Fragen" className="max-md:py-12">
          <Container>
            <FaqSection
              items={faq}
              mobileLimit={4}
              aside={
                <Link href={routes.help()} className="inline-flex min-h-touch items-center gap-2 type-label text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover">
                  Alle Fragen und Antworten
                  <Icon icon={ArrowRight} size={16} />
                </Link>
              }
            />
          </Container>
        </Section>
      ) : null}
    </>
  );
}

function TrustItem({ title, badge, children }: { title: string; badge?: boolean; children: ReactNode }) {
  return (
    <li className="grid gap-3 border-b border-line py-4 md:grid-cols-[14rem_1fr] md:gap-6 md:py-7">
      <h3 className="flex flex-wrap items-center gap-2 type-heading-m text-ink">
        {title}
        {badge ? <VerifiedBadge /> : null}
      </h3>
      <p className="type-body-s text-ink-muted md:type-body">{children}</p>
    </li>
  );
}

/** "A, B und C" */
function listSentence(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} und ${items[items.length - 1]}`;
}
