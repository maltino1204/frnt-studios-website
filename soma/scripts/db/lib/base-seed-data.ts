/**
 * Base seed data: launch cities, taxonomy, platform settings, commission, CMS.
 * Wellness wording only (Heilmittelwerbegesetz): no healing or therapy claims.
 */

export interface SeedCity {
  slug: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  sortOrder: number;
  /** inclusive numeric PLZ ranges that belong to the city */
  plzRanges: Array<[number, number]>;
}

export const CITIES: SeedCity[] = [
  { slug: "berlin", name: "Berlin", state: "Berlin", lat: 52.52, lng: 13.405, sortOrder: 1,
    plzRanges: [[10115, 10999], [12043, 12689], [13051, 13629], [14050, 14199]] },
  { slug: "hamburg", name: "Hamburg", state: "Hamburg", lat: 53.5511, lng: 9.9937, sortOrder: 2,
    plzRanges: [[20095, 20539], [21029, 21039], [21073, 21149], [22041, 22769]] },
  { slug: "muenchen", name: "München", state: "Bayern", lat: 48.1351, lng: 11.582, sortOrder: 3,
    plzRanges: [[80331, 81929]] },
  { slug: "koeln", name: "Köln", state: "Nordrhein-Westfalen", lat: 50.9375, lng: 6.9603, sortOrder: 4,
    plzRanges: [[50667, 51149]] },
  { slug: "frankfurt", name: "Frankfurt am Main", state: "Hessen", lat: 50.1109, lng: 8.6821, sortOrder: 5,
    plzRanges: [[60306, 60599], [65929, 65936]] },
  { slug: "duesseldorf", name: "Düsseldorf", state: "Nordrhein-Westfalen", lat: 51.2277, lng: 6.7735, sortOrder: 6,
    plzRanges: [[40210, 40629]] },
];

export interface SeedService {
  slug: string;
  name: string;
  description: string;
  durations: number[];
  defaultDuration: number;
  priceHintFromCents: number;
  attributes?: Record<string, unknown>;
}

export interface SeedCategory {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  requiredDocuments: Array<{ kind: string; label: string }>;
  services: SeedService[];
}

