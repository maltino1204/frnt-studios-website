import "server-only";

import { z } from "zod";
import { resolveAppUrl } from "../config";
import { setActor, withService, withUser, type Queryable, type Tx } from "../db/client";
import { rethrowDb } from "../db/errors";
import { CONTACT_LINT_MESSAGES, findHealthClaims } from "../domain/content-lint";
import { addDays, formatTimeOfDay, isValidLocalDate, parseTimeOfDay, wallTimeToInstant } from "../domain/tz";
import type {
  DocumentDTO,
  DocumentKind,
  EarningsDTO,
  EarningsItemDTO,
  MissingDocumentDTO,
  OnboardingStepDTO,
  PayoutDTO,
  ProCalendarDTO,
  ProDashboardDTO,
  ProOnboardingDTO,
  ProProfileDTO,
  ProServiceDTO,
  ProSettingsDTO,
  RequiredDocumentDTO,
  ReviewListDTO,
  Session,
  TimeOffDTO,
  VatMode,
  WeeklyHoursDTO,
} from "../dto";
import { ServiceError } from "../errors";
import { getPaymentProvider } from "../payments/provider";
import { assertNoContactDetails, loadSettings, mediaUrl, parse, requireRoleIn, zIsoInstant, zPostalCode, zUuid, type PlatformSettings } from "./_shared";
import { getNotificationPreferences, updateNotificationPreferences } from "./account";
import { runBookingMaintenanceLazily } from "./booking-maintenance";
import { listProviderBookings, queryProviderBookings, toProviderBooking } from "./bookings";
import { deleteStoredFile, storeUpload, type UploadInput } from "./media";
import { countUnreadNotifications } from "./notifications";
import { queryProviderReviews } from "./reviews";

/**
 * Provider app (`/pro`). Provider-facing messages use "du".
 * Writes to provider-owned tables run as the provider under RLS (column grants
 * keep status, ratings, commission and Stripe fields out of reach).
 */

const requirePro = (session: Session) => requireRoleIn(session, "provider");

function assertNoHealthClaims(field: string, text: string | null | undefined): void {
  const claims = findHealthClaims(text);
  if (claims.length) {
    throw new ServiceError(
      "validation",
      `Bitte verzichte auf Heilversprechen und medizinische Begriffe (gefunden: „${claims[0].match}“). SOMA bietet Wellness, keine Therapie.`,
      { [field]: `Bitte ohne „${claims[0].match}“ formulieren.` },
    );
  }
}

// ---------------------------------------------------------------------------
// Profile & service area
// ---------------------------------------------------------------------------
interface ProProfileRow {
  id: string;
  slug: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarPath: string | null;
  yearsExperience: number | null;
  languages: string[];
  status: ProProfileDTO["status"];
  basePostalCode: string | null;
  serviceRadiusKm: string;
  travelFeeBaseCents: number;
  travelFeeIncludedKm: string;
  travelFeePerKmCents: number;
}

export async function queryProProfile(tx: Queryable, providerId: string): Promise<ProProfileDTO | null> {
  const [r] = await tx<ProProfileRow[]>`
    select id, slug, display_name, headline, bio, avatar_path, years_experience, languages, status, base_postal_code,
           service_radius_km::text as service_radius_km, travel_fee_base_cents, travel_fee_included_km::text as travel_fee_included_km,
           travel_fee_per_km_cents
    from public.providers where id = ${providerId}`;
  if (!r) return null;
  return {
    providerId: r.id, slug: r.slug, displayName: r.displayName, headline: r.headline, bio: r.bio, avatarUrl: mediaUrl(r.avatarPath),
    yearsExperience: r.yearsExperience, languages: [...r.languages], status: r.status, basePostalCode: r.basePostalCode,
    serviceRadiusKm: Number(r.serviceRadiusKm), travelFeeBaseCents: r.travelFeeBaseCents, travelFeeIncludedKm: Number(r.travelFeeIncludedKm),
    travelFeePerKmCents: r.travelFeePerKmCents,
  };
}

export async function getProProfile(session: Session): Promise<ProProfileDTO> {
  const s = requirePro(session);
  const p = await withUser(s.userId, (tx) => queryProProfile(tx, s.userId));
  if (!p) throw new ServiceError("not_found", "Profil nicht gefunden.");
  return p;
}

const ProProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Bitte gib deinen Anzeigenamen an (z. B. „Selin A.“).").max(80),
  headline: z.string().trim().max(120).optional().transform((v) => v || null),
  bio: z.string().trim().max(400, "Höchstens 400 Zeichen.").optional().transform((v) => v || null),
  yearsExperience: z.number().int().min(0).max(60).nullable().optional(),
  languages: z.array(z.string().trim().regex(/^[a-z]{2}$/, "Sprachcode, z. B. „de“.")).min(1, "Bitte wähle mindestens eine Sprache.").max(10),
});

export async function updateProProfile(session: Session, input: z.input<typeof ProProfileSchema>): Promise<ProProfileDTO> {
  const s = requirePro(session);
  const v = parse(ProProfileSchema, input);
  assertNoHealthClaims("headline", v.headline);
  assertNoHealthClaims("bio", v.bio);
  assertNoContactDetails({ displayName: v.displayName, headline: v.headline, bio: v.bio }, CONTACT_LINT_MESSAGES.providerProfile);
  await withUser(s.userId, (tx) => tx`
    update public.providers set display_name = ${v.displayName}, headline = ${v.headline}, bio = ${v.bio},
      years_experience = ${v.yearsExperience ?? null}, languages = ${v.languages}::text[]
    where id = ${s.userId}`).catch(rethrowDb);
  return getProProfile(s);
}

