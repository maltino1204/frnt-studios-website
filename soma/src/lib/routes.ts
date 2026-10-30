/**
 * Central route builders. Use these instead of string literals so German slugs
 * stay consistent across customer, provider and admin surfaces.
 */
export type SearchParams = {
  plz?: string;
  kategorie?: string;
  leistung?: string;
  dauer?: number;
  datum?: string; // YYYY-MM-DD (Europe/Berlin)
  zeit?: "morgens" | "mittags" | "abends";
  sort?: "empfohlen" | "preis" | "bewertung" | "entfernung";
};

function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const routes = {
  home: () => "/",
  categories: () => "/behandlungen",
  category: (slug: string) => `/behandlungen/${slug}`,
  categoryCity: (slug: string, city: string) => `/behandlungen/${slug}/${city}`,
  cities: () => "/staedte",
  city: (slug: string) => `/staedte/${slug}`,
  search: (p: SearchParams = {}) => `/suche${qs(p)}`,
  provider: (slug: string, p: { leistung?: string; dauer?: number; plz?: string; datum?: string } = {}) =>
    `/profis/${slug}${qs(p)}`,
  checkout: (p: { angebot: string; start: string; plz?: string; adresse?: string }) => `/buchen${qs(p)}`,
  booking: (id: string) => `/buchung/${id}`,
  login: (next?: string) => `/anmelden${qs({ next })}`,
  register: (next?: string) => `/registrieren${qs({ next })}`,
  forPros: () => "/fuer-profis",
  help: () => "/hilfe",
  imprint: () => "/impressum",
  privacy: () => "/datenschutz",
  terms: () => "/agb",
  account: {
    root: () => "/konto",
    bookings: () => "/konto/termine",
    favorites: () => "/konto/favoriten",
    addresses: () => "/konto/adressen",
    profile: () => "/konto/profil",
    credits: () => "/konto/guthaben",
    notifications: () => "/konto/benachrichtigungen",
  },
  pro: {
    root: () => "/pro",
    onboarding: () => "/pro/registrieren",
    bookings: () => "/pro/termine",
    booking: (id: string) => `/pro/termine/${id}`,
    calendar: () => "/pro/kalender",
    services: () => "/pro/leistungen",
    area: () => "/pro/einsatzgebiet",
    profile: () => "/pro/profil",
    verification: () => "/pro/verifizierung",
    earnings: () => "/pro/einnahmen",
    reviews: () => "/pro/bewertungen",
    settings: () => "/pro/einstellungen",
  },
  admin: {
    root: () => "/admin",
    users: () => "/admin/nutzer",
    providers: () => "/admin/profis",
    provider: (id: string) => `/admin/profis/${id}`,
    categories: () => "/admin/kategorien",
    bookings: () => "/admin/buchungen",
    booking: (id: string) => `/admin/buchungen/${id}`,
    disputes: () => "/admin/streitfaelle",
    payments: () => "/admin/zahlungen",
    commissions: () => "/admin/provisionen",
    regions: () => "/admin/regionen",
    content: () => "/admin/inhalte",
    audit: () => "/admin/protokoll",
  },
} as const;