export const CATEGORIES: SeedCategory[] = [
  {
    slug: "massage",
    name: "Massage",
    tagline: "Klassisch, Aromaöl, Hot Stone.",
    description:
      "Wellnessmassagen von geprüften Profis – klassisch, mit Aromaöl, Hot Stone oder kurz für Rücken und Nacken. Liege, Öl und Tücher kommen mit.",
    seoTitle: "Wellnessmassage zu Hause buchen",
    seoDescription: "Wellnessmassage bei dir zu Hause, im Hotel oder im Büro: geprüfte Profis, Endpreis inkl. Anfahrt, kostenlos stornierbar bis 24 Std. vorher.",
    requiredDocuments: [{ kind: "qualification", label: "Nachweis einer Massageausbildung (Wellness)" }],
    services: [
      { slug: "entspannungsmassage", name: "Entspannungsmassage (klassisch)", durations: [60, 90], defaultDuration: 60, priceHintFromCents: 7500,
        description: "Ganzkörpermassage mit warmem Öl und ruhigen, fließenden Griffen. Für ein gutes Körpergefühl nach einem langen Tag.",
        attributes: { intake_form: true, equipment: ["Massageliege"] } },
      { slug: "aromaoelmassage", name: "Aromaölmassage", durations: [60, 90], defaultDuration: 60, priceHintFromCents: 8000,
        description: "Sanfte Ganzkörpermassage mit ausgewählten ätherischen Ölen und ruhigen, fließenden Griffen.",
        attributes: { intake_form: true, allergy_question: true, equipment: ["Massageliege"] } },
      { slug: "hot-stone-massage", name: "Hot-Stone-Massage", durations: [90], defaultDuration: 90, priceHintFromCents: 11500,
        description: "Wohlige Wärme erwärmter Basaltsteine, kombiniert mit fließenden Massagegriffen.",
        attributes: { intake_form: true, equipment: ["Massageliege", "Steine"] } },
      { slug: "sportmassage", name: "Sportmassage", durations: [60], defaultDuration: 60, priceHintFromCents: 8000,
        description: "Kräftige, belebende Wellnessmassage für aktive Menschen – ideal nach Training oder einem langen Tag. Keine medizinische Anwendung.",
        attributes: { intake_form: true, equipment: ["Massageliege"] } },
      { slug: "thai-massage", name: "Thai-Massage", durations: [90], defaultDuration: 90, priceHintFromCents: 9500,
        description: "Traditionelle Dehn- und Drucktechniken auf der Matte, in bequemer Kleidung.",
        attributes: { intake_form: true, equipment: ["Bodenmatte"] } },
      { slug: "ruecken-nacken-massage", name: "Rücken- & Nackenmassage", durations: [30, 45], defaultDuration: 30, priceHintFromCents: 4500,
        description: "Kurze Wellnessmassage für Rücken, Schultern und Nacken – perfekt für eine Pause im Büro.",
        attributes: { equipment: ["Massagestuhl"] } },
    ],
  },
  {
    slug: "manikuere",
    name: "Maniküre",
    tagline: "Von klassisch mit Lack bis Gel.",
    description: "Klassisch mit Lack, Shellac oder Gel-Modellage – von Profis mit Kurszertifikat. Ein Tisch mit gutem Licht genügt.",
    seoTitle: "Maniküre zu Hause buchen",
    seoDescription: "Maniküre, Shellac und Gelnägel bei dir zu Hause, im Hotel oder im Büro. Geprüfte Profis, Endpreis inkl. Anfahrt.",
    requiredDocuments: [{ kind: "qualification", label: "Kurszertifikat Maniküre oder Nageldesign" }],
    services: [
      { slug: "klassische-manikuere", name: "Klassische Maniküre mit Lack", durations: [45], defaultDuration: 45, priceHintFromCents: 3500,
        description: "Nägel formen, Nagelhaut pflegen, Handmassage und Lack in deiner Wunschfarbe." },
      { slug: "shellac-manikuere", name: "Shellac-Maniküre", durations: [60], defaultDuration: 60, priceHintFromCents: 4500,
        description: "Nägel in Form, Nagelhaut gepflegt, Shellac in deiner Farbe. Glänzt bis zu drei Wochen." },
      { slug: "gelnaegel-neumodellage", name: "Gelnägel Neumodellage", durations: [120], defaultDuration: 120, priceHintFromCents: 7000,
        description: "Neue Gelnägel nach deinen Wünschen in Form und Länge, inklusive Farbgel.",
        attributes: { portfolio_required: true } },
      { slug: "gelnaegel-auffuellen", name: "Gelnägel Auffüllen", durations: [90], defaultDuration: 90, priceHintFromCents: 5500,
        description: "Auffüllen und Neugestalten bestehender Gelnägel.", attributes: { rebook_weeks: 3 } },
      { slug: "herrenmanikuere", name: "Herrenmaniküre", durations: [30], defaultDuration: 30, priceHintFromCents: 3000,
        description: "Gepflegte, natürliche Nägel – kürzen, feilen, Nagelhautpflege, ohne Lack." },
    ],
  },
  {
    slug: "pedikuere",
    name: "Pediküre",
    tagline: "Kosmetische Fußpflege im eigenen Sessel.",
    description: "Kosmetische Pediküre – klassisch, mit Shellac oder mit Fußmassage. Keine medizinische Fußpflege.",
    seoTitle: "Pediküre zu Hause buchen",
    seoDescription: "Kosmetische Pediküre mit oder ohne Shellac bei dir zu Hause – geprüfte Profis, Endpreis inkl. Anfahrt.",
    requiredDocuments: [{ kind: "qualification", label: "Nachweis Ausbildung kosmetische Fußpflege" }],
    services: [
      { slug: "klassische-pedikuere", name: "Klassische Pediküre", durations: [50], defaultDuration: 50, priceHintFromCents: 4500,
        description: "Fußbad, Nägel kürzen und formen, Hornhaut sanft glätten, pflegende Creme." },
      { slug: "pedikuere-shellac", name: "Pediküre mit Shellac", durations: [75], defaultDuration: 75, priceHintFromCents: 6000,
        description: "Klassische Pediküre plus langhaltender Shellac-Lack." },
      { slug: "wellness-pedikuere", name: "Wellness-Pediküre mit Fußmassage", durations: [75], defaultDuration: 75, priceHintFromCents: 6500,
        description: "Fußbad, Peeling, Nägel in Form, Maske – und zum Schluss eine entspannende Fußmassage." },
      { slug: "manikuere-pedikuere", name: "Maniküre & Pediküre", durations: [105], defaultDuration: 105, priceHintFromCents: 8000,
        description: "Das Komplettpaket für Hände und Füße in einem Termin." },
    ],
  },
  {
    slug: "kosmetik",
    name: "Kosmetik",
    tagline: "Gesichtsbehandlungen und Waxing.",
    description: "Gesichtsbehandlungen und Waxing von Profis mit Kosmetikausbildung – mit professionellen Produkten, an einem ruhigen Platz bei dir.",
    seoTitle: "Kosmetikbehandlung zu Hause buchen",
    seoDescription: "Gesichtsbehandlungen und Waxing bei dir zu Hause: geprüfte Profis mit Kosmetikausbildung, Endpreis inkl. Anfahrt.",
    requiredDocuments: [{ kind: "qualification", label: "Nachweis der Kosmetikausbildung" }],
    services: [
      { slug: "express-gesichtsbehandlung", name: "Express-Gesichtsbehandlung", durations: [30], defaultDuration: 30, priceHintFromCents: 4000,
        description: "Reinigung, Peeling und Pflege – in 30 Minuten." },
      { slug: "klassische-gesichtsbehandlung", name: "Klassische Gesichtsbehandlung", durations: [60], defaultDuration: 60, priceHintFromCents: 6500,
        description: "Reinigung, Peeling, Ausreinigung, Maske und Pflege – abgestimmt auf deine Haut." },
      { slug: "feuchtigkeitspflege", name: "Feuchtigkeits- & Pflegebehandlung", durations: [90], defaultDuration: 90, priceHintFromCents: 9500,
        description: "Intensive Feuchtigkeitspflege mit Massage und Maske für einen frischen, gepflegten Teint." },
      { slug: "waxing-beine", name: "Waxing Beine komplett", durations: [45], defaultDuration: 45, priceHintFromCents: 4000,
        description: "Haarentfernung an beiden Beinen mit hautschonendem Wachs." },
    ],
  },
  {
    slug: "make-up",
    name: "Make-up",
    tagline: "Für Büro, Abend und Hochzeit.",
    description: "Make-up für den Alltag, besondere Abende und deinen großen Tag – zu Hause oder im Hotel. Für Braut-Make-up gibt es eine eigene Probe.",
    seoTitle: "Make-up-Artist nach Hause buchen",
    seoDescription: "Tages-, Abend- und Braut-Make-up bei dir zu Hause oder im Hotel. Geprüfte Profis mit Portfolio, Endpreis inkl. Anfahrt.",
    requiredDocuments: [],
    services: [
      { slug: "tages-make-up", name: "Tages-Make-up", durations: [45], defaultDuration: 45, priceHintFromCents: 5000,
        description: "Natürliches, frisches Make-up für Büro, Fotos oder Alltag." },
      { slug: "event-make-up", name: "Abend- & Event-Make-up", durations: [60], defaultDuration: 60, priceHintFromCents: 7000,
        description: "Ausdrucksstarkes Make-up für Feiern, Galas und besondere Abende." },
      { slug: "braut-make-up-probe", name: "Braut-Make-up Probe", durations: [75], defaultDuration: 75, priceHintFromCents: 7000,
        description: "Gemeinsam findet ihr deinen Look für den großen Tag – in Ruhe und ohne Zeitdruck." },
      { slug: "braut-make-up", name: "Braut-Make-up", durations: [90], defaultDuration: 90, priceHintFromCents: 15000,
        description: "Dein Braut-Make-up am Hochzeitstag, langanhaltend und fotogen.", attributes: { recommended_mode: "request" } },
    ],
  },
  {
    slug: "haare-styling",
    name: "Haare & Styling",
    tagline: "Föhnen, Schnitt, Hochsteckfrisur.",
    description: "Föhnen, Haarschnitt und Hochsteckfrisur von Profis mit Meisterbrief oder Eintragung in die Handwerksrolle.",
    seoTitle: "Friseur nach Hause buchen",
    seoDescription: "Haarschnitt, Föhnen und Hochsteckfrisur bei dir zu Hause. Alle Profis mit Meisterbrief oder Eintragung in die Handwerksrolle.",
    requiredDocuments: [{ kind: "qualification", label: "Meisterbrief oder Eintragung in die Handwerksrolle" }],
    services: [
      { slug: "foehnen-styling", name: "Föhnen & Styling", durations: [45], defaultDuration: 45, priceHintFromCents: 4000,
        description: "Waschen, föhnen, stylen – glatt, mit Wellen oder mit Volumen. Bevor der Abend beginnt." },
      { slug: "hochsteckfrisur", name: "Hochsteckfrisur", durations: [60], defaultDuration: 60, priceHintFromCents: 7000,
        description: "Elegante Hochsteckfrisur für Hochzeit, Gala oder Feier." },
      { slug: "damenhaarschnitt", name: "Damenhaarschnitt inkl. Föhnen", durations: [60], defaultDuration: 60, priceHintFromCents: 5500,
        description: "Beratung, Waschen, Schnitt und Föhnen." },
      { slug: "herrenhaarschnitt", name: "Herrenhaarschnitt", durations: [30], defaultDuration: 30, priceHintFromCents: 3000,
        description: "Klassischer oder moderner Herrenschnitt inklusive Styling." },
    ],
  },
  {
    slug: "brows-lashes",
    name: "Brows & Lashes",
    tagline: "Lifting, Lamination, Verlängerung.",
    description: "Augenbrauen und Wimpern von Profis mit Kurszertifikat. Einen Verträglichkeitstest stimmst du auf Wunsch vorab mit deinem Profi ab.",
    seoTitle: "Wimpern & Augenbrauen zu Hause buchen",
    seoDescription: "Wimpernlifting, Wimpernverlängerung und Brow Lamination bei dir zu Hause – geprüfte Profis mit Kurszertifikat.",
    requiredDocuments: [{ kind: "qualification", label: "Kurszertifikat Wimpern- bzw. Augenbrauenbehandlung" }],
    services: [
      { slug: "brauen-zupfen-faerben", name: "Augenbrauen zupfen & färben", durations: [30], defaultDuration: 30, priceHintFromCents: 2500,
        description: "Formen und Färben der Augenbrauen passend zu deinem Gesicht.", attributes: { patch_test: true } },
      { slug: "brow-lamination", name: "Brow Lamination inkl. Färben", durations: [45], defaultDuration: 45, priceHintFromCents: 5000,
        description: "Gebürstete, volle Brauen für bis zu sechs Wochen.", attributes: { patch_test: true } },
      { slug: "wimpernlifting", name: "Wimpernlifting inkl. Färben", durations: [60], defaultDuration: 60, priceHintFromCents: 5500,
        description: "Natürlich geschwungene, dunklere Wimpern – ganz ohne Verlängerung.", attributes: { patch_test: true } },
      { slug: "wimpernverlaengerung-neuset", name: "Wimpernverlängerung Neuset (1:1)", durations: [120], defaultDuration: 120, priceHintFromCents: 11000,
        description: "Einzelwimpern-Technik für einen natürlichen, dichten Look.", attributes: { patch_test: true, portfolio_required: true } },
      { slug: "wimpernverlaengerung-auffuellen", name: "Wimpernverlängerung Auffüllen", durations: [75], defaultDuration: 75, priceHintFromCents: 5500,
        description: "Auffüllen bestehender Wimpernverlängerung nach zwei bis drei Wochen.", attributes: { patch_test: true, rebook_weeks: 3 } },
    ],
  },
];

