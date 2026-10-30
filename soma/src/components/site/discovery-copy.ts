/**
 * Copy and pure helpers for the discovery & brand surfaces (home, category,
 * city and SEO pages). Isomorphic: no server-only imports, no React,
 * so client components (booking entry) and server pages share one source.
 */
import type { CancellationPolicyDTO, CategoryDTO, CategoryWithServicesDTO, RequiredDocumentDTO } from "@/server/dto";
import { BRAND_NAME } from "@/lib/brand";
import { formatPrice, plural } from "@/lib/format";

/* ------------------------------------------------------------------------ */
/* Numbers in words (headlines read better with words than digits)          */
/* ------------------------------------------------------------------------ */
const WORDS = ["null", "eine", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"];

/** 6 → "sechs"; numbers above twelve stay digits. */
export function numberWord(n: number): string {
  return n >= 0 && n < WORDS.length ? WORDS[n] : n.toLocaleString("de-DE");
}

export function capitalize(s: string): string {
  return s ? s[0].toLocaleUpperCase("de-DE") + s.slice(1) : s;
}

/** Splits "Satz eins. Satz zwei." into the plain first sentence and an italic second clause. */
export function splitHeadline(title: string): [string, string | null] {
  const m = title.trim().match(/^(.+?[.!?])\s+(.+)$/);
  return m ? [m[1], m[2]] : [title.trim(), null];
}

/* ------------------------------------------------------------------------ */
/* Place lines (Ortszeilen): the editorial signature                        */
/* ------------------------------------------------------------------------ */
export const PLACE_LINES = {
  home: "Altbau, 3. OG · Berlin-Prenzlauer Berg · 19:30",
  arrival: "Wohnungstür, 2. OG · Köln-Ehrenfeld · 18:55",
  setup: "Wohnzimmer · Hamburg-Eimsbüttel · 19:05",
  after: "Sofa, danach · München-Schwabing · 20:20",
  hotel: "Hotelsuite, 6. Stock · Frankfurt-Westend · 21:10",
  office: "Besprechungsraum · Hamburg-HafenCity · 13:00",
  pros: "Treppenhaus, Altbau · Berlin-Neukölln · 17:40",
} as const;

/* ------------------------------------------------------------------------ */
/* Booking entry catalogue (slim client payload)                            */
/* ------------------------------------------------------------------------ */
export type EntryService = { id: string; slug: string; name: string; durations: number[]; fromCents: number | null };
export type EntryCategory = { slug: string; name: string; tagline: string | null; imagePath: string | null; services: EntryService[] };

/** Strips the catalogue down to what the booking entry needs; prices are real floors (null = no offer yet). */
export function toEntryCatalog(catalog: CategoryWithServicesDTO[], floors: Record<string, number> = {}): EntryCategory[] {
  return catalog.map((c) => ({
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    imagePath: c.imagePath,
    services: c.services.map((s) => ({ id: s.id, slug: s.slug, name: s.name, durations: s.durations, fromCents: floors[s.id] ?? null })),
  }));
}

export function floorsById(floors: Array<{ serviceId: string; fromCents: number }>): Record<string, number> {
  return Object.fromEntries(floors.map((f) => [f.serviceId, f.fromCents]));
}

/** "60 / 90 Min." */
export function durationsLabel(durations: number[]): string {
  const sorted = [...durations].sort((a, b) => a - b);
  if (sorted.length === 0) return "";
  return `${sorted.join(" / ")} Min.`;
}

/** "ab 49 €" with a non-breaking space; null when no provider offers it yet. */
export function fromPrice(cents: number | null | undefined): string | null {
  return cents == null ? null : `ab ${formatPrice(cents)}`;
}

/* ------------------------------------------------------------------------ */
/* Cancellation policy in words                                             */
/* ------------------------------------------------------------------------ */
export function hoursLabel(h: number): string {
  if (h > 0 && h % 24 === 0 && h >= 48) return plural(h / 24, "Tag", "Tage");
  return plural(h, "Stunde", "Stunden");
}

export type PolicyRow = { when: string; fee: string; feePercent: number };

/** Tiers sorted from the most generous; each row: "Bis 24 Stunden vorher" → "kostenlos". */
export function policyRows(policy: CancellationPolicyDTO): PolicyRow[] {
  const tiers = [...policy.tiers].sort((a, b) => b.minHoursBefore - a.minHoursBefore);
  return tiers.map((t, i) => {
    const prev = tiers[i - 1];
    let when: string;
    if (i === 0 && t.minHoursBefore > 0) when = `Bis ${hoursLabel(t.minHoursBefore)} vor dem Termin`;
    else if (t.minHoursBefore <= 0) when = prev ? `Weniger als ${hoursLabel(prev.minHoursBefore)} vor dem Termin` : "Jederzeit";
    else when = prev ? `Zwischen ${prev.minHoursBefore} und ${hoursLabel(t.minHoursBefore)} vor dem Termin` : `Ab ${hoursLabel(t.minHoursBefore)} vorher`;
    return { when, fee: t.feePercent <= 0 ? "Kostenlos" : `${t.feePercent} % des Preises`, feePercent: t.feePercent };
  });
}

/** Hours before the start until which cancelling is free (null when there is no free tier). */
export function freeCancellationHours(policy: CancellationPolicyDTO): number | null {
  const free = policy.tiers.filter((t) => t.feePercent <= 0).sort((a, b) => a.minHoursBefore - b.minHoursBefore)[0];
  return free ? free.minHoursBefore : null;
}

/** "Kostenlos stornierbar bis 24 Stunden vor dem Termin." */
export function freeCancellationSentence(policy: CancellationPolicyDTO): string {
  const h = freeCancellationHours(policy);
  return h == null ? "Die Stornobedingungen sehen Sie vor jeder Buchung." : h <= 0 ? "Kostenlos stornierbar bis zum Termin." : `Kostenlos stornierbar bis ${hoursLabel(h)} vor dem Termin.`;
}

/* ------------------------------------------------------------------------ */
/* Category copy                                                            */
/* ------------------------------------------------------------------------ */
const PREP: Record<string, string> = {
  massage: "Für die Liege braucht es etwa 2 × 3 Meter freie Fläche. Liege, Öl und Tücher bringt Ihr Profi mit.",
  manikuere: "Ein Tisch mit gutem Licht genügt, am besten am Fenster. Werkzeug, Lacke und Lampe bringt Ihr Profi mit.",
  pedikuere: "Ein bequemer Sessel und etwas Platz davor genügen. Fußbad, Werkzeug und Handtücher bringt Ihr Profi mit.",
  kosmetik: "Ein ruhiger, gut beleuchteter Platz genügt. Produkte und Tücher bringt Ihr Profi mit.",
  "make-up": "Ein Stuhl mit Tageslicht ist ideal. Das komplette Make-up-Set bringt Ihr Profi mit.",
  "haare-styling": "Ein Stuhl und ein Platz, an dem Haare fallen dürfen – etwa Küche oder Bad. Werkzeug und Umhang bringt Ihr Profi mit.",
  "brows-lashes": "Ein Platz zum bequemen Zurücklehnen und gutes Licht genügen. Alles Weitere bringt Ihr Profi mit.",
};

const EXTRA_FAQ: Record<string, FaqItem[]> = {
  massage: [
    {
      q: `Ist eine Massage auf ${BRAND_NAME} eine medizinische Behandlung?`,
      a: `Nein. Massagen auf ${BRAND_NAME} sind Wellnessanwendungen für Entspannung und Wohlbefinden. Sie ersetzen keine ärztliche oder physiotherapeutische Behandlung.`,
    },
  ],
  pedikuere: [
    {
      q: "Ist das medizinische Fußpflege?",
      a: `Nein. Auf ${BRAND_NAME} buchen Sie kosmetische Pediküre. Medizinische Fußpflege ist Podologinnen und Podologen vorbehalten.`,
    },
  ],
  "brows-lashes": [
    {
      q: "Gibt es vorab einen Verträglichkeitstest?",
      a: "Auf Wunsch ja. Vermerken Sie es bei der Buchung in den Hinweisen; Ihr Profi stimmt den Test vorab mit Ihnen ab.",
    },
  ],
};

export type FaqItem = { q: string; a: string };

export function categoryFaq(
  category: Pick<CategoryDTO, "slug" | "name" | "requiredDocuments">,
  opts: { baseDocuments: RequiredDocumentDTO[]; policy: CancellationPolicyDTO; fromCents: number | null; cityName?: string },
): FaqItem[] {
  const docs = [...opts.baseDocuments, ...category.requiredDocuments].map((d) => d.label);
  const where = opts.cityName ? ` in ${opts.cityName}` : "";
  const items: FaqItem[] = [
    {
      q: "Was muss ich zu Hause vorbereiten?",
      a: PREP[category.slug] ?? "Ein ruhiger, gut beleuchteter Platz genügt. Alles Weitere bringt Ihr Profi mit.",
    },
    {
      q: `Wie setzt sich der Preis${where} zusammen?`,
      a:
        "Die Preise legen die Profis selbst fest. In der Suche sehen Sie für jeden Profi den Endpreis inklusive Anfahrt, bevor Sie buchen." +
        (opts.fromCents != null ? ` Aktuell beginnen die Preise${where} bei ${formatPrice(opts.fromCents)} ohne Anfahrt.` : ""),
    },
    {
      q: `Wie prüft ${BRAND_NAME} die Profis?`,
      a: docs.length
        ? `Bevor ein Profi buchbar ist, prüfen wir: ${docs.join(", ")}.`
        : "Bevor ein Profi buchbar ist, prüfen wir Identität, Gewerbeanmeldung und Versicherung.",
    },
    {
      q: "Kann ich auch ins Hotel oder ins Büro buchen?",
      a: "Ja. Bei der Buchung wählen Sie Zuhause, Hotel oder Büro und geben an, wie Ihr Profi Sie findet – etwa Zimmernummer, Name an der Rezeption oder Etage.",
    },
    { q: "Bis wann kann ich kostenlos stornieren?", a: `${freeCancellationSentence(opts.policy)} Die genaue Frist sehen Sie vor der Buchung mit Datum und Uhrzeit.` },
    ...(EXTRA_FAQ[category.slug] ?? []),
  ];
  return items;
}

/** Inserts soft hyphens into long compound words of a display headline (guideline §5). */
export function shy(text: string): string {
  return text
    .replace(/Wimpernverlängerung/g, "Wimpern­verlängerung")
    .replace(/Gesichtsbehandlung/g, "Gesichts­behandlung")
    .replace(/Entspannungsmassage/g, "Entspannungs­massage")
    .replace(/Schwangerschaftsmassage/g, "Schwangerschafts­massage")
    .replace(/Hochsteckfrisur/g, "Hochsteck­frisur")
    .replace(/Behandlungen/g, "Behand­lungen");
}
