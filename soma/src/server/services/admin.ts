import "server-only";

import { z } from "zod";
import { setActor, withService, type Fragment, type Queryable, type Tx } from "../db/client";
import { rethrowDb } from "../db/errors";
import type {
  AdminBookingDetailDTO,
  AdminBookingListItemDTO,
  AdminDisputeDTO,
  AdminPaymentDTO,
  AdminProviderDetailDTO,
  AdminProviderListItemDTO,
  AdminUserDTO,
  AppRole,
  AuditLogEntryDTO,
  BookingStatus,
  CategoryDTO,
  CommissionRuleDTO,
  ContentBlockDTO,
  DisputeStatus,
  Paginated,
  PayoutDTO,
  ProviderDecision,
  ProviderDecisionResult,
  ProviderStatus,
  ServiceDTO,
  Session,
} from "../dto";
import { assertNotDemoAccount } from "../auth/demo-accounts";
import { ServiceError } from "../errors";
import { getPaymentProvider } from "../payments/provider";
import { createDevPaymentProvider } from "../payments/dev";
import { createStripePaymentProvider } from "../payments/stripe";
import { assertAdmin, audit, loadSettings, paging, parse, zLocalDate, zUuid } from "./_shared";
import { cancelInTx, lockBooking, runPaymentOps, type PaymentOp } from "./booking-engine";
import { notify } from "./notifications";
import { DOCUMENT_COLUMNS, queryMissingDocuments, queryProProfile, toDocument, validUntilToExpiry, type DocumentRow } from "./pro";
import { activateAwaitingOfferings, DOCUMENT_KIND_LABELS, suspendIfDocumentsIncomplete } from "./verification";

/**
 * Admin platform. Every function: assertAdmin (session role + DB re-check)
 * inside a service transaction, then the use case; every write is audited.
 * withService is used throughout because admin use cases read/write across
 * users after requireAdmin (docs/architecture.md §3.1).
 */

async function asAdmin<T>(session: Session, fn: (tx: Tx, admin: Session) => Promise<T>): Promise<T> {
  // withService: admin use case, authorised by assertAdmin() in the same transaction.
  return withService(async (tx) => {
    const admin = await assertAdmin(tx, session);
    return fn(tx, admin);
  }).catch(rethrowDb);
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export async function listUsers(session: Session, opts: { q?: string; role?: AppRole; page?: number; pageSize?: number } = {}): Promise<Paginated<AdminUserDTO>> {
  const v = parse(z.object({ q: z.string().trim().max(100).optional(), role: z.enum(["customer", "provider", "admin"]).optional() }), { q: opts.q, role: opts.role });
  const pg = paging(opts.page, opts.pageSize, 25);
  return asAdmin(session, async (tx) => {
    const cond = (t: Queryable): Fragment => t`
      true ${v.role ? t`and p.role = ${v.role}` : t``}
      ${v.q ? t`and (u.email ilike ${`%${v.q}%`} or p.first_name ilike ${`%${v.q}%`} or p.last_name ilike ${`%${v.q}%`})` : t``}`;
    const rows = await tx<Array<Omit<AdminUserDTO, "createdAt" | "blockedAt"> & { createdAt: Date; blockedAt: Date | null }>>`
      select p.id, u.email, p.role, p.first_name, p.last_name, p.phone, p.created_at, p.blocked_at,
             (select count(*)::int from public.bookings b where b.customer_id = p.id or b.provider_id = p.id) as bookings_count,
             pr.status as provider_status
      from public.profiles p join auth.users u on u.id = p.id left join public.providers pr on pr.id = p.id
      where ${cond(tx)} order by p.created_at desc limit ${pg.pageSize} offset ${pg.offset}`;
    const [{ total }] = await tx<{ total: number }[]>`select count(*)::int as total from public.profiles p join auth.users u on u.id = p.id where ${cond(tx)}`;
    return { items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), blockedAt: iso(r.blockedAt) })), total, page: pg.page, pageSize: pg.pageSize };
  });
}

export async function setUserBlocked(session: Session, userId: string, blocked: boolean, reason: string): Promise<void> {
  const id = parse(zUuid, userId);
  const r = parse(z.string().trim().min(3, "Bitte einen Grund angeben.").max(500), reason);
  await asAdmin(session, async (tx, admin) => {
    if (id === admin.userId) throw new ServiceError("validation", "Das eigene Konto kann nicht gesperrt werden.");
    if (blocked) await assertNotDemoAccount(id, tx);
    const rows = await tx`update public.profiles set blocked_at = ${blocked ? new Date() : null} where id = ${id} returning id`;
    if (rows.length === 0) throw new ServiceError("not_found", "Nutzer nicht gefunden.");
    if (blocked) {
      const [{ exists }] = await tx<{ exists: boolean }[]>`select to_regclass('app_private.local_sessions') is not null as exists`;
      if (exists) await tx`delete from app_private.local_sessions where user_id = ${id}`;
    }
    await audit(tx, admin.userId, blocked ? "user.block" : "user.unblock", "profile", id, { reason: r });
  });
}

export async function adjustCredits(session: Session, userId: string, amountCents: number, note: string, reason: "admin_adjustment" | "goodwill" = "admin_adjustment"): Promise<void> {
  const v = parse(z.object({
    userId: zUuid, amountCents: z.number().int().refine((n) => n !== 0 && Math.abs(n) <= 50_000, "Betrag zwischen −500 € und 500 €, nicht 0."),
    note: z.string().trim().min(3).max(300), reason: z.enum(["admin_adjustment", "goodwill"]),
  }), { userId, amountCents, note, reason });
  await asAdmin(session, async (tx, admin) => {
    await tx`insert into public.credit_ledger (user_id, amount_cents, reason, note, created_by) values (${v.userId}, ${v.amountCents}, ${v.reason}, ${v.note}, ${admin.userId})`;
    await audit(tx, admin.userId, "credits.adjust", "profile", v.userId, { amountCents: v.amountCents, reason: v.reason, note: v.note });
  });
}

