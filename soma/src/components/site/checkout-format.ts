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
  home: "bei dir zu Hause",
  hotel: "im Hotel",
  office: "im Büro",
  other: "vor Ort",
};

/** URL ↔ API mappings for /suche (names fixed in src/lib/routes.ts). */
export const TIME_OF_DAY_PARAM: Record<string, TimeOfDay> = { morgens: "morning", mittags: "afternoon", abends: "evening" };
export const TIME_OF_DAY_LABEL: Record<string, string> = { morgens: "Morgens", mittags: "Nachmittags", abends: "Abends" };
export const TIME_OF_DAY_RANGE: Record<string, string> = { morgens: "7–12 Uhr", mittags: "12–17 Uhr", abends: "17–22 Uhr" };
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

/**
 * Non-breaking spaces inside dates (design-guideline §5): "1.\u00a0November", "Sa.,\u00a031.\u00a0Okt.",
 * so a line never breaks between the day and the month.
 */
export function nbspDate(s: string): string {
  return s.replace(/(\d{1,2}\.) (?=\p{L})/gu, `$1${NBSP}`).replace(/(^|\s)(\p{L}{2,3}\.,) (?=\d)/gu, `$1$2${NBSP}`);
}

const monthLong = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", month: "long" });
const monthYear = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", month: "long", year: "numeric" });

/**
 * When something last happened, for "zuletzt …" (F14): "heute", "gestern", "vor 5 Tagen",
 * "vor 3 Wochen", then "im September" (with the year when it differs).
 */
export function lastTimeText(iso: string, now: Date = new Date()): string {
  const days = Math.round((Date.parse(`${berlinDateKey(now)}T12:00:00Z`) - Date.parse(`${berlinDateKey(iso)}T12:00:00Z`)) / 86_400_000);
  if (days <= 0) return "heute";
  if (days === 1) return "gestern";
  if (days < 14) return `vor ${days}${NBSP}Tagen`;
  if (days < 60) return `vor ${Math.round(days / 7)}${NBSP}Wochen`;
  const d = new Date(iso);
  return `im ${d.getUTCFullYear() === now.getUTCFullYear() ? monthLong.format(d) : monthYear.format(d)}`;
}

/** "Heute", "Morgen", "Do., 6. Nov." for an instant or a local date key. */
export function dayLabel(d: string | Date, now: Date = new Date()): string {
  const key = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : berlinDateKey(d);
  const today = berlinDateKey(now);
  const tomorrow = berlinDateKey(new Date(now.getTime() + 86_400_000));
  if (key === today) return "Heute";
  if (key === tomorrow) return "Morgen";
  return nbspDate(formatDayShort(localNoon(key)));
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
  return `${nbspDate(formatDay(iso))}, ${formatTime(iso)}${NBSP}Uhr`;
}

/** Mid-sentence deadline: "heute, 16:30 Uhr" / "morgen, 09:00 Uhr" / "Sa., 31. Okt., 12:30 Uhr" */
export function deadlineShort(iso: string, now: Date = new Date()): string {
  const d = dayLabel(iso, now);
  const day = d === "Heute" ? "heute" : d === "Morgen" ? "morgen" : d;
  return `${day}, ${formatTime(iso)}${NBSP}Uhr`;
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
  requested: "Anfrage an den Profi gesendet",
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

/** Older policy snapshots carry no travel flag: the travel fee was kept only in 100 % tiers. */
const travelKept = (t: { feePercent: number; travelFeeRetained?: boolean }) => t.travelFeeRetained ?? t.feePercent >= 100;

/**
 * What a cancellation costs in one tier. The fee is a share of the treatment price;
 * the travel fee is either refunded or kept ("50 % der Behandlung, Anfahrt wird erstattet").
 */
export function tierFeeText(t: { feePercent: number; travelFeeRetained?: boolean }): string {
  const kept = travelKept(t);
  if (t.feePercent <= 0 && !kept) return "kostenlos";
  if (t.feePercent <= 0) return "nur die Anfahrt";
  return `${t.feePercent}${NBSP}% der Behandlung${kept ? " zzgl. Anfahrt" : ", Anfahrt wird erstattet"}`;
}

/** The free 15-minute window after booking ("Bedenkzeit"), or null when the policy has none. */
export function graceSentence(policy: Pick<CancellationPolicyDTO, "graceMinutes"> | null | undefined): string | null {
  const m = policy?.graceMinutes ?? 0;
  return m > 0 ? `In den ersten ${m}${NBSP}Minuten nach der Buchung immer kostenlos stornierbar.` : null;
}

/**
 * Human list of the cancellation tiers with concrete deadlines (tiers that already ended are left out).
 * When the last tier is the only one left, it reads "Ab jetzt: …" instead of a lone "Danach: …".
 */
export function scheduleLines(schedule: PolicyScheduleEntryDTO[], now: number = Date.now()): string[] {
  return schedule.filter((e) => !e.until || Date.parse(e.until) > now).map((e, i) => {
    const what = `${tierFeeText(e)}${/Bedenkzeit/.test(e.label) ? " (Bedenkzeit)" : ""}`;
    if (e.until) return `Bis ${deadlineText(e.until)}: ${what}`;
    if (e.from && i > 0) return `Danach: ${what}`;
    if (e.from) return Date.parse(e.from) > now ? `Ab ${deadlineText(e.from)}: ${what}` : `Ab jetzt: ${what}`;
    return what;
  });
}

/** Generic tier summary (no concrete date), e.g. on profiles. */
export function policySummary(policy: CancellationPolicyDTO): string[] {
  const tiers = [...policy.tiers].sort((a, b) => b.minHoursBefore - a.minHoursBefore);
  const lines = tiers.map((t, i) => {
    const what = tierFeeText(t);
    if (i === 0) return `Bis ${t.minHoursBefore}${NBSP}Std. vor Beginn: ${what}`;
    const prev = tiers[i - 1].minHoursBefore;
    if (t.minHoursBefore > 0) return `${prev}–${t.minHoursBefore}${NBSP}Std. vorher: ${what}`;
    return `Weniger als ${prev}${NBSP}Std. vorher: ${what}`;
  });
  const grace = graceSentence(policy);
  return grace ? [...lines, grace] : lines;
}

/** Free-cancellation deadline for a slot by tier (client-side preview from the public policy; without the Bedenkzeit). */
export function freeUntilFor(policy: CancellationPolicyDTO, startsAt: string): string | null {
  const free = policy.tiers.filter((t) => t.feePercent === 0 && !travelKept(t)).sort((a, b) => a.minHoursBefore - b.minHoursBefore)[0];
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

/** Slot tile class (white tile, mid hairline, settles to ink on press) for "next free times" lists. */
export const slotTileClasses =
  "inline-flex h-11 items-center rounded-tile bg-surface-raised px-4 type-label num text-ink shadow-[0_1px_2px_rgb(37_33_31/0.05)] ring-1 ring-line-mid ring-inset pressable focus-ring hover:-translate-y-px hover:ring-line-strong hover:shadow-[0_6px_14px_-6px_rgb(37_33_31/0.18)]";