/** SOMA Standard (docs/architecture.md §5.5): fee basis = service price; travel kept only < 2 h / no-show; 15-min Bedenkzeit. */
export const DEFAULT_CANCELLATION_POLICY = {
  tiers: [
    { min_hours_before: 24, fee_percent: 0, travel_fee_retained: false },
    { min_hours_before: 2, fee_percent: 50, travel_fee_retained: false },
    { min_hours_before: 0, fee_percent: 100, travel_fee_retained: true },
  ],
  no_show_fee_percent: 100,
  provider_cancellation: "full_refund",
  grace_minutes: 15,
  fee_basis: "service_price",
} as const;

export const PLATFORM_SETTINGS: Record<string, unknown> = {
  cancellation_policy: DEFAULT_CANCELLATION_POLICY,
  hold_minutes: 10,
  request_response_hours: 4,
  slot_step_minutes: 30,
  referral_reward_cents: 1500,
  referral_welcome_cents: 1500,
  customer_service_fee_cents: 0,
  review_window_days: 14,
  dispute_window_hours: 48,
  payout_hold_hours: 48,
  auto_complete_hours: 24,
  search_days_ahead: 7,
  coverage_min_providers: 2,
  base_required_documents: [
    { kind: "id_document", label: "Personalausweis oder Reisepass" },
    { kind: "business_registration", label: "Gewerbeanmeldung" },
    { kind: "insurance", label: "Berufs- bzw. Betriebshaftpflichtversicherung" },
  ],
};