// ---------------------------------------------------------------------------
// Provider verification
// ---------------------------------------------------------------------------
export async function listProvidersAdmin(session: Session, opts: { status?: ProviderStatus | ProviderStatus[]; q?: string; page?: number; pageSize?: number } = {}): Promise<Paginated<AdminProviderListItemDTO>> {
  const statuses = opts.status ? (Array.isArray(opts.status) ? opts.status : [opts.status]) : null;
  const v = parse(z.object({ statuses: z.array(z.enum(["draft", "submitted", "in_review", "approved", "rejected", "suspended"])).nullable(), q: z.string().trim().max(100).optional() }), { statuses, q: opts.q });
  const pg = paging(opts.page, opts.pageSize, 25);
  return asAdmin(session, async (tx) => {
    const settings = await loadSettings(tx);
    const cond = (t: Queryable): Fragment => t`true ${v.statuses ? t`and p.status = any(${v.statuses}::public.provider_status[])` : t``}
      ${v.q ? t`and (p.display_name ilike ${`%${v.q}%`} or p.slug ilike ${`%${v.q}%`})` : t``}`;
    const rows = await tx<Array<{ id: string; slug: string; displayName: string; status: ProviderStatus; citySlug: string | null; categories: string[]; submittedAt: Date | null; documentsPending: number; ratingAvg: string | null; completedCount: number }>>`
      select p.id, p.slug, p.display_name, p.status, pc.city_slug, p.submitted_at, p.rating_avg::text as rating_avg, p.completed_count,
             coalesce((select array_agg(distinct c.slug) from public.provider_services ps join public.services s on s.id = ps.service_id
                       join public.categories c on c.id = s.category_id where ps.provider_id = p.id and ps.is_active), '{}') as categories,
             (select count(*)::int from public.provider_documents d where d.provider_id = p.id and d.status = 'pending') as documents_pending
      from public.providers p left join public.postal_codes pc on pc.postal_code = p.base_postal_code
      where ${cond(tx)}
      order by case p.status when 'submitted' then 0 when 'in_review' then 1 else 2 end, p.submitted_at nulls last, p.display_name
      limit ${pg.pageSize} offset ${pg.offset}`;
    const [{ total }] = await tx<{ total: number }[]>`select count(*)::int as total from public.providers p where ${cond(tx)}`;
    const items: AdminProviderListItemDTO[] = [];
    for (const r of rows) {
      const missing = await queryMissingDocuments(tx, r.id, settings, true);
      items.push({
        providerId: r.id, slug: r.slug, displayName: r.displayName, status: r.status, citySlug: r.citySlug, categories: [...r.categories],
        submittedAt: iso(r.submittedAt), documentsPending: r.documentsPending, missingDocuments: missing.length,
        ratingAvg: r.ratingAvg == null ? null : Number(r.ratingAvg), completedCount: r.completedCount,
      });
    }
    return { items, total, page: pg.page, pageSize: pg.pageSize };
  });
}

/** Verification queue: submitted + in_review. */
export async function listVerificationQueue(session: Session): Promise<AdminProviderListItemDTO[]> {
  return (await listProvidersAdmin(session, { status: ["submitted", "in_review"], pageSize: 100 })).items;
}

export async function getProviderForAdmin(session: Session, providerId: string): Promise<AdminProviderDetailDTO | null> {
  const id = parse(zUuid, providerId);
  return asAdmin(session, async (tx) => {
    const profile = await queryProProfile(tx, id);
    if (!profile) return null;
    const settings = await loadSettings(tx);
    const [extra] = await tx<{ email: string; phone: string | null; bookingMode: "instant" | "request"; commissionRateOverride: number | null; payoutsEnabled: boolean; vatMode: AdminProviderDetailDTO["vatMode"]; termsAcceptedAt: Date | null; ratingAvg: string | null; ratingCount: number; completedCount: number }[]>`
      select u.email, pf.phone, p.booking_mode, p.commission_rate_override::float8 as commission_rate_override, p.payouts_enabled,
             p.vat_mode, p.terms_accepted_at,
             p.rating_avg::text as rating_avg, p.rating_count, p.completed_count
      from public.providers p join public.profiles pf on pf.id = p.id join auth.users u on u.id = p.id where p.id = ${id}`;
    const services = await tx<Array<AdminProviderDetailDTO["services"][number]>>`
      select ps.id as provider_service_id, s.id as service_id, s.slug as service_slug, s.name as service_name, c.id as category_id,
             c.slug as category_slug, c.name as category_name, ps.duration_minutes, ps.price_cents, ps.is_active,
             s.durations as service_durations, s.price_hint_from_cents
      from public.provider_services ps join public.services s on s.id = ps.service_id join public.categories c on c.id = s.category_id
      where ps.provider_id = ${id} order by c.sort_order, s.sort_order`;
    const hours = await tx<{ id: string; weekday: number; startTime: string; endTime: string }[]>`
      select id, weekday, start_time::text as start_time, end_time::text as end_time from public.provider_weekly_hours where provider_id = ${id} order by weekday, start_time`;
    const docs = await tx<DocumentRow[]>`
      select ${tx.unsafe(DOCUMENT_COLUMNS)} from public.provider_documents where provider_id = ${id} order by created_at desc`;
    const events = await tx<Array<{ fromStatus: ProviderStatus | null; toStatus: ProviderStatus; note: string | null; createdAt: Date }>>`
      select from_status, to_status, note, created_at from public.provider_status_events where provider_id = ${id} order by created_at desc`;
    return {
      profile,
      email: extra.email,
      phone: extra.phone,
      bookingMode: extra.bookingMode,
      commissionRateOverride: extra.commissionRateOverride,
      payoutsEnabled: extra.payoutsEnabled,
      vatMode: extra.vatMode,
      termsAcceptedAt: iso(extra.termsAcceptedAt),
      services: services.map((s) => ({ ...s, serviceDurations: [...s.serviceDurations] })),
      weeklyHours: hours.map((h) => ({ id: h.id, weekday: h.weekday, start: h.startTime.slice(0, 5), end: h.endTime.startsWith("24") ? "24:00" : h.endTime.slice(0, 5) })),
      documents: docs.map((d) => ({ ...toDocument(d), providerId: id })),
      missingDocuments: await queryMissingDocuments(tx, id, settings, true),
      statusEvents: events.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
      ratingAvg: extra.ratingAvg == null ? null : Number(extra.ratingAvg),
      ratingCount: extra.ratingCount,
      completedCount: extra.completedCount,
    };
  });
}

const DECISION_TARGET: Record<ProviderDecision, { from: ProviderStatus[]; to: ProviderStatus }> = {
  start_review: { from: ["submitted"], to: "in_review" },
  approve: { from: ["submitted", "in_review", "rejected", "draft"], to: "approved" },
  reject: { from: ["submitted", "in_review"], to: "rejected" },
  suspend: { from: ["approved"], to: "suspended" },
  reinstate: { from: ["suspended"], to: "approved" },
};

