import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/site/discovery-content-page";
import { BRAND_NAME } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { getPublicTerms } from "@/server/services/site-ext";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "AGB",
  description: `Allgemeine Geschäftsbedingungen für Kundinnen und Kunden von ${BRAND_NAME}.`,
  alternates: { canonical: routes.terms() },
};

export default async function AgbPage() {
  const terms = await getPublicTerms();
  const sections = [
    { id: "geltung", title: "1. Geltungsbereich" },
    { id: "rolle", title: "2. Rolle von SOMA" },
    { id: "vertrag", title: "3. Buchung und Vertragsschluss" },
    { id: "preise", title: "4. Preise und Zahlung" },
    { id: "storno", title: "5. Stornierung" },
    { id: "widerruf", title: "6. Widerrufsrecht" },
    { id: "pflichten", title: "7. Ihre Mitwirkung" },
    { id: "ranking", title: "8. Ranking und Bewertungen" },
    { id: "probleme", title: "9. Probleme und Haftung" },
    { id: "schluss", title: "10. Schlussbestimmungen" },
  ].map((s) => ({ ...s, title: s.title.replace("SOMA", BRAND_NAME) }));
  return (
    <ContentPage
      overline="Rechtliches"
      crumb="AGB"
      path={routes.terms()}
      title="Allgemeine Geschäfts­bedingungen."
      lead={`Für Kundinnen und Kunden, die über ${BRAND_NAME} Termine buchen. Für Profis gelten eigene Bedingungen.`}
      sections={sections}
      placeholder
    >
      <ContentSection id="geltung" title={sections[0].title}>
        <p>
          Diese Bedingungen regeln die Nutzung des Marktplatzes {BRAND_NAME} durch Verbraucherinnen und Verbraucher sowie Unternehmen, die Beauty- und Wellnessbehandlungen bei sich zu Hause,
          im Hotel oder im Büro buchen. Betreiber ist die [Firmenname] GmbH (<Link href={routes.imprint()}>Impressum</Link>).
        </p>
      </ContentSection>
      <ContentSection id="rolle" title={sections[1].title}>
        <p>
          {BRAND_NAME} vermittelt Termine und wickelt die Zahlung ab. Die Behandlung selbst erbringt der gebuchte Profi als selbstständiger Unternehmer in eigenem Namen und auf eigene
          Rechnung; mit ihm kommt der Behandlungsvertrag zustande. Name und Anbieterangaben des Profis sehen Sie vor der Buchung.
        </p>
      </ContentSection>
      <ContentSection id="vertrag" title={sections[2].title}>
        <ul>
          <li>
            <strong>Sofort bestätigt:</strong> Mit dem Klick auf „Zahlungspflichtig buchen“ geben Sie ein verbindliches Angebot ab; der Vertrag kommt mit der Buchungsbestätigung zustande.
          </li>
          <li>
            <strong>Auf Anfrage:</strong> Mit „Zahlungspflichtig anfragen“ senden Sie eine verbindliche Anfrage. Der Vertrag kommt erst mit der Zusage des Profis zustande. Erfolgt keine
            Zusage innerhalb der angezeigten Frist, entfällt die Anfrage kostenlos.
          </li>
        </ul>
      </ContentSection>
      <ContentSection id="preise" title={sections[3].title}>
        <p>
          Profis legen ihre Preise selbst fest. Angezeigt werden Endpreise inklusive Anfahrt und gesetzlicher Umsatzsteuer bzw. mit Hinweis auf § 19 UStG. Bei der Buchung wird der Betrag auf
          Ihrem Zahlungsmittel reserviert und nach dem Termin eingezogen. Guthaben wird vor der Zahlung verrechnet.
        </p>
      </ContentSection>
      <ContentSection id="storno" title={sections[4].title}>
        <p>
          Es gelten die Fristen und Gebühren, die Ihnen vor der Buchung angezeigt werden. Eine Übersicht finden Sie unter <Link href="/stornierung">Stornierung</Link>. Sagt der Profi ab,
          erhalten Sie den vollen Betrag zurück.
        </p>
      </ContentSection>
      <ContentSection id="widerruf" title={sections[5].title}>
        <p>
          [Widerrufsbelehrung und Muster-Widerrufsformular nach §§ 312g, 355, 356 BGB. Anwaltlich zu klären: Anwendbarkeit der Ausnahme nach § 312g Abs. 2 Nr. 9 BGB sowie das Verhältnis
          zu den Stornogebühren.]
        </p>
      </ContentSection>
      <ContentSection id="pflichten" title={sections[6].title}>
        <ul>
          <li>Sie sorgen für Zugang, ausreichend Platz und wahrheitsgemäße Angaben zum Ort und zur Behandlung.</li>
          <li>Sie nennen Ihrem Profi vor Ort den Start-Code aus Ihrer Buchung.</li>
          <li>Respektvoller Umgang ist Voraussetzung. Anfragen mit sexuellem Bezug führen zum sofortigen Ausschluss.</li>
          <li>Die Behandlungen sind Wellness- und Beautyanwendungen, keine Heilbehandlungen.</li>
        </ul>
      </ContentSection>
      <ContentSection id="ranking" title={sections[7].title}>
        <p>
          Die Reihenfolge „Empfohlen“ berücksichtigt vor allem, wie gut freie Zeiten zu Ihrer Suche passen, die Bewertungen, die Zuverlässigkeit, die sofortige Bestätigung, die Entfernung
          sowie neue Profis und vollständige Profile. Bezahlte Platzierungen gibt es nicht. Bewertungen können nur nach einem tatsächlich wahrgenommenen Termin abgegeben werden.
        </p>
      </ContentSection>
      <ContentSection id="probleme" title={sections[8].title}>
        <p>
          Entspricht eine Behandlung nicht der Buchung, melden Sie dies bitte innerhalb von {terms.disputeWindowHours} Stunden über Ihre Buchung. Wir halten die Auszahlung an den Profi bis zur Klärung zurück. [Haftung
          von {BRAND_NAME} als Vermittler und der Profis für die Behandlung: anwaltlich zu formulieren.]
        </p>
      </ContentSection>
      <ContentSection id="schluss" title={sections[9].title}>
        <p>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts; zwingende Verbraucherschutzvorschriften Ihres Aufenthaltsstaats bleiben unberührt. [Stand: Datum]</p>
      </ContentSection>
    </ContentPage>
  );
}
