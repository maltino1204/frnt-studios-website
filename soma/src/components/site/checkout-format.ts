/**
 * Shared, isomorphic display helpers for the booking journey (search → profile →
 * checkout → confirmation → account). German copy, Europe/Berlin wall clock.
 */
import { berlinDateKey, formatDay, formatDayShort, formatTime } from "@/lib/format";
import type {
  BookingStatus,
  CancellationPolicyDTO,
  LocationKind,
  PaymentSummaryDTO,
  PolicyScheduleEntryDTO,
  SearchSort,
  TimeOfDay,
} from "@/server/dto";
import type { StatusTone } from "@/components/ui/feedback";

export const NBSP = " ";

export const LOCATION_LABELS: Record<LocationKind, string> = {
  home: "Zuhause",
  hotel: "Hotel",
  office: "Büro",
  other: "Anderer Ort",
};

export const LOCATION_PHRASE: Record<LocationKind, string> = {
  home: "bei Ihnen zu Hause",
  hotel: "im Hotel",
  office: "im Büro",
  other: "vor Ort",
};

/** URL ↔ API mappings for /suche (names fixed in src/lib/routes.ts). */
export const TIME_OF_DAY_PARAM: Record<string, TimeOfDay> = { morgens: "morning", mittags: "afternoon", abends: "evening" };
export const TIME_OF_DAY_LABEL: Record<string, string> = { morgens: "Morgens", mittags: "Nachmittags", abends: "Abends" };
export const TIME_OF_DAY_RANGE: Record<string, string> = { morgens: "7–12 Uhr", mittags: "12–17 Uhr", abends: "17–22 Uhr" };
export const SORT_PARAM: Record<string, SearchSort> = {
  empfohlen: "recommended",
  frueheste: "earliest",
  preis: "price_asc",
  bewertung: "rating",
  entfernung: "recommended",
};
export const SORT_LABEL: Record<string, string> = {
  empfohlen: "Empfohlen",
  frueheste: "Frühester Termin",
  preis: "Preis aufsteigend",
  bewertung: "Bewertung",
};

export const LANGUAGE_LABELS: Record<string, string> = {
  de: "Deutsch",
  en: "Englisch",
  tr: "Türkisch",
  fr: "Französisch",
  es: "Spanisch",
  it: "Italienisch",
  pl: "Polnisch",
  ru: "Russisch",
  ar: "Arabisch",
  pt: "Portugiesisch",
  vi: "Vietnamesisch",
  ko: "Koreanisch",
  uk: "Ukrainisch",
  fa: "Persisch",
  zh: "Chinesisch",
  ja: "Japanisch",
  el: "Griechisch",
  nl: "Niederländisch",
  hi: "Hindi",
  tw: "Twi",
};
export const languageName = (code: string) => LANGUAGE_LABELS[code] ?? code.toUpperCase();

/** "Heute", "Morgen", "Do., 6. Nov." for an instant or a local date key. */
export function dayLabel(d: string | Date, now: Date = new Date()): string {
  const key = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : berlinDateKey(d);
  const today = berlinDateKey(now);
  const tomorrow = berlinDateKey(new Date(now.getTime() + 86_400_000));
  if (key === today) return "Heute";
  if (key === tomorrow) return "Morgen";
  return formatDayShort(localNoon(key));
}

/** Noon in Berlin for a local date key – safe anchor for date formatting. */
export function localNoon(key: string): Date {
  return new Date(`${key}T12:00:00Z`);
}

/** Slot chip label: "18:30" or "Morgen 18:30". */
export function slotChipLabel(iso: string, withDay: boolean, now: Date = new Date()): string {
  if (!withDay) return formatTime(iso);
  const day = dayLabel(iso, now);
  return `${day.replace(/,? \d+\. \S+$/, "")}${NBSP}${formatTime(iso)}`;
}

/** "Mittwoch, 4. November, 18:30 Uhr" */
export function deadlineText(iso: string): string {
  return `${formatDay(iso)}, ${formatTime(iso)}${NBSP}Uhr`;
}

