import "server-only";

import { z } from "zod";
import { resolveAppUrl } from "../config";
import { withService, withUser, type Queryable } from "../db/client";
import { rethrowDb } from "../db/errors";
import type {
  AddressDTO,
  CreditSummaryDTO,
  DisputeDTO,
  DisputeReason,
  FavoriteDTO,
  NotificationPreferencesDTO,
  ProfileDTO,
  ReferralInfoDTO,
  Session,
} from "../dto";
import { ServiceError } from "../errors";
import { CONTACT_LINT_MESSAGES } from "../domain/content-lint";
import { assertNoContactDetails, CREDIT_REASON_LABELS, loadSettings, mediaUrl, parse, requireRoleIn, zPostalCode, zUuid } from "./_shared";
import { deleteStoredFile, storeUpload, type UploadInput } from "./media";
import { notify } from "./notifications";
import { PROVIDER_CARD_COLUMNS, toProviderCard, type ProviderCardRow } from "./providers";

/**
 * Customer account: profile, addresses, favourites, notification preferences,
 * credits (SOMA-Guthaben), referrals, disputes ("Problem melden").
 * Reads/writes run as the user under RLS unless noted.
 */

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export async function getProfile(session: Session): Promise<ProfileDTO> {
  const s = requireRoleIn(session, "customer", "provider", "admin");
  return withUser(s.userId, async (tx) => {
    const [p] = await tx<{ id: string; role: ProfileDTO["role"]; firstName: string | null; lastName: string | null; phone: string | null; avatarPath: string | null; referralCode: string; marketingOptIn: boolean; createdAt: Date }[]>`
      select id, role, first_name, last_name, phone, avatar_path, referral_code, marketing_opt_in, created_at
      from public.profiles where id = ${s.userId}`;
    if (!p) throw new ServiceError("not_found", "Profil nicht gefunden.");
    return {
      userId: p.id, email: s.email, role: p.role, firstName: p.firstName, lastName: p.lastName, phone: p.phone,
      avatarUrl: mediaUrl(p.avatarPath), referralCode: p.referralCode, marketingOptIn: p.marketingOptIn, createdAt: p.createdAt.toISOString(),
    };
  });
}

const ProfileSchema = z.object({
  firstName: z.string().trim().min(1, "Bitte geben Sie Ihren Vornamen an.").max(80),
  lastName: z.string().trim().min(1, "Bitte geben Sie Ihren Nachnamen an.").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()/-]{6,24}$/, "Bitte geben Sie eine gültige Telefonnummer an.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  marketingOptIn: z.boolean().optional(),
});

export async function updateProfile(session: Session, input: z.input<typeof ProfileSchema>): Promise<ProfileDTO> {
  const s = requireRoleIn(session, "customer", "provider", "admin");
  const v = parse(ProfileSchema, input);
  await withUser(s.userId, (tx) => tx`
    update public.profiles set first_name = ${v.firstName}, last_name = ${v.lastName}, phone = ${v.phone ?? null},
      marketing_opt_in = coalesce(${v.marketingOptIn ?? null}::boolean, marketing_opt_in)
    where id = ${s.userId}`).catch(rethrowDb);
  return getProfile(s);
}

