import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/site/discovery-content-page";
import { freeCancellationSentence, type FaqItem } from "@/components/site/discovery-copy";
import { FaqList } from "@/components/site/discovery-faq";
import { faqLd, JsonLd } from "@/components/site/discovery-json-ld";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { getPublicTerms } from "@/server/services/site-ext";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Hilfe & häufige Fragen",
  description: `Antworten rund um Buchung, Bezahlung, Stornierung und Ihren Termin bei ${BRAND_NAME} – und wie Sie uns erreichen.`,
  alternates: { canonical: routes.help() },
};

export default async function HilfePage() {
  const terms = await getPublicTerms();
  const docs = terms.baseRequiredDocuments.map((d) => d.label);

  const groups: Array<{ id: string; title: string; items: FaqItem[] }> = [
    {
      id: "buchen",
      title: "Buchen",
      items: [
        {
          q: "Wie buche ich einen Termin?",
          a: "Geben Sie Ihre Postleitzahl ein, wählen Sie eine Behandlung und ein Zeitfenster. Sie sehen nur Profis mit echten freien Terminen. Ein Tipp auf eine Uhrzeit führt direkt zur Buchung.",
        },
        {
          q: "Was bedeutet „Sofort bestätigt“ und „Auf Anfrage“?",
          a: "Bei „Sofort bestätigt“ steht Ihr Termin mit der Buchung fest. Bei „Auf Anfrage“ bestätigt der Profi Ihren Wunschtermin selbst; bis zur Antwort ist die Zeit für Sie reserviert und Ihre Karte wird nicht belastet. Die Frist für die Antwort sehen Sie in Ihrer Buchung.",
        },
        {
          q: "Wie lange wird ein Termin für mich freigehalten?",
          a: `Während Sie bezahlen, halten wir den gewählten Termin ${terms.holdMinutes} Minuten für Sie frei. Danach wird er wieder für andere sichtbar.`,
        },
        {
          q: "Brauche ich ein Kundenkonto?",
          a: "Ja. Im Konto sehen Sie Ihre Termine, den Start-Code für den Termin und Ihr Guthaben. Die Registrierung dauert etwa eine Minute.",
        },
        {
          q: "Kann ich ins Hotel oder ins Büro buchen?",
          a: "Ja. Bei der Buchung wählen Sie Zuhause, Hotel oder Büro und geben an, wie Ihr Profi Sie findet – etwa Zimmernummer, Name an der Rezeption oder Etage.",
        },
      ],
    },
    {
      id: "preise",
      title: "Preise & Bezahlung",
      items: [
        {
          q: "Ist die Anfahrt im Preis enthalten?",
          a: `Ja. In der Suche, im Profil und bei der Buchung sehen Sie den Gesamtpreis inklusive Anfahrt.${terms.customerServiceFeeCents === 0 ? ` ${BRAND_NAME} berechnet keine Servicegebühr.` : ""}`,
        },
        {
          q: "Wer legt die Preise fest?",
          a: `Die Profis sind selbstständig und legen ihre Preise selbst fest. ${BRAND_NAME} vermittelt den Termin; Vertragspartner für die Behandlung ist der Profi.`,
        },
        {
          q: "Wann wird meine Karte belastet?",
          a: "Bei der Buchung wird der Betrag nur reserviert. Belastet wird erst, wenn der Termin stattgefunden hat.",
        },
        {
          q: "Kann ich Guthaben einlösen?",
          a: "Ja. Guthaben, etwa aus einer Empfehlung, wird bei der Buchung automatisch angeboten und vom Gesamtpreis abgezogen.",
        },
      ],
    },
    {
      id: "stornieren",
      title: "Stornieren & Umbuchen",
      items: [
        {
          q: "Bis wann kann ich kostenlos stornieren?",
          a: `${freeCancellationSentence(terms.cancellationPolicy)} Danach fallen gestaffelte Gebühren an. Die genaue Frist sehen Sie in jeder Buchung mit Datum und Uhrzeit.`,
        },
        {
          q: "Was passiert, wenn der Profi absagt?",
          a: "Dann erhalten Sie den vollen Betrag zurück. Offene Anfragen, die noch nicht bestätigt sind, können Sie jederzeit kostenlos zurückziehen.",
        },
        {
          q: "Kann ich einen Termin verschieben?",
          a: "Eine Umbuchung ist derzeit eine Stornierung mit neuer Buchung. Innerhalb der kostenlosen Frist entstehen dabei keine Kosten.",
        },
      ],
    },
    {
      id: "termin",
      title: "Am Termin",
      items: [
        {
          q: "Was ist der Start-Code?",
          a: "Ein vierstelliger Code in Ihrer Buchung. Ihr Profi startet den Termin erst, wenn Sie ihm den Code vor Ort nennen. So ist sicher, dass die richtige Person bei Ihnen ist.",
        },
        {
          q: "Was muss ich vorbereiten?",
          a: "Etwas Platz, gutes Licht und für Massagen etwa 2 × 3 Meter freie Fläche für die Liege. Liege, Werkzeug und Tücher bringt Ihr Profi mit.",
        },
        {
          q: "Sind die Behandlungen medizinisch?",
          a: `Nein. Alle Angebote auf ${BRAND_NAME} sind Wellness- und Beautyanwendungen. Sie ersetzen keine ärztliche, physiotherapeutische oder podologische Behandlung.`,
        },
      ],
    },
    {
      id: "danach",
      title: "Nach dem Termin",
      items: [
        {
          q: "Wie bewerte ich meinen Profi?",
          a: `Nach dem Termin können Sie ${terms.reviewWindowDays} Tage lang eine Bewertung abgeben. Bewerten kann nur, wer wirklich gebucht hat.`,
        },
        {
          q: "Etwas war nicht in Ordnung. Was nun?",
          a: `Melden Sie das Problem innerhalb von ${terms.disputeWindowHours} Stunden über Ihre Buchung. Bis zur Klärung halten wir die Auszahlung an den Profi zurück.`,
        },
      ],
    },
    {
      id: "sicherheit",
      title: "Sicherheit",
      items: [
        {
          q: `Wie prüft ${BRAND_NAME} die Profis?`,
          a: `Bevor ein Profi buchbar ist, prüfen wir ${docs.length ? docs.join(", ") : "Identität, Gewerbe und Versicherung"} sowie die Qualifikation für jede angebotene Behandlung.`,
        },
        {
          q: "Wer sieht meine Adresse?",
          a: "Nur Ihr gebuchter Profi, und erst nachdem der Termin bestätigt ist. Nach dem Termin wird die Adresse für den Profi wieder ausgeblendet.",
        },
      ],
    },
  ];

  const sections = [...groups.map((g) => ({ id: g.id, title: g.title })), { id: "kontakt", title: "Kontakt" }];
  const all = groups.flatMap((g) => g.items);

  return (
    <ContentPage
      overline="Hilfe"
      crumb="Hilfe"
      path={routes.help()}
      title={
        <>
          Antworten, <em>bevor Sie fragen.</em>
        </>
      }
      lead="Die häufigsten Fragen rund um Buchung, Bezahlung und Ihren Termin. Ihre Frage ist nicht dabei? Schreiben Sie uns."
      sections={sections}
    >
      <JsonLd data={faqLd(all)} />
      {groups.map((g) => (
        <section key={g.id} id={g.id} aria-labelledby={`${g.id}-titel`} className="scroll-mt-24">
          <h2 id={`${g.id}-titel`} className="mb-4 type-heading-l text-ink">
            {g.title}
          </h2>
          <FaqList items={g.items} />
        </section>
      ))}
      <ContentSection id="kontakt" title="Kontakt">
        <p>
          Schreiben Sie uns an <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Bei Fragen zu einer bestimmten Buchung nennen Sie bitte die Buchungsnummer aus Ihrer Bestätigung.
        </p>
        <p>
          Alles zu Fristen und Gebühren finden Sie unter <Link href="/stornierung">Stornierung</Link>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
