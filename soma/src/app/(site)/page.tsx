import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarX2, Check, CreditCard, MapPin, ReceiptEuro, type LucideIcon } from "lucide-react";
import { BrandIcon, type BrandIconName } from "@/components/brand/brand-icon";
import { ToneFill } from "@/components/ui/motif";
import { AiLabel } from "@/components/ui/ai-label";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container, Overline, Section } from "@/components/ui/layout";
import { Reveal, ScrollRegion } from "@/components/ui/motion";
import { Photo } from "@/components/ui/photo";
import { SuccessCheck } from "@/components/ui/success";
import { Surface } from "@/components/ui/surface";
import { VerifiedBadge } from "@/components/ui/trust";
import { BookingEntry } from "@/components/site/booking-entry";
import { getHeroCopy, getHomeFaq, getHowItWorks } from "@/components/site/discovery-content";
import {
  capitalize,
  floorsById,
  freeCancellationHours,
  freeCancellationSentence,
  hoursLabel,
  numberWord,
  PLACE_LINES,
  splitHeadline,
  toEntryCatalog,
} from "@/components/site/discovery-copy";
import { FaqSection } from "@/components/site/discovery-faq";
import { ArchPair, DiscoveryHero } from "@/components/site/discovery-hero";
import { absoluteUrl, JsonLd } from "@/components/site/discovery-json-ld";
import { LinkGrid } from "@/components/site/discovery-links";
import { Rail } from "@/components/site/discovery-rail";
import { AccountDeletedToast } from "@/components/site/account-deleted-toast";
import { GuaranteePanel, ProofBand } from "@/components/site/discovery-proof";
import { RebookRow } from "@/components/site/discovery-rebook";
import { CategoryTile, ProviderPortraitCard } from "@/components/site/discovery-tiles";
import { BRAND_NAME, BRAND_PROMISE, BRAND_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { formatDayShort, formatPrice, formatTime } from "@/lib/format";
import { images } from "@/lib/images";
import { routes } from "@/lib/routes";
import { listCatalog, listCities } from "@/server/services/catalog";
import { searchProviders } from "@/server/services/search";
import { getCoverageMatrix, getPriceFloors, getPublicTerms, listCityPostalExamples, listDiscoveryProviders } from "@/server/services/site-ext";
import { getSocialProof } from "@/server/services/site-ext-2";
import type { ProviderSearchResult } from "@/server/dto";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const NBSP = " ";

/** One live search in the first launch city feeds the hero composition (a hint, never a reason to fail the page). */
async function showcaseResult(postalCode: string): Promise<ProviderSearchResult | null> {
  try {
    const res = await searchProviders({ postalCode, pageSize: 8 }, null, { logDemand: false });
    const soon = Date.now() + 2 * 3_600_000;
    const usable = res.results.filter((r) => r.nextSlots.filter((s) => new Date(s).getTime() > soon).length >= 2);
    return usable.find((r) => r.ratingCount >= 3 && r.bookingMode === "instant") ?? usable.find((r) => r.ratingCount >= 3) ?? usable[0] ?? null;
  } catch (e) {
    console.error("[home] showcase search unavailable", e);
    return null;
  }
}

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

  const firstCity = cities[0];
  const examplePlz = (firstCity && examples[firstCity.slug]) || "10115";
  const result = await showcaseResult(examplePlz);

  const [heroTitle, heroEmphasis] = splitHeadline(hero.title);
  // Editorial row: lead with established profiles (≥ 3 reviews), keep the backend's quality order otherwise.
  const featured = [...featuredAll].sort((a, b) => Number(b.ratingCount >= 3) - Number(a.ratingCount >= 3)).slice(0, 8);
  const entryCatalog = toEntryCatalog(catalog, floorsById(floors));
  const freeHours = freeCancellationHours(terms.cancellationPolicy);

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

      <DiscoveryHero overline={hero.overline} title={heroTitle} emphasis={heroEmphasis} lead={hero.lead} visual={
          <ArchPair
            className="mx-auto max-w-[36rem] lg:mr-0"
            items={[
              { src: images.hero, alt: "Ein Profi massiert am Abend Schultern und Rücken einer Person auf einer Massageliege, in einem Berliner Altbauzimmer", tone: "massage", place: PLACE_LINES.home },
              { src: images.editorial.after, alt: "Nach der Massage: Eine Frau sitzt mit einer Tasse und einer Decke auf dem Sofa, im Hintergrund legt der Profi das Laken zusammen", tone: "kosmetik", place: PLACE_LINES.after },
            ]}
          />
        }
      >
        <RebookRow />
        <BookingEntry catalog={entryCatalog} postalExample={examplePlz} />
        <ul className="-mt-2 flex flex-wrap gap-x-5 gap-y-2" aria-label="Darauf kannst du dich verlassen">
          {[
            "Geprüfte Profis",
            "Endpreis inkl. Anfahrt",
            freeHours != null && freeHours > 0 ? `Kostenlos stornierbar bis ${hoursLabel(freeHours)} vorher` : null,
          ]
            .filter((x): x is string => !!x)
            .map((x) => (
              <li key={x} className="inline-flex items-center gap-1.5 type-label-s text-ink">
                <span aria-hidden className="inline-flex size-4 items-center justify-center rounded-full bg-success-soft text-success">
                  <Icon icon={Check} size={12} strokeWidth={2.5} />
                </span>
                {x}
              </li>
            ))}
        </ul>
      </DiscoveryHero>

      <Suspense fallback={null}>
        <AccountDeletedToast />
      </Suspense>

      {/* Proof band (R14): real numbers that count up, real quotes */}
      <ProofBand proof={proof} />

      {/* Categories. Every section below the hero is `cv-auto`: rendered only near the viewport (A5-9). */}
      <Section aria-labelledby="behandlungen-titel" className="cv-auto max-md:py-14">
        <Container>
          <Reveal>
            <Rail
              label="Behandlungen"
              header={
                <div className="flex max-w-reading flex-col gap-4">
                  <Overline>Behandlungen</Overline>
                  <h2 id="behandlungen-titel" className="type-display-l">
                    {capitalize(numberWord(catalog.length))} Behandlungen. <em>Ein Ort: deiner.</em>
                  </h2>
                  <p className="type-body-l text-ink-muted">Von Profis, die mitbringen, was die Behandlung braucht – von der Liege bis zur Lampe.</p>
                </div>
              }
            >
              {catalog.map((c) => (
                <CategoryTile key={c.slug} category={c} />
              ))}
            </Rail>
            <Link href={routes.categories()} className="group mt-4 inline-flex min-h-touch items-center gap-2 rounded-full type-label text-ink focus-ring hover:text-link-hover">
              <span className="underline decoration-line-strong decoration-1 underline-offset-[0.2em] group-hover:decoration-current">Alle Behandlungen und Leistungen</span>
              <Icon icon={ArrowRight} size={16} className="transition-transform duration-base ease-settle group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </Container>
      </Section>

      {/* How it works: three steps, each with a piece of the product */}
      <Section aria-labelledby="ablauf-titel" className="cv-auto pt-0 max-md:pb-14">
        <Container>
          <Reveal className="flex max-w-reading flex-col gap-4">
            <Overline>So funktioniert’s</Overline>
            <h2 id="ablauf-titel" className="type-display-l">
              {capitalize(numberWord(steps.length))} Schritte. <em>Kein Weg.</em>
            </h2>
          </Reveal>
          <Reveal as="ol" stagger className="mt-8 grid gap-4 md:mt-12 md:grid-cols-3 lg:gap-6">
            {steps.map((s, i) => (
              <li key={s.title} className="min-w-0">
                <Surface className="flex h-full flex-col gap-5 p-1.5 pb-6">
                  <div className="relative isolate flex h-48 items-center justify-center overflow-hidden rounded-tile px-5 lg:h-56">
                    <ToneFill seed={`schritt-${i}`} tone={["brows-lashes", "massage", "kosmetik"][i % 3]} arch={false} />
                    <div className="relative z-[2] w-full max-w-[18.5rem]">
                      {i === 0 ? (
                        <StepSearch plz={examplePlz} city={firstCity?.name ?? null} categories={catalog.slice(0, 3).map((c) => c.name)} />
                      ) : i === 1 ? (
                        <StepBook result={result} />
                      ) : (
                        <StepArrive />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5 px-4 md:px-5">
                    <p className="flex items-center gap-2.5 type-overline text-ink-muted num">
                      {`Schritt ${i + 1}`}
                    </p>
                    <h3 className="type-heading-l">{s.title}</h3>
                    <p className="type-body text-ink-muted">{s.body}</p>
                  </div>
                </Surface>
              </li>
            ))}
          </Reveal>
        </Container>
      </Section>

      {/* Places: home, hotel, office */}
      <Section aria-labelledby="orte-titel" className="cv-auto pt-0 max-md:pb-14">
        <Container>
          <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-6">
            <div className="flex flex-col gap-5 lg:col-span-6">
              <Overline>Dein Ort</Overline>
              <h2 id="orte-titel" className="type-display-l">
                Zu&nbsp;Hause. Im&nbsp;Hotel. <em>Im&nbsp;Büro.</em>
              </h2>
            </div>
            <p className="max-w-[30rem] type-body-l text-ink-muted lg:col-span-5 lg:col-start-8">
              Du bleibst, wo du bist. Dein Profi kommt – mit allem, was die Behandlung braucht.
            </p>
          </Reveal>
          {/* A5-5: on phones the row scrolls sideways; the region makes it reachable and scrollable by keyboard. */}
          <ScrollRegion
            label="Orte"
            className="@container -mx-(--space-gutter) -my-4 mt-4 flex snap-x snap-mandatory scroll-px-(--space-gutter) overflow-x-auto px-(--space-gutter) pt-4 pb-8 scrollbar-none md:mx-0 md:mt-8 md:block md:snap-none md:overflow-visible md:px-0"
          >
            <Reveal as="ul" stagger aria-label="Orte" className="flex shrink-0 gap-3 md:grid md:grid-cols-3 md:gap-5 lg:gap-6">
              {(
                [
                  { k: "Zu Hause", icon: "zuhause", v: "Wohnung, Etage, Klingelname – mehr braucht es nicht.", src: images.editorial.setup, tone: "massage", place: PLACE_LINES.setup, alt: "Ein Profi klappt neben der Tragetasche eine Massageliege auf, in einem sonnigen Wohnzimmer mit Fischgrätparkett" },
                  { k: "Im Hotel", icon: "hotel", v: "Hotel, Zimmernummer und der Name an der Rezeption – dein Profi findet dich.", src: images.editorial.hotel, tone: "brows-lashes", place: PLACE_LINES.hotel, alt: "Ein Profi massiert am späten Abend einen Gast in einer Hotelsuite, hinter dem Fenster die Frankfurter Skyline" },
                  { k: "Im Büro", icon: "buero", v: "Firma und Empfang angeben. Ideal für die Mittagspause.", src: images.editorial.office, tone: "kosmetik", place: PLACE_LINES.office, alt: "Nackenmassage auf einem Massagestuhl in einem Besprechungsraum am Hamburger Hafen" },
                ] satisfies Array<{ k: string; icon: BrandIconName; v: string; src: string; tone: string; place: string; alt: string }>
              ).map((row) => (
                <li key={row.k} className="w-[84cqw] shrink-0 snap-start md:w-auto md:min-w-0">
                  <Surface as="figure" className="flex h-full flex-col gap-4 p-1.5 pb-5">
                    <Photo src={row.src} alt={row.alt} tone={row.tone} sizes="(min-width: 768px) 30vw, 84vw" className="aspect-[4/3] w-full rounded-tile" />
                    <figcaption className="flex flex-col gap-2 px-3.5">
                      {/* The Ortszeile (brand § 5.2): under the image, aligned to its edge, never on the photo. */}
                      <span className="truncate type-place text-ink-muted">{row.place}</span>
                      <span className="flex items-center gap-2 type-heading-l text-ink">
                        <BrandIcon name={row.icon} size={20} className="text-ink" />
                        {row.k}
                      </span>
                      <span className="type-body-s text-ink-muted">{row.v}</span>
                    </figcaption>
                  </Surface>
                </li>
              ))}
            </Reveal>
          </ScrollRegion>
        </Container>
      </Section>

      {/* Trust + SOMA-Garantie */}
      <Section aria-labelledby="vertrauen-titel" className="cv-auto pt-0 max-md:pb-14">
        <Container>
          {/* One GuaranteePanel, placed by the grid: after the list on phones, under the heading from lg. */}
          <div className="grid gap-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-6">
            <Reveal className="lg:col-span-5">
              <div className="flex flex-col gap-5">
                <Overline>Vertrauen</Overline>
                <h2 id="vertrauen-titel" className="type-display-l">
                  Geprüft, <em>bevor es klingelt.</em>
                </h2>
                <p className="max-w-[28rem] type-body-l text-ink-muted">
                  Wer zu dir nach Hause kommt, muss mehr vorweisen als gute Fotos. Das prüfen wir, bevor jemand buchbar ist. Und stimmt etwas nicht, greift die {BRAND_NAME}-Garantie.
                </p>
              </div>
            </Reveal>
            <Reveal as="ul" stagger className="grid gap-4 sm:grid-cols-2 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:gap-5">
              <TrustItem icon={BadgeCheck} title="Jeder Profi ist geprüft." badge>
                Bevor jemand buchbar ist, prüfen wir {listSentence(terms.baseRequiredDocuments.map((d) => d.label)) || "Identität, Gewerbe und Versicherung"} – und
                je nach Kategorie einen Qualifikationsnachweis.
              </TrustItem>
              <TrustItem icon={ReceiptEuro} title="Endpreis inklusive Anfahrt.">
                In der Suche siehst du für jeden Profi den Endpreis inklusive Anfahrt, bevor du buchst.
                {terms.customerServiceFeeCents === 0 ? " Eine Servicegebühr gibt es nicht." : null}
              </TrustItem>
              <TrustItem icon={CalendarX2} title="Kostenlos stornieren.">
                {freeCancellationSentence(terms.cancellationPolicy)} Solange eine Anfrage noch nicht bestätigt ist, ist sie immer kostenlos.{" "}
                <Link href="/stornierung" className="text-ink underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
                  Stornobedingungen
                </Link>
              </TrustItem>
              <TrustItem icon={CreditCard} title={`Bezahlt wird nur über ${BRAND_NAME}.`}>
                Der Betrag wird bei der Buchung auf deiner Karte reserviert und erst nach dem Termin belastet. Bis {terms.disputeWindowHours}
                {NBSP}Stunden danach halten wir die Auszahlung an den Profi zurück – so greift die {BRAND_NAME}-Garantie, wenn etwas nicht stimmt.
              </TrustItem>
            </Reveal>
            <Reveal className="lg:col-span-5 lg:row-start-2 lg:self-start">
              <GuaranteePanel disputeWindowHours={terms.disputeWindowHours} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Featured professionals */}
      {featured.length > 0 ? (
        <Section aria-labelledby="profis-titel" className="cv-auto pt-0 max-md:pb-14">
          <Container>
            <Reveal>
              <Rail
                label="Ausgewählte Profis"
                header={
                  <div className="flex max-w-reading flex-col gap-4">
                    <Overline>Profis</Overline>
                    <h2 id="profis-titel" className="type-display-l">
                      Wer bei dir <em>klingelt.</em>
                    </h2>
                    <p className="type-body-l text-ink-muted">Selbstständige Profis mit eigener Handschrift. Geprüft, bevor sie buchbar sind – bewertet nur von Menschen, die wirklich gebucht haben.</p>
                  </div>
                }
              >
                {featured.map((p) => (
                  <ProviderPortraitCard key={p.providerId} provider={p} />
                ))}
              </Rail>
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {/* Cities */}
      {cities.length > 0 ? (
        <Section aria-labelledby="staedte-titel" className="cv-auto pt-0 max-md:pb-14">
          <Container>
            <Reveal className="grid gap-8 md:gap-10 lg:grid-cols-12 lg:gap-6">
              <div className="flex flex-col gap-5 lg:col-span-4">
                <Overline>Städte</Overline>
                <h2 id="staedte-titel" className="type-display-l">
                  Jetzt in {numberWord(cities.length)} Städten.
                </h2>
                <p className="type-body text-ink-muted">
                  Deine Stadt ist noch nicht dabei? Gib oben deine Postleitzahl ein – wir sagen dir Bescheid, sobald Profis bei dir buchbar sind.
                </p>
              </div>
              <LinkGrid
                className="lg:col-span-8"
                items={cities.map((c) => {
                  const live = coverage.filter((x) => x.citySlug === c.slug && x.providerCount > 0).length;
                  return {
                    href: routes.city(c.slug),
                    name: c.name,
                    meta: live === catalog.length ? `Alle ${live} Behandlungen` : `${live} von ${catalog.length} Behandlungen`,
                  };
                })}
              />
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {/* For professionals: the page's one night band */}
      <Section aria-labelledby="fuer-profis-titel" className="cv-auto pt-0 max-md:pb-14">
        <Container>
          <Reveal>
            <div data-theme="night" className="relative isolate grid gap-10 overflow-clip rounded-panel [clip-path:inset(0_round_var(--radius-panel))] px-6 py-10 md:px-10 md:py-14 lg:grid-cols-12 lg:items-center lg:gap-6 lg:px-14 lg:py-16">
                <div className="flex flex-col gap-5 lg:col-span-6">
                  <Overline>Für Profis</Overline>
                  <h2 id="fuer-profis-titel" className="type-display-l">
                    Selbstständig, <em>aber nicht allein.</em>
                  </h2>
                  <p className="max-w-[30rem] type-body-l text-ink-muted">
                    Profis legen Preise, Zeiten und Einsatzgebiet selbst fest. {BRAND_NAME} macht sie für Kundschaft in ihrem Einsatzgebiet sichtbar und sichert die Zahlung{NBSP}– auszahlbar{" "}
                    {terms.payoutHoldHours}
                    {NBSP}Stunden nach dem Termin.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-3">
                    <ButtonLink href={routes.forPros()} size="l" iconRight={<Icon icon={ArrowRight} />}>
                      Mehr für Profis
                    </ButtonLink>
                  </div>
                </div>
                <ProSnippet payoutHoldHours={terms.payoutHoldHours} result={result} />
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* FAQ */}
      {faq.length > 0 ? (
        <Section aria-label="Häufige Fragen" className="cv-auto pt-0 max-md:pb-14">
          <Container>
            <Reveal>
              <FaqSection
                items={faq}
                mobileLimit={4}
                aside={
                  <Link href={routes.help()} className="group inline-flex min-h-touch items-center gap-2 rounded-full type-label text-ink focus-ring hover:text-link-hover">
                    <span className="underline decoration-line-strong decoration-1 underline-offset-[0.2em] group-hover:decoration-current">Alle Fragen und Antworten</span>
                    <Icon icon={ArrowRight} size={16} className="transition-transform duration-base ease-settle group-hover:translate-x-0.5" />
                  </Link>
                }
              />
            </Reveal>
          </Container>
        </Section>
      ) : null}
    </>
  );
}

function TrustItem({ icon, title, badge, children }: { icon: LucideIcon; title: string; badge?: boolean; children: ReactNode }) {
  return (
    <li className="min-w-0">
      <Surface className="flex h-full flex-col gap-3 p-5 md:p-6">
        <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-full bg-surface-sunken text-ink">
          <Icon icon={icon} size={20} />
        </span>
        <h3 className="flex flex-wrap items-center gap-2 type-heading-m text-ink">
          {title}
          {badge ? <VerifiedBadge /> : null}
        </h3>
        <p className="type-body-s text-ink-muted">{children}</p>
      </Surface>
    </li>
  );
}

/* --- Product snippets for the three steps (decorative; the facts are real) --- */

function StepSearch({ plz, city, categories }: { plz: string; city: string | null; categories: string[] }) {
  return (
    <div aria-hidden className="flex flex-col gap-2.5 rounded-card bg-surface-raised p-3.5 shadow-float">
      <div className="flex items-center gap-2 rounded-control bg-surface-sunken px-3 py-2">
        <Icon icon={MapPin} size={16} className="text-ink-muted" />
        <span className="type-label-s num">{plz}</span>
        {city ? <span className="truncate type-caption text-ink-muted">{city}</span> : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c, i) => (
          <span
            key={c}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12.5px] leading-none font-[540]",
              i === 0 ? "bg-ink text-ink-inverse shadow-ink" : "border border-line-mid bg-surface-raised text-ink",
            )}
          >
            {i === 0 ? <Icon icon={Check} size={12} strokeWidth={2.5} /> : null}
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function StepBook({ result }: { result: ProviderSearchResult | null }) {
  const soon = Date.now() + 2 * 3_600_000;
  const slots = (result?.nextSlots ?? []).filter((s) => new Date(s).getTime() > soon).slice(0, 2);
  if (!result) {
    return (
      <div aria-hidden className="flex items-center gap-3 rounded-card bg-surface-raised p-3.5 shadow-float">
        <SuccessCheck size={32} glow={false} tone="accent" />
        <p className="type-label-s">Endpreis inkl. Anfahrt</p>
      </div>
    );
  }
  return (
    <div aria-hidden className="flex flex-col gap-3 rounded-card bg-surface-raised p-3.5 shadow-float">
      <div className="flex items-center gap-2.5">
        <Avatar src={result.avatarUrl} name={result.displayName} size={32} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate type-label-s">{result.displayName}</span>
          <AiLabel src={result.avatarUrl} />
        </span>
        <span className="type-label-s num">{formatPrice(result.totalPriceCents)}</span>
      </div>
      <div className="flex gap-1.5">
        {slots.map((s, i) => (
          <span
            key={s}
            className={cn(
              "inline-flex h-7 items-center rounded-[10px] px-2.5 text-[12.5px] leading-none font-[540] num",
              i === 0 ? "bg-ink text-ink-inverse shadow-ink" : "border border-line-mid bg-surface-raised text-ink",
            )}
          >
            {`${formatDayShort(s).replace(/,.*/, "")} ${formatTime(s)}`}
          </span>
        ))}
      </div>
      <p className="type-caption text-ink-muted">{`inkl.${NBSP}Anfahrt · sicher bezahlt über ${BRAND_NAME}`}</p>
    </div>
  );
}

function StepArrive() {
  return (
    <div aria-hidden className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3 rounded-card bg-surface-raised p-3 shadow-float">
        <SuccessCheck size={32} glow={false} />
        <div className="min-w-0">
          <p className="type-label-s">Dein Profi ist da.</p>
          <p className="truncate type-caption text-ink-muted">{PLACE_LINES.home}</p>
        </div>
      </div>
      <div className="ml-6 flex items-center justify-between gap-3 rounded-card bg-surface-raised px-3.5 py-2.5 shadow-float">
        <span className="type-caption text-ink-muted">Start-Code</span>
        <span className="flex gap-1">
          {["4", "8", "2", "7"].map((d, i) => (
            <span key={i} className="inline-flex h-7 w-6 items-center justify-center rounded-[8px] bg-surface-sunken type-label-s num">
              {d}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

function ProSnippet({ payoutHoldHours, result }: { payoutHoldHours: number; result: ProviderSearchResult | null }) {
  return (
    <div aria-hidden className="relative mx-auto flex w-full max-w-[24rem] flex-col gap-3 lg:col-span-5 lg:col-start-8">
      <div className="flex flex-col gap-3 rounded-card bg-surface-raised p-4 shadow-float">
        <div className="flex items-center justify-between gap-3">
          <span className="type-overline text-ink-muted">Neue Anfrage</span>
          <span className="inline-flex h-6 items-center rounded-full bg-surface-sunken px-2.5 type-label-s text-ink-muted">Beispiel</span>
        </div>
        <p className="type-heading-m">{result ? `${result.offering.serviceName}` : "Entspannungsmassage"}</p>
        <div className="flex gap-2">
          <span className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-ink type-label-s text-ink-inverse shadow-ink">Annehmen</span>
          <span className="inline-flex h-9 flex-1 items-center justify-center rounded-full ring-1 ring-line-mid type-label-s">Ablehnen</span>
        </div>
      </div>
      <div className="ml-8 flex items-center gap-3 rounded-card bg-surface-raised p-3.5 shadow-float">
        <SuccessCheck size={32} glow={false} />
        <div>
          <p className="type-label-s">Auszahlung</p>
          <p className="type-caption text-ink-muted">{`${payoutHoldHours}${NBSP}Stunden nach dem Termin`}</p>
        </div>
      </div>
    </div>
  );
}

/** "A, B und C" */
function listSentence(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} und ${items[items.length - 1]}`;
}
