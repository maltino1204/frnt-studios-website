import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/site/discovery-content-page";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/brand";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: `Wie ${BRAND_NAME} personenbezogene Daten verarbeitet: Konto, Buchung, Zahlung, Adresse, Bewertungen und Cookies.`,
  alternates: { canonical: routes.privacy() },
};

export default function DatenschutzPage() {
  const sections = [
    { id: "verantwortlich", title: "Verantwortliche Stelle" },
    { id: "ueberblick", title: "Überblick" },
    { id: "konto", title: "Konto und Buchung" },
    { id: "adresse", title: "Adresse und Standort" },
    { id: "gesundheit", title: "Angaben zur Behandlung" },
    { id: "zahlung", title: "Zahlung" },
    { id: "bewertungen", title: "Bewertungen" },
    { id: "cookies", title: "Cookies und Speicher" },
    { id: "speicherdauer", title: "Speicherdauer" },
    { id: "rechte", title: "Rechte der Betroffenen" },
  ];
  return (
    <ContentPage
      overline="Rechtliches"
      crumb="Datenschutz"
      path={routes.privacy()}
      title={
        <>
          Datenschutz. <em>Nur, was nötig ist.</em>
        </>
      }
      lead="Diese Erklärung beschreibt, welche Daten wir verarbeiten, wenn über SOMA ein Termin gesucht, gebucht und wahrgenommen wird."
      sections={sections}
      placeholder
    >
      <ContentSection id="verantwortlich" title="Verantwortliche Stelle">
        <p>
          [Firmenname] GmbH, [Anschrift] – siehe <Link href={routes.imprint()}>Impressum</Link>. Datenschutzbeauftragte Person: [Name, Kontakt]. Allgemeine Anfragen:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </ContentSection>
      <ContentSection id="ueberblick" title="Überblick">
        <p>
          Wir verarbeiten personenbezogene Daten, um Termine zu vermitteln, Zahlungen abzuwickeln und die Sicherheit auf der Plattform zu gewährleisten. Rechtsgrundlagen sind insbesondere
          Art. 6 Abs. 1 lit. b DSGVO (Vertrag), lit. c (rechtliche Pflichten), lit. f (berechtigtes Interesse) sowie – wo angegeben – eine Einwilligung nach lit. a bzw. Art. 9 Abs. 2 lit. a
          DSGVO. Hosting und Datenbank befinden sich in der EU [Anbieter, Standort].
        </p>
      </ContentSection>
      <ContentSection id="konto" title="Konto und Buchung">
        <p>
          Für ein Kundenkonto speichern wir Name, E-Mail-Adresse und optional die Telefonnummer. Zu jeder Buchung speichern wir Behandlung, Zeitpunkt, Ort, Preis und den Verlauf der Buchung.
          Der gebuchte Profi erhält die Angaben, die für den Termin nötig sind.
        </p>
        <p>Suchanfragen speichern wir ohne Personenbezug (Postleitzahl, Behandlung, Zeitpunkt), um das Angebot dort auszubauen, wo es gebraucht wird.</p>
      </ContentSection>
      <ContentSection id="adresse" title="Adresse und Standort">
        <p>
          Die Adresse sieht nur der gebuchte Profi, und erst nachdem der Termin bestätigt ist. 24 Stunden nach dem Termin wird sie für den Profi wieder ausgeblendet. Bei „Standort
          verwenden“ fragt der Browser vorher um Erlaubnis; wir ermitteln daraus nur die nächstgelegene Postleitzahl und speichern den Standort nicht.
        </p>
      </ContentSection>
      <ContentSection id="gesundheit" title="Angaben zur Behandlung">
        <p>
          Hinweise zur Behandlung, etwa zu Allergien, können Gesundheitsdaten sein. Wir verarbeiten sie nur mit ausdrücklicher Einwilligung, zeigen sie ausschließlich dem gebuchten Profi
          und löschen sie [Frist] nach dem Termin.
        </p>
      </ContentSection>
      <ContentSection id="zahlung" title="Zahlung">
        <p>
          Zahlungen wickeln wir über [Zahlungsdienstleister, z. B. Stripe Payments Europe Ltd.] ab. Kartendaten gelangen nicht auf unsere Server; wir erhalten nur Zahlungsstatus, Kartenmarke
          und die letzten vier Ziffern.
        </p>
      </ContentSection>
      <ContentSection id="bewertungen" title="Bewertungen">
        <p>Bewertungen erscheinen mit Vornamen und dem ersten Buchstaben des Nachnamens. Bewerten kann nur, wer den Termin tatsächlich wahrgenommen hat.</p>
      </ContentSection>
      <ContentSection id="cookies" title="Cookies und Speicher">
        <p>Wir setzen nur technisch notwendige Speichertechnologien ein und verzichten auf Werbe- und Analyse-Cookies. Eine Einwilligung ist dafür nicht erforderlich (§ 25 Abs. 2 TDDDG).</p>
        <ul>
          <li>
            <strong>Sitzungs-Cookie</strong> – hält die Anmeldung aufrecht; bis zur Abmeldung, höchstens 30 Tage.
          </li>
          <li>
            <strong>Zuletzt verwendete Postleitzahl</strong> – im lokalen Speicher des Browsers, damit sie nicht erneut eingegeben werden muss. Die Angabe verlässt das Gerät nicht und lässt
            sich über die Browsereinstellungen löschen.
          </li>
        </ul>
        <p>[Sollten später Analyse-Dienste hinzukommen, werden sie hier ergänzt und nur nach Einwilligung aktiviert.]</p>
      </ContentSection>
      <ContentSection id="speicherdauer" title="Speicherdauer">
        <p>
          Wir löschen Daten, sobald sie für den Zweck nicht mehr erforderlich sind. Buchungs- und Zahlungsdaten bewahren wir wegen handels- und steuerrechtlicher Pflichten bis zu [sechs bzw.
          zehn] Jahre auf.
        </p>
      </ContentSection>
      <ContentSection id="rechte" title="Rechte der Betroffenen">
        <p>
          Betroffene haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht, eine
          Einwilligung jederzeit zu widerrufen. Außerdem besteht ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde, etwa [zuständige Behörde].
        </p>
      </ContentSection>
    </ContentPage>
  );
}
