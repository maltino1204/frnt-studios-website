import "server-only";

import { withService, type Queryable, type Tx } from "../db/client";
import { rethrowDb } from "../db/errors";
import type {
  ActorRole,
  AddressDTO,
  AnonymizeResultDTO,
  AppRole,
  BookingStatus,
  CreditReason,
  DisputeReason,
  DisputeStatus,
  DocumentKind,
  DocumentStatus,
  NotificationPreferencesDTO,
  PaymentStatus,
  ProviderStatus,
  Session,
  UserDataExportDTO,
} from "../dto";
import { assertNotDemoAccount } from "../auth/demo-accounts";
import { ServiceError } from "../errors";
import { assertAdmin, audit, CREDIT_REASON_LABELS, iso, isoReq, parse, requireRoleIn, zUuid } from "./_shared";
import { deleteStoredFile } from "./media";

/**
 * DSGVO tooling (audit-1 R20):
 *  - data export (Art. 15 / 20): everything stored about one account as JSON;
 *  - anonymisation (Art. 17): removes names, phone, avatar, addresses, the login
 *    and all sessions. Bookings, payments, reviews and the credit ledger stay for
 *    accounting (§ 147 AO, § 257 HGB) with the personal booking snapshot scrubbed
 *    (address line, details, notes, coordinates).
 *
 * withService is used throughout: auth.users / app_private.* are not reachable by
 * API roles, and every function is scoped to exactly one user id that was either
 * taken from the caller's own session or authorised by assertAdmin().
 */