const AreaSchema = z.object({
  basePostalCode: zPostalCode,
  serviceRadiusKm: z.number().min(3, "Mindestens 3 km.").max(30, "Höchstens 30 km."),
  travelFeeBaseCents: z.number().int().min(0).max(3000, "Höchstens 30 € Anfahrt."),
  travelFeeIncludedKm: z.number().min(0).max(30),
  travelFeePerKmCents: z.number().int().min(0).max(200),
});

export async function updateServiceArea(session: Session, input: z.input<typeof AreaSchema>): Promise<ProProfileDTO> {
  const s = requirePro(session);
  const v = parse(AreaSchema, input);
  await withUser(s.userId, async (tx) => {
    const [pc] = await tx<{ postalCode: string }[]>`select postal_code from public.postal_codes where postal_code = ${v.basePostalCode}`;
    if (!pc) throw new ServiceError("validation", "Diese Postleitzahl kennen wir nicht.", { basePostalCode: "Unbekannte Postleitzahl." });
    await tx`
      update public.providers set base_postal_code = ${v.basePostalCode}, service_radius_km = ${v.serviceRadiusKm},
        travel_fee_base_cents = ${v.travelFeeBaseCents}, travel_fee_included_km = ${v.travelFeeIncludedKm},
        travel_fee_per_km_cents = ${v.travelFeePerKmCents}
      where id = ${s.userId}`;
  }).catch(rethrowDb);
  return getProProfile(s);
}

// ---------------------------------------------------------------------------
// Services & prices
// ---------------------------------------------------------------------------
export async function listProServices(session: Session): Promise<ProServiceDTO[]> {
  const s = requirePro(session);
  return withUser(s.userId, async (tx) => {
    const rows = await tx<Array<Omit<ProServiceDTO, "missingDocuments"> & { serviceDurations: number[] }>>`
      select ps.id as provider_service_id, s.id as service_id, s.slug as service_slug, s.name as service_name,
             c.id as category_id, c.slug as category_slug, c.name as category_name, ps.duration_minutes, ps.price_cents,
             ps.is_active, ps.awaiting_documents, s.durations as service_durations, s.price_hint_from_cents
      from public.provider_services ps
      join public.services s on s.id = ps.service_id
      join public.categories c on c.id = s.category_id
      where ps.provider_id = ${s.userId}
      order by c.sort_order, s.sort_order, ps.duration_minutes`;
    const missing = rows.some((r) => r.awaitingDocuments) ? await queryMissingCategoryDocuments(tx, s.userId) : new Map<string, string[]>();
    return rows.map((r) => ({ ...r, serviceDurations: [...r.serviceDurations], missingDocuments: r.awaitingDocuments ? missing.get(r.categoryId) ?? [] : [] }));
  });
}

/** Category id → labels of required category documents that are missing, unreviewed or expired (audit-3 F2). */
export async function queryMissingCategoryDocuments(tx: Queryable, providerId: string, categoryIds?: string[]): Promise<Map<string, string[]>> {
  const docs = await tx<{ kind: DocumentKind; categoryId: string | null }[]>`
    select kind, category_id from public.provider_documents
    where provider_id = ${providerId} and status = 'approved' and (expires_at is null or expires_at > now())`;
  const cats = await tx<{ id: string; requiredDocuments: RequiredDocumentDTO[] }[]>`
    select id, required_documents from public.categories ${categoryIds ? tx`where id = any(${categoryIds}::uuid[])` : tx``}`;
  const out = new Map<string, string[]>();
  for (const c of cats) {
    const labels = (Array.isArray(c.requiredDocuments) ? c.requiredDocuments : [])
      .filter((req) => !docs.some((d) => d.kind === req.kind && d.categoryId === c.id))
      .map((req) => req.label);
    if (labels.length) out.set(c.id, labels);
  }
  return out;
}

const ProServiceSchema = z.object({
  serviceId: zUuid,
  durationMinutes: z.number().int().min(15).max(480),
  priceCents: z.number().int().min(500, "Mindestens 5 €.").max(100_000, "Höchstens 1.000 €."),
  isActive: z.boolean().optional().default(true),
  /** "Leistung hinzufügen": refuse instead of overwriting an existing offering's price (audit-4 A4-2). */
  createOnly: z.boolean().optional().default(false),
});

