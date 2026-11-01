import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/site/discovery-content-page";
import { freeCancellationSentence, ZERO_TOLERANCE, type FaqItem } from "@/components/site/discovery-copy";
import { FaqList } from "@/components/site/discovery-faq";
import { faqLd, JsonLd } from "@/components/site/discovery-json-ld";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { getPublicTerms } from "@/server/services/site-ext";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Hilfe & häufige Fragen",
  description: `Antworten rund um Buchung, Bezahlung, Stornierung und deinen Termin bei ${BRAND_NAME} – und wie du uns erreichst.`,
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
          a: "Gib deine Postleitzahl ein, wähl eine Behandlung und ein Zeitfenster. Du siehst nur Profis mit echten freien Terminen. Ein Tipp auf eine Uhrzeit führt direkt zur Buchung.",
        },
        {
          q: "Was bedeutet „Sofort bestätigt“ und „Auf Anfrage“?",
          a: "Bei „Sofort bestätigt“ steht dein Termin mit der Buchung fest. Bei „Auf Anfrage“ sagt dein Profi selbst zu; bis zur Antwort ist die Zeit für dich reserviert und deine Karte wird nicht belastet. Die Frist für die Antwort siehst du vor dem Absenden und in deiner Buchung.",
        },
        {
          q: "Wie lange wird ein Termin für mich freigehalten?",
          a: `Während du bezahlst, halten wir den gewählten Termin ${terms.holdMinutes}\u00a0Minuten für dich frei. Danach wird er wieder für andere sichtbar.`,
        },
        {
          q: "Brauche ich ein Kundenkonto?",
          a: "Ja, aber du legst es nebenbei an: Bei der ersten Buchung genügen Name, E-Mail-Adresse und Mobilnummer. Ein Passwort legst du später über den Link in unserer E-Mail fest. Im Konto siehst du deine Termine, den Start-Code und dein Guthaben.",
        },
        {
          q: "Kann ich ins Hotel oder ins Büro buchen?",
          a: "Ja. Bei der Buchung wählst du Zuhause, Hotel oder Büro und gibst an, wie dein Profi dich findet – etwa Zimmernummer, Name an der Rezeption oder Etage.",
        },
      ],
    },
    {
      id: "preise",
      title: "Preise & Bezahlung",
      items: [
        {
          q: "Ist die Anfahrt im Preis enthalten?",
          a: `Ja. In der Suche, im Profil und bei der Buchung siehst du den Endpreis inklusive Anfahrt.${terms.customerServiceFeeCents === 0 ? ` ${BRAND_NAME} berechnet keine Servicegebühr.` : ""}`,
        },
        {
          q: "Wer legt die Preise fest?",
          a: `Die Profis sind selbstständig und legen ihre Preise selbst fest. ${BRAND_NAME} vermittelt den Termin; Vertragspartner für die Behandlung ist der Profi.`,
        },
        {
          q: "Wann wird meine Karte belastet?",
          a: "Bei der Buchung wird der Betrag nur reserviert. Belastet wird erst nach dem Termin. Bezahlt wird ausschließlich online über SOMA – kein Bargeld an der Tür.",
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
          a: `${freeCancellationSentence(terms.cancellationPolicy)} Danach fallen gestaffelte Gebühren an. Die genaue Frist siehst du in jeder Buchung mit Datum und Uhrzeit.`,
        },
        {
          q: "Was passiert, wenn der Profi absagt?",
          a: "Dann entstehen dir keine Kosten. Offene Anfragen, die noch nicht bestätigt sind, kannst du jederzeit kostenlos zurückziehen.",
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
          a: "Ein vierstelliger Code in deiner Buchung. Dein Profi startet den Termin erst, wenn du den Code an der Tür nennst. So ist sicher, dass die richtige Person bei dir ist.",
        },
        {
          q: "Was muss ich vorbereiten?",
          a: "Etwas Platz, gutes Licht und für Massagen etwa 2\u00a0×\u00a03\u00a0m freie Fläche für die Liege. Liege, Werkzeug und Tücher bringt dein Profi mit.",
        },
        {
          q: "Sind die Behandlungen medizinisch?",
          a: `Nein. Alle Angebote auf ${BRAND_NAME} sind Beauty- und Wellnessanwendungen und ersetzen keine ärztliche, physiotherapeutische oder podologische Behandlung.`,
        },
      ],
    },
    {
      id: "danach",
      title: "Nach dem Termin",
      items: [
        {
          q: "Wie bewerte ich meinen Profi?",
          a: `Nach dem Termin kannst du ${terms.reviewWindowDays}\u00a0Tage lang eine Bewertung abgeben. Bewerten kann nur, wer wirklich gebucht hat.`,
        },
        {
          q: "Etwas war nicht in Ordnung. Was nun?",
          a: `Melde das Problem bis ${terms.disputeWindowHours}\u00a0Stunden nach dem Termin über „Problem melden“ in deiner Buchung. Bis zur Klärung halten wir die Auszahlung an den Profi zurück und finden mit dir eine Lösung: Nachbesserung, Gutschrift oder Erstattung.`,
        },
      ],
    },
    {
      id: "sicherheit",
      title: "Sicherheit",
      items: [
        {
          q: `Wie prüft ${BRAND_NAME} die Profis?`,
          a: `Bevor ein Profi buchbar ist, prüfen wir ${docs.length ? docs.join(", ") : "Identität, Gewerbe und Versicherung"} – und je nach Kategorie einen Qualifikationsnachweis, etwa eine Massageausbildung oder für Haare & Styling den Meisterbrief bzw. die Eintragung in die Handwerksrolle. Läuft ein Pflichtnachweis ab, pausieren wir das Profil.`,
        },
        {
          q: "Wer sieht meine Adresse?",
          a: "Nur dein gebuchter Profi, und erst nachdem der Termin bestätigt ist. Nach dem Termin wird die Adresse für den Profi wieder ausgeblendet.",
        },
        // Zero-tolerance rule (BRAND_VOICE § 7.9 P5, client-approved 2026-11-01).
        {
          q: "Welche Anfragen sind ausgeschlossen?",
          a: ZERO_TOLERANCE,
        },
      ],
    },
  ];

  const guarantee = `${BRAND_NAME}-Garantie`;
  const sections = [...groups.map((g) => ({ id: g.id, title: g.title })), { id: "garantie", title: guarantee }, { id: "kontakt", title: "Kontakt" }];
  const all = groups.flatMap((g) => g.items);

  return (
    <ContentPage
      overline="Hilfe"
      crumb="Hilfe"
      path={routes.help()}
      title={
        <>
          Antworten, <em>bevor du fragst.</em>
        </>
      }
      lead="Die häufigsten Fragen rund um Buchung, Bezahlung und deinen Termin. Deine Frage ist nicht dabei? Schreib uns."
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
      <ContentSection id="garantie" title={guarantee}>
        <p>
          Stimmt etwas nicht, meldest du es bis {terms.disputeWindowHours}{"\u00a0"}Stunden nach dem Termin über deine Buchung. Wir finden mit dir eine Lösung: Nachbesserung, Gutschrift oder Erstattung.
        </p>
        <ul>
          <li>Die Garantie gilt für alle Termine, die du über {BRAND_NAME} gebucht und bezahlt hast.</li>
          <li>
            Melde das Problem in deiner Buchung über „Problem melden“. Bis zur Klärung halten wir die Auszahlung an den Profi zurück.
          </li>
          <li>Wir hören beide Seiten an. Bei Schäden vermitteln wir zwischen dir und der Haftpflichtversicherung des Profis.</li>
        </ul>
      </ContentSection>
      <ContentSection id="kontakt" title="Kontakt">
        <p>
          Schreib uns an <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Bei Fragen zu einer bestimmten Buchung nenn bitte die Buchungsnummer aus deiner Bestätigung.
        </p>
        <p>
          Alles zu Fristen und Gebühren findest du unter <Link href="/stornierung">Stornierung</Link>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