/** Verification decision. Approving with missing/unapproved required documents is allowed but returns warnings. */
export async function decideProvider(session: Session, providerId: string, decision: ProviderDecision, note?: string): Promise<ProviderDecisionResult> {
  const v = parse(z.object({
    providerId: zUuid, decision: z.enum(["approve", "reject", "start_review", "suspend", "reinstate"]),
    note: z.string().trim().max(1000).optional(),
  }).refine((x) => !["reject", "suspend"].includes(x.decision) || (x.note && x.note.length >= 5), { message: "Bitte die Entscheidung begründen (mind. 5 Zeichen).", path: ["note"] }), { providerId, decision, note });
  return asAdmin(session, async (tx, admin) => {
    const [p] = await tx<{ status: ProviderStatus; basePostalCode: string | null }[]>`select status, base_postal_code from public.providers where id = ${v.providerId} for update`;
    if (!p) throw new ServiceError("not_found", "Profi nicht gefunden.");
    const target = DECISION_TARGET[v.decision];
    if (v.decision === "suspend" || v.decision === "reject") await assertNotDemoAccount(v.providerId, tx);
    if (!target.from.includes(p.status)) throw new ServiceError("invalid_state", `Aus dem Status „${p.status}“ ist diese Entscheidung nicht möglich.`);
    const warnings: string[] = [];
    if (v.decision === "approve" || v.decision === "reinstate") {
      const settings = await loadSettings(tx);
      // audit-1 R1: no approval without every required document (base + category) approved; no override.
      const missing = await queryMissingDocuments(tx, v.providerId, settings, true);
      if (missing.length > 0) {
        const list = missing.map((m) => `${m.label}${m.categoryName ? ` (${m.categoryName})` : ""}`).join(", ");
        throw new ServiceError(
          "invalid_state",
          `Freigabe nicht möglich. Folgende Pflichtdokumente fehlen oder sind noch nicht geprüft: ${list}.`,
        );
      }
      if (!p.basePostalCode) warnings.push("Kein Einsatzgebiet hinterlegt.");
      const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from public.provider_weekly_hours where provider_id = ${v.providerId}`;
      if (n === 0) warnings.push("Keine Arbeitszeiten hinterlegt.");
    }
    await setActor(tx, { actorId: admin.userId, actorRole: "admin", note: v.note ?? null });
    await tx`update public.providers set status = ${target.to} where id = ${v.providerId}`;
    if (target.to === "approved") await activateAwaitingOfferings(tx, v.providerId);
    await audit(tx, admin.userId, `provider.${v.decision}`, "provider", v.providerId, { from: p.status, to: target.to, note: v.note ?? null, warnings });
    if (target.to === "approved") await notify(tx, "provider.approved", { providerId: v.providerId });
    if (target.to === "rejected" || target.to === "suspended") await notify(tx, "provider.rejected", { providerId: v.providerId, note: v.note ?? null });
    return { status: target.to, warnings };
  });
}

/**
 * Approve / reject one document. `validUntil` ("YYYY-MM-DD", inclusive) sets the expiry on approval.
 * Rejecting a required document of an approved provider suspends them automatically (audit-2 N4).
 */
export async function reviewDocument(session: Session, documentId: string, status: "approved" | "rejected", note?: string, validUntil?: string | null): Promise<{ providerSuspended: boolean; offeringsActivated: number }> {
  const v = parse(z.object({
    documentId: zUuid, status: z.enum(["approved", "rejected"]), note: z.string().trim().max(500).optional(),
    validUntil: zLocalDate.nullable().optional(),
  }).refine((x) => x.status === "approved" || (x.note && x.note.length >= 3), { message: "Bitte einen Hinweis für den Profi angeben.", path: ["note"] }), { documentId, status, note, validUntil });
  const expiresAt = v.status === "approved" ? validUntilToExpiry(v.validUntil) : null;
  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    throw new ServiceError("validation", "Das Gültigkeitsdatum liegt in der Vergangenheit.", { validUntil: "Das Datum liegt in der Vergangenheit." });
  }
  return asAdmin(session, async (tx, admin) => {
    if (v.status === "rejected") {
      const [doc] = await tx<{ providerId: string }[]>`select provider_id from public.provider_documents where id = ${v.documentId}`;
      if (doc) await assertNotDemoAccount(doc.providerId, tx);
    }
    const rows = await tx<{ providerId: string; kind: DocumentRow["kind"] }[]>`
      update public.provider_documents
      set status = ${v.status}, review_note = ${v.note ?? null}, reviewed_by = ${admin.userId}, reviewed_at = now(),
          expires_at = case when ${v.status} = 'approved' then coalesce(${expiresAt}::timestamptz, expires_at) else expires_at end
      where id = ${v.documentId} returning provider_id, kind`;
    if (!rows[0]) throw new ServiceError("not_found", "Dokument nicht gefunden.");
    await audit(tx, admin.userId, `document.${v.status}`, "provider_document", v.documentId, { providerId: rows[0].providerId, note: v.note ?? null, validUntil: v.validUntil ?? null });
    const providerSuspended = v.status === "rejected"
      ? await suspendIfDocumentsIncomplete(tx, rows[0].providerId, `${DOCUMENT_KIND_LABELS[rows[0].kind]} abgelehnt${v.note ? ` („${v.note}“)` : ""}`)
      : false;
    const offeringsActivated = v.status === "approved" ? await activateAwaitingOfferings(tx, rows[0].providerId) : 0;
    return { providerSuspended, offeringsActivated };
  });
}

export async function setProviderCommissionOverride(session: Session, providerId: string, rate: number | null): Promise<void> {
  const v = parse(z.object({ providerId: zUuid, rate: z.number().min(0).max(0.5).nullable() }), { providerId, rate });
  await asAdmin(session, async (tx, admin) => {
    await tx`update public.providers set commission_rate_override = ${v.rate} where id = ${v.providerId}`;
    await audit(tx, admin.userId, "provider.commission_override", "provider", v.providerId, { rate: v.rate });
  });
}

// ---------------------------------------------------------------------------
// Catalogue CRUD
// ---------------------------------------------------------------------------
const CategorySchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]{2,60}$/, "Nur Kleinbuchstaben, Ziffern und Bindestriche."),
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  imagePath: z.string().trim().max(300).nullable().optional(),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
  seoTitle: z.string().trim().max(120).nullable().optional(),
  seoDescription: z.string().trim().max(300).nullable().optional(),
  requiredDocuments: z.array(z.object({ kind: z.enum(["id_document", "business_registration", "qualification", "insurance", "other"]), label: z.string().trim().min(3).max(160) })).max(10).default([]),
});
export type CategoryInput = z.input<typeof CategorySchema>;

export async function upsertCategory(session: Session, input: CategoryInput & { id?: string }): Promise<CategoryDTO> {
  const v = parse(CategorySchema.extend({ id: zUuid.optional() }), input);
  return asAdmin(session, async (tx, admin) => {
    const values = {
      slug: v.slug, name: v.name, tagline: v.tagline ?? null, description: v.description ?? null, imagePath: v.imagePath ?? `/images/categories/${v.slug}.jpg`,
      sortOrder: v.sortOrder, isActive: v.isActive, seoTitle: v.seoTitle ?? null, seoDescription: v.seoDescription ?? null,
    };
    const docs = tx.json(v.requiredDocuments);
    const [row] = v.id
      ? await tx<CategoryDTO[]>`update public.categories set ${tx(values)}, required_documents = ${docs} where id = ${v.id}
          returning id, slug, name, tagline, description, image_path, sort_order, is_active, seo_title, seo_description, required_documents`
      : await tx<CategoryDTO[]>`insert into public.categories ${tx({ ...values })} returning id, slug, name, tagline, description, image_path, sort_order, is_active, seo_title, seo_description, required_documents`;
    if (!row) throw new ServiceError("not_found", "Kategorie nicht gefunden.");
    if (!v.id) await tx`update public.categories set required_documents = ${docs} where id = ${row.id}`;
    await audit(tx, admin.userId, v.id ? "category.update" : "category.create", "category", row.id, { slug: v.slug });
    return { ...row, requiredDocuments: v.requiredDocuments };
  });
}

const ServiceSchema = z.object({
  categoryId: zUuid,
  slug: z.string().trim().regex(/^[a-z0-9-]{2,80}$/, "Nur Kleinbuchstaben, Ziffern und Bindestriche."),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  durations: z.array(z.number().int().min(15).max(480)).min(1).max(6),
  defaultDuration: z.number().int().min(15).max(480),
  priceHintFromCents: z.number().int().min(0).max(100_000).nullable().optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
}).refine((x) => x.durations.includes(x.defaultDuration), { message: "Die Standarddauer muss in den Dauern enthalten sein.", path: ["defaultDuration"] });
export type ServiceInput = z.input<typeof ServiceSchema>;

export async function upsertService(session: Session, input: ServiceInput & { id?: string }): Promise<ServiceDTO> {
  const id = input.id ? parse(zUuid, input.id) : null;
  const v = parse(ServiceSchema, input);
  return asAdmin(session, async (tx, admin) => {
    const attrs = tx.json(JSON.parse(JSON.stringify(v.attributes)));
    const [row] = id
      ? await tx<{ id: string }[]>`
          update public.services set category_id = ${v.categoryId}, slug = ${v.slug}, name = ${v.name}, description = ${v.description ?? null},
            durations = ${v.durations}::int[], default_duration = ${v.defaultDuration}, price_hint_from_cents = ${v.priceHintFromCents ?? null},
            attributes = ${attrs}, sort_order = ${v.sortOrder}, is_active = ${v.isActive}
          where id = ${id} returning id`
      : await tx<{ id: string }[]>`
          insert into public.services (category_id, slug, name, description, durations, default_duration, price_hint_from_cents, attributes, sort_order, is_active)
          values (${v.categoryId}, ${v.slug}, ${v.name}, ${v.description ?? null}, ${v.durations}::int[], ${v.defaultDuration},
                  ${v.priceHintFromCents ?? null}, ${attrs}, ${v.sortOrder}, ${v.isActive}) returning id`;
    if (!row) throw new ServiceError("not_found", "Leistung nicht gefunden.");
    await audit(tx, admin.userId, id ? "service.update" : "service.create", "service", row.id, { slug: v.slug });
    const [out] = await tx<ServiceDTO[]>`
      select s.id, s.category_id, c.slug as category_slug, s.slug, s.name, s.description, s.durations, s.default_duration,
             s.price_hint_from_cents, s.attributes, s.sort_order, s.is_active
      from public.services s join public.categories c on c.id = s.category_id where s.id = ${row.id}`;
    return { ...out, durations: [...out.durations] };
  });
}

/** All categories incl. inactive (admin view). */
export async function listCategoriesAdmin(session: Session): Promise<Array<CategoryDTO & { services: ServiceDTO[] }>> {
  return asAdmin(session, async (tx) => {
    const cats = await tx<CategoryDTO[]>`
      select id, slug, name, tagline, description, image_path, sort_order, is_active, seo_title, seo_description, required_documents
      from public.categories order by sort_order, name`;
    const services = await tx<ServiceDTO[]>`
      select s.id, s.category_id, c.slug as category_slug, s.slug, s.name, s.description, s.durations, s.default_duration,
             s.price_hint_from_cents, s.attributes, s.sort_order, s.is_active
      from public.services s join public.categories c on c.id = s.category_id order by s.sort_order, s.name`;
    return cats.map((c) => ({ ...c, services: services.filter((s) => s.categoryId === c.id).map((s) => ({ ...s, durations: [...s.durations] })) }));
  });
}

// ---------------------------------------------------------------------------
// Bookings, refunds, disputes
// ---------------------------------------------------------------------------
interface AdminBookingRow {
  id: string; reference: string; status: BookingStatus; startsAt: Date; endsAt: Date; serviceName: string; customerName: string;
  providerName: string; city: string; totalCents: number; commissionCents: number; createdAt: Date; hasOpenDispute: boolean;
}

const ADMIN_BOOKING_SELECT = `b.id, b.reference, b.status, b.starts_at, b.ends_at, b.service_name,
  trim(coalesce(cp.first_name, '') || ' ' || coalesce(cp.last_name, '')) as customer_name, pr.display_name as provider_name,
  b.city, b.total_cents, b.commission_cents, b.created_at,
  exists (select 1 from public.disputes d where d.booking_id = b.id and d.status in ('open', 'investigating')) as has_open_dispute`;

const toAdminBooking = (r: AdminBookingRow): AdminBookingListItemDTO => ({
  id: r.id, reference: r.reference, status: r.status, startsAt: r.startsAt.toISOString(), serviceName: r.serviceName, customerName: r.customerName,
  providerName: r.providerName, city: r.city, totalCents: r.totalCents, commissionCents: r.commissionCents, createdAt: r.createdAt.toISOString(),
  hasOpenDispute: r.hasOpenDispute,
});

export async function listAdminBookings(session: Session, opts: { status?: BookingStatus; q?: string; page?: number; pageSize?: number } = {}): Promise<Paginated<AdminBookingListItemDTO>> {
  const v = parse(z.object({ status: z.enum(["pending_payment", "requested", "confirmed", "in_progress", "completed", "cancelled", "declined", "expired", "no_show"]).optional(), q: z.string().trim().max(60).optional() }), { status: opts.status, q: opts.q });
  const pg = paging(opts.page, opts.pageSize, 25);
  return asAdmin(session, async (tx) => {
    const cond = (t: Queryable): Fragment => t`true ${v.status ? t`and b.status = ${v.status}` : t``}
      ${v.q ? t`and (b.reference ilike ${`%${v.q}%`} or pr.display_name ilike ${`%${v.q}%`} or cp.last_name ilike ${`%${v.q}%`})` : t``}`;
    const rows = await tx<AdminBookingRow[]>`
      select ${tx.unsafe(ADMIN_BOOKING_SELECT)} from public.bookings b
      join public.profiles cp on cp.id = b.customer_id join public.providers pr on pr.id = b.provider_id
      where ${cond(tx)} order by b.created_at desc limit ${pg.pageSize} offset ${pg.offset}`;
    const [{ total }] = await tx<{ total: number }[]>`
      select count(*)::int as total from public.bookings b join public.profiles cp on cp.id = b.customer_id join public.providers pr on pr.id = b.provider_id where ${cond(tx)}`;
    return { items: rows.map(toAdminBooking), total, page: pg.page, pageSize: pg.pageSize };
  });
}

export async function getAdminBooking(session: Session, bookingId: string): Promise<AdminBookingDetailDTO | null> {
  const id = parse(zUuid, bookingId);
  return asAdmin(session, async (tx) => {
    const [r] = await tx<Array<AdminBookingRow & {
      customerId: string; customerEmail: string; providerId: string; bookingMode: "instant" | "request"; addressLine: string; postalCode: string;
      addressDetails: string | null; customerNotes: string | null; servicePriceCents: number; travelFeeCents: number; serviceFeeCents: number;
      discountCents: number; commissionRate: number; commissionTier: AdminBookingDetailDTO["commissionTier"]; providerPayoutCents: number;
      cancellationFeeCents: number; refundCents: number; cancelledBy: AdminBookingDetailDTO["cancelledBy"]; cancellationReason: string | null;
    }>>`
      select ${tx.unsafe(ADMIN_BOOKING_SELECT)}, b.customer_id, u.email as customer_email, b.provider_id, b.booking_mode, b.address_line,
             b.postal_code, b.address_details, b.customer_notes, b.service_price_cents, b.travel_fee_cents, b.service_fee_cents,
             b.discount_cents, b.commission_rate::float8 as commission_rate, b.commission_tier, b.provider_payout_cents,
             b.cancellation_fee_cents, b.refund_cents, b.cancelled_by, b.cancellation_reason
      from public.bookings b
      join public.profiles cp on cp.id = b.customer_id join auth.users u on u.id = b.customer_id
      join public.providers pr on pr.id = b.provider_id
      where b.id = ${id}`;
    if (!r) return null;
    const [payment] = await tx<Array<{ provider: "dev" | "stripe"; status: AdminPaymentDTO["status"]; amountCents: number; capturedCents: number; refundedCents: number; cardBrand: string | null; cardLast4: string | null; externalId: string | null; applicationFeeCents: number }>>`
      select provider, status, amount_cents, captured_cents, refunded_cents, card_brand, card_last4, external_id, application_fee_cents from public.payments where booking_id = ${id}`;
    const refunds = await tx<Array<{ id: string; amountCents: number; reason: string; status: string; createdAt: Date }>>`
      select id, amount_cents, reason, status, created_at from public.refunds where booking_id = ${id} order by created_at`;
    const events = await tx<Array<{ fromStatus: BookingStatus | null; toStatus: BookingStatus; actorRole: AdminBookingDetailDTO["events"][number]["actorRole"]; note: string | null; createdAt: Date }>>`
      select from_status, to_status, actor_role, note, created_at from public.booking_events where booking_id = ${id} order by created_at`;
    const disputes = await tx<Array<{ id: string; bookingId: string; reason: AdminDisputeDTO["reason"]; description: string; status: DisputeStatus; refundCents: number; resolutionNote: string | null; createdAt: Date; resolvedAt: Date | null }>>`
      select id, booking_id, reason, description, status, refund_cents, resolution_note, created_at, resolved_at from public.disputes where booking_id = ${id} order by created_at`;
    return {
      ...toAdminBooking(r),
      customerId: r.customerId, customerEmail: r.customerEmail, providerId: r.providerId, bookingMode: r.bookingMode, endsAt: r.endsAt.toISOString(),
      addressLine: r.addressLine, postalCode: r.postalCode, addressDetails: r.addressDetails, notes: r.customerNotes,
      price: { servicePriceCents: r.servicePriceCents, travelFeeCents: r.travelFeeCents, serviceFeeCents: r.serviceFeeCents, discountCents: r.discountCents, totalCents: r.totalCents },
      commissionRate: r.commissionRate, commissionTier: r.commissionTier, providerPayoutCents: r.providerPayoutCents,
      cancellationFeeCents: r.cancellationFeeCents, refundCents: r.refundCents, cancelledBy: r.cancelledBy, cancellationReason: r.cancellationReason,
      payment: payment ?? null,
      refunds: refunds.map((x) => ({ ...x, createdAt: x.createdAt.toISOString() })),
      events: events.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
      disputes: disputes.map((d) => ({ ...d, bookingReference: r.reference, createdAt: d.createdAt.toISOString(), resolvedAt: iso(d.resolvedAt) })),
    };
  });
}

/** Admin cancellation with an explicit fee (default 0 = full refund). */
export async function adminCancelBooking(session: Session, bookingId: string, reason: string, feeCents = 0): Promise<{ status: BookingStatus; feeCents: number }> {
  const v = parse(z.object({ bookingId: zUuid, reason: z.string().trim().min(3, "Bitte einen Grund angeben.").max(500), feeCents: z.number().int().min(0) }), { bookingId, reason, feeCents });
  const ops: Array<PaymentOp | null> = [];
  const out = await asAdmin(session, async (tx, admin) => {
    const b = await lockBooking(tx, v.bookingId);
    if (!b) throw new ServiceError("not_found", "Buchung nicht gefunden.");
    const r = await cancelInTx(tx, b, { actor: "admin", actorId: admin.userId, reason: v.reason, feeOverrideCents: v.feeCents });
    ops.push(r.op);
    await audit(tx, admin.userId, "booking.admin_cancel", "booking", b.id, { reason: v.reason, feeCents: r.outcome.feeCents });
    return { status: "cancelled" as const, feeCents: r.outcome.feeCents };
  });
  await runPaymentOps(ops);
  return out;
}

async function refundInTx(tx: Tx, adminId: string, bookingId: string, amountCents: number, reason: string): Promise<{ refundId: string }> {
  const [p] = await tx<{ id: string; provider: "dev" | "stripe"; status: string; capturedCents: number; refundedCents: number; externalId: string | null }[]>`
    select id, provider, status, captured_cents, refunded_cents, external_id from public.payments where booking_id = ${bookingId} for update`;
  if (!p || !["captured", "partially_refunded"].includes(p.status)) throw new ServiceError("invalid_state", "Für diese Buchung gibt es keine erstattbare Zahlung.");
  const refundable = p.capturedCents - p.refundedCents;
  if (amountCents > refundable) throw new ServiceError("validation", `Es können höchstens ${(refundable / 100).toFixed(2).replace(".", ",")} € erstattet werden.`);
  const provider = p.provider === "stripe" ? createStripePaymentProvider() : createDevPaymentProvider();
  const ext = p.externalId ? await provider.refund(p.externalId, amountCents) : { externalId: null };
  const [row] = await tx<{ id: string }[]>`
    insert into public.refunds (payment_id, booking_id, amount_cents, reason, status, external_id, created_by)
    values (${p.id}, ${bookingId}, ${amountCents}, ${reason}, 'succeeded', ${ext.externalId}, ${adminId}) returning id`;
  const newRefunded = p.refundedCents + amountCents;
  await tx`update public.payments set refunded_cents = ${newRefunded}, status = ${newRefunded >= p.capturedCents ? "refunded" : "partially_refunded"} where id = ${p.id}`;
  // Refunds reduce commission and provider share proportionally.
  await tx`
    update public.bookings set refund_cents = refund_cents + ${amountCents},
      commission_cents = greatest(0, commission_cents - round(${amountCents}::numeric * commission_cents / nullif(commission_cents + provider_payout_cents, 0))::int),
      provider_payout_cents = greatest(0, provider_payout_cents - (${amountCents} - round(${amountCents}::numeric * commission_cents / nullif(commission_cents + provider_payout_cents, 0))::int))
    where id = ${bookingId}`;
  await audit(tx, adminId, "payment.refund", "booking", bookingId, { amountCents, reason, refundId: row.id });
  return { refundId: row.id };
}

export async function refundPayment(session: Session, bookingId: string, amountCents: number, reason: string): Promise<{ refundId: string }> {
  const v = parse(z.object({ bookingId: zUuid, amountCents: z.number().int().min(1, "Betrag muss größer als 0 sein."), reason: z.string().trim().min(3).max(500) }), { bookingId, amountCents, reason });
  return asAdmin(session, (tx, admin) => refundInTx(tx, admin.userId, v.bookingId, v.amountCents, v.reason));
}

export async function listDisputes(session: Session, opts: { status?: DisputeStatus } = {}): Promise<AdminDisputeDTO[]> {
  const st = opts.status ? parse(z.enum(["open", "investigating", "resolved_refund", "resolved_no_action", "closed"]), opts.status) : null;
  return asAdmin(session, async (tx) => {
    const rows = await tx<Array<{ id: string; bookingId: string; bookingReference: string; reason: AdminDisputeDTO["reason"]; description: string; status: DisputeStatus; refundCents: number; resolutionNote: string | null; createdAt: Date; resolvedAt: Date | null; customerName: string; providerName: string; bookingTotalCents: number; openedByRole: AppRole }>>`
      select d.id, d.booking_id, b.reference as booking_reference, d.reason, d.description, d.status, d.refund_cents, d.resolution_note,
             d.created_at, d.resolved_at, trim(coalesce(cp.first_name, '') || ' ' || coalesce(cp.last_name, '')) as customer_name,
             pr.display_name as provider_name, b.total_cents as booking_total_cents, op.role as opened_by_role
      from public.disputes d join public.bookings b on b.id = d.booking_id join public.profiles cp on cp.id = b.customer_id
      join public.providers pr on pr.id = b.provider_id join public.profiles op on op.id = d.opened_by
      ${st ? tx`where d.status = ${st}` : tx``}
      order by case when d.status in ('open', 'investigating') then 0 else 1 end, d.created_at desc limit 200`;
    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), resolvedAt: iso(r.resolvedAt) }));
  });
}

export async function updateDisputeStatus(session: Session, disputeId: string, status: "investigating" | "closed", note?: string): Promise<void> {
  const v = parse(z.object({ disputeId: zUuid, status: z.enum(["investigating", "closed"]), note: z.string().trim().max(2000).optional() }), { disputeId, status, note });
  await asAdmin(session, async (tx, admin) => {
    const rows = await tx`update public.disputes set status = ${v.status}, resolution_note = coalesce(${v.note ?? null}, resolution_note),
      resolved_by = case when ${v.status} = 'closed' then ${admin.userId}::uuid else resolved_by end,
      resolved_at = case when ${v.status} = 'closed' then now() else resolved_at end
      where id = ${v.disputeId} returning id`;
    if (!rows.length) throw new ServiceError("not_found", "Streitfall nicht gefunden.");
    await audit(tx, admin.userId, `dispute.${v.status}`, "dispute", v.disputeId, { note: v.note ?? null });
  });
}

/** Resolve with a (partial) refund or without action; notifies both parties. */
export async function resolveDispute(session: Session, disputeId: string, outcome: "refund" | "no_action", note: string, refundCents = 0): Promise<void> {
  const v = parse(z.object({ disputeId: zUuid, outcome: z.enum(["refund", "no_action"]), note: z.string().trim().min(5, "Bitte die Entscheidung begründen.").max(2000), refundCents: z.number().int().min(0) })
    .refine((x) => x.outcome === "no_action" || x.refundCents > 0, { message: "Bitte einen Erstattungsbetrag angeben.", path: ["refundCents"] }), { disputeId, outcome, note, refundCents });
  await asAdmin(session, async (tx, admin) => {
    const [d] = await tx<{ bookingId: string; status: DisputeStatus }[]>`select booking_id, status from public.disputes where id = ${v.disputeId} for update`;
    if (!d) throw new ServiceError("not_found", "Streitfall nicht gefunden.");
    if (!["open", "investigating"].includes(d.status)) throw new ServiceError("invalid_state", "Dieser Streitfall ist bereits abgeschlossen.");
    if (v.outcome === "refund") await refundInTx(tx, admin.userId, d.bookingId, v.refundCents, `Streitfall: ${v.note}`);
    await tx`update public.disputes set status = ${v.outcome === "refund" ? "resolved_refund" : "resolved_no_action"}, refund_cents = ${v.outcome === "refund" ? v.refundCents : 0},
      resolution_note = ${v.note}, resolved_by = ${admin.userId}, resolved_at = now() where id = ${v.disputeId}`;
    await audit(tx, admin.userId, "dispute.resolve", "dispute", v.disputeId, { outcome: v.outcome, refundCents: v.refundCents });
    await notify(tx, "dispute.resolved", { disputeId: v.disputeId, note: v.note });
  });
}

// ---------------------------------------------------------------------------
// Commission rules (versioned: a new rule deactivates the previous one for the same target)
// ---------------------------------------------------------------------------
export async function listCommissionRules(session: Session, opts: { includeInactive?: boolean } = {}): Promise<CommissionRuleDTO[]> {
  return asAdmin(session, async (tx) => {
    const rows = await tx<Array<Omit<CommissionRuleDTO, "updatedAt"> & { updatedAt: Date }>>`
      select r.id, r.scope, r.category_id, c.name as category_name, r.provider_id, p.display_name as provider_name,
             r.rate::float8 as rate, r.repeat_client_rate::float8 as repeat_client_rate, r.own_client_rate::float8 as own_client_rate,
             r.is_active, r.updated_at
      from public.commission_rules r left join public.categories c on c.id = r.category_id left join public.providers p on p.id = r.provider_id
      ${opts.includeInactive ? tx`` : tx`where r.is_active`}
      order by r.is_active desc, case r.scope when 'global' then 0 when 'category' then 1 else 2 end, r.updated_at desc`;
    return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
  });
}

const RuleSchema = z.object({
  scope: z.enum(["global", "category", "provider"]),
  categoryId: zUuid.nullable().optional(),
  providerId: zUuid.nullable().optional(),
  rate: z.number().min(0).max(0.5),
  repeatClientRate: z.number().min(0).max(0.5),
  ownClientRate: z.number().min(0).max(0.5),
}).refine((r) => (r.scope === "category" ? !!r.categoryId : true) && (r.scope === "provider" ? !!r.providerId : true), { message: "Bitte Kategorie bzw. Profi wählen.", path: ["scope"] });

export async function createCommissionRule(session: Session, input: z.input<typeof RuleSchema>): Promise<{ id: string }> {
  const v = parse(RuleSchema, input);
  const categoryId = v.scope === "category" ? v.categoryId ?? null : null;
  const providerId = v.scope === "provider" ? v.providerId ?? null : null;
  return asAdmin(session, async (tx, admin) => {
    await tx`update public.commission_rules set is_active = false
      where is_active and scope = ${v.scope}
        and category_id is not distinct from ${categoryId}::uuid and provider_id is not distinct from ${providerId}::uuid`;
    const [row] = await tx<{ id: string }[]>`
      insert into public.commission_rules (scope, category_id, provider_id, rate, repeat_client_rate, own_client_rate, is_active, created_by)
      values (${v.scope}, ${categoryId}, ${providerId}, ${v.rate}, ${v.repeatClientRate}, ${v.ownClientRate}, true, ${admin.userId}) returning id`;
    await audit(tx, admin.userId, "commission.create", "commission_rule", row.id, { ...v });
    return { id: row.id };
  });
}

export async function deactivateCommissionRule(session: Session, ruleId: string): Promise<void> {
  const id = parse(zUuid, ruleId);
  await asAdmin(session, async (tx, admin) => {
    const [r] = await tx<{ scope: string }[]>`select scope from public.commission_rules where id = ${id}`;
    if (!r) throw new ServiceError("not_found", "Regel nicht gefunden.");
    if (r.scope === "global") throw new ServiceError("validation", "Die globale Regel kann nur ersetzt, nicht deaktiviert werden.");
    await tx`update public.commission_rules set is_active = false where id = ${id}`;
    await audit(tx, admin.userId, "commission.deactivate", "commission_rule", id);
  });
}

// ---------------------------------------------------------------------------
// Payments & payouts
// ---------------------------------------------------------------------------
export async function listPayments(session: Session, opts: { page?: number; pageSize?: number } = {}): Promise<Paginated<AdminPaymentDTO>> {
  const pg = paging(opts.page, opts.pageSize, 25);
  return asAdmin(session, async (tx) => {
    const rows = await tx<Array<Omit<AdminPaymentDTO, "createdAt"> & { createdAt: Date }>>`
      select p.id, p.booking_id, b.reference as booking_reference, p.provider, p.status, p.amount_cents, p.captured_cents, p.refunded_cents,
             p.application_fee_cents, p.created_at
      from public.payments p join public.bookings b on b.id = p.booking_id order by p.created_at desc limit ${pg.pageSize} offset ${pg.offset}`;
    const [{ total }] = await tx<{ total: number }[]>`select count(*)::int as total from public.payments`;
    return { items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, page: pg.page, pageSize: pg.pageSize };
  });
}

async function queryPayouts(tx: Queryable, where: Fragment, limit: number): Promise<PayoutDTO[]> {
  const rows = await tx<Array<Omit<PayoutDTO, "periodStart" | "periodEnd" | "paidAt" | "createdAt"> & { periodStart: Date | null; periodEnd: Date | null; paidAt: Date | null; createdAt: Date }>>`
    select po.id, po.provider_id, pr.display_name as provider_name, po.amount_cents, po.status, po.period_start, po.period_end, po.paid_at, po.created_at,
           (select count(*)::int from public.bookings b where b.payout_id = po.id) as booking_count
    from public.payouts po join public.providers pr on pr.id = po.provider_id ${where}
    order by po.created_at desc limit ${limit}`;
  return rows.map((r) => ({ ...r, periodStart: iso(r.periodStart), periodEnd: iso(r.periodEnd), paidAt: iso(r.paidAt), createdAt: r.createdAt.toISOString() }));
}

export async function listPayouts(session: Session, opts: { status?: PayoutDTO["status"] } = {}): Promise<PayoutDTO[]> {
  const st = opts.status ? parse(z.enum(["pending", "in_transit", "paid", "failed"]), opts.status) : null;
  return asAdmin(session, (tx) => queryPayouts(tx, st ? tx`where po.status = ${st}` : tx``, 200));
}

/**
 * Payout batch: per provider, all bookings that are payable — completed (or
 * cancelled/no-show with a retained fee) at least payout_hold_hours (48 h) ago,
 * not yet in a payout and without an open dispute.
 */
export async function createPayoutBatch(session: Session): Promise<{ payouts: PayoutDTO[]; totalCents: number; bookingCount: number }> {
  return asAdmin(session, async (tx, admin) => {
    const settings = await loadSettings(tx);
    const eligible = await tx<{ id: string; providerId: string; providerPayoutCents: number; doneAt: Date }[]>`
      select b.id, b.provider_id, b.provider_payout_cents, coalesce(b.completed_at, b.cancelled_at) as done_at
      from public.bookings b
      where b.payout_id is null and b.provider_payout_cents > 0
        and (b.status = 'completed' or (b.status in ('cancelled', 'no_show') and b.cancellation_fee_cents > 0))
        and coalesce(b.completed_at, b.cancelled_at) <= now() - make_interval(hours => ${settings.payoutHoldHours})
        and not exists (select 1 from public.disputes d where d.booking_id = b.id and d.status in ('open', 'investigating'))
      for update of b skip locked`;
    type Eligible = (typeof eligible)[number];
    const byProvider = new Map<string, Eligible[]>();
    for (const e of eligible) byProvider.set(e.providerId, [...(byProvider.get(e.providerId) ?? []), e]);
    const ids: string[] = [];
    let totalCents = 0;
    for (const [providerId, list] of byProvider) {
      const amount = list.reduce((a, b) => a + b.providerPayoutCents, 0);
      const times = list.map((b) => b.doneAt.getTime());
      const [po] = await tx<{ id: string }[]>`
        insert into public.payouts (provider_id, amount_cents, status, period_start, period_end, created_by)
        values (${providerId}, ${amount}, 'pending', ${new Date(Math.min(...times))}, ${new Date(Math.max(...times))}, ${admin.userId}) returning id`;
      await tx`update public.bookings set payout_id = ${po.id} where id = any(${list.map((b) => b.id)}::uuid[])`;
      ids.push(po.id);
      totalCents += amount;
    }
    await audit(tx, admin.userId, "payout.batch", "payout", null, { payouts: ids.length, totalCents, bookings: eligible.length });
    const payouts = ids.length ? await queryPayouts(tx, tx`where po.id = any(${ids}::uuid[])`, 500) : [];
    return { payouts, totalCents, bookingCount: eligible.length };
  });
}

export async function markPayoutPaid(session: Session, payoutId: string): Promise<void> {
  const id = parse(zUuid, payoutId);
  await asAdmin(session, async (tx, admin) => {
    const [p] = await tx<{ providerId: string; amountCents: number }[]>`
      update public.payouts set status = 'paid', paid_at = now(), external_id = coalesce(external_id, ${`${getPaymentProvider().id}_po_${id.slice(0, 8)}`})
      where id = ${id} and status in ('pending', 'in_transit') returning provider_id, amount_cents`;
    if (!p) throw new ServiceError("invalid_state", "Diese Auszahlung ist nicht offen.");
    await audit(tx, admin.userId, "payout.paid", "payout", id, { amountCents: p.amountCents });
    await notify(tx, "payout.paid", { providerId: p.providerId, amountCents: p.amountCents });
  });
}

// ---------------------------------------------------------------------------
// Content, settings, reviews, audit, waitlist
// ---------------------------------------------------------------------------
export async function listContentBlocks(session: Session): Promise<ContentBlockDTO[]> {
  return asAdmin(session, async (tx) =>
    (await tx<{ key: string; value: unknown; updatedAt: Date }[]>`select key, value, updated_at from public.content_blocks order by key`)
      .map((r) => ({ key: r.key, value: r.value, updatedAt: r.updatedAt.toISOString() })),
  );
}

export async function upsertContentBlock(session: Session, key: string, value: unknown): Promise<void> {
  const v = parse(z.object({ key: z.string().trim().regex(/^[a-z0-9_.-]{2,80}$/, "Ungültiger Schlüssel."), value: z.json() }), { key, value });
  await asAdmin(session, async (tx, admin) => {
    await tx`
      insert into public.content_blocks (key, value, updated_by, updated_at) values (${v.key}, ${tx.json(v.value as Parameters<typeof tx.json>[0])}, ${admin.userId}, now())
      on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now()`;
    await audit(tx, admin.userId, "content.upsert", "content_block", v.key);
  });
}

const SETTING_SCHEMAS: Record<string, z.ZodType> = {
  hold_minutes: z.number().int().min(5).max(60),
  request_response_hours: z.number().int().min(1).max(48),
  slot_step_minutes: z.number().int().refine((n) => [15, 30, 60].includes(n), "15, 30 oder 60."),
  referral_reward_cents: z.number().int().min(0).max(10_000),
  referral_welcome_cents: z.number().int().min(0).max(10_000),
  customer_service_fee_cents: z.number().int().min(0).max(1_000),
  review_window_days: z.number().int().min(1).max(60),
  dispute_window_hours: z.number().int().min(1).max(720),
  payout_hold_hours: z.number().int().min(0).max(720),
  auto_complete_hours: z.number().int().min(1).max(168),
  search_days_ahead: z.number().int().min(1).max(14),
  coverage_min_providers: z.number().int().min(1).max(50),
  cancellation_policy: z.object({
    tiers: z
      .array(z.object({ min_hours_before: z.number().min(0).max(168), fee_percent: z.number().min(0).max(100), travel_fee_retained: z.boolean().default(false) }))
      .min(1)
      .max(6),
    no_show_fee_percent: z.number().min(0).max(100),
    provider_cancellation: z.literal("full_refund"),
    grace_minutes: z.number().int().min(0).max(120).default(15),
    fee_basis: z.literal("service_price").default("service_price"),
  }),
  base_required_documents: z.array(z.object({ kind: z.enum(["id_document", "business_registration", "qualification", "insurance", "other"]), label: z.string().min(3).max(160) })).max(10),
};

/** Platform settings (new bookings snapshot the cancellation policy; existing ones keep theirs). */
export async function updatePlatformSetting(session: Session, key: string, value: unknown): Promise<void> {
  const schema = SETTING_SCHEMAS[key];
  if (!schema) throw new ServiceError("validation", "Unbekannte Einstellung.");
  const v = parse(schema, value);
  await asAdmin(session, async (tx, admin) => {
    await tx`
      insert into public.platform_settings (key, value, updated_by, updated_at) values (${key}, ${tx.json(JSON.parse(JSON.stringify(v)))}, ${admin.userId}, now())
      on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now()`;
    await audit(tx, admin.userId, "setting.update", "platform_setting", key, { value: v });
  });
}

export async function listPlatformSettings(session: Session): Promise<Array<{ key: string; value: unknown; updatedAt: string }>> {
  return asAdmin(session, async (tx) =>
    (await tx<{ key: string; value: unknown; updatedAt: Date }[]>`select key, value, updated_at from public.platform_settings order by key`)
      .map((r) => ({ key: r.key, value: r.value, updatedAt: r.updatedAt.toISOString() })),
  );
}

export async function moderateReview(session: Session, reviewId: string, isPublished: boolean, note?: string): Promise<void> {
  const id = parse(zUuid, reviewId);
  await asAdmin(session, async (tx, admin) => {
    const rows = await tx`update public.reviews set is_published = ${isPublished} where id = ${id} returning id`;
    if (!rows.length) throw new ServiceError("not_found", "Bewertung nicht gefunden.");
    await audit(tx, admin.userId, isPublished ? "review.publish" : "review.unpublish", "review", id, { note: note ?? null });
  });
}

export async function listAuditLog(session: Session, opts: { entity?: string; page?: number; pageSize?: number } = {}): Promise<Paginated<AuditLogEntryDTO>> {
  const entity = opts.entity ? parse(z.string().trim().max(60), opts.entity) : null;
  const pg = paging(opts.page, opts.pageSize, 50);
  return asAdmin(session, async (tx) => {
    const rows = await tx<Array<Omit<AuditLogEntryDTO, "createdAt"> & { createdAt: Date }>>`
      select a.id, a.actor_id, trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) as actor_name, a.action, a.entity, a.entity_id, a.data, a.created_at
      from public.audit_log a left join public.profiles p on p.id = a.actor_id
      ${entity ? tx`where a.entity = ${entity}` : tx``}
      order by a.created_at desc limit ${pg.pageSize} offset ${pg.offset}`;
    const [{ total }] = await tx<{ total: number }[]>`select count(*)::int as total from public.audit_log ${entity ? tx`where entity = ${entity}` : tx``}`;
    return { items: rows.map((r) => ({ ...r, actorName: r.actorName || null, createdAt: r.createdAt.toISOString() })), total, page: pg.page, pageSize: pg.pageSize };
  });
}

export async function listWaitlist(session: Session, opts: { citySlug?: string } = {}): Promise<Array<{ id: string; email: string; postalCode: string; citySlug: string | null; categoryName: string | null; createdAt: string; notifiedAt: string | null }>> {
  const city = opts.citySlug ? parse(z.string().trim().max(40), opts.citySlug) : null;
  return asAdmin(session, async (tx) =>
    (await tx<Array<{ id: string; email: string; postalCode: string; citySlug: string | null; categoryName: string | null; createdAt: Date; notifiedAt: Date | null }>>`
      select w.id, w.email::text as email, w.postal_code, w.city_slug, c.name as category_name, w.created_at, w.notified_at
      from public.waitlist_signups w left join public.categories c on c.id = w.category_id
      ${city ? tx`where w.city_slug = ${city}` : tx``}
      order by w.created_at desc limit 500`).map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), notifiedAt: iso(r.notifiedAt) })),
  );
}