/** "Heute, 14:30" / "Morgen, 09:00" / "Do., 6. Nov., 14:30" */
export function whenShort(iso: string, now: Date = new Date()): string {
  return `${dayLabel(iso, now)}, ${formatTime(iso)}`;
}

export function statusTone(status: BookingStatus): StatusTone {
  switch (status) {
    case "confirmed":
    case "completed":
      return "success";
    case "in_progress":
      return "accent";
    case "requested":
    case "pending_payment":
      return "warning";
    case "cancelled":
    case "declined":
    case "no_show":
      return "danger";
    default:
      return "neutral";
  }
}

export const EVENT_LABELS: Record<BookingStatus, string> = {
  pending_payment: "Buchung angelegt, Termin reserviert",
  requested: "Anfrage an die Fachkraft gesendet",
  confirmed: "Termin bestätigt",
  in_progress: "Behandlung gestartet",
  completed: "Behandlung abgeschlossen",
  cancelled: "Termin storniert",
  declined: "Anfrage abgelehnt",
  expired: "Abgelaufen",
  no_show: "Als nicht angetroffen markiert",
};

export function paymentLabel(p: PaymentSummaryDTO | null): string {
  if (!p) return "Keine Zahlung";
  const test = p.provider === "dev";
  switch (p.status) {
    case "requires_payment_method":
      return "Zahlung ausstehend";
    case "authorized":
      return test ? "Testzahlung autorisiert" : "Betrag reserviert";
    case "captured":
      return test ? "Testzahlung abgebucht" : "Bezahlt";
    case "partially_refunded":
      return "Teilweise erstattet";
    case "refunded":
      return "Erstattet";
    case "cancelled":
      return "Reservierung aufgehoben – nichts belastet";
    case "failed":
      return "Zahlung fehlgeschlagen";
  }
}

/** Appends a full stop unless the text already ends with one ("Anna K." stays "Anna K."). */
export function withStop(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/** Human list of the cancellation tiers with concrete deadlines (tiers that already ended are left out). */
export function scheduleLines(schedule: PolicyScheduleEntryDTO[], now: number = Date.now()): string[] {
  return schedule.filter((e) => !e.until || Date.parse(e.until) > now).map((e) => {
    const what = e.feePercent === 0 ? "kostenlos" : `${e.feePercent}${NBSP}% Stornogebühr`;
    if (e.until && !e.from) return `Bis ${deadlineText(e.until)}: ${what}`;
    if (e.until && e.from) return `Bis ${deadlineText(e.until)}: ${what}`;
    if (e.from) return `Danach: ${what}`;
    return what;
  });
}

/** Generic tier summary (no concrete date), e.g. on profiles. */
export function policySummary(policy: CancellationPolicyDTO): string[] {
  const tiers = [...policy.tiers].sort((a, b) => b.minHoursBefore - a.minHoursBefore);
  return tiers.map((t, i) => {
    const what = t.feePercent === 0 ? "kostenlos" : `${t.feePercent}${NBSP}% Stornogebühr`;
    if (i === 0) return `Bis ${t.minHoursBefore}${NBSP}Std. vor Beginn: ${what}`;
    const prev = tiers[i - 1].minHoursBefore;
    if (t.minHoursBefore > 0) return `${prev}–${t.minHoursBefore}${NBSP}Std. vorher: ${what}`;
    return `Weniger als ${prev}${NBSP}Std. vorher: ${what}`;
  });
}

/** Free-cancellation deadline for a slot (client-side preview from the public policy). */
export function freeUntilFor(policy: CancellationPolicyDTO, startsAt: string): string | null {
  const free = policy.tiers.filter((t) => t.feePercent === 0).sort((a, b) => a.minHoursBefore - b.minHoursBefore)[0];
  if (!free) return null;
  return new Date(new Date(startsAt).getTime() - free.minHoursBefore * 3_600_000).toISOString();
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