/** Create or update the offering (provider, service, duration). Duration: one of the service's durations or within ±30 % of the default, in 5-minute steps. */
export async function upsertProService(session: Session, input: z.input<typeof ProServiceSchema>): Promise<ProServiceDTO> {
  const s = requirePro(session);
  const v = parse(ProServiceSchema, input);
  await withUser(s.userId, async (tx) => {
    const [svc] = await tx<{ durations: number[]; defaultDuration: number }[]>`select durations, default_duration from public.services where id = ${v.serviceId} and is_active`;
    if (!svc) throw new ServiceError("not_found", "Diese Leistung gibt es nicht (mehr).");
    const within = Math.abs(v.durationMinutes - svc.defaultDuration) <= svc.defaultDuration * 0.3 && v.durationMinutes % 5 === 0;
    if (!svc.durations.includes(v.durationMinutes) && !within) {
      throw new ServiceError("validation", `Die Dauer muss zu dieser Leistung passen (${svc.durations.join(" / ")} Min. oder ±30 %).`, { durationMinutes: "Unpassende Dauer." });
    }
    // The trigger provider_services_10_require_documents (migration 0008) stores the offering of an
    // approved provider inactive with awaiting_documents while the category's documents are incomplete.
    if (v.createOnly) {
      const [exists] = await tx`
        select 1 from public.provider_services
        where provider_id = ${s.userId} and service_id = ${v.serviceId} and duration_minutes = ${v.durationMinutes}`;
      if (exists) {
        throw new ServiceError("conflict", "Diese Leistung bietest du mit dieser Dauer schon an. Den Preis änderst du direkt in deiner Liste.", {
          serviceId: "Schon in deinem Angebot.",
        });
      }
    }
    await tx`
      insert into public.provider_services (provider_id, service_id, duration_minutes, price_cents, is_active)
      values (${s.userId}, ${v.serviceId}, ${v.durationMinutes}, ${v.priceCents}, ${v.isActive})
      on conflict (provider_id, service_id, duration_minutes)
      do update set price_cents = excluded.price_cents, is_active = excluded.is_active`;
  }).catch(rethrowDb);
  if (!v.isActive) {
    // withService: the provider switched the offering off — it no longer waits for documents (flag has no API grant).
    await withService((tx) => tx`
      update public.provider_services set awaiting_documents = false
      where provider_id = ${s.userId} and service_id = ${v.serviceId} and duration_minutes = ${v.durationMinutes} and awaiting_documents`);
  }
  const all = await listProServices(s);
  const found = all.find((o) => o.serviceId === v.serviceId && o.durationMinutes === v.durationMinutes);
  if (!found) throw new ServiceError("internal", "Die Leistung konnte nicht gespeichert werden.");
  return found;
}

/** Deletes an offering; offerings with bookings are deactivated instead (bookings keep their snapshot). */
export async function deleteProService(session: Session, providerServiceId: string): Promise<{ deleted: boolean; deactivated: boolean }> {
  const s = requirePro(session);
  const id = parse(zUuid, providerServiceId);
  try {
    const rows = await withUser(s.userId, (tx) => tx`delete from public.provider_services where id = ${id} and provider_id = ${s.userId} returning id`);
    if (rows.length === 0) throw new ServiceError("not_found", "Leistung nicht gefunden.");
    return { deleted: true, deactivated: false };
  } catch (e) {
    if (e instanceof ServiceError) throw e;
    await withUser(s.userId, (tx) => tx`update public.provider_services set is_active = false where id = ${id} and provider_id = ${s.userId}`);
    return { deleted: false, deactivated: true };
  }
}

// ---------------------------------------------------------------------------
// Weekly hours & time off
// ---------------------------------------------------------------------------
const WindowSchema = z.object({
  weekday: z.number().int().min(1).max(7),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM."),
  end: z.string().regex(/^(\d{2}:\d{2}|24:00)$/, "Format HH:MM."),
});

export async function getWeeklyHours(session: Session): Promise<WeeklyHoursDTO[]> {
  const s = requirePro(session);
  return withUser(s.userId, (tx) => queryWeeklyHours(tx, s.userId));
}

async function queryWeeklyHours(tx: Queryable, providerId: string): Promise<WeeklyHoursDTO[]> {
  const rows = await tx<{ id: string; weekday: number; startTime: string; endTime: string }[]>`
    select id, weekday, start_time::text as start_time, end_time::text as end_time
    from public.provider_weekly_hours where provider_id = ${providerId} order by weekday, start_time`;
  return rows.map((r) => ({ id: r.id, weekday: r.weekday, start: r.startTime.slice(0, 5), end: r.endTime.startsWith("24") ? "24:00" : r.endTime.slice(0, 5) }));
}

/** Replaces all weekly windows (multiple windows per day allowed, no overlaps). */
export async function setWeeklyHours(session: Session, windows: Array<z.input<typeof WindowSchema>>): Promise<WeeklyHoursDTO[]> {
  const s = requirePro(session);
  const list = parse(z.array(WindowSchema).max(42), windows);
  const parsed = list.map((w) => ({ ...w, s: parseTimeOfDay(w.start), e: parseTimeOfDay(w.end) }));
  for (const w of parsed) {
    if (w.e <= w.s) throw new ServiceError("validation", "Das Ende muss nach dem Beginn liegen.", { windows: "Ungültiges Zeitfenster." });
  }
  for (const a of parsed) for (const b of parsed) {
    if (a !== b && a.weekday === b.weekday && a.s < b.e && b.s < a.e) {
      throw new ServiceError("validation", "Zeitfenster am selben Tag dürfen sich nicht überschneiden.", { windows: "Überschneidung." });
    }
  }
  await withUser(s.userId, async (tx) => {
    await tx`delete from public.provider_weekly_hours where provider_id = ${s.userId}`;
    for (const w of parsed) {
      await tx`insert into public.provider_weekly_hours (provider_id, weekday, start_time, end_time) values (${s.userId}, ${w.weekday}, ${formatTimeOfDay(w.s)}, ${w.e === 1440 ? "24:00" : formatTimeOfDay(w.e)})`;
    }
  }).catch(rethrowDb);
  return getWeeklyHours(s);
}

