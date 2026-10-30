import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/site/discovery-content-page";
import { BRAND_NAME } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { getProviderTerms } from "@/server/services/pro-ext";
import { getPublicTerms } from "@/server/services/site-ext";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "AGB für Profis",
  description: `Bedingungen für Beauty- und Wellness-Profis, die ihre Leistungen über ${BRAND_NAME} anbieten.`,
  alternates: { canonical: "/agb-profis" },
};

const pct = (rate: number) => `${(rate * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`;

export default async function AgbProfisPage() {
  const [terms, publicTerms] = await Promise.all([getProviderTerms(), getPublicTerms()]);
  const c = terms.commission ?? { rate: 0.2, repeatClientRate: 0.12, ownClientRate: 0.05 };
  const sections = [
    { id: "geltung", title: "1. Geltungsbereich" },
    { id: "rolle", title: `2. Rolle von ${BRAND_NAME}` },
    { id: "pruefung", title: "3. Registrierung und Prüfung" },
    { id: "leistungen", title: "4. Leistungen, Preise und Verfügbarkeit" },
    { id: "provision", title: "5. Provision und Auszahlung" },
    { id: "absagen", title: "6. Annahme, Absagen und Start-Code" },
    { id: "plattform", title: "7. Kommunikation über die Plattform" },
    { id: "qualitaet", title: "8. Qualität, Bewertungen und Beschwerden" },
    { id: "schluss", title: "9. Laufzeit und Schlussbestimmungen" },
  ];
  return (
    <ContentPage
      overline="Rechtliches"
      crumb="AGB für Profis"
      path="/agb-profis"
      title="Bedingungen für Profis."
      lead={`Für selbstständige Profis, die ihre Behandlungen über ${BRAND_NAME} anbieten. Für Kundinnen und Kunden gelten die allgemeinen AGB.`}
      sections={sections}
      placeholder
    >
      <ContentSection id="geltung" title={sections[0].title}>
        <p>
          Diese Bedingungen gelten für Unternehmerinnen und Unternehmer (§ 14 BGB), die über {BRAND_NAME} Beauty- und Wellnessbehandlungen am Ort ihrer Kundschaft anbieten. Betreiber ist
          die [Firmenname] GmbH (<Link href={routes.imprint()}>Impressum</Link>).
        </p>
      </ContentSection>
      <ContentSection id="rolle" title={sections[1].title}>
        <p>
          {BRAND_NAME} betreibt den Marktplatz, vermittelt Termine und wickelt die Zahlung im Namen des Profis ab. Den Behandlungsvertrag schließt der Profi selbst mit der Kundschaft – in
          eigenem Namen, auf eigene Rechnung und eigenverantwortlich. Es entsteht kein Arbeitsverhältnis.
        </p>
      </ContentSection>
      <ContentSection id="pruefung" title={sections[2].title}>
        <p>
          Vor der Freischaltung prüfen wir Identität, Gewerbeanmeldung, Qualifikation und Berufshaftpflichtversicherung. Für einzelne Kategorien gelten zusätzliche Nachweise, etwa für Haare
          &amp; Styling ein Meisterbrief oder die Eintragung in die Handwerksrolle. Wir können eine Freischaltung ablehnen oder ein Profil sperren, wenn Nachweise fehlen oder Pflichten
          verletzt werden.
        </p>
      </ContentSection>
      <ContentSection id="leistungen" title={sections[3].title}>
        <p>
          Du legst Leistungen, Preise, Einsatzgebiet, Anfahrtskosten und Verfügbarkeit selbst fest. Preise sind Endpreise für die Kundschaft. Werbliche Aussagen dürfen keine
          Heilversprechen enthalten (Heilmittelwerbegesetz); Massagen werden als Wellnessbehandlungen angeboten.
        </p>
      </ContentSection>
      <ContentSection id="provision" title={sections[4].title}>
        <ul>
          <li>
            Provision auf den Behandlungspreis: <strong>{pct(c.rate)}</strong> für neue Kundschaft, <strong>{pct(c.repeatClientRate)}</strong> für
            Stammkundschaft, die erneut über {BRAND_NAME} bucht, und <strong>{pct(c.ownClientRate)}</strong> für Kundschaft, die über deinen persönlichen Einladungslink kommt.
          </li>
          <li>Auf Anfahrtskosten fällt keine Provision an.</li>
          <li>
            Auszahlungen erfolgen {terms.payoutHoldHours} Stunden nach Abschluss eines Termins, sofern kein Problem gemeldet wurde, über unseren Zahlungsdienstleister auf dein Konto.
          </li>
        </ul>
      </ContentSection>
      <ContentSection id="absagen" title={sections[5].title}>
        <p>
          Anfragen beantwortest du innerhalb von {terms.requestResponseHours} Stunden. Bestätigte Termine sagst du nur aus wichtigem Grund ab; die Kundschaft erhält dann den vollen Betrag
          zurück. Den Termin startest du vor Ort mit dem vierstelligen Start-Code der Kundschaft – er belegt, dass die Behandlung stattgefunden hat.
        </p>
      </ContentSection>
      <ContentSection id="plattform" title={sections[6].title}>
        <p>
          Buchungen, Zahlungen und Kommunikation zu über {BRAND_NAME} vermittelter Kundschaft laufen über die Plattform. Nur so gelten Zahlungsgarantie, Stornoregeln und
          Problemklärung. [Rechtlich zu prüfen: Zulässigkeit und Umfang einer Umgehungsklausel.]
        </p>
      </ContentSection>
      <ContentSection id="qualitaet" title={sections[7].title}>
        <p>
          Kundinnen und Kunden können nach abgeschlossenen Terminen bewerten; du kannst öffentlich antworten. Meldet die Kundschaft innerhalb von {publicTerms.disputeWindowHours} Stunden ein
          Problem, wird die Auszahlung für diesen Termin bis zur Klärung zurückgehalten.
        </p>
      </ContentSection>
      <ContentSection id="schluss" title={sections[8].title}>
        <p>[Laufzeit, Kündigung, Haftung, Datenschutz (Auftragsverarbeitung), anwendbares Recht und Gerichtsstand – anwaltlich zu ergänzen.]</p>
      </ContentSection>
    </ContentPage>
  );
}
