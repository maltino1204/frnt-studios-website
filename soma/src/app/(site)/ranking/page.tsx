import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/site/discovery-content-page";
import { SORT_LABEL } from "@/components/site/checkout-format";
import { BRAND_NAME } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { RATING_PRIOR_MEAN, RATING_PRIOR_WEIGHT, WEIGHTS } from "@/server/domain/ranking";
import { getPublicTerms } from "@/server/services/site-ext";
import {
  EXPLORE_NEW_DAYS,
  FOR_YOU_SLOT_DAYS,
  MIN_RATING_COUNT,
  POPULAR_MIN_CITY_BOOKINGS,
  POPULAR_MIN_SERVICE_BOOKINGS,
  POPULAR_WINDOW_DAYS,
} from "@/server/domain/explore";
import { listExploreCollections } from "@/server/services/explore";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "So sortieren wir",
  description: `Wie ${BRAND_NAME} Suchergebnisse auswählt und sortiert: Hauptparameter des Rankings, ihre Gewichtung und wie Bewertungen geprüft werden. Bezahlte Platzierungen gibt es nicht.`,
  alternates: { canonical: "/ranking" },
};

const NBSP = " ";
const pct = (w: number) => `${Math.round(w * 100)}${NBSP}%`;
const dec = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 1 });

/**
 * Ranking transparency (§ 5b Abs. 2 UWG, Art. 5 P2B-VO). Weights and constants are read
 * from src/server/domain/ranking.ts, so this page always describes the code that sorts.
 */