const ACTIVE_STATUSES: BookingStatus[] = ["pending_payment", "requested", "confirmed", "in_progress"];
export const ANONYMIZED_ADDRESS_LINE = "Anonymisiert";

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
export async function buildUserExport(tx: Queryable, userId: string): Promise<UserDataExportDTO> {
  const [p] = await tx<Array<{
    id: string; email: string; role: AppRole; firstName: string | null; lastName: string | null; phone: string | null; referralCode: string;
    marketingOptIn: boolean; createdAt: Date; blockedAt: Date | null; anonymizedAt: Date | null;
  }>>`
    select p.id, u.email, p.role, p.first_name, p.last_name, p.phone, p.referral_code, p.marketing_opt_in, p.created_at, p.blocked_at, p.anonymized_at
    from public.profiles p join auth.users u on u.id = p.id where p.id = ${userId}`;
  if (!p) throw new ServiceError("not_found", "Nutzer nicht gefunden.");

  const [prefs] = await tx<NotificationPreferencesDTO[]>`
    select email_bookings, email_reminders, email_marketing, sms_reminders, push_bookings from public.notification_preferences where user_id = ${userId}`;
  const addresses = await tx<AddressDTO[]>`
    select id, label, kind, street, house_number, postal_code, city, details, is_default from public.addresses where user_id = ${userId} order by created_at`;
  const bookings = await tx<Array<{
    reference: string; status: BookingStatus; serviceName: string; providerName: string; startsAt: Date; endsAt: Date; addressLine: string; postalCode: string;
    city: string; addressDetails: string | null; customerNotes: string | null; servicePriceCents: number; travelFeeCents: number; serviceFeeCents: number;
    discountCents: number; totalCents: number; cancellationFeeCents: number; refundCents: number; cancelledBy: ActorRole | null; cancellationReason: string | null;
    createdAt: Date; payStatus: PaymentStatus | null; amountCents: number | null; capturedCents: number | null; refundedCents: number | null;
    cardBrand: string | null; cardLast4: string | null;
  }>>`
    select b.reference, b.status, b.service_name, pr.display_name as provider_name, b.starts_at, b.ends_at, b.address_line, b.postal_code, b.city,
           b.address_details, b.customer_notes, b.service_price_cents, b.travel_fee_cents, b.service_fee_cents, b.discount_cents, b.total_cents,
           b.cancellation_fee_cents, b.refund_cents, b.cancelled_by, b.cancellation_reason, b.created_at,
           pay.status as pay_status, pay.amount_cents, pay.captured_cents, pay.refunded_cents, pay.card_brand, pay.card_last4
    from public.bookings b
    join public.providers pr on pr.id = b.provider_id
    left join public.payments pay on pay.booking_id = b.id
    where b.customer_id = ${userId}
    order by b.starts_at desc`;
  const reviews = await tx<Array<{ reference: string; providerName: string; rating: number; comment: string | null; tags: string[]; providerReply: string | null; isPublished: boolean; createdAt: Date }>>`
    select b.reference, pr.display_name as provider_name, r.rating, r.comment, r.tags, r.provider_reply, r.is_published, r.created_at
    from public.reviews r join public.bookings b on b.id = r.booking_id join public.providers pr on pr.id = r.provider_id
    where r.customer_id = ${userId} order by r.created_at desc`;
  const credits = await tx<Array<{ amountCents: number; reason: CreditReason; note: string | null; createdAt: Date }>>`
    select amount_cents, reason, note, created_at from public.credit_ledger where user_id = ${userId} order by created_at desc`;
  const referrals = await tx<Array<{ role: "referrer" | "referred"; status: string; createdAt: Date }>>`
    select case when referrer_id = ${userId} then 'referrer' else 'referred' end as role, status::text as status, created_at
    from public.referrals where referrer_id = ${userId} or referred_id = ${userId} order by created_at desc`;
  const favorites = await tx<Array<{ providerName: string; createdAt: Date }>>`
    select pr.display_name as provider_name, f.created_at from public.favorites f join public.providers pr on pr.id = f.provider_id
    where f.customer_id = ${userId} order by f.created_at desc`;
  const disputes = await tx<Array<{ reference: string; reason: DisputeReason; status: DisputeStatus; description: string; createdAt: Date }>>`
    select b.reference, d.reason, d.status, d.description, d.created_at
    from public.disputes d join public.bookings b on b.id = d.booking_id
    where d.opened_by = ${userId} order by d.created_at desc`;
  const notifications = await tx<Array<{ type: string; title: string; body: string | null; readAt: Date | null; createdAt: Date }>>`
    select type, title, body, read_at, created_at from public.notifications where user_id = ${userId} order by created_at desc limit 500`;

  let provider: UserDataExportDTO["provider"] = null;
  if (p.role === "provider") {
    const [pr] = await tx<Array<{ slug: string; displayName: string; headline: string | null; bio: string | null; status: ProviderStatus; basePostalCode: string | null }>>`
      select slug, display_name, headline, bio, status, base_postal_code from public.providers where id = ${userId}`;
    if (pr) {
      const documents = await tx<Array<{ kind: DocumentKind; status: DocumentStatus; fileName: string | null; createdAt: Date }>>`
        select kind, status, file_name, created_at from public.provider_documents where provider_id = ${userId} order by created_at`;
      const payouts = await tx<Array<{ amountCents: number; status: string; createdAt: Date }>>`
        select amount_cents, status::text as status, created_at from public.payouts where provider_id = ${userId} order by created_at desc`;
      provider = {
        ...pr,
        documents: documents.map((d) => ({ ...d, createdAt: isoReq(d.createdAt) })),
        payouts: payouts.map((x) => ({ ...x, createdAt: isoReq(x.createdAt) })),
      };
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    format: "soma-user-export/v1",
    profile: {
      userId: p.id, email: p.email, role: p.role, firstName: p.firstName, lastName: p.lastName, phone: p.phone, referralCode: p.referralCode,
      marketingOptIn: p.marketingOptIn, createdAt: isoReq(p.createdAt), blockedAt: iso(p.blockedAt), anonymizedAt: iso(p.anonymizedAt),
    },
    notificationPreferences: prefs ?? null,
    addresses,
    bookings: bookings.map((b) => ({
      reference: b.reference, status: b.status, serviceName: b.serviceName, providerName: b.providerName, startsAt: isoReq(b.startsAt), endsAt: isoReq(b.endsAt),
      address: { line: b.addressLine, postalCode: b.postalCode, city: b.city, details: b.addressDetails },
      notes: b.customerNotes, servicePriceCents: b.servicePriceCents, travelFeeCents: b.travelFeeCents, serviceFeeCents: b.serviceFeeCents,
      discountCents: b.discountCents, totalCents: b.totalCents, cancellationFeeCents: b.cancellationFeeCents, refundCents: b.refundCents,
      cancelledBy: b.cancelledBy, cancellationReason: b.cancellationReason, createdAt: isoReq(b.createdAt),
      payment: b.payStatus
        ? { status: b.payStatus, amountCents: b.amountCents ?? 0, capturedCents: b.capturedCents ?? 0, refundedCents: b.refundedCents ?? 0, cardBrand: b.cardBrand, cardLast4: b.cardLast4 }
        : null,
    })),
    reviews: reviews.map((r) => ({
      bookingReference: r.reference, providerName: r.providerName, rating: r.rating, comment: r.comment, tags: [...r.tags], providerReply: r.providerReply,
      isPublished: r.isPublished, createdAt: isoReq(r.createdAt),
    })),
    credits: {
      balanceCents: credits.reduce((sum, c) => sum + c.amountCents, 0),
      entries: credits.map((c) => ({ amountCents: c.amountCents, reason: c.reason, reasonLabel: CREDIT_REASON_LABELS[c.reason] ?? c.reason, note: c.note, createdAt: isoReq(c.createdAt) })),
    },
    referrals: referrals.map((r) => ({ ...r, createdAt: isoReq(r.createdAt) })),
    favorites: favorites.map((f) => ({ ...f, createdAt: isoReq(f.createdAt) })),
    disputes: disputes.map((d) => ({ bookingReference: d.reference, reason: d.reason, status: d.status, description: d.description, createdAt: isoReq(d.createdAt) })),
    notifications: notifications.map((n) => ({ ...n, readAt: iso(n.readAt), createdAt: isoReq(n.createdAt) })),
    provider,
  };
}

export function exportFileName(userId: string, now = new Date()): string {
  return `soma-datenexport-${now.toISOString().slice(0, 10)}-${userId.slice(0, 8)}.json`;
}

/** Customer / provider: own data export. */
export async function exportMyData(session: Session): Promise<UserDataExportDTO> {
  const s = requireRoleIn(session, "customer", "provider");
  // withService: the export reads auth.users (e-mail) — scoped to the caller's own user id.
  return withService(async (tx) => {
    const data = await buildUserExport(tx, s.userId);
    await audit(tx, s.userId, "user.export", "profile", s.userId, { by: "self" });
    return data;
  }).catch(rethrowDb);
}

/** Admin: export for one user (audited). */
export async function exportUserData(session: Session, userId: string): Promise<UserDataExportDTO> {
  const id = parse(zUuid, userId);
  // withService: admin use case, authorised by assertAdmin() in the same transaction.
  return withService(async (tx) => {
    const admin = await assertAdmin(tx, session);
    const data = await buildUserExport(tx, id);
    await audit(tx, admin.userId, "user.export", "profile", id, { by: "admin" });
    return data;
  }).catch(rethrowDb);
}

// ---------------------------------------------------------------------------
// Anonymisation
// ---------------------------------------------------------------------------
interface BlockerFacts {
  role: AppRole;
  anonymizedAt: Date | null;
  activeBookings: number;
  openDisputes: number;
}

async function blockerFacts(tx: Queryable, userId: string): Promise<BlockerFacts | null> {
  const [row] = await tx<BlockerFacts[]>`
    select p.role, p.anonymized_at,
           (select count(*)::int from public.bookings b where (b.customer_id = p.id or b.provider_id = p.id) and b.status = any(${ACTIVE_STATUSES}::public.booking_status[])) as active_bookings,
           (select count(*)::int from public.disputes d join public.bookings b on b.id = d.booking_id
             where (b.customer_id = p.id or b.provider_id = p.id) and d.status in ('open', 'investigating')) as open_disputes
    from public.profiles p where p.id = ${userId}`;
  return row ?? null;
}

/** Neutral (admin) reasons why the account cannot be anonymised now; empty = possible. */
export function anonymizeBlockersFrom(f: BlockerFacts, opts: { isSelf?: boolean } = {}): string[] {
  const out: string[] = [];
  if (f.anonymizedAt) out.push("Das Konto ist bereits anonymisiert.");
  if (f.role === "admin") out.push("Admin-Konten können nicht anonymisiert werden.");
  if (opts.isSelf) out.push("Das eigene Konto kann hier nicht anonymisiert werden.");
  if (f.role === "provider") {
    out.push("Profi-Konten werden wegen Auszahlungen und Aufbewahrungspflichten nicht automatisch anonymisiert. Bitte das Profil sperren und die Löschung manuell abwickeln.");
  }
  if (f.activeBookings > 0) out.push(f.activeBookings === 1 ? "Es gibt noch 1 offene Buchung." : `Es gibt noch ${f.activeBookings} offene Buchungen.`);
  if (f.openDisputes > 0) out.push(f.openDisputes === 1 ? "Es gibt noch 1 offenen Streitfall." : `Es gibt noch ${f.openDisputes} offene Streitfälle.`);
  return out;
}

export async function queryAnonymizeBlockers(tx: Queryable, userId: string, opts: { isSelf?: boolean } = {}): Promise<string[]> {
  const f = await blockerFacts(tx, userId);
  return f ? anonymizeBlockersFrom(f, opts) : ["Nutzer nicht gefunden."];
}

async function tableExists(tx: Queryable, name: string): Promise<boolean> {
  const [{ exists }] = await tx<{ exists: boolean }[]>`select to_regclass(${name}) is not null as exists`;
  return exists;
}

/**
 * Anonymises one account inside the caller's (owner) transaction. The caller has
 * checked the blockers. Returns the storage keys to delete after commit.
 */
async function anonymizeInTx(tx: Tx, userId: string): Promise<AnonymizeResultDTO & { avatarPath: string | null }> {
  const [prev] = await tx<{ email: string; avatarPath: string | null }[]>`
    select u.email, p.avatar_path from public.profiles p join auth.users u on u.id = p.id where p.id = ${userId} for update of p`;
  if (!prev) throw new ServiceError("not_found", "Nutzer nicht gefunden.");
  const now = new Date();

  await tx`
    update public.profiles set
      first_name = null, last_name = null, phone = null, avatar_path = null, marketing_opt_in = false,
      referral_code = 'ANON' || public.random_code(8),
      blocked_at = coalesce(blocked_at, ${now}), anonymized_at = ${now}
    where id = ${userId}`;
  await tx`
    update auth.users set
      email = ${`deleted+${userId}@anonymized.soma.invalid`}, encrypted_password = null,
      raw_user_meta_data = '{}'::jsonb, banned_until = 'infinity', updated_at = now()
    where id = ${userId}`;
  if (await tableExists(tx, "auth.identities")) await tx`delete from auth.identities where user_id = ${userId}`;

  // Sessions and login traces (local adapter tables and Supabase Auth tables, whichever exist).
  if (await tableExists(tx, "app_private.local_sessions")) await tx`delete from app_private.local_sessions where user_id = ${userId}`;
  if (await tableExists(tx, "app_private.password_resets")) await tx`delete from app_private.password_resets where user_id = ${userId}`;
  if (await tableExists(tx, "app_private.login_attempts")) await tx`delete from app_private.login_attempts where email = ${prev.email.toLowerCase()}`;
  if (await tableExists(tx, "auth.refresh_tokens")) await tx`delete from auth.refresh_tokens where user_id::text = ${userId}`;
  if (await tableExists(tx, "auth.sessions")) await tx`delete from auth.sessions where user_id = ${userId}`;

  const addresses = await tx`delete from public.addresses where user_id = ${userId} returning id`;
  await tx`delete from public.favorites where customer_id = ${userId}`;
  await tx`delete from public.notifications where user_id = ${userId}`;
  await tx`delete from public.email_outbox where to_user_id = ${userId}`;
  await tx`delete from public.waitlist_signups where lower(email::text) = ${prev.email.toLowerCase()}`;
  await tx`update public.notification_preferences set email_marketing = false, sms_reminders = false where user_id = ${userId}`;

  // Bookings stay (accounting); the personal snapshot is scrubbed. These columns are not part of the immutable snapshot.
  const scrubbed = await tx`
    update public.bookings set address_line = ${ANONYMIZED_ADDRESS_LINE}, address_details = null, customer_notes = null, lat = null, lng = null
    where customer_id = ${userId} returning id`;

  return { userId, anonymizedAt: now.toISOString(), bookingsScrubbed: scrubbed.length, addressesDeleted: addresses.length, avatarPath: prev.avatarPath };
}

/** Admin: "Konto anonymisieren" (customers only; see blockers). */
export async function anonymizeUser(session: Session, userId: string, reason: string): Promise<AnonymizeResultDTO> {
  const id = parse(zUuid, userId);
  const note = reason.trim();
  if (note.length < 5 || note.length > 500) throw new ServiceError("validation", "Bitte einen Grund angeben (5–500 Zeichen).", { reason: "Bitte einen Grund angeben (5–500 Zeichen)." });
  // withService: admin use case, authorised by assertAdmin() in the same transaction.
  const result = await withService(async (tx) => {
    const admin = await assertAdmin(tx, session);
    await assertNotDemoAccount(id, tx);
    const blockers = await queryAnonymizeBlockers(tx, id, { isSelf: id === admin.userId });
    if (blockers.length) throw new ServiceError("invalid_state", `Anonymisierung nicht möglich. ${blockers.join(" ")}`);
    const r = await anonymizeInTx(tx, id);
    await audit(tx, admin.userId, "user.anonymize", "profile", id, { by: "admin", reason: note, bookingsScrubbed: r.bookingsScrubbed, addressesDeleted: r.addressesDeleted });
    return r;
  }).catch(rethrowDb);
  await deleteStoredFile(result.avatarPath);
  const { avatarPath: _avatar, ...dto } = result;
  return dto;
}

/** Customer-facing blocker texts ("Sie"). */
function customerBlockerMessage(f: BlockerFacts): string | null {
  if (f.anonymizedAt) return "Ihr Konto ist bereits gelöscht.";
  if (f.role !== "customer") return "Bitte wenden Sie sich für die Löschung dieses Kontos an das SOMA-Team.";
  if (f.activeBookings > 0) return "Sie haben noch offene Termine. Bitte stornieren Sie diese zuerst oder warten Sie, bis sie abgeschlossen sind.";
  if (f.openDisputes > 0) return "Zu einem Ihrer Termine läuft noch eine Klärung. Wir löschen Ihr Konto gern, sobald sie abgeschlossen ist.";
  return null;
}

/**
 * Customer: deletes (anonymises) the own account. The caller (Server Action) has
 * re-confirmed the password with the auth adapter and signs the user out afterwards.
 */
export async function anonymizeOwnAccount(session: Session): Promise<AnonymizeResultDTO> {
  const s = requireRoleIn(session, "customer", "provider");
  // withService: deletes the caller's own login, sessions and addresses (auth.*, app_private.*).
  const result = await withService(async (tx) => {
    await assertNotDemoAccount(s.userId, tx);
    const f = await blockerFacts(tx, s.userId);
    if (!f) throw new ServiceError("not_found", "Konto nicht gefunden.");
    const blocked = customerBlockerMessage(f);
    if (blocked) throw new ServiceError("invalid_state", blocked);
    const r = await anonymizeInTx(tx, s.userId);
    await audit(tx, s.userId, "user.anonymize", "profile", s.userId, { by: "self", bookingsScrubbed: r.bookingsScrubbed, addressesDeleted: r.addressesDeleted });
    return r;
  }).catch(rethrowDb);
  await deleteStoredFile(result.avatarPath);
  const { avatarPath: _avatar, ...dto } = result;
  return dto;
}
