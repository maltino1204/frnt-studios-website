import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/site/discovery-content-page";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/brand";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Impressum",
  description: `Anbieterkennzeichnung von ${BRAND_NAME} nach § 5 DDG.`,
  alternates: { canonical: routes.imprint() },
};

export default function ImpressumPage() {
  const sections = [
    { id: "anbieter", title: "Anbieter" },
    { id: "kontakt", title: "Kontakt" },
    { id: "register", title: "Register und Steuern" },
    { id: "verantwortlich", title: "Verantwortlich für den Inhalt" },
    { id: "vermittlung", title: "Rolle als Vermittler" },
    { id: "streitbeilegung", title: "Verbraucherstreitbeilegung" },
  ];
  return (
    <ContentPage
      overline="Rechtliches"
      crumb="Impressum"
      path={routes.imprint()}
      title="Impressum."
      lead="Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)."
      sections={sections}
      placeholder
    >
      <ContentSection id="anbieter" title="Anbieter">
        <p>
          <strong>[Firmenname] GmbH</strong>
          <br />
          [Straße Hausnummer]
          <br />
          [PLZ] [Ort]
          <br />
          Deutschland
        </p>
        <p>Vertreten durch die Geschäftsführung: [Vorname Nachname]</p>
      </ContentSection>
      <ContentSection id="kontakt" title="Kontakt">
        <p>
          E-Mail: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          <br />
          Telefon: [+49 …]
        </p>
      </ContentSection>
      <ContentSection id="register" title="Register und Steuern">
        <p>
          Registergericht: Amtsgericht [Ort]
          <br />
          Registernummer: HRB [Nummer]
          <br />
          Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE[Nummer]
        </p>
      </ContentSection>
      <ContentSection id="verantwortlich" title="Verantwortlich für den Inhalt">
        <p>Verantwortlich im Sinne von § 18 Abs. 2 Medienstaatsvertrag (MStV): [Vorname Nachname], Anschrift wie oben.</p>
      </ContentSection>
      <ContentSection id="vermittlung" title="Rolle als Vermittler">
        <p>
          {BRAND_NAME} betreibt einen Online-Marktplatz und vermittelt Termine mit selbstständigen Profis. Vertragspartner für die jeweilige Behandlung ist der gebuchte Profi als
          Unternehmer. Die Anbieterangaben der Profis finden Sie in deren Profil und in Ihrer Buchungsbestätigung.
        </p>
        <p>
          Wie die Reihenfolge der Suchergebnisse zustande kommt und wie Bewertungen geprüft werden, erläutern wir in den <Link href={routes.terms()}>AGB</Link>.
        </p>
      </ContentSection>
      <ContentSection id="streitbeilegung" title="Verbraucherstreitbeilegung">
        <p>
          [Zu prüfen:] Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG). Bei Problemen mit einer
          Buchung helfen wir Ihnen direkt: <Link href={routes.help()}>Hilfe & Kontakt</Link>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
