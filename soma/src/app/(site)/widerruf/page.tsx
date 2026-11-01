import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/site/discovery-content-page";
import { freeCancellationSentence } from "@/components/site/discovery-copy";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { getPublicTerms } from "@/server/services/site-ext";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Widerrufsbelehrung",
  description: `Widerrufsrecht für online gebuchte Behandlungen bei ${BRAND_NAME}: Frist, Folgen, vorzeitiger Beginn nach § 356 Abs. 4 BGB und Muster-Widerrufsformular.`,
  alternates: { canonical: "/widerruf" },
};

const NBSP = " ";

const FORM_LINES = [
  "An: [Name und Anschrift des Profis laut Buchungsbestätigung] – oder an [Firmenname] GmbH, [Anschrift], " + SUPPORT_EMAIL,
  "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung (*):",
  "Gebucht am (*):",
  "Buchungsnummer:",
  "Name des/der Verbraucher(s):",
  "Anschrift des/der Verbraucher(s):",
  "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):",
  "Datum:",
];

/**
 * Widerrufsbelehrung for services booked online (§§ 312g, 355, 356 BGB, Art. 246a EGBGB)
 * plus the model withdrawal form. ⚖ Placeholder: wording and the relation to the
 * cancellation fees need legal review before launch.
 */
export default async function WiderrufPage() {
  const terms = await getPublicTerms();
  const sections = [
    { id: "widerrufsrecht", title: "Widerrufsrecht" },
    { id: "folgen", title: "Folgen des Widerrufs" },
    { id: "vorzeitig", title: "Beginn vor Ablauf der Frist" },
    { id: "stornierung", title: "Widerruf und Stornierung" },
    { id: "formular", title: "Muster-Widerrufsformular" },
  ];
  const mailBody = [...FORM_LINES.slice(1), "", "(*) Unzutreffendes streichen."].join("\n");
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Widerruf meiner Buchung")}&body=${encodeURIComponent(mailBody)}`;

  return (
    <ContentPage
      overline="Rechtliches"
      crumb="Widerruf"
      path="/widerruf"
      title={"Widerrufs\u00adbelehrung."}
      lead={`Für Behandlungen, die Sie als Verbraucherin oder Verbraucher über ${BRAND_NAME} online buchen. Vertragspartner für die Behandlung ist der jeweilige Profi.`}
      sections={sections}
      placeholder
    >
      <ContentSection id="widerrufsrecht" title={sections[0].title}>
        <p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p>
        <p>Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses. Bei „Sofort bestätigt“ ist das der Tag der Buchung, bei „Auf Anfrage“ der Tag der Zusage.</p>
        <p>
          Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ([Name und Anschrift des Profis laut Buchungsbestätigung]; Sie können den Widerruf auch an [Firmenname] GmbH, [Anschrift],
          E-Mail <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, richten, die ihn an den Profi weiterleitet) mittels einer eindeutigen Erklärung (z.{NBSP}B. ein mit der Post
          versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das unten stehende Muster-Widerrufsformular verwenden,
          das jedoch nicht vorgeschrieben ist.
        </p>
        <p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>
      </ContentSection>

      <ContentSection id="folgen" title={sections[1].title}>
        <p>
          Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag
          zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der
          ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte
          berechnet.
        </p>
        <p>
          Haben Sie verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem
          Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der
          im Vertrag vorgesehenen Dienstleistungen entspricht.
        </p>
      </ContentSection>

      <ContentSection id="vorzeitig" title={sections[2].title}>
        <p>
          Die meisten Termine liegen innerhalb der vierzehn Tage. Damit Ihr Profi trotzdem pünktlich zu Ihnen kommen darf, bestätigen Sie bei jeder Buchung ausdrücklich:
        </p>
        <blockquote className="border-l-2 border-ink pl-4 text-ink">
          „Ich verlange ausdrücklich, dass die Fachkraft vor Ablauf der Widerrufsfrist mit der Behandlung beginnt. Mir ist bekannt, dass ich mein Widerrufsrecht bei vollständiger
          Erbringung der Leistung verliere.“
        </blockquote>
        <p>Das bedeutet nach § 356 Abs. 4 BGB und § 357a Abs. 2 BGB:</p>
        <ul>
          <li>
            <strong>Vor dem Termin</strong> können Sie weiterhin widerrufen.
          </li>
          <li>
            <strong>Während der Behandlung</strong> können Sie widerrufen; Sie zahlen dann nur den Anteil, der bis dahin erbracht wurde.
          </li>
          <li>
            <strong>Nach der vollständigen Behandlung</strong> erlischt das Widerrufsrecht. Stimmt etwas nicht, gilt die{" "}
            <Link href={`${routes.help()}#garantie`}>{BRAND_NAME}-Garantie</Link>: Melden Sie sich innerhalb von {terms.disputeWindowHours}
            {NBSP}Stunden über Ihre Buchung.
          </li>
        </ul>
        <p>Ohne diese Bestätigung ist eine Buchung über {BRAND_NAME} nicht möglich.</p>
      </ContentSection>

      <ContentSection id="stornierung" title={sections[3].title}>
        <p>
          Am einfachsten lösen Sie eine Buchung über <Link href={routes.account.bookings()}>Ihre Termine</Link>: {freeCancellationSentence(terms.cancellationPolicy)} Bevor Sie bestätigen,
          sehen Sie, was eine Stornierung in diesem Moment kostet. Die Fristen und Gebühren im Einzelnen stehen unter <Link href="/stornierung">Stornierung</Link>.
        </p>
        <p>
          [Anwaltlich zu klären: ob für Termine zu einem festen Zeitpunkt die Ausnahme nach § 312g Abs. 2 Nr. 9 BGB greift und wie sich Stornogebühren innerhalb der Widerrufsfrist
          dazu verhalten. Bis zur Klärung bleibt Ihr gesetzliches Widerrufsrecht von den Stornobedingungen unberührt.]
        </p>
      </ContentSection>

      <ContentSection id="formular" title={sections[4].title}>
        <p>Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden Sie es zurück.</p>
        <ol className="flex flex-col divide-y divide-line rounded-card bg-surface-raised px-5 shadow-raised">
          {FORM_LINES.map((line) => (
            <li key={line} className="py-3 type-body-s text-ink">
              {line}
            </li>
          ))}
        </ol>
        <p className="type-caption">(*) Unzutreffendes streichen.</p>
        <p>
          <a href={mailto}>Formular als E-Mail an {BRAND_NAME} öffnen</a>
        </p>
      </ContentSection>
    </ContentPage>
  );
}
