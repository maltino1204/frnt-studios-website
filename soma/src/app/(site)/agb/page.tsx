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
    { id: "pflichten", title: "7. Mitwirkung und Verhalten" },
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
          Rechnung; mit ihm kommt der Behandlungsvertrag zustande. Name und Anbieterangaben des Profis werden vor der Buchung angezeigt.
        </p>
      </ContentSection>
      <ContentSection id="vertrag" title={sections[2].title}>
        <ul>
          <li>
            <strong>Sofort bestätigt:</strong> Mit dem Klick auf „Zahlungspflichtig buchen“ wird ein verbindliches Angebot abgegeben; der Vertrag kommt mit der Buchungsbestätigung zustande.
          </li>
          <li>
            <strong>Auf Anfrage:</strong> Mit „Zahlungspflichtig anfragen“ wird eine verbindliche Anfrage gesendet. Der Vertrag kommt erst mit der Zusage des Profis zustande. Erfolgt keine
            Zusage innerhalb der angezeigten Frist, entfällt die Anfrage kostenlos.
          </li>
        </ul>
      </ContentSection>
      <ContentSection id="preise" title={sections[3].title}>
        <p>
          Profis legen ihre Preise selbst fest. Angezeigt werden Endpreise inklusive Anfahrt und gesetzlicher Umsatzsteuer bzw. mit Hinweis auf § 19 UStG. Bei der Buchung wird der Betrag auf
          dem gewählten Zahlungsmittel reserviert und nach dem Termin belastet. Guthaben wird vor der Zahlung verrechnet.
        </p>
      </ContentSection>
      <ContentSection id="storno" title={sections[4].title}>
        <p>
          Es gelten die Fristen und Gebühren, die vor der Buchung angezeigt werden; eine Übersicht steht unter <Link href="/stornierung">Stornierung</Link>. Sagt der Profi ab,
          entstehen der Kundschaft keine Kosten: Die Reservierung wird aufgehoben, ein bereits belasteter Betrag vollständig erstattet.
        </p>
      </ContentSection>
      <ContentSection id="widerruf" title={sections[5].title}>
        <p>
          Verbraucherinnen und Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Belehrung, Muster-Widerrufsformular und die Folgen eines vorzeitigen Beginns (§ 356 Abs. 4 BGB)
          stehen in der <Link href="/widerruf">Widerrufsbelehrung</Link>. [Anwaltlich zu klären: Anwendbarkeit der Ausnahme nach § 312g Abs. 2 Nr. 9 BGB sowie das Verhältnis zu
          den Stornogebühren.]
        </p>
      </ContentSection>
      <ContentSection id="pflichten" title={sections[6].title}>
        <ul>
          <li>Die Kundschaft sorgt für Zugang, ausreichend Platz und wahrheitsgemäße Angaben zum Ort und zur Behandlung.</li>
          <li>Die Kundschaft nennt dem Profi vor Ort den Start-Code aus der Buchung.</li>
          <li>Respektvoller Umgang ist Voraussetzung.</li>
          <li>Die Behandlungen sind Beauty- und Wellnessanwendungen, keine Heilbehandlungen.</li>
        </ul>
        {/* ⚖ Zero-tolerance rule (BRAND_VOICE § 7.9 P5, client-approved 2026-11-01); the binding wording is the lawyer's. */}
        <p>
          <strong>Null Toleranz bei anzüglichen Anfragen.</strong> {BRAND_NAME} vermittelt ausschließlich Wellness- und Beautybehandlungen. Anzügliche Anfragen oder Bemerkungen führen
          zur Sperrung des Kontos. [⚖ Anwaltlich zu formulieren: Tatbestand, Sperrung und Kündigung aus wichtigem Grund, Umgang mit bereits gebuchten Terminen und gezahlten Beträgen.]
        </p>
      </ContentSection>
      <ContentSection id="ranking" title={sections[7].title}>
        <p>
          Die Reihenfolge „Empfohlen“ berücksichtigt vor allem, wie gut freie Zeiten zur Suche passen, die Bewertungen, die Zuverlässigkeit, die sofortige Bestätigung, die Entfernung
          sowie neue Profis und vollständige Profile. Bezahlte Platzierungen gibt es nicht. Bewertungen können nur nach einem tatsächlich wahrgenommenen Termin abgegeben werden. Die
          Parameter und ihre Gewichtung erläutern wir unter <Link href="/ranking">So sortieren wir</Link>.
        </p>
      </ContentSection>
      <ContentSection id="probleme" title={sections[8].title}>
        <p>
          Entspricht eine Behandlung nicht der Buchung, ist dies innerhalb von {terms.disputeWindowHours}{"\u00a0"}Stunden nach dem Termin über die Buchung zu melden. Wir halten die Auszahlung an den Profi bis zur Klärung zurück. [Haftung
          von {BRAND_NAME} als Vermittler und der Profis für die Behandlung: anwaltlich zu formulieren.]
        </p>
      </ContentSection>
      <ContentSection id="schluss" title={sections[9].title}>
        <p>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts; zwingende Verbraucherschutzvorschriften des Staates, in dem Verbraucherinnen und Verbraucher ihren gewöhnlichen Aufenthalt haben, bleiben unberührt. [Stand: Datum]</p>
      </ContentSection>
    </ContentPage>
  );
}