async function queryTimeOff(tx: Queryable, providerId: string, from?: Date, to?: Date): Promise<TimeOffDTO[]> {
  const rows = await tx<{ id: string; start: Date; end: Date; reason: string | null }[]>`
    select id, lower(period) as start, upper(period) as end, reason from public.provider_time_off
    where provider_id = ${providerId}
      ${from && to ? tx`and period && tstzrange(${from}, ${to})` : tx`and upper(period) > now()`}
    order by lower(period)`;
  return rows.map((r) => ({ id: r.id, start: r.start.toISOString(), end: r.end.toISOString(), reason: r.reason }));
}

export async function listTimeOff(session: Session): Promise<TimeOffDTO[]> {
  const s = requirePro(session);
  return withUser(s.userId, (tx) => queryTimeOff(tx, s.userId));
}

const TimeOffSchema = z
  .object({ start: zIsoInstant, end: zIsoInstant, reason: z.string().trim().max(200).optional() })
  .refine((v) => Date.parse(v.end) > Date.parse(v.start), { message: "Das Ende muss nach dem Beginn liegen.", path: ["end"] });

/** Adds time off. Returns how many active bookings overlap (they are not cancelled automatically). */
export async function addTimeOff(session: Session, input: z.input<typeof TimeOffSchema>): Promise<{ id: string; conflictingBookings: number }> {
  const s = requirePro(session);
  const v = parse(TimeOffSchema, input);
  return withUser(s.userId, async (tx) => {
    const [row] = await tx<{ id: string }[]>`
      insert into public.provider_time_off (provider_id, period, reason)
      values (${s.userId}, tstzrange(${new Date(v.start)}, ${new Date(v.end)}, '[)'), ${v.reason ?? null}) returning id`;
    const [{ n }] = await tx<{ n: number }[]>`
      select count(*)::int as n from public.provider_bookings
      where status in ('requested', 'confirmed', 'in_progress') and tstzrange(starts_at, ends_at) && tstzrange(${new Date(v.start)}, ${new Date(v.end)})`;
    return { id: row.id, conflictingBookings: n };
  }).catch(rethrowDb);
}

export async function deleteTimeOff(session: Session, timeOffId: string): Promise<void> {
  const s = requirePro(session);
  const id = parse(zUuid, timeOffId);
  const rows = await withUser(s.userId, (tx) => tx`delete from public.provider_time_off where id = ${id} and provider_id = ${s.userId} returning id`);
  if (rows.length === 0) throw new ServiceError("not_found", "Eintrag nicht gefunden.");
}

// ---------------------------------------------------------------------------
// Documents & portfolio
// ---------------------------------------------------------------------------
const DOCUMENT_KINDS = ["id_document", "business_registration", "qualification", "insurance", "other"] as const;

export interface DocumentRow {
  id: string; kind: DocumentKind; fileName: string; mimeType: string; status: DocumentDTO["status"]; reviewNote: string | null;
  createdAt: Date; reviewedAt: Date | null; storagePath: string; expiresAt: Date | null;
  categoryId: string | null; categoryName: string | null;
}
export const DOCUMENT_COLUMNS =
  "id, kind, file_name, mime_type, status, review_note, created_at, reviewed_at, storage_path, expires_at, category_id, " +
  "(select c.name from public.categories c where c.id = provider_documents.category_id) as category_name";

export function toDocument(r: DocumentRow, now = new Date()): DocumentDTO {
  return {
    id: r.id, kind: r.kind, fileName: r.fileName, mimeType: r.mimeType, status: r.status, reviewNote: r.reviewNote,
    createdAt: r.createdAt.toISOString(), reviewedAt: r.reviewedAt?.toISOString() ?? null, url: `/api/media/${r.storagePath}`,
    expiresAt: r.expiresAt?.toISOString() ?? null, expired: Boolean(r.expiresAt && r.expiresAt.getTime() <= now.getTime()),
    categoryId: r.categoryId, categoryName: r.categoryName,
  };
}

/** "Gültig bis" date (local, inclusive) → instant at the following local midnight (Europe/Berlin). */
export function validUntilToExpiry(localDate: string | null | undefined): Date | null {
  if (!localDate) return null;
  if (!isValidLocalDate(localDate)) throw new ServiceError("validation", "Bitte ein gültiges Datum angeben.", { expiresAt: "Ungültiges Datum." });
  return wallTimeToInstant(addDays(localDate, 1), 0).instant;
}

export async function listDocuments(session: Session): Promise<DocumentDTO[]> {
  const s = requirePro(session);
  return withUser(s.userId, async (tx) =>
    (await tx<DocumentRow[]>`
      select ${tx.unsafe(DOCUMENT_COLUMNS)}
      from public.provider_documents where provider_id = ${s.userId} order by created_at desc`).map((r) => toDocument(r)),
  );
}

/** `validUntil` (optional, "YYYY-MM-DD", inclusive): e.g. the end of the insurance period. */
export async function uploadDocument(session: Session, kind: DocumentKind, file: UploadInput, categoryId?: string | null, validUntil?: string | null): Promise<DocumentDTO> {
  const s = requirePro(session);
  const k = parse(z.enum(DOCUMENT_KINDS), kind);
  const cat = categoryId ? parse(zUuid, categoryId) : null;
  const expiresAt = validUntilToExpiry(validUntil);
  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    throw new ServiceError("validation", "Dieses Dokument ist bereits abgelaufen. Bitte lade ein aktuelles hoch.", { expiresAt: "Das Datum liegt in der Vergangenheit." });
  }
  const stored = await storeUpload("documents", s.userId, file);
  try {
    return await withUser(s.userId, async (tx) => {
      const [row] = await tx<DocumentRow[]>`
        insert into public.provider_documents (provider_id, kind, category_id, storage_path, file_name, mime_type, size_bytes, expires_at)
        values (${s.userId}, ${k}, ${cat}, ${stored.key}, ${file.fileName.slice(0, 200) || "dokument"}, ${stored.mime}, ${stored.size}, ${expiresAt})
        returning ${tx.unsafe(DOCUMENT_COLUMNS)}`;
      return toDocument(row);
    });
  } catch (e) {
    await deleteStoredFile(stored.key);
    return rethrowDb(e);
  }
}

