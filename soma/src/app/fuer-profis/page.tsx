import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, CalendarCheck, Check, KeyRound, Link2, MapPin, MapPinned, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";
import { formatPercent } from "@/components/pro/labels";
import { EarningsCalculator } from "@/components/pro/landing/earnings-calculator";
import { ButtonLink } from "@/components/ui/button";
import { Table } from "@/components/ui/data";
import { Reveal } from "@/components/ui/motion";
import { FormattedNumber } from "@/components/ui/number";
import { Surface } from "@/components/ui/surface";
import { FaqList } from "@/components/site/discovery-faq";
import { Icon } from "@/components/ui/icon";
import { Container, Overline, Section, SectionHeader } from "@/components/ui/layout";
import { AiLabel } from "@/components/ui/ai-label";
import { Photo } from "@/components/ui/photo";
import { PLACE_LINES } from "@/components/site/discovery-copy";
import { BRAND_NAME } from "@/lib/brand";
import { images } from "@/lib/images";
import { routes } from "@/lib/routes";
import { listCategories, listCities } from "@/server/services/catalog";
import { cn } from "@/lib/cn";
import { getProviderTerms } from "@/server/services/pro-ext";
import { getDemandByCity } from "@/server/services/site-ext-2";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Für Profis – Dein Können. Deine Preise. Deine Zeiten.",
  description: `${BRAND_NAME} für Profis: Werde von Kundschaft in deinem Einsatzgebiet gefunden – zu Hause, im Hotel und im Büro. Keine Grundgebühr, transparente Provision, eigene Preise und Zeiten.`,
  alternates: { canonical: routes.forPros() },
};

const REGISTER = routes.pro.onboarding();