/** Avatar for customers (profiles.avatar_path) and providers (also providers.avatar_path, shown publicly). */
export async function uploadAvatar(session: Session, file: UploadInput): Promise<{ avatarUrl: string }> {
  const s = requireRoleIn(session, "customer", "provider");
  const stored = await storeUpload("avatars", s.userId, file);
  const old = await withUser(s.userId, async (tx) => {
    const [prev] = await tx<{ avatarPath: string | null }[]>`select avatar_path from public.profiles where id = ${s.userId}`;
    await tx`update public.profiles set avatar_path = ${stored.key} where id = ${s.userId}`;
    if (s.role === "provider") await tx`update public.providers set avatar_path = ${stored.key} where id = ${s.userId}`;
    return prev?.avatarPath ?? null;
  });
  await deleteStoredFile(old);
  return { avatarUrl: mediaUrl(stored.key) ?? "" };
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------
const AddressSchema = z.object({
  label: z.string().trim().max(60).optional().transform((v) => v || null),
  kind: z.enum(["home", "hotel", "office", "other"]).default("home"),
  street: z.string().trim().min(2, "Bitte geben Sie die Straße an.").max(120),
  houseNumber: z.string().trim().min(1, "Bitte geben Sie die Hausnummer an.").max(12),
  postalCode: zPostalCode,
  city: z.string().trim().min(2, "Bitte geben Sie den Ort an.").max(80),
  details: z.string().trim().max(300).optional().transform((v) => v || null),
  isDefault: z.boolean().optional().default(false),
});
export type AddressInput = z.input<typeof AddressSchema>;

const UNKNOWN_PLZ = "Diese Postleitzahl kennen wir nicht.";

/** The PLZ must exist in postal_codes (coordinates and service areas are derived from it). */
async function assertKnownPostalCode(tx: Queryable, postalCode: string): Promise<void> {
  const [pc] = await tx<{ postalCode: string }[]>`select postal_code from public.postal_codes where postal_code = ${postalCode}`;
  if (!pc) throw new ServiceError("validation", UNKNOWN_PLZ, { postalCode: UNKNOWN_PLZ });
}

const toAddress = (r: AddressDTO): AddressDTO => ({ ...r });

export async function listAddresses(session: Session): Promise<AddressDTO[]> {
  const s = requireRoleIn(session, "customer");
  return withUser(s.userId, async (tx) =>
    (await tx<AddressDTO[]>`
      select id, label, kind, street, house_number, postal_code, city, details, is_default
      from public.addresses where user_id = ${s.userId} order by is_default desc, created_at`).map(toAddress),
  );
}

export async function createAddress(session: Session, input: AddressInput): Promise<AddressDTO> {
  const s = requireRoleIn(session, "customer");
  const v = parse(AddressSchema, input);
  return withUser(s.userId, async (tx) => {
    await assertKnownPostalCode(tx, v.postalCode);
    const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from public.addresses where user_id = ${s.userId}`;
    if (n >= 20) throw new ServiceError("validation", "Sie können höchstens 20 Adressen speichern.");
    const makeDefault = v.isDefault || n === 0;
    if (makeDefault) await tx`update public.addresses set is_default = false where user_id = ${s.userId} and is_default`;
    const [row] = await tx<AddressDTO[]>`
      insert into public.addresses (user_id, label, kind, street, house_number, postal_code, city, details, is_default)
      values (${s.userId}, ${v.label}, ${v.kind}, ${v.street}, ${v.houseNumber}, ${v.postalCode}, ${v.city}, ${v.details}, ${makeDefault})
      returning id, label, kind, street, house_number, postal_code, city, details, is_default`;
    return toAddress(row);
  }).catch(rethrowDb);
}

export async function updateAddress(session: Session, addressId: string, input: AddressInput): Promise<AddressDTO> {
  const s = requireRoleIn(session, "customer");
  const id = parse(zUuid, addressId);
  const v = parse(AddressSchema, input);
  return withUser(s.userId, async (tx) => {
    await assertKnownPostalCode(tx, v.postalCode);
    if (v.isDefault) await tx`update public.addresses set is_default = false where user_id = ${s.userId} and is_default and id <> ${id}`;
    const [row] = await tx<AddressDTO[]>`
      update public.addresses set label = ${v.label}, kind = ${v.kind}, street = ${v.street}, house_number = ${v.houseNumber},
        postal_code = ${v.postalCode}, city = ${v.city}, details = ${v.details}, is_default = ${v.isDefault} or is_default
      where id = ${id} and user_id = ${s.userId}
      returning id, label, kind, street, house_number, postal_code, city, details, is_default`;
    if (!row) throw new ServiceError("not_found", "Adresse nicht gefunden.");
    return toAddress(row);
  }).catch(rethrowDb);
}

export async function deleteAddress(session: Session, addressId: string): Promise<void> {
  const s = requireRoleIn(session, "customer");
  const id = parse(zUuid, addressId);
  await withUser(s.userId, async (tx) => {
    const [row] = await tx<{ isDefault: boolean }[]>`delete from public.addresses where id = ${id} and user_id = ${s.userId} returning is_default`;
    if (!row) throw new ServiceError("not_found", "Adresse nicht gefunden.");
    if (row.isDefault) {
      await tx`update public.addresses set is_default = true where id = (select id from public.addresses where user_id = ${s.userId} order by created_at limit 1)`;
    }
  });
}

export async function setDefaultAddress(session: Session, addressId: string): Promise<void> {
  const s = requireRoleIn(session, "customer");
  const id = parse(zUuid, addressId);
  await withUser(s.userId, async (tx) => {
    const [exists] = await tx<{ id: string }[]>`select id from public.addresses where id = ${id} and user_id = ${s.userId}`;
    if (!exists) throw new ServiceError("not_found", "Adresse nicht gefunden.");
    await tx`update public.addresses set is_default = false where user_id = ${s.userId} and is_default`;
    await tx`update public.addresses set is_default = true where id = ${id}`;
  });
}

// ---------------------------------------------------------------------------
// Favourites
// ---------------------------------------------------------------------------
export async function toggleFavorite(session: Session, providerId: string): Promise<{ favorite: boolean }> {
  const s = requireRoleIn(session, "customer");
  const id = parse(zUuid, providerId);
  return withUser(s.userId, async (tx) => {
    const removed = await tx`delete from public.favorites where customer_id = ${s.userId} and provider_id = ${id} returning provider_id`;
    if (removed.length > 0) return { favorite: false };
    const [visible] = await tx<{ id: string }[]>`select id from public.providers where id = ${id} and status = 'approved'`;
    if (!visible) throw new ServiceError("not_found", "Profi nicht gefunden.");
    await tx`insert into public.favorites (customer_id, provider_id) values (${s.userId}, ${id}) on conflict do nothing`;
    return { favorite: true };
  });
}

export async function listFavorites(session: Session): Promise<FavoriteDTO[]> {
  const s = requireRoleIn(session, "customer");
  return withUser(s.userId, async (tx) => {
    const rows = await tx<Array<ProviderCardRow & { favoritedAt: Date }>>`
      select ${tx.unsafe(PROVIDER_CARD_COLUMNS)}, f.created_at as favorited_at
      from public.favorites f
      join public.providers p on p.id = f.provider_id and p.status = 'approved'
      left join public.postal_codes pc on pc.postal_code = p.base_postal_code
      left join public.cities ci on ci.slug = pc.city_slug
      where f.customer_id = ${s.userId}
      order by f.created_at desc`;
    return rows.map((r) => ({ ...toProviderCard(r), favoritedAt: r.favoritedAt.toISOString() }));
  });
}

// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------
const PrefsSchema = z.object({
  emailBookings: z.boolean(),
  emailReminders: z.boolean(),
  emailMarketing: z.boolean(),
  smsReminders: z.boolean(),
  pushBookings: z.boolean(),
});

export async function getNotificationPreferences(session: Session): Promise<NotificationPreferencesDTO> {
  const s = requireRoleIn(session, "customer", "provider", "admin");
  return withUser(s.userId, async (tx) => {
    const [p] = await tx<NotificationPreferencesDTO[]>`
      select email_bookings, email_reminders, email_marketing, sms_reminders, push_bookings
      from public.notification_preferences where user_id = ${s.userId}`;
    return p ?? { emailBookings: true, emailReminders: true, emailMarketing: false, smsReminders: false, pushBookings: true };
  });
}

export async function updateNotificationPreferences(session: Session, input: NotificationPreferencesDTO): Promise<NotificationPreferencesDTO> {
  const s = requireRoleIn(session, "customer", "provider", "admin");
  const v = parse(PrefsSchema, input);
  await withUser(s.userId, (tx) => tx`
    update public.notification_preferences set email_bookings = ${v.emailBookings}, email_reminders = ${v.emailReminders},
      email_marketing = ${v.emailMarketing}, sms_reminders = ${v.smsReminders}, push_bookings = ${v.pushBookings}
    where user_id = ${s.userId}`);
  return v;
}

// ---------------------------------------------------------------------------
// Credits & referrals
// ---------------------------------------------------------------------------
export async function getCreditSummary(session: Session): Promise<CreditSummaryDTO> {
  const s = requireRoleIn(session, "customer");
  return withUser(s.userId, async (tx) => {
    const rows = await tx<Array<{ id: string; amountCents: number; reason: CreditSummaryDTO["entries"][number]["reason"]; bookingId: string | null; note: string | null; createdAt: Date }>>`
      select id, amount_cents, reason, booking_id, note, created_at from public.credit_ledger
      where user_id = ${s.userId} order by created_at desc limit 200`;
    const [{ balance }] = await tx<{ balance: number }[]>`select coalesce(sum(amount_cents), 0)::int as balance from public.credit_ledger where user_id = ${s.userId}`;
    return {
      balanceCents: balance,
      entries: rows.map((r) => ({ ...r, reasonLabel: CREDIT_REASON_LABELS[r.reason] ?? r.reason, createdAt: r.createdAt.toISOString() })),
    };
  });
}

export async function getReferralInfo(session: Session): Promise<ReferralInfoDTO> {
  const s = requireRoleIn(session, "customer");
  return withUser(s.userId, async (tx) => {
    const settings = await loadSettings(tx);
    const [p] = await tx<{ referralCode: string }[]>`select referral_code from public.profiles where id = ${s.userId}`;
    const [stats] = await tx<{ invited: number; rewarded: number }[]>`
      select count(*)::int as invited, count(*) filter (where status = 'rewarded')::int as rewarded
      from public.referrals where referrer_id = ${s.userId}`;
    const [earned] = await tx<{ cents: number }[]>`
      select coalesce(sum(amount_cents), 0)::int as cents from public.credit_ledger where user_id = ${s.userId} and reason = 'referral_reward'`;
    return {
      code: p.referralCode,
      shareUrl: `${await resolveAppUrl()}/registrieren?empfehlung=${encodeURIComponent(p.referralCode)}`,
      invitedCount: stats.invited,
      rewardedCount: stats.rewarded,
      earnedCents: earned.cents,
      rewardCents: settings.referralRewardCents,
      welcomeCents: settings.referralWelcomeCents,
    };
  });
}

// ---------------------------------------------------------------------------
// Disputes ("Problem melden")
// ---------------------------------------------------------------------------
const DisputeSchema = z.object({
  bookingId: zUuid,
  reason: z.enum(["quality", "provider_no_show", "customer_no_show", "damage", "payment", "safety", "other"]),
  description: z.string().trim().min(10, "Bitte das Problem in mindestens 10 Zeichen beschreiben.").max(4000),
});

/** Customer (or provider) opens a dispute; holds the booking's payout until resolved. */
export async function openDispute(session: Session, bookingId: string, reason: DisputeReason, description: string): Promise<{ disputeId: string }> {
  const s = requireRoleIn(session, "customer", "provider");
  const v = parse(DisputeSchema, { bookingId, reason, description });
  assertNoContactDetails({ description: v.description }, s.role === "provider" ? CONTACT_LINT_MESSAGES.providerDispute : CONTACT_LINT_MESSAGES.customerDispute);
  // withService: disputes have no API insert grant; participation and the time window are verified here first.
  return withService(async (tx) => {
    const settings = await loadSettings(tx);
    const [b] = await tx<{ id: string; status: string; completedAt: Date | null; cancelledAt: Date | null; startsAt: Date }[]>`
      select id, status, completed_at, cancelled_at, starts_at from public.bookings
      where id = ${v.bookingId} and (customer_id = ${s.userId} or provider_id = ${s.userId})`;
    if (!b) throw new ServiceError("not_found", "Buchung nicht gefunden.");
    const ref = b.completedAt ?? b.cancelledAt ?? (b.status === "in_progress" || b.status === "confirmed" ? b.startsAt : null);
    if (!ref || !["completed", "no_show", "cancelled", "in_progress", "confirmed"].includes(b.status)) {
      throw new ServiceError("invalid_state", "Für diese Buchung kann kein Problem gemeldet werden.");
    }
    if (Date.now() - ref.getTime() > settings.disputeWindowHours * 3_600_000) {
      throw new ServiceError("invalid_state", `Probleme können bis ${settings.disputeWindowHours} Stunden nach dem Termin gemeldet werden.`);
    }
    const [open] = await tx<{ id: string }[]>`select id from public.disputes where booking_id = ${v.bookingId} and status in ('open', 'investigating')`;
    if (open) throw new ServiceError("conflict", "Zu dieser Buchung gibt es bereits eine offene Meldung.");
    const [row] = await tx<{ id: string }[]>`
      insert into public.disputes (booking_id, opened_by, reason, description) values (${v.bookingId}, ${s.userId}, ${v.reason}, ${v.description}) returning id`;
    await notify(tx, "dispute.opened", { disputeId: row.id });
    return { disputeId: row.id };
  });
}

export async function listMyDisputes(session: Session): Promise<DisputeDTO[]> {
  const s = requireRoleIn(session, "customer", "provider");
  return withUser(s.userId, async (tx) => {
    const rows = await tx<Array<Omit<DisputeDTO, "createdAt" | "resolvedAt" | "bookingReference"> & { createdAt: Date; resolvedAt: Date | null }>>`
      select id, booking_id, reason, description, status, refund_cents, resolution_note, created_at, resolved_at
      from public.disputes order by created_at desc limit 100`;
    // Booking references: customers may read their bookings; providers use the restricted view.
    const refs = new Map<string, string>();
    const ids = rows.map((r) => r.bookingId);
    if (ids.length) {
      const src = s.role === "customer"
        ? await tx<{ id: string; reference: string }[]>`select id, reference from public.bookings where id = any(${ids}::uuid[])`
        : await tx<{ id: string; reference: string }[]>`select id, reference from public.provider_bookings where id = any(${ids}::uuid[])`;
      for (const r of src) refs.set(r.id, r.reference);
    }
    return rows.map((r) => ({ ...r, bookingReference: refs.get(r.bookingId) ?? "", createdAt: r.createdAt.toISOString(), resolvedAt: r.resolvedAt?.toISOString() ?? null }));
  });
}