export async function deleteDocument(session: Session, documentId: string): Promise<void> {
  const s = requirePro(session);
  const id = parse(zUuid, documentId);
  const [row] = await withUser(s.userId, (tx) => tx<{ storagePath: string }[]>`
    delete from public.provider_documents where id = ${id} and provider_id = ${s.userId} and status = 'pending' returning storage_path`);
  if (!row) throw new ServiceError("not_found", "Nur noch nicht geprüfte Dokumente können gelöscht werden.");
  await deleteStoredFile(row.storagePath);
}

export async function uploadPortfolioImage(session: Session, file: UploadInput, meta: { caption?: string; categoryId?: string | null } = {}): Promise<{ id: string; url: string }> {
  const s = requirePro(session);
  const caption = meta.caption ? parse(z.string().trim().max(200), meta.caption) : null;
  assertNoContactDetails({ caption }, CONTACT_LINT_MESSAGES.providerProfile);
  const cat = meta.categoryId ? parse(zUuid, meta.categoryId) : null;
  const count = await withUser(s.userId, async (tx) => (await tx<{ n: number }[]>`select count(*)::int as n from public.provider_portfolio where provider_id = ${s.userId}`)[0].n);
  if (count >= 24) throw new ServiceError("validation", "Du kannst höchstens 24 Portfolio-Bilder hochladen.");
  const stored = await storeUpload("portfolio", s.userId, file);
  const [row] = await withUser(s.userId, (tx) => tx<{ id: string }[]>`
    insert into public.provider_portfolio (provider_id, storage_path, caption, category_id, sort_order)
    values (${s.userId}, ${stored.key}, ${caption}, ${cat}, ${count}) returning id`).catch(async (e: unknown) => {
    await deleteStoredFile(stored.key);
    return rethrowDb(e);
  });
  return { id: row.id, url: mediaUrl(stored.key) ?? "" };
}

export async function updatePortfolioItem(session: Session, itemId: string, input: { caption?: string | null; sortOrder?: number; categoryId?: string | null }): Promise<void> {
  const s = requirePro(session);
  const id = parse(zUuid, itemId);
  const v = parse(z.object({ caption: z.string().trim().max(200).nullable().optional(), sortOrder: z.number().int().min(0).max(100).optional(), categoryId: zUuid.nullable().optional() }), input);
  assertNoContactDetails({ caption: v.caption }, CONTACT_LINT_MESSAGES.providerProfile);
  const rows = await withUser(s.userId, (tx) => tx`
    update public.provider_portfolio set
      caption = case when ${v.caption !== undefined} then ${v.caption ?? null} else caption end,
      sort_order = coalesce(${v.sortOrder ?? null}::int, sort_order),
      category_id = case when ${v.categoryId !== undefined} then ${v.categoryId ?? null}::uuid else category_id end
    where id = ${id} and provider_id = ${s.userId} returning id`);
  if (rows.length === 0) throw new ServiceError("not_found", "Bild nicht gefunden.");
}

export async function deletePortfolioItem(session: Session, itemId: string): Promise<void> {
  const s = requirePro(session);
  const id = parse(zUuid, itemId);
  const [row] = await withUser(s.userId, (tx) => tx<{ storagePath: string }[]>`
    delete from public.provider_portfolio where id = ${id} and provider_id = ${s.userId} returning storage_path`);
  if (!row) throw new ServiceError("not_found", "Bild nicht gefunden.");
  await deleteStoredFile(row.storagePath);
}

// ---------------------------------------------------------------------------
// Verification requirements & onboarding
// ---------------------------------------------------------------------------
/**
 * Missing required documents: platform-wide (setting base_required_documents)
 * plus each offered category's categories.required_documents. A requirement is
 * met by an upload of that kind that is pending or approved (category-specific
 * requirements need a document filed for that category — audit-4 A4-3).
 * `requireApproved` → only approved documents count (admin approval check).
 */
export async function queryMissingDocuments(tx: Queryable, providerId: string, settings: PlatformSettings, requireApproved = false): Promise<MissingDocumentDTO[]> {
  const docs = await tx<{ kind: DocumentKind; categoryId: string | null; status: string; expired: boolean }[]>`
    select kind, category_id, status, coalesce(expires_at <= now(), false) as expired
    from public.provider_documents where provider_id = ${providerId}`;
  // Expired documents (expires_at reached) never count (audit-2 N4).
  const valid = docs.filter((d) => !d.expired && (requireApproved ? d.status === "approved" : d.status !== "rejected"));
  const cats = await tx<{ id: string; slug: string; name: string; requiredDocuments: RequiredDocumentDTO[] }[]>`
    select distinct c.id, c.slug, c.name, c.required_documents
    from public.provider_services ps join public.services s on s.id = ps.service_id join public.categories c on c.id = s.category_id
    where ps.provider_id = ${providerId} and ps.is_active`;
  const missing: MissingDocumentDTO[] = [];
  for (const req of settings.baseRequiredDocuments) {
    if (!valid.some((d) => d.kind === req.kind)) missing.push({ categorySlug: null, categoryName: null, kind: req.kind, label: req.label });
  }
  for (const c of cats) {
    for (const req of Array.isArray(c.requiredDocuments) ? c.requiredDocuments : []) {
      if (!valid.some((d) => d.kind === req.kind && d.categoryId === c.id)) {
        missing.push({ categorySlug: c.slug, categoryName: c.name, kind: req.kind, label: req.label });
      }
    }
  }
  return missing;
}