export default async function ForProsPage() {
  const [terms, categories, cities, demand] = await Promise.all([
    getProviderTerms(),
    listCategories(),
    listCities(),
    // Live demand is a bonus: the page stays complete without it.
    getDemandByCity({ days: 30 }).catch((e) => {
      console.error("[fuer-profis] demand unavailable", e);
      return null;
    }),
  ]);
  const c = terms.commission ?? { rate: 0.2, repeatClientRate: 0.12, ownClientRate: 0.05 };
  const hold = terms.payoutHoldHours;
  const tiers = [...terms.cancellationPolicy.tiers].sort((a, b) => b.minHoursBefore - a.minHoursBefore);
  const freeHours = tiers.find((t) => t.feePercent === 0)?.minHoursBefore ?? 24;
  const partial = tiers.find((t) => t.feePercent > 0 && t.feePercent < 100);
  const full = tiers.find((t) => t.feePercent === 100);
  const pct = (n: number) => `${n}\u00a0%`;
  const cancelText = `Sagt Kundschaft weniger als ${freeHours}\u00a0Stunden vorher ab, wird eine Gebühr auf den Behandlungspreis fällig${
    partial ? ` (${pct(partial.feePercent)}${full && partial.minHoursBefore > 0 ? `, unter ${partial.minHoursBefore}\u00a0Stunden ${pct(full.feePercent)} plus Anfahrt` : ""})` : ""
  }. Bei Nichterscheinen sind es ${pct(terms.cancellationPolicy.noShowFeePercent)} plus Anfahrt.`;
  const demandRows = demand?.cities.filter((x) => x.searches > 0 || x.waitlistSignups > 0) ?? [];
  const totalSearches = demandRows.reduce((a, x) => a + x.searches, 0);
  const n = (v: number) => v.toLocaleString("de-DE");
  const activeCities = cities.filter((x) => x.isActive);
  const cityList = activeCities.map((x) => x.name);
  const cityText = cityList.length > 1 ? `${cityList.slice(0, -1).join(", ")} und ${cityList[cityList.length - 1]}` : cityList.join("");
  const catDocs = categories.filter((x) => x.requiredDocuments.length > 0);

  const benefits: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: MapPinned, title: "Gefunden werden", body: "Du erscheinst in Suchen in deinem Radius – mit deinem Endpreis inklusive Anfahrt. Ohne Werbekosten und ohne bezahlte Platzierung." },
    { icon: Wallet, title: "Bezahlt wird über SOMA", body: `Nicht an der Tür: Bei der Buchung wird der Betrag auf der Karte der Kundschaft reserviert und nach dem Termin belastet. Dein Anteil ist ${hold}\u00a0Stunden später verfügbar.` },
    { icon: CalendarCheck, title: "Du bestimmst", body: "Preise, Radius, Arbeitszeiten und Puffer legst du fest. Anfragen nimmst du an oder lehnst sie ab." },
    { icon: ShieldCheck, title: "Schutz bei kurzfristigen Absagen", body: cancelText },
    { icon: KeyRound, title: "Start-Code statt Diskussion", body: "Vor Ort startest du mit dem vierstelligen Code der Kundschaft. So ist belegt, dass du da warst." },
    { icon: BadgeCheck, title: "Ein geprüftes Netzwerk", body: "Jedes Profil ist geprüft, jede Buchung läuft über Konto und Karte. Du siehst vorab, wie oft jemand schon über SOMA gebucht hat." },
  ];

  const steps = [
    { n: "01", title: "Registrieren", body: "Konto, Profil, Leistungen, Preise und Arbeitszeiten. Jeder Schritt wird gespeichert, du kannst jederzeit unterbrechen." },
    { n: "02", title: "Verifizieren", body: "Ausweis, Gewerbeanmeldung, Haftpflicht und – je nach Kategorie – deinen Qualifikationsnachweis hochladen. Wir melden uns, sobald alles geprüft ist." },
    { n: "03", title: "Anfragen annehmen", body: "Du siehst Leistung, Zeit, Entfernung und deinen Verdienst – und entscheidest. Die Adresse siehst du, sobald der Termin bestätigt ist." },
    { n: "04", title: "Arbeiten, ausgezahlt werden", body: `Vor Ort mit Start-Code beginnen, danach abschließen. ${hold}\u00a0Stunden später ist dein Anteil verfügbar.` },
  ];

  const faq: { q: string; a: string }[] = [
    {
      q: "Was kostet mich SOMA?",
      a: `Keine Grundgebühr, keine Mindestlaufzeit. Provision zahlst du nur auf das, was du über SOMA verdienst: ${formatPercent(c.rate)} bei neuer Kundschaft, ${formatPercent(c.repeatClientRate)} bei Stammkundschaft und ${formatPercent(c.ownClientRate)} bei Kundschaft, die du über deinen persönlichen Link mitbringst. Auf die Anfahrt fällt keine Provision an.`,
    },
    {
      q: "Wann bekomme ich mein Geld?",
      a: `Bei der Buchung wird der Betrag auf der Karte der Kundschaft reserviert und nach dem Termin belastet; dein Anteil ist ${hold}\u00a0Stunden später verfügbar, sofern kein Einspruch eingeht, und wird über unseren Zahlungspartner Stripe auf dein Konto überwiesen.`,
    },
    { q: "Was passiert, wenn Kundschaft absagt oder nicht da ist?", a: `${cancelText} Du erhältst deinen Anteil an der Gebühr. Musst du selbst absagen, entstehen der Kundschaft keine Kosten.` },
    {
      q: "Muss ich jede Anfrage annehmen?",
      a: "Nein. Im Modus „Auf Anfrage“ nimmst du an oder lehnst mit kurzer Begründung ab – innerhalb der angezeigten Antwortfrist. Nach drei abgeschlossenen Terminen kannst du auf Sofortbuchung umstellen.",
    },
    {
      q: "Brauche ich ein Gewerbe?",
      a: "Ja. Auf SOMA arbeiten selbstständige Profis mit Gewerbeanmeldung, die Kleinunternehmerregelung ist möglich. Für Haare & Styling brauchst du zusätzlich einen Meisterbrief oder die Eintragung in die Handwerksrolle.",
    },
    { q: "Welche Versicherung brauche ich?", a: "Eine Berufs- bzw. Betriebshaftpflichtversicherung, die Behandlungen bei Kundschaft vor Ort abdeckt. Den Nachweis lädst du bei der Registrierung hoch." },
    {
      q: "Kann ich meine bestehende Kundschaft mitbringen?",
      a: `Ja. Mit deinem persönlichen Einladungslink bucht deine Stammkundschaft dich über SOMA – für dauerhaft nur ${formatPercent(c.ownClientRate)} Provision. Deine Kundschaft bekommt Erinnerungen, sichere Zahlung und Absicherung, du sparst dir Zahlungserinnerungen und Nachfragen.`,
    },
    {
      q: "Wer sieht meine Adresse – und wann sehe ich die der Kundschaft?",
      a: "Deine Adresse ist nie öffentlich, wir rechnen die Entfernung über die Postleitzahl. Die genaue Adresse der Kundschaft siehst du erst, wenn der Termin bestätigt ist.",
    },
    { q: "Welche Leistungen sind auf SOMA nicht möglich?", a: "Medizinische und therapeutische Leistungen wie Physiotherapie, Podologie oder Heilpraktik. Werbung mit Heilversprechen ist nicht erlaubt – SOMA steht für Beauty und Wellness." },
    // Zero-tolerance rule (BRAND_VOICE § 7.9 P5, client-approved 2026-11-01).
    {
      q: "Was, wenn ich mich bei einem Termin unwohl fühle?",
      a: "SOMA vermittelt ausschließlich Wellness- und Beautybehandlungen. Anzügliche Anfragen oder Bemerkungen führen zur Sperrung des Kontos. Fühlst du dich bei einem Termin unwohl, darfst du gehen. Melde es uns – wir kümmern uns darum.",
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  const tiersShown = [
    { value: c.rate, label: "nur bei neuer Kundschaft" },
    { value: c.repeatClientRate, label: "bei Stammkundschaft" },
    { value: c.ownClientRate, label: "mit deinem Link" },
    { value: 0, label: "auf Anfahrt" },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero: text + an editorial photograph in the arch */}
      <section className="relative isolate overflow-clip">
        <Container className="grid gap-12 pt-8 pb-14 md:pt-12 lg:grid-cols-12 lg:items-center lg:gap-6 lg:pt-12 lg:pb-20">
          <div className="flex flex-col gap-6 lg:col-span-6">
            <Overline>{BRAND_NAME} für Profis · {activeCities.length} Städte</Overline>
            <h1 className="type-display-l">
              Dein Können. Deine Preise. <em>Deine Zeiten.</em>
            </h1>
            <p className="max-w-reading type-body-l text-ink-muted">
              {BRAND_NAME} macht dich für Kundschaft in deinem Einsatzgebiet sichtbar und kümmert sich um Buchung, Zahlung und Stornofristen – zu Hause, im Hotel, im Büro. Du bestimmst Preise, Radius und Zeiten.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href={REGISTER} variant="accent" size="l" iconRight={<Icon icon={ArrowRight} />}>
                Profi werden
              </ButtonLink>
              <ButtonLink href="#so-funktionierts" size="l" variant="ghost">
                So funktioniert’s
              </ButtonLink>
            </div>
            <div className="mt-2 flex flex-col gap-3">
              <dl className="grid grid-cols-2 rounded-card bg-surface-raised shadow-raised sm:grid-cols-4">
                {tiersShown.map((f, i) => (
                  <div
                    key={f.label}
                    className={cn(
                      "relative flex min-w-0 flex-col gap-1 px-4 py-4",
                      i % 2 === 1 && "before:absolute before:inset-y-4 before:left-0 before:w-px before:bg-line",
                      i >= 2 && "max-sm:border-t max-sm:border-line",
                      i === 2 && "sm:before:absolute sm:before:inset-y-4 sm:before:left-0 sm:before:w-px sm:before:bg-line",
                    )}
                  >
                    <dt className="order-2 type-caption text-ink-muted hyphens-none">{f.label}</dt>
                    <dd className="order-1 type-stat">
                      <FormattedNumber value={Math.round(f.value * 1000) / 10} format={{ maximumFractionDigits: 1 }} suffix={" %"} />
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="type-caption text-ink-muted">{`Keine Grundgebühr, keine Laufzeit. Dein Anteil ist ${hold}\u00a0Stunden nach dem Termin verfügbar.`}</p>
            </div>
          </div>
          {/* The place, not a dashboard: one editorial photograph in the arch with its Ortszeile (brand § 10.1). */}
          <figure className="mx-auto w-full max-w-[26rem] min-w-0 lg:col-span-5 lg:col-start-8">
            <Photo
              src={images.editorial.setup}
              alt="Ein Profi klappt die mobile Massageliege im Wohnzimmer einer Kundin auf"
              tone="massage"
              shape="arch"
              ratio="4/5"
              priority
              sizes="(min-width: 1024px) 26rem, 88vw"
              className="w-full"
            />
            <figcaption className="mt-3 flex flex-col gap-1">
              <span className="type-place text-ink-muted">{PLACE_LINES.setup}</span>
              <AiLabel src={images.editorial.setup} kind="image" />
            </figcaption>
          </figure>
        </Container>
      </section>

      {/* Benefits */}
      <Section>
        <Container className="flex flex-col gap-10 md:gap-12">
          <Reveal>
            <SectionHeader overline="Was du bekommst" title={<>Mehr Zeit für die Arbeit, weniger fürs Drumherum.</>} />
          </Reveal>
          <Reveal as="ul" stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {benefits.map((b) => (
              <li key={b.title} className="min-w-0">
                <Surface className="flex h-full flex-col gap-3 p-5 md:p-6">
                  <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-full bg-surface-sunken text-ink">
                    <Icon icon={b.icon} size={20} />
                  </span>
                  <h3 className="type-heading-m">{b.title}</h3>
                  <p className="type-body-s text-ink-muted">{b.body}</p>
                </Surface>
              </li>
            ))}
          </Reveal>
        </Container>
      </Section>

      {/* Commission + calculator */}
      <Section id="provision" className="pt-0">
        <Container className="grid gap-10 lg:grid-cols-12 lg:gap-6">
          <Reveal className="flex flex-col gap-8 lg:col-span-6">
            <SectionHeader
              overline="Provision"
              title={<>Transparent. Ohne Grundgebühr.</>}
              lead="Provision nur auf das, was du über SOMA verdienst. Je enger die Beziehung zur Kundschaft, desto weniger."
            />
            <dl className="flex flex-col divide-y divide-line rounded-card bg-surface-raised px-5 shadow-raised md:px-6">
              {[
                { rate: formatPercent(c.rate), title: "Neue Kundschaft über SOMA", body: "Die erste Buchung einer Person bei dir." },
                { rate: formatPercent(c.repeatClientRate), title: "Stammkundschaft", body: "Jede weitere Buchung derselben Person über SOMA." },
                { rate: formatPercent(c.ownClientRate), title: "Eigene Kundschaft", body: "Kommt über deinen persönlichen Einladungslink – dauerhaft." },
                { rate: "0 %", title: "Anfahrt", body: "Die Anfahrtspauschale geht immer vollständig an dich." },
              ].map((r) => (
                <div key={r.title} className="grid grid-cols-[5.5rem_1fr] items-baseline gap-x-6 py-5 md:grid-cols-[7rem_1fr]">
                  <dd className="type-stat">{r.rate}</dd>
                  <dt className="flex flex-col gap-1">
                    <span className="type-heading-m">{r.title}</span>
                    <span className="type-body-s text-ink-muted">{r.body}</span>
                  </dt>
                </div>
              ))}
            </dl>
            <p className="type-caption text-ink-muted">
              {terms.commission ? "Aktuelle Konditionen zum Start." : "Konditionen zum Start."} Für Kundschaft fällt keine Servicegebühr an. Jede Buchung behält die Provision, die beim Buchen galt.
            </p>
          </Reveal>
          <Reveal className="flex flex-col gap-4 lg:col-span-6 lg:pl-6" delay={80}>
            <h3 className="flex items-center gap-2.5 type-heading-m">
              Rechne nach
            </h3>
            <EarningsCalculator rates={c} />
          </Reveal>
        </Container>
      </Section>

      {/* How it works */}
      <Section id="so-funktionierts" className="scroll-mt-(--header-height) pt-0">
        <Container className="flex flex-col gap-10 md:gap-12">
          <Reveal>
            <SectionHeader overline="So funktioniert’s" title={<>In vier Schritten startklar.</>} />
          </Reveal>
          <Reveal as="ol" stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {steps.map((s) => (
              <li key={s.n} className="min-w-0">
                <Surface className="flex h-full flex-col gap-3 p-5 md:p-6">
                  <span className="flex items-center gap-2.5 type-overline text-ink-muted num">
                    {s.n}
                  </span>
                  <h3 className="type-heading-m">{s.title}</h3>
                  <p className="type-body-s text-ink-muted">{s.body}</p>
                </Surface>
              </li>
            ))}
          </Reveal>
        </Container>
      </Section>

      {/* Requirements */}
      <Section className="pt-0">
        <Container className="grid gap-10 lg:grid-cols-12 lg:gap-6">
          <Reveal className="lg:col-span-5">
            <SectionHeader
              size="m"
              overline="Voraussetzungen"
              title={<>Was du mitbringst.</>}
              lead="Du arbeitest in privaten Wohnungen, Hotels und Büros. Deshalb prüfen wir jedes Profil, bevor es sichtbar wird."
            />
          </Reveal>
          <Reveal className="flex flex-col gap-8 lg:col-span-6 lg:col-start-7">
            <div className="flex flex-col gap-3">
              <h3 className="type-overline text-ink-muted">Für alle Profis</h3>
              <ul className="flex flex-col divide-y divide-line rounded-card bg-surface-raised px-5 shadow-raised">
                {[...terms.baseRequiredDocuments.map((d) => ({ key: d.kind, label: d.label })), { key: "gewerbe", label: "Selbstständige Tätigkeit (Kleinunternehmerregelung möglich)" }].map((d) => (
                  <li key={d.key} className="flex items-start gap-3 py-3.5 type-body text-ink">
                    <span aria-hidden className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                      <Icon icon={Check} size={12} strokeWidth={2.5} />
                    </span>
                    {d.label}
                  </li>
                ))}
              </ul>
            </div>
            {catDocs.length ? (
              <div className="flex flex-col gap-3">
                <h3 className="type-overline text-ink-muted">Je nach Kategorie</h3>
                <dl className="flex flex-col divide-y divide-line rounded-card bg-surface-raised px-5 shadow-raised">
                  {catDocs.map((cat) => (
                    <div key={cat.id} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                      <dt className="shrink-0 type-label">{cat.name}</dt>
                      <dd className="type-body-s text-ink-muted sm:text-right">{cat.requiredDocuments.map((d) => d.label).join(", ")}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </Reveal>
        </Container>
      </Section>

      {/* The page's one night band: invite link */}
      <Section className="pt-0">
        <Container>
          <Reveal>
            <div data-theme="night" className="relative isolate grid gap-10 overflow-clip rounded-panel px-6 py-10 md:px-10 md:py-14 lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-14 lg:py-16">
              <div className="flex flex-col gap-6 lg:col-span-5">
                <Overline>Einladungslink</Overline>
                <h2 className="type-display-l">
                  Bring deine Stamm&shy;kundschaft mit. Für {formatPercent(c.ownClientRate)}.
                </h2>
                <p className="type-body-l text-ink-muted">
                  Über deinen persönlichen Link bucht deine Kundschaft dich direkt – mit sicherer Zahlung, Erinnerungen und Absicherung. Du zahlst dafür dauerhaft nur {formatPercent(c.ownClientRate)} Provision.
                </p>
                <ButtonLink href={REGISTER} size="l" className="self-start" iconRight={<Icon icon={ArrowRight} />}>
                  Profi werden
                </ButtonLink>
              </div>
              <figure className="relative flex flex-col gap-3 lg:col-span-7">
                <Photo
                  src={images.editorial.providerCta}
                  alt="Ein Profi mit Arbeitstasche auf der Altbautreppe, unterwegs zum nächsten Termin"
                  tone="nacht"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  ratio="16/10"
                  className="rounded-card"
                />
                <div aria-hidden className="absolute top-4 right-4 flex items-center gap-2.5 rounded-card bg-surface-raised px-3.5 py-2.5 shadow-float">
                  <Icon icon={Link2} size={16} className="text-ink" />
                  <span className="type-label-s num">{`Dein Einladungslink · ${formatPercent(c.ownClientRate)}`}</span>
                </div>
                <figcaption className="flex flex-col gap-1">
                  <span className="type-place text-ink-muted">Treppenhaus, 2. OG · Berlin-Neukölln · 17:40</span>
                  <AiLabel src={images.editorial.providerCta} kind="image" />
                </figcaption>
              </figure>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Live demand per launch city (R15) */}
      {demandRows.length && demand ? (
        <Section id="nachfrage" aria-labelledby="nachfrage-titel" className="pt-0">
          <Container className="grid gap-10 lg:grid-cols-12 lg:gap-6">
            <Reveal className="flex flex-col gap-5 lg:col-span-5">
              <Overline>Nachfrage</Overline>
              <h2 id="nachfrage-titel" className="type-display-l">
                Gesucht wird schon.
              </h2>
              <p className="max-w-reading type-body-l text-ink-muted">
                {`${n(totalSearches)} Suchen nach Behandlungen in den letzten ${demand.days} Tagen. Auf der Warteliste stehen Menschen, die in ihrer Nähe noch niemanden gefunden haben.`}
              </p>
            </Reveal>
            <Reveal className="flex min-w-0 flex-col gap-3 lg:col-span-6 lg:col-start-7">
              <Table>
                <caption className="sr-only">{`Suchen der letzten ${demand.days} Tage, Warteliste und Profis pro Stadt`}</caption>
                <thead>
                  <tr>
                    <th scope="col">Stadt</th>
                    <th scope="col" className="text-right">
                      Suchen
                    </th>
                    <th scope="col" className="text-right">
                      Warteliste
                    </th>
                    <th scope="col" className="text-right">
                      Profis
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {demandRows.map((r) => {
                    const max = Math.max(...demandRows.map((x) => x.searches), 1);
                    return (
                      <tr key={r.citySlug}>
                        <td className="text-ink hyphens-none">
                          <span className="flex flex-col gap-1.5 py-2">
                            {r.cityName}
                            <span aria-hidden className="block h-1 w-full max-w-40 overflow-hidden rounded-full bg-surface-sunken">
                              <span className="block h-full rounded-full bg-chart-1" style={{ width: `${Math.max(4, Math.round((r.searches / max) * 100))}%` }} />
                            </span>
                          </span>
                        </td>
                        <td className="text-right type-label num">{n(r.searches)}</td>
                        <td className="text-right text-ink-muted num">{n(r.waitlistSignups)}</td>
                        <td className="text-right text-ink-muted num">{n(r.approvedProviders)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              <p className="type-caption text-ink-muted">{`Suchen der letzten ${demand.days} Tage in der ${BRAND_NAME}-Suche, stündlich aktualisiert. „Profis“ zählt freigeschaltete Profile mit Standort in der Stadt.`}</p>
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {/* Cities */}
      <Section className="pt-0">
        <Container>
          <Reveal className="flex flex-col gap-5">
            <Overline>Wo wir starten</Overline>
            <p className="max-w-[48rem] type-display-m">
              Jetzt in {cityText}. <span className="text-ink-muted">Weitere Städte folgen.</span>
            </p>
            <ul className="flex flex-wrap gap-2" aria-label="Startstädte">
              {activeCities.map((x) => (
                <li key={x.slug} className="inline-flex h-9 items-center gap-2 rounded-full bg-surface-raised px-3.5 type-label-s text-ink shadow-raised">
                  <Icon icon={MapPin} size={14} className="text-ink" />
                  {x.name}
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="pt-0">
        <Container className="grid gap-10 lg:grid-cols-12 lg:gap-6">
          <Reveal className="lg:col-span-4">
            <SectionHeader size="m" overline="Fragen" title="Gut zu wissen." />
          </Reveal>
          <Reveal className="lg:col-span-7 lg:col-start-6">
            <FaqList items={faq} />
          </Reveal>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section className="pt-0">
        <Container>
          <Reveal className="relative isolate flex flex-col items-start gap-6 overflow-clip rounded-panel p-6 md:flex-row md:items-end md:justify-between md:p-12">
            <div className="flex max-w-reading flex-col gap-4">
              <Overline>Registrierung</Overline>
              <h2 className="type-display-l">
                Schritt für Schritt startklar.
              </h2>
              <p className="type-body-l text-ink-muted">Konto anlegen, Profil einrichten, Dokumente hochladen. Wir melden uns, sobald du freigeschaltet bist.</p>
            </div>
            <ButtonLink href={REGISTER} size="l" iconRight={<Icon icon={ArrowRight} />}>
              Profi werden
            </ButtonLink>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}

