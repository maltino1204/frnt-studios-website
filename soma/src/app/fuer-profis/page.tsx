import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, CalendarCheck, KeyRound, MapPinned, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";
import { formatPercent } from "@/components/pro/labels";
import { EarningsCalculator } from "@/components/pro/landing/earnings-calculator";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container, Overline, Section, SectionHeader } from "@/components/ui/layout";
import { Photo } from "@/components/ui/photo";
import { BRAND_NAME } from "@/lib/brand";
import { images } from "@/lib/images";
import { routes } from "@/lib/routes";
import { listCategories, listCities } from "@/server/services/catalog";
import { getProviderTerms } from "@/server/services/pro-ext";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Für Profis – Kundschaft in deiner Nähe",
  description: `Als selbstständiger Beauty- oder Wellness-Profi mit ${BRAND_NAME} Termine bei Kundschaft zu Hause, im Hotel und im Büro: transparente Provision, Auszahlung 48 Stunden nach dem Termin, eigene Preise und Zeiten.`,
  alternates: { canonical: routes.forPros() },
};

const REGISTER = routes.pro.onboarding();

export default async function ForProsPage() {
  const [terms, categories, cities] = await Promise.all([getProviderTerms(), listCategories(), listCities()]);
  const c = terms.commission ?? { rate: 0.2, repeatClientRate: 0.12, ownClientRate: 0.05 };
  const hold = terms.payoutHoldHours;
  const tiers = [...terms.cancellationPolicy.tiers].sort((a, b) => b.minHoursBefore - a.minHoursBefore);
  const freeHours = tiers.find((t) => t.feePercent === 0)?.minHoursBefore ?? 24;
  const partial = tiers.find((t) => t.feePercent > 0 && t.feePercent < 100);
  const full = tiers.find((t) => t.feePercent === 100);
  const pct = (n: number) => `${n}\u00a0%`;
  const cancelText = `Sagt Kundschaft weniger als ${freeHours} Stunden vorher ab, wird eine Gebühr fällig${
    partial ? ` (${pct(partial.feePercent)}${full && partial.minHoursBefore > 0 ? `, unter ${partial.minHoursBefore} Stunden ${pct(full.feePercent)}` : ""})` : ""
  }. Bei Nichterscheinen sind es ${pct(terms.cancellationPolicy.noShowFeePercent)}.`;
  const activeCities = cities.filter((x) => x.isActive);
  const cityList = activeCities.map((x) => x.name);
  const cityText = cityList.length > 1 ? `${cityList.slice(0, -1).join(", ")} und ${cityList[cityList.length - 1]}` : cityList.join("");
  const catDocs = categories.filter((x) => x.requiredDocuments.length > 0);

  const benefits: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: MapPinned, title: "Kundschaft in deiner Nähe", body: "Du erscheinst in Suchen innerhalb deines Radius – mit Endpreis inklusive Anfahrt. Keine Werbung, keine Akquise." },
    { icon: Wallet, title: "Bezahlt, bevor du klingelst", body: `Die Zahlung ist bei der Buchung hinterlegt. Nach dem Termin wird sie eingezogen, dein Anteil ist ${hold} Stunden später verfügbar.` },
    { icon: CalendarCheck, title: "Du bestimmst", body: "Preise, Radius, Arbeitszeiten und Puffer legst du fest. Anfragen nimmst du an oder lehnst sie ab." },
    { icon: ShieldCheck, title: "Schutz bei kurzfristigen Absagen", body: cancelText },
    { icon: KeyRound, title: "Start-Code statt Diskussion", body: "Vor Ort startest du mit dem vierstelligen Code der Kundschaft. So ist belegt, dass du da warst." },
    { icon: BadgeCheck, title: "Ein geprüftes Netzwerk", body: "Jedes Profil ist verifiziert, jede Buchung läuft über Konto und Karte. Du siehst vorab, wie oft jemand schon über SOMA gebucht hat." },
  ];

  const steps = [
    { n: "01", title: "Registrieren", body: "Konto, Profil, Leistungen, Preise und Arbeitszeiten. Dauert etwa 15 Minuten, jeder Schritt wird gespeichert." },
    { n: "02", title: "Verifizieren", body: "Ausweis, Gewerbeanmeldung, Haftpflicht und Qualifikation hochladen. Wir prüfen meist innerhalb von 48 Stunden." },
    { n: "03", title: "Anfragen annehmen", body: "Du siehst Leistung, Zeit, Entfernung und deinen Verdienst – und entscheidest. Die Adresse siehst du nach deiner Zusage." },
    { n: "04", title: "Arbeiten, ausgezahlt werden", body: `Vor Ort mit Start-Code beginnen, danach abschließen. ${hold} Stunden später ist dein Geld verfügbar.` },
  ];

  const faq: { q: string; a: string }[] = [
    {
      q: "Was kostet mich SOMA?",
      a: `Keine Grundgebühr, keine Mindestlaufzeit. Du zahlst Provision nur auf vermittelte Behandlungen: ${formatPercent(c.rate)} bei neuer Kundschaft, ${formatPercent(c.repeatClientRate)} bei Stammkundschaft und ${formatPercent(c.ownClientRate)} bei Kundschaft, die du über deinen persönlichen Link mitbringst. Auf die Anfahrt fällt keine Provision an.`,
    },
    {
      q: "Wann bekomme ich mein Geld?",
      a: `Die Kundschaft hinterlegt die Zahlung bei der Buchung. Nach dem Termin wird sie eingezogen; dein Anteil ist ${hold} Stunden später verfügbar, sofern kein Einspruch eingeht, und wird über unseren Zahlungspartner Stripe auf dein Konto überwiesen.`,
    },
    { q: "Was passiert, wenn Kundschaft absagt oder nicht da ist?", a: `${cancelText} Du erhältst deinen Anteil an der Gebühr. Musst du selbst absagen, bekommt die Kundschaft den vollen Betrag zurück.` },
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
      a: `Ja. Mit deinem persönlichen Einladungslink buchen deine Stammkund:innen dich über SOMA – für dauerhaft nur ${formatPercent(c.ownClientRate)} Provision. Sie bekommen Erinnerungen, sichere Zahlung und Absicherung, du sparst dir Rechnungen und Nachfragen.`,
    },
    {
      q: "Wer sieht meine Adresse – und wann sehe ich die der Kundschaft?",
      a: "Deine Adresse ist nie öffentlich, wir rechnen die Entfernung über die Postleitzahl. Die genaue Adresse der Kundschaft siehst du erst, wenn der Termin bestätigt ist.",
    },
    { q: "Welche Leistungen sind auf SOMA nicht möglich?", a: "Medizinische und therapeutische Leistungen wie Physiotherapie, Podologie oder Heilpraktik. Werbung mit Heilversprechen ist nicht erlaubt – SOMA steht für Beauty und Wellness." },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <section className="pt-8 pb-(--space-section) md:pt-12">
        <Container className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
          <div className="flex flex-col gap-6 lg:col-span-6">
            <Overline>Für Profis · {activeCities.length} Städte</Overline>
            <h1 className="type-display-l">
              Du bringst das Können. <em className="italic">Wir die Kundschaft.</em>
            </h1>
            <p className="max-w-reading type-body-l text-ink-muted">
              {BRAND_NAME} vermittelt dir bezahlte Termine bei Kundschaft in deiner Nähe – zu Hause, im Hotel, im Büro. Du bestimmst Preise, Radius und Zeiten.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href={REGISTER} size="l" iconRight={<Icon icon={ArrowRight} />}>
                Jetzt registrieren
              </ButtonLink>
              <ButtonLink href="#so-funktionierts" size="l" variant="ghost">
                So funktioniert’s
              </ButtonLink>
            </div>
            <dl className="mt-4 grid grid-cols-3 border-y border-line">
              {[
                { value: formatPercent(c.ownClientRate), label: "Provision ab", note: "für eigene Kundschaft" },
                { value: `${hold} Std.`, label: "Auszahlung", note: "nach dem Termin" },
                { value: "0 €", label: "Grundgebühr", note: "keine Laufzeit" },
              ].map((f, i) => (
                <div key={f.label} className={i > 0 ? "flex flex-col gap-1 border-l border-line py-4 pl-4" : "flex flex-col gap-1 py-4 pr-4"}>
                  <dt className="order-2 type-caption text-ink-muted">
                    {f.label} <span className="hidden sm:inline">· {f.note}</span>
                  </dt>
                  <dd className="order-1 type-stat">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <figure className="-mx-(--space-gutter) flex flex-col gap-3 lg:col-span-6 lg:mx-0 lg:-mr-(--space-gutter)">
            <Photo
              src={images.editorial.arrival}
              alt="Eine Massagetherapeutin mit Klappliege kommt an einer Altbau-Wohnungstür an."
              tone="massage"
              word="Angekommen."
              wordSize="l"
              sizes="(min-width: 1024px) 50vw, 100vw"
              ratio="4/5"
              priority
              className="lg:aspect-[5/6]!"
            />
            <figcaption className="px-(--space-gutter) type-caption text-ink-muted lg:px-0">Altbau, 3. OG · Berlin-Prenzlauer Berg · 18:30</figcaption>
          </figure>
        </Container>
      </section>

      {/* Benefits */}
      <Section className="border-t border-line pt-(--space-section)">
        <Container className="flex flex-col gap-12">
          <SectionHeader overline="Was du bekommst" title={<>Mehr Zeit für die Arbeit, <em className="italic">weniger fürs Drumherum.</em></>} />
          <ul className="grid gap-x-12 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <li key={b.title} className="flex flex-col gap-3 border-t border-line py-6">
                <Icon icon={b.icon} size={24} className="text-ink" />
                <h3 className="type-heading-m">{b.title}</h3>
                <p className="type-body-s text-ink-muted">{b.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Commission */}
      <Section id="provision" className="bg-surface-sunken">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-8 lg:col-span-6">
            <SectionHeader
              overline="Provision"
              title={<>Transparent. <em className="italic">Ohne Grundgebühr.</em></>}
              lead="Du zahlst nur, wenn ein Termin stattfindet. Je enger die Beziehung zur Kundschaft, desto weniger."
            />
            <dl className="border-t border-ink">
              {[
                { rate: formatPercent(c.rate), title: "Neue Kundschaft über SOMA", body: "Die erste Buchung einer Person bei dir." },
                { rate: formatPercent(c.repeatClientRate), title: "Stammkundschaft", body: "Jede weitere Buchung derselben Person über SOMA." },
                { rate: formatPercent(c.ownClientRate), title: "Eigene Kundschaft", body: "Kommt über deinen persönlichen Einladungslink – dauerhaft." },
                { rate: "0 %", title: "Anfahrt", body: "Die Anfahrtspauschale geht immer vollständig an dich." },
              ].map((r) => (
                <div key={r.title} className="grid grid-cols-[5.5rem_1fr] items-baseline gap-x-6 border-b border-line py-5 md:grid-cols-[7rem_1fr]">
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
          </div>
          <div className="flex flex-col gap-4 lg:col-span-5 lg:col-start-8 lg:pt-24">
            <h3 className="type-heading-m">Rechne nach</h3>
            <EarningsCalculator rates={c} />
          </div>
        </Container>
      </Section>

      {/* How it works */}
      <Section id="so-funktionierts" className="scroll-mt-(--header-height)">
        <Container className="flex flex-col gap-12">
          <SectionHeader overline="So funktioniert’s" title={<>In vier Schritten <em className="italic">startklar.</em></>} />
          <ol className="grid gap-x-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n} className="flex flex-col gap-3 border-t border-ink py-6">
                <span className="type-label num text-ink-muted">{s.n}</span>
                <h3 className="type-heading-m">{s.title}</h3>
                <p className="type-body-s text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Requirements */}
      <Section className="border-t border-line">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeader
              size="m"
              overline="Voraussetzungen"
              title={<>Was du <em className="italic">mitbringst.</em></>}
              lead="Du arbeitest in privaten Wohnungen, Hotels und Büros. Deshalb prüfen wir jedes Profil, bevor es sichtbar wird – meist innerhalb von 48 Stunden."
            />
          </div>
          <div className="flex flex-col gap-10 lg:col-span-6 lg:col-start-7">
            <div className="flex flex-col gap-3">
              <h3 className="type-overline text-ink-muted">Für alle Profis</h3>
              <ul className="border-t border-line">
                {terms.baseRequiredDocuments.map((d) => (
                  <li key={d.kind} className="border-b border-line py-3.5 type-body text-ink">
                    {d.label}
                  </li>
                ))}
                <li className="border-b border-line py-3.5 type-body text-ink">Selbstständige Tätigkeit (Kleinunternehmerregelung möglich)</li>
              </ul>
            </div>
            {catDocs.length ? (
              <div className="flex flex-col gap-3">
                <h3 className="type-overline text-ink-muted">Je nach Kategorie</h3>
                <dl className="border-t border-line">
                  {catDocs.map((cat) => (
                    <div key={cat.id} className="flex flex-col gap-1 border-b border-line py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                      <dt className="shrink-0 type-label">{cat.name}</dt>
                      <dd className="type-body-s text-ink-muted sm:text-right">{cat.requiredDocuments.map((d) => d.label).join(", ")}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        </Container>
      </Section>

      {/* Night band: invite link */}
      <Section night className="overflow-hidden">
        <Container className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <Overline>Einladungslink</Overline>
            <h2 className="type-display-l">
              Bring deine Stamm&shy;kundschaft mit. <em className="italic">Für {formatPercent(c.ownClientRate)}.</em>
            </h2>
            <p className="type-body-l text-ink-muted">
              Über deinen persönlichen Link buchen deine Kund:innen dich direkt – mit sicherer Zahlung, Erinnerungen und Absicherung. Du zahlst dafür dauerhaft nur {formatPercent(c.ownClientRate)} Provision.
            </p>
            <ButtonLink href={REGISTER} size="l" className="self-start" iconRight={<Icon icon={ArrowRight} />}>
              Kostenlos registrieren
            </ButtonLink>
          </div>
          <figure className="-mx-(--space-gutter) flex flex-col gap-3 lg:col-span-7 lg:mx-0 lg:-mr-(--space-gutter)">
            <Photo
              src={images.editorial.providerCta}
              alt="Eine Friseurin mit Arbeitstasche auf dem Weg die Altbautreppe hinauf zum nächsten Termin."
              tone="nacht"
              word="Zwischen zwei Terminen."
              sizes="(min-width: 1024px) 58vw, 100vw"
              ratio="16/9"
            />
            <figcaption className="px-(--space-gutter) type-caption text-ink-muted lg:px-0">Treppenhaus, 2. OG · Berlin-Neukölln · 17:40</figcaption>
          </figure>
        </Container>
      </Section>

      {/* Cities */}
      <Section className="pb-0">
        <Container>
          <div className="flex flex-col gap-4 border-b border-line pb-(--space-section)">
            <Overline>Wo wir starten</Overline>
            <p className="max-w-[48rem] type-display-m">
              Jetzt in {cityText}. <em className="italic text-ink-muted">Weitere Städte folgen.</em>
            </p>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeader size="m" overline="Fragen" title="Gut zu wissen." />
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <ul className="border-t border-line">
              {faq.map((f) => (
                <li key={f.q} className="border-b border-line">
                  <details className="group">
                    <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 type-heading-m [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span aria-hidden className="relative size-4 shrink-0">
                        <span className="absolute top-1/2 left-0 h-px w-4 bg-ink" />
                        <span className="absolute top-0 left-1/2 h-4 w-px bg-ink transition-transform duration-base ease-standard group-open:scale-y-0" />
                      </span>
                    </summary>
                    <p className="max-w-reading pb-6 type-body text-ink-muted">{f.a}</p>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section className="bg-surface-sunken">
        <Container className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-reading flex-col gap-4">
            <Overline>Los geht’s</Overline>
            <h2 className="type-display-l">
              In 15 Minuten <em className="italic">startklar.</em>
            </h2>
            <p className="type-body-l text-ink-muted">Konto anlegen, Profil einrichten, Dokumente hochladen. Wir melden uns, sobald du freigeschaltet bist.</p>
          </div>
          <ButtonLink href={REGISTER} size="l" iconRight={<Icon icon={ArrowRight} />}>
            Jetzt registrieren
          </ButtonLink>
        </Container>
      </Section>
    </>
  );
}
