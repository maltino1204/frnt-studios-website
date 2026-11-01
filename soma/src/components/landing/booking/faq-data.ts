/**
 * Chapter 09 FAQ and trust strip (brand/COPY_DECK_LANDING.md § 09; LANDING_DESIGN_SPEC.md § 4.9; INTEGRATION.md § 6.2).
 * Owner: Conversion & Integration. Pure and isomorphic.
 *
 * Frontend: render exactly `buildLandingFaq(...)` (all nine, no mobile limit) and the strip from `faqTrustStrip(...)`.
 * The FAQPage JSON-LD is emitted by <LandingJsonLd faq={…}> from the same array, so do NOT use `FaqSection`
 * (it emits a second FAQPage).
 *
 * Every policy value comes from `getPublicTerms()`; the cities are those with at least one approved Profi.
 */
import { BRAND_NAME } from "@/lib/brand";
import type { CancellationPolicyDTO, CoverageDTO, RequiredDocumentDTO } from "@/server/dto";
import { hoursLabel, type FaqItem } from "@/components/site/discovery-copy";
import { joinGerman } from "./landing-copy";

const NBSP = " ";

export type LandingFaqTerms = {
  cancellationPolicy: CancellationPolicyDTO;
  disputeWindowHours: number;
  customerServiceFeeCents: number;
  baseRequiredDocuments: RequiredDocumentDTO[];
};

/** Short names for the base documents in running text (deck § 09); unknown kinds keep their admin label. */
const DOC_SHORT: Record<string, string> = {
  id_document: "Ausweis",
  business_registration: "Gewerbeanmeldung",
  insurance: "Berufshaftpflicht",
};

/** Active cities with at least one approved Profi in any category, in city order. */
export function liveCityNames(cities: ReadonlyArray<{ slug: string; name: string }>, coverage: ReadonlyArray<Pick<CoverageDTO, "citySlug" | "providerCount">>): string[] {
  const live = new Set(coverage.filter((c) => c.providerCount > 0).map((c) => c.citySlug));
  return cities.filter((c) => live.has(c.slug)).map((c) => c.name);
}

const pct = (n: number) => `${n}${NBSP}%`;

/** FAQ 5, built from the tiers: free window, Bedenkzeit, fee tiers, no-show. */
export function cancellationAnswer(policy: CancellationPolicyDTO): string {
  const tiers = [...policy.tiers].sort((a, b) => b.minHoursBefore - a.minHoursBefore);
  const kept = (t: { feePercent: number; travelFeeRetained?: boolean }) => t.travelFeeRetained ?? t.feePercent >= 100;
  const freeIdx = tiers.findIndex((t) => t.feePercent <= 0 && !kept(t));
  const free = freeIdx >= 0 ? tiers[freeIdx] : null;
  const grace = policy.graceMinutes > 0 ? `${policy.graceMinutes}${NBSP}Minuten` : null;
  const parts: string[] = [];

  if (free && free.minHoursBefore > 0) {
    parts.push(`Bis ${hoursLabel(free.minHoursBefore)} vor dem Termin stornierst du kostenlos${grace ? `, in den ersten ${grace} nach der Buchung sogar immer` : ""}.`);
  } else if (free) {
    parts.push("Du stornierst bis zum Termin kostenlos.");
  } else if (grace) {
    parts.push(`In den ersten ${grace} nach der Buchung stornierst du kostenlos.`);
  }

  const paid = tiers.slice(freeIdx + 1).filter((t) => t.feePercent > 0 || kept(t));
  let prev = free;
  paid.forEach((t, i) => {
    const last = t.minHoursBefore <= 0;
    const lead = !prev ? "Ab der Buchung" : i === 0 ? "Danach" : `Weniger als ${hoursLabel(prev.minHoursBefore)} vorher`;
    if (last && prev && t.feePercent >= 100 && kept(t) && policy.noShowFeePercent >= 100) {
      parts.push(`Weniger als ${hoursLabel(prev.minHoursBefore)} vorher oder wenn du nicht da bist, werden Behandlung und Anfahrt voll berechnet.`);
    } else if (t.feePercent >= 100 && kept(t)) {
      parts.push(`${lead} werden Behandlung und Anfahrt voll berechnet.`);
    } else {
      parts.push(`${lead} fallen ${pct(t.feePercent)} des Behandlungspreises an; die Anfahrt wird ${kept(t) ? "zusätzlich" : "nicht"} berechnet.`);
    }
    prev = t;
  });
  const lastTier = paid[paid.length - 1];
  const noShowCovered = !!lastTier && lastTier.minHoursBefore <= 0 && lastTier.feePercent >= 100 && kept(lastTier) && policy.noShowFeePercent >= 100;
  if (!noShowCovered && policy.noShowFeePercent > 0) {
    parts.push(
      policy.noShowFeePercent >= 100
        ? "Wenn du nicht da bist, werden Behandlung und Anfahrt voll berechnet."
        : `Wenn du nicht da bist, fallen ${pct(policy.noShowFeePercent)} des Behandlungspreises und die Anfahrt an.`,
    );
  }

  parts.push("Offene Anfragen kannst du jederzeit kostenlos zurückziehen. Sagt dein Profi ab, entstehen dir keine Kosten. Die genaue Frist siehst du vor dem Bezahlen – mit Datum und Uhrzeit.");
  return parts.join(" ");
}

