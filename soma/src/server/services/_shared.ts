import "server-only";

import { z } from "zod";
import type { Queryable, Tx } from "../db/client";
import { parsePolicy, type CancellationPolicy } from "../domain/cancellation";
import { hasContactDetails } from "../domain/content-lint";
import type { AppRole, CancellationPolicyDTO, RequiredDocumentDTO, Session } from "../dto";
import { ServiceError } from "../errors";

// German default messages for every zod schema in the server layer.
z.config(z.locales.de());

const deNumber = (n: number | bigint) => (typeof n === "bigint" ? n.toString() : n.toLocaleString("de-DE"));

/**
 * Human German messages for the common issues (audit-1 R17), neutral voice so they fit
 * customers ("Sie") and providers ("du"). Schema-level messages still win; anything not
 * handled here falls back to the zod German locale.
 */
export function germanIssueMessage(iss: z.core.$ZodRawIssue): string | undefined {
  switch (iss.code) {
    case "too_small": {
      const min = iss.minimum;
      if (iss.origin === "string") return Number(min) <= 1 ? "Bitte ausfüllen." : `Bitte mindestens ${deNumber(min)} Zeichen.`;
      if (iss.origin === "array" || iss.origin === "set") return Number(min) <= 1 ? "Bitte mindestens einen Eintrag wählen." : `Bitte mindestens ${deNumber(min)} Einträge wählen.`;
      if (iss.origin === "number" || iss.origin === "int" || iss.origin === "bigint") {
        return iss.inclusive === false ? `Bitte einen Wert größer als ${deNumber(min)} angeben.` : `Bitte mindestens ${deNumber(min)} angeben.`;
      }
      return undefined;
    }
    case "too_big": {
      const max = iss.maximum;
      if (iss.origin === "string") return `Bitte höchstens ${deNumber(max)} Zeichen.`;
      if (iss.origin === "array" || iss.origin === "set") return `Bitte höchstens ${deNumber(max)} Einträge wählen.`;
      if (iss.origin === "number" || iss.origin === "int" || iss.origin === "bigint") {
        return iss.inclusive === false ? `Bitte einen Wert kleiner als ${deNumber(max)} angeben.` : `Bitte höchstens ${deNumber(max)} angeben.`;
      }
      return undefined;
    }
    case "invalid_type":
      return iss.input === undefined || iss.input === null ? "Bitte ausfüllen." : "Ungültige Eingabe.";
    case "invalid_format":
      return iss.format === "email" ? "Bitte eine gültige E-Mail-Adresse angeben." : "Ungültiges Format.";
    case "invalid_value":
      return "Bitte einen gültigen Wert wählen.";
    default:
      return undefined;
  }
}

z.config({ customError: germanIssueMessage });

/** Appends a period unless the text already ends with one ("Hanna B." stays "Hanna B."). */
export function endSentence(text: string): string {
  return /[.!?…]$/.test(text.trimEnd()) ? text.trimEnd() : `${text.trimEnd()}.`;
}

/** Validates `input` and throws a German ServiceError with field errors. */
export function parse<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const res = schema.safeParse(input);
  if (res.success) return res.data;
  const fieldErrors: Record<string, string> = {};
  for (const issue of res.error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  throw new ServiceError("validation", "Bitte überprüfen Sie Ihre Eingaben.", fieldErrors);
}

/**
 * Contact lint (audit-1 R7): rejects free texts that carry phone numbers, e-mail
 * addresses, handles, URLs/domains or messenger names. `message` comes from
 * CONTACT_LINT_MESSAGES (audience-specific voice); every offending field gets it.
 */
export function assertNoContactDetails(fields: Record<string, string | null | undefined>, message: string): void {
  const fieldErrors: Record<string, string> = {};
  for (const [field, text] of Object.entries(fields)) if (hasContactDetails(text)) fieldErrors[field] = message;
  if (Object.keys(fieldErrors).length) throw new ServiceError("validation", message, fieldErrors);
}

export const zUuid = z.guid("Ungültige ID.");
export const zPostalCode = z.string().trim().regex(/^\d{5}$/, "Bitte geben Sie eine gültige fünfstellige Postleitzahl ein.");
export const zLocalDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum.");
export const zIsoInstant = z.iso.datetime({ offset: true, error: "Ungültiger Zeitpunkt." });

export function requireRoleIn(session: Session | null | undefined, ...roles: AppRole[]): Session {
  if (!session) throw new ServiceError("unauthenticated", "Bitte melden Sie sich an.");
  if (!roles.includes(session.role)) throw new ServiceError("forbidden", "Dafür fehlt die Berechtigung.");
  return session;
}

/**
 * Admin guard for admin services: checks the session role AND re-verifies it
 * in the database inside the same transaction (a forged Session object in
 * process memory is not enough).
 */