async function queryOnboarding(tx: Queryable, providerId: string, settings: PlatformSettings): Promise<ProOnboardingDTO> {
  const [p] = await tx<{ status: ProOnboardingDTO["status"]; displayName: string; bio: string | null; basePostalCode: string | null; payoutsEnabled: boolean; submittedAt: Date | null; termsAcceptedAt: Date | null }[]>`
    select status, display_name, bio, base_postal_code, payouts_enabled, submitted_at, terms_accepted_at from public.providers where id = ${providerId}`;
  if (!p) throw new ServiceError("not_found", "Profil nicht gefunden.");
  const [{ services }] = await tx<{ services: number }[]>`select count(*)::int as services from public.provider_services where provider_id = ${providerId} and is_active`;
  const [{ hours }] = await tx<{ hours: number }[]>`select count(*)::int as hours from public.provider_weekly_hours where provider_id = ${providerId}`;
  const [note] = await tx<{ note: string | null }[]>`
    select note from public.provider_status_events where provider_id = ${providerId} and to_status in ('rejected', 'suspended')
    order by created_at desc limit 1`;
  const missing = await queryMissingDocuments(tx, providerId, settings);
  const steps: OnboardingStepDTO[] = [
    { key: "profile", label: "Profil & Vorstellung", done: p.displayName.length >= 2 && (p.bio?.length ?? 0) >= 40 },
    { key: "services", label: "Leistungen & Preise", done: services > 0 },
    { key: "area", label: "Einsatzgebiet", done: !!p.basePostalCode },
    { key: "hours", label: "Verfügbarkeit", done: hours > 0 },
    { key: "documents", label: "Verifizierung", done: missing.length === 0 },
    { key: "payout", label: "Auszahlung", done: p.payoutsEnabled },
  ];
  const required = steps.filter((st) => st.key !== "payout");
  return {
    status: p.status,
    steps,
    missingDocuments: missing,
    canSubmit: (p.status === "draft" || p.status === "rejected") && required.every((st) => st.done),
    submittedAt: p.submittedAt?.toISOString() ?? null,
    lastDecisionNote: note?.note ?? null,
    termsAcceptedAt: p.termsAcceptedAt?.toISOString() ?? null,
  };
}

export async function getOnboardingState(session: Session): Promise<ProOnboardingDTO> {
  const s = requirePro(session);
  return withUser(s.userId, async (tx) => queryOnboarding(tx, s.userId, await loadSettings(tx)));
}

const SubmitSchema = z.object({
  termsAccepted: z.literal(true, { error: "Bitte bestätige die AGB für Profis und den SOMA-Verhaltenskodex." }),
  vatMode: z.enum(["regular", "small_business"]).optional(),
});

/**
 * draft/rejected → submitted. Requires `termsAccepted: true` (AGB für Profis +
 * Verhaltenskodex) and records terms_accepted_at; optionally stores the VAT mode.
 */
export async function submitForReview(session: Session, input: { termsAccepted: boolean; vatMode?: VatMode }): Promise<ProOnboardingDTO> {
  const s = requirePro(session);
  const v = parse(SubmitSchema, input);
  const state = await getOnboardingState(s);
  if (!state.canSubmit) {
    const open = state.steps.filter((st) => !st.done && st.key !== "payout").map((st) => st.label);
    throw new ServiceError("validation", open.length ? `Bitte schließe zuerst ab: ${open.join(", ")}.` : "Dein Profil wurde bereits eingereicht.");
  }
  // withService: providers.status / terms_accepted_at are not column-granted to providers; readiness and consent were verified above.
  await withService(async (tx) => {
    await setActor(tx, { actorId: s.userId, actorRole: "provider", note: "Zur Prüfung eingereicht" });
    await tx`
      update public.providers
      set status = 'submitted', terms_accepted_at = now(), vat_mode = coalesce(${v.vatMode ?? null}, vat_mode)
      where id = ${s.userId} and status in ('draft', 'rejected')`;
  });
  return getOnboardingState(s);
}

// ---------------------------------------------------------------------------
// Settings & payouts
// ---------------------------------------------------------------------------
export async function getProSettings(session: Session): Promise<ProSettingsDTO> {
  const s = requirePro(session);
  // withService: invite_code is not column-granted (other users must not read it); only the owner's row is read.
  const [p] = await withService((tx) => tx<{ bookingMode: "instant" | "request"; leadTimeMinutes: number; travelBufferMinutes: number; maxAdvanceDays: number; inviteCode: string; slug: string; payoutsEnabled: boolean; vatMode: VatMode }[]>`
    select booking_mode, lead_time_minutes, travel_buffer_minutes, max_advance_days, invite_code, slug, payouts_enabled, vat_mode
    from public.providers where id = ${s.userId}`);
  if (!p) throw new ServiceError("not_found", "Profil nicht gefunden.");
  return {
    bookingMode: p.bookingMode, leadTimeMinutes: p.leadTimeMinutes, travelBufferMinutes: p.travelBufferMinutes, maxAdvanceDays: p.maxAdvanceDays,
    inviteCode: p.inviteCode, inviteUrl: `${await resolveAppUrl()}/profis/${p.slug}?einladung=${p.inviteCode}`, payoutsEnabled: p.payoutsEnabled,
    vatMode: p.vatMode,
    notificationPreferences: await getNotificationPreferences(s),
  };
}

