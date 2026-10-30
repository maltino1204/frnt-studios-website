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
const TLD = "(?:de|com|net|org|info|io|me|eu|at|ch|fr|it|nl|es|pl|be|dk|se|uk|us|tv|xyz|store|art|salon|shop|online|app|biz|co|link|page|studio|beauty|berlin|hamburg|koeln|nrw)";
// "linh at gmail dot com", "linh (at) gmail (punkt) com", "linh ät gmail.de", "linh [at] gmx [dot] de"
const AT_WORD = String.raw`(?:\s*[(\[{]\s*(?:at|ät|@)\s*[)\]}]\s*|\s+(?:at|ät)\s+)`;
const DOT_WORD = String.raw`(?:\s*[(\[{]\s*(?:dot|punkt|\.)\s*[)\]}]\s*|\s+(?:dot|punkt)\s+|\s*\.\s*)`;
const SPELLED_EMAIL = new RegExp(String.raw`\b[a-z0-9._%+-]{2,}${AT_WORD}[a-z0-9-]{2,}(?:${DOT_WORD}[a-z0-9-]{2,})*${DOT_WORD}${TLD}\b`, "i");
// "anna @ gmx . de", "anna@ gmx.de" — spaces around "@" and the dots (audit-3 F13)
const SPACED_EMAIL = new RegExp(String.raw`\b[a-z0-9._%+-]{2,}\s*@\s*[a-z0-9-]{2,}(?:\s*\.\s*[a-z0-9-]{2,})*\s*\.\s*${TLD}\b`, "i");
const HANDLE = /(?:^|[\s(,;:])@[a-z0-9_][a-z0-9._]{1,29}/i;
const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/i;
const DOMAIN = new RegExp(String.raw`\b[a-z0-9][a-z0-9-]{1,62}\.${TLD}\b`, "i");
// "linhnails . de" (space before the dot), "linhnails dot de", "linhnails (dot) com", "linhnails punkt de" (audit-3 F13).
// A space only AFTER the dot is ordinary punctuation ("… im Kurs. Info folgt") and is not matched.
const SPACED_DOMAIN = new RegExp(String.raw`\b[a-z0-9][a-z0-9-]{1,62}(?:\s+\.\s*|\s*[(\[{]\s*(?:dot|punkt)\s*[)\]}]\s*|\s+(?:dot|punkt)\s+)${TLD}\b`, "i");
// Messenger / social names. "IG" only in capitals or before ":"/"@"; "Signal" only in a contact context
// ("per Signal", "Signal: …", "Signal-Nummer"), because it is also an ordinary German word.
const MESSENGER = /\b(?:whats\s?app|insta(?:gram{1,2})?|telegram{1,2}|facebook|tik\s?tok|snapchat|threema|wa\.me|t\.me)\b/i;
const MESSENGER_IG = /\bIG\b|\big\s*[:@]/;
const MESSENGER_SIGNAL = /\b(?:per|über|via|auf|bei|in)\s+signal\b|\bsignal\s*(?::|-?nummer|-?messenger|-?app\b)/i;
// Phone numbers: +49 / 0049 / leading 0, digits separated by spaces, dashes, slashes, dots or parentheses.
const PHONE = /(?:\+|\b00)\s?\d[\d\s().\/-]{5,}\d|(?:^|[^\d,.])(0[\d\s().\/-]{5,}\d)/;
// Without the leading 0: German mobile prefixes 15x/16x/17x with separators, or ≥ 9 digits in one run.
const PHONE_NO_ZERO = /(?:^|[^\d,.+])(1[5-7]\d[\s\/-]?\d[\d\s\/-]{5,}\d|[1-9]\d{8,})(?![\d,])/;
// Spelled-out digits ("null eins sieben null …"): 7 or more digit words in a row.
const DIGIT_WORD = "(?:null|eins|zwei|zwo|drei|vier|fünf|fuenf|sechs|sieben|acht|neun)";
// Mixed spelled-out words and digits ("null eins 7 0 …") count too, with at least two words.
const DIGIT_TOKEN = String.raw`(?:${DIGIT_WORD}|\d)`;
const SPELLED_PHONE = new RegExp(String.raw`\b${DIGIT_TOKEN}(?:[\s,;.\-/]+${DIGIT_TOKEN}){6,}\b`, "i");
const DIGIT_WORD_RE = new RegExp(String.raw`\b${DIGIT_WORD}\b`, "gi");

// Not phone numbers: dates, clock times, prices (removed before the phone patterns run).
const NON_PHONE = [
  /\b\d{1,2}\.\s?\d{1,2}\.\s?(?:\d{4}|\d{2})\b/g, // 01.03.2019, 1. 3. 19
  /\b\d{4}-\d{2}-\d{2}\b/g, // 2019-03-01
  /\b(?:[01]?\d|2[0-3])[:.][0-5]\d\b(?:\s?uhr)?/gi, // 09:00, 18.30 Uhr
  /\b\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?\s?(?:€|eur\b|euro\b)/gi, // 1.234,56 €, 45,00 €
  /€\s?\d+(?:[.,]\d{1,2})?/g, // € 45
];

const DIGITS_AND_SEPARATORS = /^[\d\s().\/-]+$/;

/**
 * Lint normalisation: NFKC (full-width digits/letters, ＠), drop format and zero-width
 * characters (\p{Cf}: U+200B–U+200D, U+2060, U+FEFF, soft hyphen …), and read a standalone
 * letter O/o inside a digit run as 0 ("O17O 1234567").
 */
export function normalizeForLint(text: string): string {
  let t = text.normalize("NFKC").replace(/[\p{Cf}᠎]/gu, "");
  t = t.replace(/(?<![\p{L}])[oO](?![\p{L}])/gu, (m, offset: number, all: string) => {
    const before = all.slice(Math.max(0, offset - 3), offset);
    const after = all.slice(offset + 1, offset + 4);
    return /\d[\s\/-]?$/.test(before) || /^[\s\/-]?\d/.test(after) ? "0" : m;
  });
  return t;
}

function digits(s: string): number {
  return (s.match(/\d/g) ?? []).length;
}

function phoneIn(text: string): string | null {
  let t = text;
  for (const re of NON_PHONE) t = t.replace(re, " ");
  const m = PHONE.exec(t);
  if (m) {
    const candidate = (m[1] ?? m[0]).trim();
    const n = digits(candidate);
    if (n >= 7 && n <= 16 && DIGITS_AND_SEPARATORS.test(candidate.replace(/^\+/, ""))) return candidate;
  }
  const m2 = PHONE_NO_ZERO.exec(t);
  if (m2) {
    const candidate = m2[1].trim();
    const n = digits(candidate);
    // PLZ lists ("10405 10115") are 5-digit groups, not phone numbers.
    const plzList = /^\d{5}(?:[\s\/-]+\d{5})+$/.test(candidate);
    if (n >= 9 && n <= 15 && !plzList) return candidate;
  }
  const spelled = SPELLED_PHONE.exec(t);
  return spelled && (spelled[0].match(DIGIT_WORD_RE) ?? []).length >= 2 ? spelled[0] : null;
}

/** All contact details found in `text` (empty array = clean). */
export function findContactDetails(text: string | null | undefined): ContactFinding[] {
  if (!text) return [];
  const normalized = normalizeForLint(text);
  const found: ContactFinding[] = [];
  const email = EMAIL.exec(normalized) ?? SPELLED_EMAIL.exec(normalized) ?? SPACED_EMAIL.exec(normalized);
  if (email) found.push({ kind: "email", match: email[0].trim() });
  const withoutEmails = normalized
    .replace(new RegExp(EMAIL.source, "gi"), " ")
    .replace(new RegExp(SPELLED_EMAIL.source, "gi"), " ")
    .replace(new RegExp(SPACED_EMAIL.source, "gi"), " ");
  const handle = HANDLE.exec(withoutEmails);
  if (handle) found.push({ kind: "handle", match: handle[0].trim() });
  const url = URL_PATTERN.exec(withoutEmails) ?? DOMAIN.exec(withoutEmails) ?? SPACED_DOMAIN.exec(withoutEmails);
  if (url) found.push({ kind: "url", match: url[0] });
  const messenger = MESSENGER.exec(normalized) ?? MESSENGER_IG.exec(normalized) ?? MESSENGER_SIGNAL.exec(normalized);
  if (messenger) found.push({ kind: "messenger", match: messenger[0].trim() });
  const phone = phoneIn(withoutEmails);
  if (phone) found.push({ kind: "phone", match: phone });
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
  /** decline / acceptance note and provider cancellation reason (shown to the customer) */
  providerMessage:
    "Kontaktdaten wie Telefonnummern, E-Mail-Adressen oder Profile darfst du hier nicht teilen – der Kontakt läuft über SOMA.",
  /** customer cancellation reason (shown to the provider) */
  customerMessage:
    "Kontaktdaten wie Telefonnummern, E-Mail-Adressen oder Profile können Sie hier nicht teilen – der Kontakt läuft über SOMA.",
  customerDispute: "Bitte lassen Sie Kontaktdaten wie Telefonnummern oder E-Mail-Adressen weg – wir melden uns über SOMA bei Ihnen.",
  providerDispute: "Bitte lass Kontaktdaten wie Telefonnummern oder E-Mail-Adressen weg – wir melden uns über SOMA bei dir.",
} as const;
