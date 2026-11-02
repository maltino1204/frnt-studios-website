/**
 * „Entdecken“ copy and link helpers (isomorphic: server cards, the „Für dich“ client chunk and the admin editor).
 * German, du, calm (brand/BRAND_VOICE.md). Never "kuratiert" or "handverlesen" (§ 6.3).
 */
import { formatPrice, formatTime, NBSP } from "@/lib/format";
import { routes } from "@/lib/routes";
import { BRAND_NAME } from "@/lib/brand";
import { dayLabel, TIME_OF_DAY_LABEL, TIME_OF_DAY_RANGE } from "./checkout-format";

/** Search filters a category item may carry: exactly the existing /suche params. */
export type ExploreFilters = { plz?: string; leistung?: string; datum?: string; zeit?: "morgens" | "mittags" | "abends" };

export const EXPLORE_ZEIT_OPTIONS = (["morgens", "mittags", "abends"] as const).map((v) => ({
  value: v,
  label: `${TIME_OF_DAY_LABEL[v]} ${TIME_OF_DAY_RANGE[v].replace(" ", NBSP)}`,
}));

/** /suche link of a category item (kategorie + its filters). */
export function exploreSearchHref(categorySlug: string, f: ExploreFilters = {}): string {
  return routes.search({ plz: f.plz, kategorie: categorySlug, leistung: f.leistung, datum: f.datum, zeit: f.zeit });
}

/** The label every collection carries (UWG § 5a Abs. 4, DSA Art. 26: paid placements read „Anzeige“). */
export type CollectionLabel = { kind: "editorial" | "sponsored"; text: string; info: string };

export const EDITORIAL_LABEL = `Von ${BRAND_NAME} ausgewählt`;
export const SPONSORED_LABEL = "Anzeige";

export function collectionLabel(c: { isSponsored: boolean; sponsorName: string | null }): CollectionLabel {
  if (c.isSponsored) {
    const who = c.sponsorName?.trim();
    return {
      kind: "sponsored",
      text: SPONSORED_LABEL,
      info: who ? `Bezahlte Platzierung im Auftrag von ${who}.` : "Bezahlte Platzierung.",
    };
  }
  return {
    kind: "editorial",
    text: EDITORIAL_LABEL,
    info: `Eine redaktionelle Auswahl von ${BRAND_NAME}. Niemand bezahlt dafür, hier zu erscheinen.`,
  };
}

/** "6 Behandlungen" / "1 Behandlung" */
export function itemCountLabel(n: number): string {
  return `${n}${NBSP}${n === 1 ? "Behandlung" : "Behandlungen"}`;
}

/** "60 / 90 Min." with non-breaking spaces; "" without durations. */
export function durationsText(durations: number[]): string {
  const d = [...new Set(durations)].sort((a, b) => a - b);
  return d.length ? `${d.join(`${NBSP}/${NBSP}`)}${NBSP}Min.` : "";
}

/** "ab 49 €" / "49 €" (excl. travel; the card says „zzgl. Anfahrt“ next to it). */
export function priceText(p: { cents: number; from: boolean }): string {
  return p.from ? `ab${NBSP}${formatPrice(p.cents)}` : formatPrice(p.cents);
}

/** "Heute, 18:30" · "Morgen, 09:00" · "Do., 12. Nov., 18:30" (a slot from the availability engine; only in „Für dich“, client-rendered). */
export function slotText(iso: string, now: Date = new Date()): string {
  return `${dayLabel(iso, now)}, ${formatTime(iso)}`;
}

const sinceFmt = { v: null as Intl.DateTimeFormat | null };
/** "21. Okt." (the approval date of a new Profi; Europe/Berlin, non-breaking space). */
export function sinceText(iso: string): string {
  sinceFmt.v ??= new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", day: "numeric", month: "short" });
  return sinceFmt.v.format(new Date(iso)).replace(/ /g, NBSP);
}

export const FOR_YOU_WHY_HREF = "/ranking#fuer-dich";
export const SELECTION_WHY_HREF = "/ranking#auswahl";
export const COUNT_WHY_HREF = "/ranking#entdecken";