const SettingsSchema = z.object({
  bookingMode: z.enum(["instant", "request"]),
  leadTimeMinutes: z.number().int().min(60, "Mindestens 1 Stunde Vorlauf.").max(2880),
  travelBufferMinutes: z.number().int().min(15, "Mindestens 15 Minuten Puffer.").max(60, "Höchstens 60 Minuten Puffer."),
  maxAdvanceDays: z.number().int().min(7).max(180),
  /** omitted → unchanged */
  vatMode: z.enum(["regular", "small_business"]).optional(),
  notificationPreferences: z.object({
    emailBookings: z.boolean(), emailReminders: z.boolean(), emailMarketing: z.boolean(), smsReminders: z.boolean(), pushBookings: z.boolean(),
  }).optional(),
});

export async function updateProSettings(session: Session, input: z.input<typeof SettingsSchema>): Promise<ProSettingsDTO> {
  const s = requirePro(session);
  const v = parse(SettingsSchema, input);
  await withUser(s.userId, (tx) => tx`
    update public.providers set booking_mode = ${v.bookingMode}, lead_time_minutes = ${v.leadTimeMinutes},
      travel_buffer_minutes = ${v.travelBufferMinutes}, max_advance_days = ${v.maxAdvanceDays},
      vat_mode = coalesce(${v.vatMode ?? null}, vat_mode)
    where id = ${s.userId}`).catch(rethrowDb);
  if (v.notificationPreferences) await updateNotificationPreferences(s, v.notificationPreferences);
  return getProSettings(s);
}

/** Payout onboarding: Stripe Connect Express link; dev mode enables payouts immediately (Testmodus). */
export async function getPayoutOnboardingLink(session: Session): Promise<{ url: string }> {
  const s = requirePro(session);
  const provider = getPaymentProvider();
  // withService: stripe_account_id / payouts_enabled are not provider-writable (and not readable by API roles).
  const [p] = await withService((tx) => tx<{ stripeAccountId: string | null }[]>`select stripe_account_id from public.providers where id = ${s.userId}`);
  const base = await resolveAppUrl();
  const link = await provider.createConnectedAccountLink({
    providerId: s.userId, existingAccountId: p?.stripeAccountId ?? null, email: s.email,
    returnUrl: `${base}/pro/einnahmen?auszahlung=fertig`, refreshUrl: `${base}/pro/einnahmen?auszahlung=erneut`,
  });
  // withService: see above — store the connected account (Stripe) or simulate a completed onboarding (dev).
  await withService(async (tx) => {
    if (provider.id === "dev") await tx`update public.providers set payouts_enabled = true where id = ${s.userId}`;
    else if (link.accountId) await tx`update public.providers set stripe_account_id = ${link.accountId} where id = ${s.userId}`;
  });
  return { url: link.url };
}

// ---------------------------------------------------------------------------
// Earnings (pending → available after 48 h without open dispute → paid out)
// ---------------------------------------------------------------------------
interface EarningsRow {
  id: string;
  reference: string;
  serviceName: string;
  status: EarningsItemDTO["status"];
  startsAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  servicePriceCents: number;
  travelFeeCents: number;
  commissionTier: EarningsItemDTO["commissionTier"];
  commissionCents: number;
  providerPayoutCents: number;
  payoutId: string | null;
}

export function payoutStateOf(r: { status: string; completedAt: Date | null; cancelledAt: Date | null; payoutId: string | null }, disputed: boolean, holdHours: number, now: Date): { state: EarningsItemDTO["payoutState"]; availableAt: string | null } {
  if (r.payoutId) return { state: "paid_out", availableAt: null };
  const base = r.completedAt ?? r.cancelledAt;
  if (!base) return { state: "pending", availableAt: null };
  const at = new Date(base.getTime() + holdHours * 3_600_000);
  if (disputed) return { state: "pending", availableAt: null };
  return at.getTime() <= now.getTime() ? { state: "available", availableAt: at.toISOString() } : { state: "pending", availableAt: at.toISOString() };
}