export default async function RankingPage() {
  const [terms, collections] = await Promise.all([getPublicTerms(), listExploreCollections()]);
  const sponsored = collections.filter((c) => c.isSponsored);
  const sections = [
    { id: "wer", title: "Wer in der Suche erscheint" },
    { id: "empfohlen", title: "Die Sortierung „Empfohlen“" },
    { id: "andere", title: "Andere Sortierungen und Filter" },
    { id: "unabhaengig", title: "Was keine Rolle spielt" },
    { id: "bewertungen", title: "Wie Bewertungen entstehen" },
    { id: "uebersichten", title: "Auswahl auf Start- und Stadtseiten" },
    { id: "auswahl", title: "„Von SOMA ausgewählt“ und „Anzeige“" },
    { id: "entdecken", title: "Beliebt und neu auf Entdecken" },
    { id: "fuer-dich", title: "Vorschläge „Für dich“" },
  ].map((x) => ({ ...x, title: x.title.replace("SOMA", BRAND_NAME) }));

  const factors = [
    {
      name: "Zeitliche Passung",
      weight: WEIGHTS.timeFit,
      body: "Wie früh im gewählten Zeitraum der erste freie Termin liegt. Ein Termin heute zählt mehr als einer in sieben Tagen.",
    },
    {
      name: "Bewertungen",
      weight: WEIGHTS.quality,
      body: `Der Durchschnitt der verifizierten Bewertungen, ausgeglichen nach Anzahl: (${RATING_PRIOR_WEIGHT} × ${dec(RATING_PRIOR_MEAN)} + Summe aller Sterne) ÷ (${RATING_PRIOR_WEIGHT} + Anzahl der Bewertungen). So überholen zwei Fünf-Sterne-Bewertungen nicht automatisch ein Profil mit 80 sehr guten.`,
    },
    {
      name: "Zuverlässigkeit",
      weight: WEIGHTS.reliability,
      body: "Derzeit für alle Profis derselbe neutrale Wert, bis genug Verlauf vorliegt. Danach fließen Annahmequote, Antwortzeit und Absagen durch den Profi ein.",
    },
    {
      name: "Sofort bestätigt",
      weight: WEIGHTS.instant,
      body: "Profis, bei denen deine Buchung ohne Rückfrage sofort feststeht, erhalten diesen Anteil vollständig.",
    },
    {
      name: "Entfernung",
      weight: WEIGHTS.proximity,
      body: "Wie nah deine Postleitzahl am Standort des Profis liegt, gemessen an seinem Einsatzradius. Kürzere Wege bedeuten meist eine niedrigere Anfahrt.",
    },
    {
      name: "Neu auf SOMA",
      weight: WEIGHTS.newPro,
      body: "Ein kleiner Startvorteil für neue Profis. Er nimmt in den ersten 30 Tagen oder bis zum fünften abgeschlossenen Termin auf null ab.",
    },
    {
      name: "Vollständiges Profil",
      weight: WEIGHTS.completeness,
      body: "Porträtfoto, ein Profiltext ab 80 Zeichen, mindestens drei Arbeitsbilder und angegebene Sprachen.",
    },
  ].map((f) => ({ ...f, body: f.body.replace("SOMA", BRAND_NAME) }));

  return (
    <ContentPage
      overline="Transparenz"
      crumb="So sortieren wir"
      path="/ranking"
      title={
        <>
          So sortieren wir. <em>Ohne bezahlte Plätze.</em>
        </>
      }
      lead={`Welche Profis du in der Suche siehst und in welcher Reihenfolge, folgt festen Regeln. Hier steht, welche – mit der Gewichtung, die ${BRAND_NAME} tatsächlich verwendet.`}
      sections={sections}
    >
      <ContentSection id="wer" title={sections[0].title}>
        <p>Ein Profi erscheint in deinen Ergebnissen nur, wenn alle diese Bedingungen erfüllt sind:</p>
        <ul>
          <li>Das Profil ist geprüft und freigeschaltet.</li>
          <li>Deine Postleitzahl liegt innerhalb des Einsatzradius, den der Profi selbst festgelegt hat.</li>
          <li>Die gesuchte Behandlung oder Kategorie wird aktiv angeboten.</li>
          <li>
            Es gibt mindestens einen freien Termin: am gewählten Tag oder, bei „So bald wie möglich“, in den nächsten {terms.searchDaysAhead}
            {NBSP}Tagen. Termine entstehen aus den Arbeitszeiten, Abwesenheiten, bestehenden Buchungen und der Vorlaufzeit des Profis.
          </li>
        </ul>
        <p>Der Preis, den du siehst, ist immer der Endpreis inklusive Anfahrt zu deiner Postleitzahl.</p>
      </ContentSection>

      <ContentSection id="empfohlen" title={sections[1].title}>
        <p>
          Standardmäßig sortieren wir nach einer Punktzahl aus sieben Faktoren. Jeder Faktor wird auf einen Wert zwischen 0 und 1 gebracht und mit seinem Anteil gewichtet:
        </p>
        <dl className="mt-2 flex flex-col divide-y divide-line rounded-card bg-surface-raised px-5 shadow-raised">
          {factors.map((f) => (
            <div key={f.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1.5 py-4">
              <dt className="type-heading-s text-ink hyphens-none">{f.name}</dt>
              <dd className="row-span-2 type-label font-semibold text-ink num">{pct(f.weight)}</dd>
              <dd className="col-start-1 type-body-s text-ink-muted">{f.body}</dd>
              <dd aria-hidden className="col-span-2 mt-1 h-1 overflow-hidden rounded-full bg-surface-sunken">
                <span className="block h-full rounded-full bg-chart-1" style={{ width: `${Math.round(f.weight * 100)}%` }} />
              </dd>
            </div>
          ))}
        </dl>
        <p>Haben zwei Profis dieselbe Punktzahl, steht der frühere freie Termin vorn.</p>
      </ContentSection>

      <ContentSection id="andere" title={sections[2].title}>
        <ul>
          <li>
            <strong>{SORT_LABEL.frueheste}:</strong> nach dem ersten freien Termin, bei Gleichstand nach der Punktzahl „Empfohlen“.
          </li>
          <li>
            <strong>{SORT_LABEL.preis}:</strong> nach dem Endpreis inklusive Anfahrt.
          </li>
          <li>
            <strong>{SORT_LABEL.bewertung}:</strong> nach dem ausgeglichenen Bewertungsdurchschnitt von oben.
          </li>
        </ul>
        <p>Die Filter „Sofort bestätigt“, „Bewertung ab 4,5“ und „Sprache“ blenden Profis aus, ändern aber nichts an der Reihenfolge der übrigen.</p>
      </ContentSection>

      <ContentSection id="unabhaengig" title={sections[3].title}>
        <ul>
          <li>
            <strong>Keine bezahlten Platzierungen.</strong> Profis können sich keinen besseren Platz kaufen. Sollte es das künftig geben, kennzeichnen wir es deutlich als „Anzeige“.
          </li>
          <li>
            <strong>Keine Provision im Ranking.</strong> Wie viel {BRAND_NAME} an einer Buchung verdient, fließt nicht in die Reihenfolge ein.
          </li>
          <li>
            <strong>Deine Favoriten</strong> markieren wir in der Liste, sie werden aber nicht nach oben sortiert.
          </li>
        </ul>
      </ContentSection>

      <ContentSection id="bewertungen" title={sections[4].title}>
        <p>
          Bewerten kann nur, wer den Termin über {BRAND_NAME} gebucht hat und bei dem die Behandlung abgeschlossen wurde – innerhalb von {terms.reviewWindowDays}
          {NBSP}Tagen danach und einmal pro Buchung. Wir zeigen die guten wie die kritischen Bewertungen, mit Vorname und Initial der Kundin oder des Kunden.
        </p>
        <p>
          Profis können öffentlich antworten, aber keine Bewertung löschen oder ändern. {BRAND_NAME} blendet eine Bewertung nur aus, wenn sie gegen unsere Regeln verstößt,
          etwa durch Beleidigungen oder persönliche Kontaktdaten. Jede solche Entscheidung wird protokolliert.
        </p>
        <p>Profile mit weniger als drei Bewertungen tragen den Hinweis „Neu auf {BRAND_NAME}“.</p>
      </ContentSection>

      <ContentSection id="uebersichten" title={sections[5].title}>
        <p>
          Auf der Startseite und auf den Seiten für Behandlungen und Städte zeigen wir eine Auswahl ohne Terminbezug. Die Reihenfolge folgt dem ausgeglichenen Bewertungsdurchschnitt,
          bei Gleichstand der Zahl abgeschlossener Termine. Buchbare Zeiten siehst du in der <Link href={routes.search()}>Suche</Link>.
        </p>
        <p>
          Mehr zu Rolle und Pflichten von {BRAND_NAME} steht in den <Link href={routes.terms()}>AGB</Link>.
        </p>
      </ContentSection>

      <ContentSection id="auswahl" title={sections[6].title}>
        <p>
          Die Themen auf <Link href={routes.explore()}>Entdecken</Link>, etwa „Massage im Hotel“, stellt das {BRAND_NAME}-Team redaktionell zusammen. Sie tragen den Hinweis
          „Von {BRAND_NAME} ausgewählt“. Für die Aufnahme zahlt niemand, und wie viel {BRAND_NAME} an einer Buchung verdient, spielt für die Auswahl keine Rolle.
        </p>
        <p>
          Ein Thema enthält Behandlungen, Kategorien oder einzelne Profis. Die Preise sind die echten Preise der Profis, ohne Anfahrt. Freie Termine und den Endpreis inklusive
          Anfahrt siehst du im Profil oder in der Suche, sobald du deine Postleitzahl eingibst.
        </p>
        <p>
          Sollte eine Platzierung künftig bezahlt sein, steht daran deutlich „Anzeige“ – auf der Karte und auf der Seite des Themas –, zusammen mit dem Namen dessen, in dessen
          Auftrag sie erscheint (§ 5a Abs. 4 UWG, Art. 26 DSA).{" "}
          {sponsored.length
            ? `Derzeit als Anzeige gekennzeichnet: ${sponsored.map((c) => `„${c.title}“ im Auftrag von ${c.sponsorName}`).join(", ")}.`
            : "Derzeit gibt es keine bezahlten Platzierungen."}
        </p>
      </ContentSection>

      <ContentSection id="entdecken" title={sections[7].title}>
        <ul>
          <li>
            <strong>Beliebt in deiner Stadt:</strong> Wir zählen bestätigte, begonnene und abgeschlossene Buchungen der letzten {POPULAR_WINDOW_DAYS}
            {NBSP}Tage, deren Adresse in der Stadt liegt. Eine Stadt erscheint erst ab {POPULAR_MIN_CITY_BOOKINGS} solcher Buchungen, eine Behandlung erst ab{" "}
            {POPULAR_MIN_SERVICE_BOOKINGS}. Wir zeigen nur die Reihenfolge, keine Zahlen, und nur Behandlungen, die in der Stadt jemand anbietet. Der „ab“-Preis ist das günstigste
            Angebot dort, ohne Anfahrt.
          </li>
          <li>
            <strong>Neu auf {BRAND_NAME}:</strong> Profis, die in den letzten {EXPLORE_NEW_DAYS}
            {NBSP}Tagen freigeschaltet wurden, die neuesten zuerst. Sie sind geprüft wie alle anderen.
          </li>
          <li>
            <strong>Bewertungen</strong> erscheinen auf den Karten ab {MIN_RATING_COUNT} veröffentlichten Bewertungen.
          </li>
        </ul>
      </ContentSection>

      <ContentSection id="fuer-dich" title={sections[8].title}>
        <p>Angemeldet siehst du auf Entdecken Vorschläge, die nur aus deinen eigenen Daten bei {BRAND_NAME} entstehen:</p>
        <ul>
          <li>
            <strong>Wieder buchen:</strong> Profis, bei denen du schon einen Termin abgeschlossen hast, und deine Favoriten.
          </li>
          <li>
            <strong>Passend zu deinen Buchungen:</strong> Behandlungen aus den Kategorien, die du gebucht hast, von Profis, deren Einsatzgebiet die Postleitzahl deiner
            Standardadresse abdeckt. Pro Behandlung zeigen wir einen Profi mit einem freien Termin in den nächsten {FOR_YOU_SLOT_DAYS}
            {NBSP}Tagen: zuerst nach dem ausgeglichenen Bewertungsdurchschnitt, dann nach dem früheren Termin. Was du bei einem Profi schon gebucht hast, steht unter „Wieder
            buchen“.
          </li>
          <li>
            <strong>Neu in deiner Nähe:</strong> Profis, die in den letzten {EXPLORE_NEW_DAYS}
            {NBSP}Tagen freigeschaltet wurden und zu deiner Postleitzahl kommen.
          </li>
        </ul>
        <p>
          „Nächster freier Termin“ und der Endpreis inklusive Anfahrt werden beim Aufruf aus den echten Arbeitszeiten und Buchungen der Profis berechnet. Daten anderer
          Kundinnen und Kunden fließen nicht ein, und wir speichern aus den Vorschlägen kein Profil.
        </p>
        <p>
          Du kannst die Vorschläge jederzeit unter <Link href={`${routes.account.profile()}#vorschlaege`}>Konto › Profil &amp; Sicherheit › Persönliche Vorschläge</Link>{" "}
          ausschalten. Dann berechnen wir nichts für dich und zeigen nur die allgemeine Auswahl. Mehr dazu in der <Link href={`${routes.privacy()}#vorschlaege`}>Datenschutzerklärung</Link>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
