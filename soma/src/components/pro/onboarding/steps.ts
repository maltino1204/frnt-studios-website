/** Onboarding wizard steps (isomorphic; used by the server page and the client pieces). */
export const WIZARD_STEPS = [
  { slug: "konto", label: "Konto" },
  { slug: "profil", label: "Profil" },
  { slug: "leistungen", label: "Leistungen" },
  { slug: "einsatzgebiet", label: "Einsatzgebiet" },
  { slug: "verfuegbarkeit", label: "Verfügbarkeit" },
  { slug: "verifizierung", label: "Verifizierung" },
  { slug: "auszahlung", label: "Auszahlung" },
  { slug: "pruefen", label: "Prüfen" },
] as const;

export type WizardSlug = (typeof WIZARD_STEPS)[number]["slug"];

export const stepHref = (slug: WizardSlug) => `/pro/registrieren?schritt=${slug}`;

/** onboarding step key → wizard slug */
export const STEP_SLUG = {
  profile: "profil",
  services: "leistungen",
  area: "einsatzgebiet",
  hours: "verfuegbarkeit",
  documents: "verifizierung",
  payout: "auszahlung",
} as const satisfies Record<string, WizardSlug>;