export async function getEarnings(session: Session, opts: { limit?: number } = {}): Promise<EarningsDTO> {
  const s = requirePro(session);
  const limit = Math.min(500, Math.max(1, opts.limit ?? 200));
  return withUser(s.userId, async (tx) => {
    const settings = await loadSettings(tx);
    const rows = await tx<EarningsRow[]>`
      select id, reference, service_name, status, starts_at, completed_at, cancelled_at, service_price_cents, travel_fee_cents,
             commission_tier, commission_cents, provider_payout_cents, payout_id
      from public.provider_bookings
      where status = 'completed' or (status in ('cancelled', 'no_show') and provider_payout_cents > 0 and cancellation_fee_cents > 0)
      order by coalesce(completed_at, cancelled_at) desc nulls last
      limit ${limit}`;
    const disputed = new Set((await tx<{ bookingId: string }[]>`
      select booking_id from public.disputes where status in ('open', 'investigating')`).map((d) => d.bookingId));
    const now = new Date();
    const items: EarningsItemDTO[] = rows.map((r) => {
      const ps = payoutStateOf(r, disputed.has(r.id), settings.payoutHoldHours, now);
      return {
        bookingId: r.id, reference: r.reference, serviceName: r.serviceName, status: r.status, startsAt: r.startsAt.toISOString(),
        completedAt: r.completedAt?.toISOString() ?? r.cancelledAt?.toISOString() ?? null, servicePriceCents: r.servicePriceCents,
        travelFeeCents: r.travelFeeCents, commissionTier: r.commissionTier, commissionCents: r.commissionCents, payoutCents: r.providerPayoutCents,
        payoutState: ps.state, availableAt: ps.availableAt, disputed: disputed.has(r.id),
      };
    });
    const payouts = await tx<Array<Omit<PayoutDTO, "periodStart" | "periodEnd" | "paidAt" | "createdAt"> & { periodStart: Date | null; periodEnd: Date | null; paidAt: Date | null; createdAt: Date }>>`
      select po.id, po.provider_id, po.amount_cents, po.status, po.period_start, po.period_end, po.paid_at, po.created_at,
             (select count(*)::int from public.provider_bookings pb where pb.payout_id = po.id) as booking_count
      from public.payouts po where po.provider_id = ${s.userId} order by po.created_at desc limit 50`;
    const sum = (st: EarningsItemDTO["payoutState"]) => items.filter((i) => i.payoutState === st).reduce((a, i) => a + i.payoutCents, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
    const since = (t: number) => items.filter((i) => i.completedAt && Date.parse(i.completedAt) >= t).reduce((a, i) => a + i.payoutCents, 0);
    return {
      totals: { pendingCents: sum("pending"), availableCents: sum("available"), paidOutCents: sum("paid_out"), monthCents: since(monthStart), yearCents: since(yearStart) },
      items,
      payouts: payouts.map((p) => ({
        ...p, periodStart: p.periodStart?.toISOString() ?? null, periodEnd: p.periodEnd?.toISOString() ?? null,
        paidAt: p.paidAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString(),
      })),
    };
  });
}

// ---------------------------------------------------------------------------
// Dashboard, calendar, reviews
// ---------------------------------------------------------------------------
export async function getProDashboard(session: Session): Promise<ProDashboardDTO> {
  const s = requirePro(session);
  await runBookingMaintenanceLazily();
  const [today, requests] = await Promise.all([listProviderBookings(s, "today", 1, 50), listProviderBookings(s, "requests", 1, 50)]);
  const base = await withUser(s.userId, async (tx) => {
    const settings = await loadSettings(tx);
    const [p] = await tx<{ status: ProDashboardDTO["status"]; displayName: string; ratingAvg: string | null; ratingCount: number; completedCount: number }[]>`
      select status, display_name, rating_avg::text as rating_avg, rating_count, completed_count from public.providers where id = ${s.userId}`;
    const [{ upcoming }] = await tx<{ upcoming: number }[]>`
      select count(*)::int as upcoming from public.provider_bookings where status in ('confirmed', 'in_progress') and ends_at > now()`;
    const [{ week }] = await tx<{ week: number }[]>`
      select coalesce(sum(provider_payout_cents), 0)::int as week from public.provider_bookings
      where status = 'completed' and completed_at >= date_trunc('week', now() at time zone 'Europe/Berlin') at time zone 'Europe/Berlin'`;
    return { p, upcoming, week, onboarding: await queryOnboarding(tx, s.userId, settings) };
  });
  return {
    status: base.p.status,
    displayName: base.p.displayName,
    today: today.items,
    openRequests: requests.items,
    upcomingCount: base.upcoming,
    weekEarningsCents: base.week,
    ratingAvg: base.p.ratingAvg == null ? null : Number(base.p.ratingAvg),
    ratingCount: base.p.ratingCount,
    completedCount: base.p.completedCount,
    onboarding: base.onboarding,
    unreadNotifications: await countUnreadNotifications(s),
  };
}

export async function getProCalendar(session: Session, from: string, days = 7): Promise<ProCalendarDTO> {
  const s = requirePro(session);
  const v = parse(z.object({ from: z.string().refine(isValidLocalDate, "Ungültiges Datum."), days: z.number().int().min(1).max(42) }), { from, days });
  return withUser(s.userId, async (tx: Tx) => {
    const start = new Date(`${v.from}T00:00:00Z`);
    start.setUTCHours(start.getUTCHours() - 2);
    const end = new Date(`${addDays(v.from, v.days)}T00:00:00Z`);
    const [weeklyHours, timeOff, bookings] = await Promise.all([
      queryWeeklyHours(tx, s.userId),
      queryTimeOff(tx, s.userId, start, end),
      queryProviderBookings(tx, (t) => t`where starts_at < ${end} and ends_at > ${start} and status in ('requested', 'confirmed', 'in_progress', 'completed') order by starts_at`),
    ]);
    const now = new Date();
    return { from: v.from, days: v.days, weeklyHours, timeOff, bookings: bookings.map((b) => toProviderBooking(b, now)) };
  });
}

export async function listMyReviews(session: Session, page = 1): Promise<ReviewListDTO> {
  const s = requirePro(session);
  return withUser(s.userId, (tx) => queryProviderReviews(tx, s.userId, page, 20));
}
