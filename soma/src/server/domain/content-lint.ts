import "server-only";

/**
 * Heilmittelwerbegesetz (HWG) guard for provider texts: SOMA sells wellness,
 * not therapy. Finds healing / medical claims and protected titles in bios
 * and headlines. Pure; heuristic by design (admins review the rest).
 */
const PATTERNS: Array<{ re: RegExp; hint: string }> = [
  { re: /\bheil(t|en|ung|end|wirkung)\w*/i, hint: "Heilversprechen" },
  { re: /\blinder(t|n|ung)\w*/i, hint: "Linderungsversprechen" },
  { re: /therap(ie|ien|eut|eutin|eutisch)\w*/i, hint: "Therapie" },
  { re: /\bphysiotherap\w*/i, hint: "geschützter Berufstitel" },
  { re: /\bpodolog\w*/i, hint: "geschützter Berufstitel" },
  { re: /\bmedizinisch\w*/i, hint: "medizinische Aussage" },
  { re: /(schmerz|krankheit|beschwerden)\w*/i, hint: "Krankheitsbezug" },
  { re: /\b(masseur und medizinischer bademeister|med\.\s*bademeister|medizinische fußpflege)\b/i, hint: "geschützter Berufstitel" },
];

export interface HealthClaim {
  match: string;
  hint: string;
}

export function findHealthClaims(text: string | null | undefined): HealthClaim[] {
  if (!text) return [];
  const found: HealthClaim[] = [];
  for (const p of PATTERNS) {
    const m = p.re.exec(text);
    if (m) found.push({ match: m[0], hint: p.hint });
  }
  return found;
}

// ---------------------------------------------------------------------------
// Contact lint (anti-disintermediation, audit-1 R7): bookings and contact run
// through SOMA, so free texts must not carry phone numbers, e-mail addresses,
// social handles, URLs/domains or messenger mentions.
// ---------------------------------------------------------------------------
export type ContactKind = "phone" | "email" | "handle" | "url" | "messenger";

export interface ContactFinding {
  kind: ContactKind;
  match: string;
}

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const HANDLE = /(?:^|[\s(,;:])@[a-z0-9_][a-z0-9._]{1,29}/i;
const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/i;
const DOMAIN = /\b[a-z0-9][a-z0-9-]{1,62}\.(?:de|com|net|org|info|io|me|eu|at|ch|shop|online|app|biz|co|link|page|studio|beauty|berlin|hamburg|koeln|nrw)\b/i;
const MESSENGER = /\b(?:whats\s?app|insta(?:gram)?|telegram|facebook|tik\s?tok|snapchat|threema|wa\.me)\b/i;
// Phone numbers: +49 / 0049 / leading 0, digits separated by spaces, dashes, slashes, dots or parentheses.
const PHONE = /(?:\+|\b00)\s?\d[\d\s().\/-]{5,}\d|(?:^|[^\d,.])(0[\d\s().\/-]{5,}\d)/;

function digits(s: string): number {
  return (s.match(/\d/g) ?? []).length;
}

/** All contact details found in `text` (empty array = clean). */
export function findContactDetails(text: string | null | undefined): ContactFinding[] {
  if (!text) return [];
  const found: ContactFinding[] = [];
  const email = EMAIL.exec(text);
  if (email) found.push({ kind: "email", match: email[0] });
  const withoutEmails = text.replace(new RegExp(EMAIL.source, "gi"), " ");
  const handle = HANDLE.exec(withoutEmails);
  if (handle) found.push({ kind: "handle", match: handle[0].trim() });
  const url = URL_PATTERN.exec(withoutEmails) ?? DOMAIN.exec(withoutEmails);
  if (url) found.push({ kind: "url", match: url[0] });
  const messenger = MESSENGER.exec(text);
  if (messenger) found.push({ kind: "messenger", match: messenger[0] });
  const phone = PHONE.exec(withoutEmails);
  if (phone) {
    const candidate = (phone[1] ?? phone[0]).trim();
    const n = digits(candidate);
    if (n >= 7 && n <= 16) found.push({ kind: "phone", match: candidate });
  }
  return found;
}

export function hasContactDetails(text: string | null | undefined): boolean {
  return findContactDetails(text).length > 0;
}

/** German rejection messages per audience (customers "Sie", providers "du"). */
export const CONTACT_LINT_MESSAGES = {
  providerProfile:
    "Kontaktdaten wie Telefonnummern, E-Mail-Adressen oder Profile sind im Profil nicht erlaubt – Buchung und Kontakt laufen über SOMA.",
  providerReply:
    "Kontaktdaten wie Telefonnummern, E-Mail-Adressen oder Profile sind in Antworten nicht erlaubt – Buchung und Kontakt laufen über SOMA.",
  customerReview:
    "Kontaktdaten wie Telefonnummern, E-Mail-Adressen oder Profile sind in Bewertungen nicht erlaubt.",
  customerNotes:
    "Kontaktdaten wie Telefonnummern, E-Mail-Adressen oder Profile sind in den Hinweisen nicht erlaubt – nach der Bestätigung erreicht Ihr Profi Sie über SOMA.",
} as const;