export async function assertAdmin(tx: Queryable, session: Session | null | undefined): Promise<Session> {
  const s = requireRoleIn(session, "admin");
  const [row] = await tx<{ role: AppRole; blockedAt: Date | null }[]>`select role, blocked_at from public.profiles where id = ${s.userId}`;
  if (!row || row.role !== "admin" || row.blockedAt) throw new ServiceError("forbidden", "Dafür fehlt die Berechtigung.");
  return s;
}

export async function audit(
  tx: Tx,
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  data: Record<string, unknown> = {},
): Promise<void> {
  await tx`
    insert into public.audit_log (actor_id, action, entity, entity_id, data)
    values (${actorId}, ${action}, ${entity}, ${entityId}, ${tx.json(JSON.parse(JSON.stringify(data)))})`;
}

/** Storage path → URL. Static paths ('/images/…') pass through, storage keys go via /api/media. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("/") || path.startsWith("http://") || path.startsWith("https://")) return path;
  return `/api/media/${path}`;
}

export const iso = (d: Date | string | null | undefined): string | null =>
  d == null ? null : (d instanceof Date ? d : new Date(d)).toISOString();
export const isoReq = (d: Date | string): string => (d instanceof Date ? d : new Date(d)).toISOString();
export const num = (v: number | string | null | undefined): number => (v == null ? 0 : Number(v));
export const numOrNull = (v: number | string | null | undefined): number | null => (v == null ? null : Number(v));

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------
export interface PlatformSettings {
  cancellationPolicy: CancellationPolicy;
  holdMinutes: number;
  requestResponseHours: number;
  slotStepMinutes: number;
  referralRewardCents: number;
  referralWelcomeCents: number;
  customerServiceFeeCents: number;
  reviewWindowDays: number;
  disputeWindowHours: number;
  payoutHoldHours: number;
  autoCompleteHours: number;
  searchDaysAhead: number;
  coverageMinProviders: number;
  baseRequiredDocuments: RequiredDocumentDTO[];
}

const DEFAULT_POLICY = {
  tiers: [
    { min_hours_before: 24, fee_percent: 0, travel_fee_retained: false },
    { min_hours_before: 2, fee_percent: 50, travel_fee_retained: false },
    { min_hours_before: 0, fee_percent: 100, travel_fee_retained: true },
  ],
  no_show_fee_percent: 100,
  provider_cancellation: "full_refund",
  grace_minutes: 15,
  fee_basis: "service_price",
};

export async function loadSettings(tx: Queryable): Promise<PlatformSettings> {
  const rows = await tx<{ key: string; value: unknown }[]>`select key, value from public.platform_settings`;
  const m = new Map(rows.map((r) => [r.key, r.value]));
  const n = (key: string, fallback: number) => {
    const v = m.get(key);
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  const docs = m.get("base_required_documents");
  return {
    cancellationPolicy: parsePolicy(m.get("cancellation_policy") ?? DEFAULT_POLICY),
    holdMinutes: n("hold_minutes", 10),
    requestResponseHours: n("request_response_hours", 4),
    slotStepMinutes: n("slot_step_minutes", 30),
    referralRewardCents: n("referral_reward_cents", 1500),
    referralWelcomeCents: n("referral_welcome_cents", 1500),
    customerServiceFeeCents: n("customer_service_fee_cents", 0),
    reviewWindowDays: n("review_window_days", 14),
    disputeWindowHours: n("dispute_window_hours", 48),
    payoutHoldHours: n("payout_hold_hours", 48),
    autoCompleteHours: n("auto_complete_hours", 24),
    searchDaysAhead: n("search_days_ahead", 7),
    coverageMinProviders: n("coverage_min_providers", 2),
    baseRequiredDocuments: Array.isArray(docs) ? (docs as RequiredDocumentDTO[]) : [],
  };
}

export function policyToDTO(p: CancellationPolicy): CancellationPolicyDTO {
  return {
    tiers: p.tiers.map((t) => ({ minHoursBefore: t.min_hours_before, feePercent: t.fee_percent, travelFeeRetained: t.travel_fee_retained })),
    noShowFeePercent: p.no_show_fee_percent,
    graceMinutes: p.grace_minutes,
    feeBasis: p.fee_basis,
  };
}

export const CREDIT_REASON_LABELS: Record<string, string> = {
  referral_reward: "Empfehlungsprämie",
  referral_welcome: "Willkommensguthaben",
  booking_redemption: "Eingelöst bei Buchung",
  booking_refund: "Gutschrift aus Stornierung",
  admin_adjustment: "Korrektur durch SOMA",
  goodwill: "Kulanzgutschrift",
};

/** Paging helper: page >= 1, pageSize 1..100 */
export function paging(page?: number, pageSize?: number, defaultSize = 20): { page: number; pageSize: number; offset: number } {
  const p = Math.max(1, Math.floor(page ?? 1));
  const s = Math.min(100, Math.max(1, Math.floor(pageSize ?? defaultSize)));
  return { page: p, pageSize: s, offset: (p - 1) * s };
}