/** The nine questions of deck § 09 (six core, three recommended), every value bound to data. */
export function buildLandingFaq(input: { terms: LandingFaqTerms; liveCities: readonly string[]; activeCategorySlugs?: readonly string[] }): FaqItem[] {
  const { terms, liveCities } = input;
  const docs = terms.baseRequiredDocuments.map((d) => DOC_SHORT[d.kind] ?? d.label);
  const active = new Set(input.activeCategorySlugs ?? ["massage", "haare-styling"]);
  const examples = [
    active.has("massage") ? "eine Massageausbildung" : null,
    active.has("haare-styling") ? "für Haare & Styling den Meisterbrief bzw. die Eintragung in die Handwerksrolle" : null,
  ].filter((x): x is string => !!x);
  const qualification = `je nach Kategorie einen Qualifikationsnachweis${examples.length ? `, etwa ${examples.join(" oder ")}` : ""}`;
  const hours = terms.disputeWindowHours;

  return [
    {
      q: `Wie funktioniert ${BRAND_NAME}?`,
      a: "Du gibst deine Postleitzahl ein und wählst eine Behandlung und einen Zeitraum. Du siehst geprüfte Profis mit echten freien Terminen und dem Endpreis inklusive Anfahrt. Du buchst – und dein Profi kommt zu dir nach Hause, ins Hotel oder ins Büro.",
    },
    {
      q: `Wo gibt es ${BRAND_NAME}?`,
      a: [
        liveCities.length ? `Aktuell in ${joinGerman(liveCities)}.` : null,
        "Profis legen ihr Einsatzgebiet selbst fest. Ob es bei dir freie Termine gibt, siehst du, sobald du deine Postleitzahl eingibst. Noch niemand in deiner Gegend? Trag dich ein – wir sagen dir Bescheid, sobald Profis bei dir buchbar sind.",
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      q: `Wie prüft ${BRAND_NAME} die Profis?`,
      a: [
        `Auf ${BRAND_NAME} arbeiten selbstständige Profis mit Gewerbeanmeldung.`,
        docs.length ? `Bevor jemand buchbar ist, prüfen wir ${joinGerman(docs)} – und ${qualification}.` : `Bevor jemand buchbar ist, prüfen wir die Nachweise – und ${qualification}.`,
        "Läuft ein Pflichtnachweis ab, pausieren wir das Profil. Bewerten kann nur, wer wirklich gebucht hat.",
      ].join(" "),
    },
    {
      q: "Wie läuft die Buchung ab?",
      a: "Tipp auf eine freie Uhrzeit, gib an, wo der Termin stattfindet – Zuhause, Hotel oder Büro –, und bezahl online. Ein Konto legst du dabei nebenbei an, ohne Passwort. Bei „Sofort bestätigt“ steht dein Termin sofort. Bei „Auf Anfrage“ sagt dein Profi innerhalb einer Frist zu, die du vor dem Absenden siehst. Am Termin nennst du deinem Profi deinen vierstelligen Start-Code – damit beginnt der Termin.",
    },
    { q: "Was passiert, wenn ein Termin abgesagt wird?", a: cancellationAnswer(terms.cancellationPolicy) },
    {
      q: "Wie bezahle ich?",
      a: [
        "Online bei der Buchung, über unseren Zahlungsdienstleister Stripe. Welche Zahlarten verfügbar sind, siehst du im Bezahlschritt. Der Betrag wird zunächst nur reserviert und erst nach dem Termin belastet.",
        terms.customerServiceFeeCents === 0 ? `Eine Servicegebühr berechnet ${BRAND_NAME} nicht.` : null,
        "Bargeld gibt es nicht – so ist jeder Termin für beide Seiten abgesichert.",
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      q: `Ist eine Massage auf ${BRAND_NAME} eine medizinische Behandlung?`,
      a: `Nein. Alle Angebote auf ${BRAND_NAME} sind Beauty- und Wellnessanwendungen und ersetzen keine ärztliche, physiotherapeutische oder podologische Behandlung.`,
    },
    {
      q: "Wer sieht meine Adresse?",
      a: "Nur dein gebuchter Profi, und erst, wenn der Termin bestätigt ist. Nach dem Termin wird sie wieder ausgeblendet.",
    },
    {
      q: `Was ist die ${BRAND_NAME}-Garantie?`,
      a: `Stimmt etwas nicht, meldest du es bis ${hours}${NBSP}Stunden nach dem Termin über deine Buchung. Bis zur Klärung halten wir die Auszahlung an den Profi zurück und finden mit dir eine Lösung: Nachbesserung, Gutschrift oder Erstattung.`,
    },
  ];
}

/** Chapter 09 trust strip (deck § 09): facts, no badges. */
export function faqTrustStrip(terms: Pick<LandingFaqTerms, "disputeWindowHours">): string[] {
  return [
    "Verifizierte Profis",
    "Endpreis inkl. Anfahrt",
    `Bezahlt nur über ${BRAND_NAME}`,
    ...(terms.disputeWindowHours > 0 ? [`${BRAND_NAME}-Garantie: Problem melden bis ${terms.disputeWindowHours}${NBSP}Std. nach dem Termin`] : []),
  ];
}