export const GLOBAL_COMMISSION = { rate: 0.2, repeatClientRate: 0.12, ownClientRate: 0.05 };

const cityIntro = (name: string, extra: string) => ({
  title: `Beauty & Wellness bei dir. In ${name}`,
  body: `Geprüfte Profis für Massage, Maniküre, Kosmetik, Make-up und mehr kommen zu dir – nach Hause, ins Hotel oder ins Büro. ${extra}`,
});

export const CONTENT_BLOCKS: Record<string, unknown> = {
  // Copy: brand/COPY_DECK_LANDING.md (hero alternative B = the German signature line, steps 01–03, FAQ 1–9).
  "home.hero": {
    eyebrow: "Zu Hause · Hotel · Büro",
    title: "Du bleibst. Dein Profi kommt.",
    subtitle: "Geprüfte Profis für Massage, Nägel, Kosmetik, Haare und Make-up kommen zu dir – nach Hause, ins Hotel oder ins Büro.",
    cta: "Freie Termine finden",
  },
  "home.how_it_works": {
    steps: [
      { title: "Entdecken", body: "Finde deine Behandlung. PLZ, Behandlung, Zeitraum: Du siehst nur echte freie Termine – mit Endpreis inklusive Anfahrt." },
      { title: "Buchen", body: "Wähl Ort und Uhrzeit – Zuhause, Hotel oder Büro. Bezahlt wird online, belastet erst nach dem Termin." },
      { title: "Bleiben", body: "Dein Profi kommt zu dir. Mit deinem vierstelligen Start-Code beginnt der Termin." },
    ],
  },
  "home.faq": {
    items: [
      { q: "Wie funktioniert SOMA?", a: "Du gibst deine Postleitzahl ein und wählst eine Behandlung und einen Zeitraum. Du siehst geprüfte Profis mit echten freien Terminen und dem Endpreis inklusive Anfahrt. Du buchst – und dein Profi kommt zu dir nach Hause, ins Hotel oder ins Büro." },
      { q: "Wie prüft SOMA die Profis?", a: "Bevor jemand buchbar ist, prüfen wir Ausweis, Gewerbeanmeldung und Berufshaftpflicht – und je nach Kategorie einen Qualifikationsnachweis, etwa eine Massageausbildung oder für Haare & Styling den Meisterbrief bzw. die Eintragung in die Handwerksrolle. Läuft ein Pflichtnachweis ab, pausieren wir das Profil. Bewerten kann nur, wer wirklich gebucht hat." },
      { q: "Was kostet die Anfahrt?", a: "Die Anfahrt ist im Endpreis schon enthalten. Den Gesamtpreis siehst du in der Suche, bevor du buchst." },
      { q: "Kann ich kostenlos stornieren?", a: "Bis 24\u00a0Stunden vor dem Termin stornierst du kostenlos, in den ersten 15\u00a0Minuten nach der Buchung sogar immer. Danach fallen gestaffelte Gebühren an; die genaue Frist siehst du vor dem Bezahlen – mit Datum und Uhrzeit." },
      { q: "Wann wird meine Karte belastet?", a: "Bei der Buchung wird der Betrag nur reserviert. Belastet wird erst nach dem Termin. Bargeld gibt es nicht." },
      { q: "Ist eine Massage auf SOMA eine medizinische Behandlung?", a: "Nein. Alle Angebote auf SOMA sind Beauty- und Wellnessanwendungen und ersetzen keine ärztliche, physiotherapeutische oder podologische Behandlung." },
      // Zero-tolerance rule (BRAND_VOICE § 7.9 P5, client-approved 2026-11-01).
      { q: "Welche Anfragen sind ausgeschlossen?", a: "SOMA vermittelt ausschließlich Wellness- und Beautybehandlungen. Anzügliche Anfragen oder Bemerkungen führen zur Sperrung des Kontos." },
    ],
  },
  announcement: { active: false, text: "" },
  "city.berlin.intro": cityIntro("Berlin", "Von Prenzlauer Berg bis Zehlendorf."),
  "city.hamburg.intro": cityIntro("Hamburg", "Von Eimsbüttel bis Blankenese."),
  "city.muenchen.intro": cityIntro("München", "Von Schwabing bis Sendling."),
  "city.koeln.intro": cityIntro("Köln", "Vom Belgischen Viertel bis Deutz."),
  "city.frankfurt.intro": cityIntro("Frankfurt am Main", "Vom Nordend bis Sachsenhausen."),
  "city.duesseldorf.intro": cityIntro("Düsseldorf", "Von Pempelfort bis Oberkassel."),
};
