import type { BookingStatus, CommissionTier, DocumentKind, DocumentStatus, LocationKind, PayoutState, PayoutStatus, ProviderStatus, VatMode } from "@/server/dto";
import type { StatusTone } from "@/components/ui/feedback";

/** Shared labels and tones for the provider app (voice: du). Isomorphic. */

/** Umsatzsteuer select (PAngV / § 19 UStG). */
export const VAT_MODE_OPTIONS: { value: VatMode; label: string }[] = [
  { value: "regular", label: "Regelbesteuert – Preise inkl. 19\u00a0% MwSt." },
  { value: "small_business", label: "Kleinunternehmer nach §\u00a019 UStG" },
];

export const BOOKING_TONE: Record<BookingStatus, StatusTone> = {
  pending_payment: "neutral",
  requested: "warning",
  confirmed: "success",
  in_progress: "accent",
  completed: "neutral",
  cancelled: "danger",
  declined: "danger",
  expired: "neutral",
  no_show: "danger",
};

export const LOCATION_LABEL: Record<LocationKind, string> = {
  home: "Zuhause",
  hotel: "Hotel",
  office: "Büro",
  other: "Anderer Ort",
};

export const TIER_LABEL: Record<CommissionTier, string> = {
  base: "Neukundschaft",
  repeat: "Stammkundschaft",
  own_client: "Eigene Kundschaft",
};

export const TIER_DESCRIPTION: Record<CommissionTier, string> = {
  base: "Erste Buchung über SOMA",
  repeat: "Wiederholte Buchung über SOMA",
  own_client: "Über deinen Einladungslink",
};

export const PROVIDER_STATUS_LABEL: Record<ProviderStatus, string> = {
  draft: "Entwurf",
  submitted: "In Prüfung",
  in_review: "In Prüfung",
  approved: "Freigeschaltet",
  rejected: "Überarbeitung nötig",
  suspended: "Pausiert",
};

export const PROVIDER_STATUS_TONE: Record<ProviderStatus, StatusTone> = {
  draft: "neutral",
  submitted: "warning",
  in_review: "warning",
  approved: "success",
  rejected: "danger",
  suspended: "danger",
};

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  id_document: "Ausweisdokument",
  business_registration: "Gewerbeanmeldung",
  qualification: "Qualifikationsnachweis",
  insurance: "Berufshaftpflicht",
  other: "Weiteres Dokument",
};

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  pending: "In Prüfung",
  approved: "Geprüft",
  rejected: "Abgelehnt",
};

export const DOCUMENT_STATUS_TONE: Record<DocumentStatus, StatusTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export const PAYOUT_STATE_LABEL: Record<PayoutState, string> = {
  pending: "Ausstehend",
  available: "Verfügbar",
  paid_out: "Ausgezahlt",
};

export const PAYOUT_STATE_TONE: Record<PayoutState, StatusTone> = {
  pending: "warning",
  available: "success",
  paid_out: "neutral",
};

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  pending: "In Vorbereitung",
  in_transit: "Unterwegs",
  paid: "Überwiesen",
  failed: "Fehlgeschlagen",
};

export const PAYOUT_STATUS_TONE: Record<PayoutStatus, StatusTone> = {
  pending: "warning",
  in_transit: "accent",
  paid: "success",
  failed: "danger",
};

export const WEEKDAYS = [
  { n: 1, short: "Mo", long: "Montag" },
  { n: 2, short: "Di", long: "Dienstag" },
  { n: 3, short: "Mi", long: "Mittwoch" },
  { n: 4, short: "Do", long: "Donnerstag" },
  { n: 5, short: "Fr", long: "Freitag" },
  { n: 6, short: "Sa", long: "Samstag" },
  { n: 7, short: "So", long: "Sonntag" },
] as const;

export const LANGUAGE_OPTIONS: { code: string; label: string }[] = [
  { code: "de", label: "Deutsch" },
  { code: "en", label: "Englisch" },
  { code: "tr", label: "Türkisch" },
  { code: "fr", label: "Französisch" },
  { code: "es", label: "Spanisch" },
  { code: "it", label: "Italienisch" },
  { code: "pl", label: "Polnisch" },
  { code: "ru", label: "Russisch" },
  { code: "uk", label: "Ukrainisch" },
  { code: "ar", label: "Arabisch" },
  { code: "pt", label: "Portugiesisch" },
  { code: "vi", label: "Vietnamesisch" },
];

export function languageLabel(code: string): string {
  return LANGUAGE_OPTIONS.find((l) => l.code === code)?.label ?? code.toUpperCase();
}

/** 0.2 → "20 %" */
export function formatPercent(rate: number): string {
  return `${(rate * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })}\u00a0%`;
}

/** "Selin A." → "Selin" */
export function firstNameOf(displayName: string | null | undefined): string {
  return (displayName ?? "").trim().split(/\s+/)[0] ?? "";
}

/** Customer label without last name before confirmation: "Julia H." or "Julia". */
export function customerLabel(c: { firstName: string | null; lastName: string | null }): string {
  const first = c.firstName?.trim() || "Kundschaft";
  return c.lastName ? `${first} ${c.lastName.trim()}` : first;
}

/**
 * Travel fee exactly like the server (src/server/domain/pricing.ts):
 * distance ≤ included km → base, otherwise base + ceil(distance − included) × per km, rounded to 50 ct.
 */
export function travelFeeFor(distanceKm: number, cfg: { baseCents: number; includedKm: number; perKmCents: number }): number {
  const extraKm = distanceKm <= cfg.includedKm ? 0 : Math.ceil(distanceKm - cfg.includedKm - 1e-9);
  return Math.round((cfg.baseCents + extraKm * cfg.perKmCents) / 50) * 50;
}

/** Remaining time as German text: "1 Std. 40 Min.", "25 Min.", "weniger als 1 Min." */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "0 Min.";
  const totalMin = Math.floor(ms / 60_000);
  if (totalMin < 1) return "weniger als 1 Min.";
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return h > 0 ? `${d} ${d === 1 ? "Tag" : "Tagen"} ${h} Std.` : `${d} ${d === 1 ? "Tag" : "Tagen"}`;
  if (h > 0) return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`;
  return `${m} Min.`;
}

/** Euro string from a German input ("45", "45,50", "45.5") → cents, or null. */
export function parseEuroToCents(value: string): number | null {
  const v = value.trim().replace(/\s|€/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/** cents → "45" or "45,50" for input fields */
export function centsToInput(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace(".", ",");
}

/** Shared server messages are written in "Sie" (src/server/services/_shared.ts, actions/_run.ts). In /pro we speak "du". */
const DU_MESSAGES: Record<string, string> = {
  "Bitte überprüfen Sie Ihre Eingaben.": "Bitte prüfe die markierten Felder.",
  "Bitte melden Sie sich an.": "Bitte melde dich an.",
  "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.": "Etwas ist schiefgelaufen. Bitte versuch es noch einmal.",
  "Bitte eine Datei auswählen.": "Bitte wähle eine Datei aus.",
};

export function proError(message: string): string {
  return DU_MESSAGES[message] ?? message;
}
