import "server-only";

import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getConfig } from "../config";
import { setActor, withService, withUser, withViewer, type Fragment, type Queryable } from "../db/client";
import { rethrowDb } from "../db/errors";
import { isSlotAvailable } from "../domain/availability";
import { canTransition, computeRespondBy, hasSufficientResponseWindow, NO_SHOW_AFTER_MINUTES, START_WINDOW_MINUTES, STATUS_LABELS_DE, type BookingStatus } from "../domain/booking-state";
import { computeCancellation, freeCancellationUntil, parsePolicy, policySchedule } from "../domain/cancellation";
import { CONTACT_LINT_MESSAGES } from "../domain/content-lint";
import { haversineKm, roundKm } from "../domain/geo";
import { computePrice, computeTravelFee, resolveCommission, vatNote, type CommissionRule, type VatMode } from "../domain/pricing";
import { generateBookingReference, generateStartCode } from "../domain/reference";
import { localDateOf } from "../domain/tz";
import type {
  BookingEventDTO,
  BookingListItemDTO,
  CreateBookingInput,
  CreateBookingResult,
  CustomerBookingDTO,
  Paginated,
  PaymentStatus,
  ProviderBookingDTO,
  ProviderBookingFilter,
  QuoteDTO,
  QuoteInput,
  RebookOptionsDTO,
  Session,
} from "../dto";
import { ServiceError } from "../errors";
import { getPaymentProvider } from "../payments/provider";
import { assertNoContactDetails, endSentence, loadSettings, mediaUrl, num, numOrNull, paging, parse, policyToDTO, requireRoleIn, zIsoInstant, zPostalCode, zUuid } from "./_shared";
import { loadSchedules, rangeForDays, rulesFor, todayBerlin } from "./availability-data";
import {
  applyTransition,
  authorizeInTx,
  cancelInTx,
  completeInTx,
  lockBooking,
  noShowInTx,
  runPaymentOps,
  type PaymentOp,
} from "./booking-engine";
import { runBookingMaintenanceLazily } from "./booking-maintenance";
import { notify } from "./notifications";
import { queryAvailability, toProviderCard, type ProviderCardRow, PROVIDER_CARD_COLUMNS } from "./providers";
import { searchProviders } from "./search";

/**
 * Booking lifecycle (docs/architecture.md §5). TypeScript is the friendly guard
 * (German messages); the database (triggers, exclusion constraint) is the final one.
 */

const MAX_START_CODE_ATTEMPTS = 5;

// ---------------------------------------------------------------------------
// Offering context
// ---------------------------------------------------------------------------
interface OfferingContext {
  providerServiceId: string;
  providerId: string;
  providerSlug: string;
  providerName: string;
  providerStatus: string;
  serviceId: string;
  categoryId: string;
  serviceName: string;
  durationMinutes: number;
  priceCents: number;
  bookingMode: "instant" | "request";
  leadTimeMinutes: number;
  maxAdvanceDays: number;
  travelBufferMinutes: number;
  baseLat: number | null;
  baseLng: number | null;
  serviceRadiusKm: string;
  travelFeeBaseCents: number;
  travelFeeIncludedKm: string;
  travelFeePerKmCents: number;
  vatMode: VatMode;
}

async function loadOffering(tx: Queryable, providerServiceId: string): Promise<OfferingContext | null> {
  const rows = await tx<OfferingContext[]>`
    select ps.id as provider_service_id, p.id as provider_id, p.slug as provider_slug, p.display_name as provider_name,
           p.status as provider_status, s.id as service_id, s.category_id, s.name as service_name, ps.duration_minutes,
           ps.price_cents, p.booking_mode, p.lead_time_minutes, p.max_advance_days, p.travel_buffer_minutes,
           p.base_lat, p.base_lng, p.service_radius_km::text as service_radius_km, p.travel_fee_base_cents,
           p.travel_fee_included_km::text as travel_fee_included_km, p.travel_fee_per_km_cents, p.vat_mode
    from public.provider_services ps
    join public.providers p on p.id = ps.provider_id
    join public.services s on s.id = ps.service_id and s.is_active
    join public.categories c on c.id = s.category_id and c.is_active
    where ps.id = ${providerServiceId} and ps.is_active`;
  return rows[0] ?? null;
}

async function slotIsFree(tx: Queryable, o: OfferingContext, startsAt: Date, stepMinutes: number, now: Date): Promise<boolean> {
  const day = localDateOf(startsAt);
  const range = rangeForDays(day, 1);
  const schedules = await loadSchedules(tx, [{ id: o.providerId, leadTimeMinutes: o.leadTimeMinutes, maxAdvanceDays: o.maxAdvanceDays, travelBufferMinutes: o.travelBufferMinutes, bookingMode: o.bookingMode }], range.from, range.to);
  const s = schedules.get(o.providerId);
  return Boolean(s && isSlotAvailable(startsAt, rulesFor(s, o.durationMinutes, stepMinutes, now)));
}

function travel(o: OfferingContext, point: { lat: number; lng: number }) {
  if (o.baseLat == null || o.baseLng == null) return { distanceKm: Number.POSITIVE_INFINITY, within: false, feeCents: 0 };
  const distanceKm = roundKm(haversineKm({ lat: o.baseLat, lng: o.baseLng }, point));
  const within = distanceKm <= Number(o.serviceRadiusKm);
  const feeCents = computeTravelFee(distanceKm, { baseCents: o.travelFeeBaseCents, includedKm: Number(o.travelFeeIncludedKm), perKmCents: o.travelFeePerKmCents });
  return { distanceKm, within, feeCents };
}

async function postalPoint(tx: Queryable, plz: string): Promise<{ lat: number; lng: number }> {
  const [row] = await tx<{ lat: number; lng: number }[]>`select lat, lng from public.postal_codes where postal_code = ${plz}`;
  if (!row) throw new ServiceError("validation", "Diese Postleitzahl ist uns nicht bekannt.", { postalCode: "Unbekannte Postleitzahl." });
  return row;
}

async function creditBalance(tx: Queryable, userId: string): Promise<number> {
  const [r] = await tx<{ balance: number }[]>`select coalesce(sum(amount_cents), 0)::int as balance from public.credit_ledger where user_id = ${userId}`;
  return r.balance;
}

// ---------------------------------------------------------------------------
// Quote
// ---------------------------------------------------------------------------
export const QuoteInputSchema = z
  .object({
    providerServiceId: zUuid,
    startsAt: zIsoInstant,
    postalCode: zPostalCode.optional(),
    addressId: zUuid.optional(),
    useCredits: z.boolean().optional().default(false),
    inviteCode: z.string().trim().max(20).optional(),
  })
  .refine((v) => v.postalCode || v.addressId, { message: "Bitte geben Sie eine Adresse oder Postleitzahl an.", path: ["postalCode"] });

/** Price breakdown + policy for one slot. Anonymous callers may pass a postal code; credits need a session. */
export async function quoteBooking(input: QuoteInput, session?: Session | null): Promise<QuoteDTO> {
  const q = parse(QuoteInputSchema, input);
  if (q.addressId && !session) throw new ServiceError("unauthenticated", "Bitte melden Sie sich an, um gespeicherte Adressen zu nutzen.");
  const viewerId = session?.role === "customer" ? session.userId : null;
  return withViewer(viewerId, async (tx) => {
    const o = await loadOffering(tx, q.providerServiceId);
    if (!o || o.providerStatus !== "approved") throw new ServiceError("not_found", "Dieses Angebot ist nicht mehr verfügbar.");
    let plz = q.postalCode ?? null;
    if (q.addressId) {
      const [a] = await tx<{ postalCode: string }[]>`select postal_code from public.addresses where id = ${q.addressId}`;
      if (!a) throw new ServiceError("not_found", "Adresse nicht gefunden.");
      plz = a.postalCode;
    }
    const point = await postalPoint(tx, plz as string);
    const settings = await loadSettings(tx);
    const now = new Date();
    const startsAt = new Date(q.startsAt);
    const t = travel(o, point);
    const credits = viewerId ? await creditBalance(tx, viewerId) : 0;
    const price = computePrice({
      servicePriceCents: o.priceCents, travelFeeCents: t.feeCents, serviceFeeCents: settings.customerServiceFeeCents,
      availableCreditsCents: credits, useCredits: q.useCredits, commissionRate: 0,
    });
    const slotAvailable = await slotIsFree(tx, o, startsAt, settings.slotStepMinutes, now);
    return {
      providerServiceId: o.providerServiceId,
      providerId: o.providerId,
      providerName: o.providerName,
      providerSlug: o.providerSlug,
      serviceName: o.serviceName,
      durationMinutes: o.durationMinutes,
      startsAt: startsAt.toISOString(),
      endsAt: new Date(startsAt.getTime() + o.durationMinutes * 60_000).toISOString(),
      slotAvailable,
      withinServiceArea: t.within,
      distanceKm: Number.isFinite(t.distanceKm) ? t.distanceKm : 0,
      bookingMode: o.bookingMode,
      price: {
        servicePriceCents: price.servicePriceCents, travelFeeCents: price.travelFeeCents, serviceFeeCents: price.serviceFeeCents,
        discountCents: price.discountCents, totalCents: price.totalCents,
      },
      creditsAvailableCents: credits,
      cancellation: {
        policy: policyToDTO(settings.cancellationPolicy),
        // A quote is a booking made now: the Bedenkzeit starts now.
        schedule: policySchedule(settings.cancellationPolicy, startsAt, now),
        freeUntil: freeCancellationUntil(settings.cancellationPolicy, startsAt, now),
      },
      holdMinutes: settings.holdMinutes,
      requestResponseHours: settings.requestResponseHours,
      // Request mode: the deadline the provider would get if the request were sent now (audit-2 N6).
      respondByPreview: o.bookingMode === "request" ? computeRespondBy(now, startsAt, settings.requestResponseHours).toISOString() : null,
      paymentProvider: getConfig().PAYMENTS_PROVIDER,
      vatMode: o.vatMode,
      vatNote: vatNote(o.vatMode, price.totalCents),
    };
  });
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
const NewAddressSchema = z.object({
  kind: z.enum(["home", "hotel", "office", "other"]).default("home"),
  street: z.string().trim().min(2, "Bitte geben Sie die Straße an.").max(120),
  houseNumber: z.string().trim().min(1, "Bitte geben Sie die Hausnummer an.").max(12),
  postalCode: zPostalCode,
  city: z.string().trim().min(2, "Bitte geben Sie den Ort an.").max(80),
  details: z.string().trim().max(300).optional(),
  label: z.string().trim().max(60).optional(),
  save: z.boolean().optional().default(false),
});

export const CreateBookingInputSchema = z.object({
  providerServiceId: zUuid,
  startsAt: zIsoInstant,
  address: z.union([z.object({ addressId: zUuid }), NewAddressSchema]),
  notes: z.string().trim().max(1000, "Höchstens 1000 Zeichen.").optional(),
  useCredits: z.boolean().optional().default(false),
  inviteCode: z.string().trim().max(20).optional(),
  rebookedFromId: zUuid.optional(),
});

interface ResolvedAddress {
  kind: "home" | "hotel" | "office" | "other";
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  details: string | null;
}

/**
 * Creates a booking with a slot hold (pending_payment, hold_minutes) and the
 * payment authorization. Concurrent attempts for the same slot: exactly one
 * wins (exclusion constraint); the other gets "Dieser Termin wurde gerade vergeben".
 */
export async function createBooking(session: Session, raw: CreateBookingInput): Promise<CreateBookingResult> {
  const s = requireRoleIn(session, "customer");
  const input = parse(CreateBookingInputSchema, raw);
  assertNoContactDetails({ notes: input.notes }, CONTACT_LINT_MESSAGES.customerNotes);
  await runBookingMaintenanceLazily();
  const startsAt = new Date(input.startsAt);
  const payments = getPaymentProvider();
  const now = new Date();

  // withService: booking-engine write path. Authorisation is explicit below: customer role and
  // account state, ownership of a saved address, service area, slot validity; the DB triggers re-check.
  const created = await withService(async (tx) => {
    await setActor(tx, { actorId: s.userId, actorRole: "customer" });
    // Row lock on the customer serialises concurrent checkouts of the same customer (credit redemption).
    const [customer] = await tx<{ role: string; blockedAt: Date | null; email: string | null }[]>`
      select p.role, p.blocked_at, u.email from public.profiles p left join auth.users u on u.id = p.id
      where p.id = ${s.userId} for update of p`;
    if (!customer || customer.role !== "customer" || customer.blockedAt) throw new ServiceError("forbidden", "Mit diesem Konto sind keine Buchungen möglich.");

    const o = await loadOffering(tx, input.providerServiceId);
    if (!o || o.providerStatus !== "approved") throw new ServiceError("unavailable", "Dieses Angebot ist nicht mehr verfügbar.");

    let address: ResolvedAddress;
    if ("addressId" in input.address) {
      const [a] = await tx<ResolvedAddress[]>`
        select kind, street, house_number, postal_code, city, details from public.addresses
        where id = ${input.address.addressId} and user_id = ${s.userId}`;
      if (!a) throw new ServiceError("not_found", "Adresse nicht gefunden.");
      address = a;
    } else {
      const a = input.address;
      address = { kind: a.kind, street: a.street, houseNumber: a.houseNumber, postalCode: a.postalCode, city: a.city, details: a.details ?? null };
    }

    const point = await postalPoint(tx, address.postalCode);
    const t = travel(o, point);
    if (!t.within) throw new ServiceError("unavailable", `Diese Adresse liegt leider außerhalb des Einsatzgebiets von ${endSentence(o.providerName)}`, { address: "Außerhalb des Einsatzgebiets." });

    const settings = await loadSettings(tx);
    if (o.bookingMode === "request" && !hasSufficientResponseWindow(now, startsAt, settings.requestResponseHours)) {
      throw new ServiceError("unavailable", "Für diesen Termin bliebe zu wenig Zeit für die Antwort des Profis. Bitte wählen Sie einen späteren Termin.");
    }
    if (!(await slotIsFree(tx, o, startsAt, settings.slotStepMinutes, now))) {
      throw new ServiceError("unavailable", "Dieser Termin ist leider nicht mehr verfügbar. Bitte wählen Sie eine andere Uhrzeit.");
    }

    // Commission tier: own client (provider invite) → repeat client → base.
    const [{ repeat }] = await tx<{ repeat: boolean }[]>`
      select exists (select 1 from public.bookings where customer_id = ${s.userId} and provider_id = ${o.providerId} and status = 'completed') as repeat`;
    let [link] = await tx<{ source: "provider_invite" | "platform" }[]>`
      select source from public.provider_client_links where provider_id = ${o.providerId} and customer_id = ${s.userId}`;
    if (!link && input.inviteCode) {
      const [ok] = await tx<{ x: number }[]>`select 1 as x from public.providers where id = ${o.providerId} and invite_code = ${input.inviteCode.toUpperCase()}`;
      if (ok) {
        await tx`insert into public.provider_client_links (provider_id, customer_id, source) values (${o.providerId}, ${s.userId}, 'provider_invite') on conflict do nothing`;
        link = { source: "provider_invite" };
      }
    }
    const rules = await tx<CommissionRule[]>`
      select scope, category_id, provider_id, rate::float8 as rate, repeat_client_rate::float8 as repeat_client_rate,
             own_client_rate::float8 as own_client_rate, is_active
      from public.commission_rules where is_active`;
    const [{ override }] = await tx<{ override: number | null }[]>`select commission_rate_override::float8 as override from public.providers where id = ${o.providerId}`;
    const commission = resolveCommission(rules, {
      providerId: o.providerId, categoryId: o.categoryId, providerRateOverride: override,
      isOwnClient: link?.source === "provider_invite", isRepeatClient: repeat,
    });

    const balance = await creditBalance(tx, s.userId);
    const price = computePrice({
      servicePriceCents: o.priceCents, travelFeeCents: t.feeCents, serviceFeeCents: settings.customerServiceFeeCents,
      availableCreditsCents: balance, useCredits: input.useCredits, commissionRate: commission.rate,
    });

    const endsAt = new Date(startsAt.getTime() + o.durationMinutes * 60_000);
    const holdExpiresAt = new Date(now.getTime() + settings.holdMinutes * 60_000);
    const addressLine = `${address.street} ${address.houseNumber}`;
    let bookingId = "";
    let reference = "";
    for (let attempt = 0; attempt < 5 && !bookingId; attempt += 1) {
      reference = generateBookingReference();
      const rows = await tx<{ id: string }[]>`
        insert into public.bookings (
          reference, customer_id, provider_id, provider_service_id, service_id, category_id, service_name, duration_minutes,
          starts_at, ends_at, blocked_range, status, booking_mode, location_kind, address_line, postal_code, city, address_details,
          lat, lng, customer_notes, distance_km, service_price_cents, travel_fee_cents, service_fee_cents, discount_cents,
          total_cents, commission_rate, commission_tier, commission_cents, provider_payout_cents, is_repeat_client,
          cancellation_policy, start_code, hold_expires_at, rebooked_from_id, vat_mode
        ) values (
          ${reference}, ${s.userId}, ${o.providerId}, ${o.providerServiceId}, ${o.serviceId}, ${o.categoryId}, ${o.serviceName},
          ${o.durationMinutes}, ${startsAt}, ${endsAt}, tstzrange(${startsAt}, ${endsAt}), 'pending_payment', ${o.bookingMode},
          ${address.kind}, ${addressLine}, ${address.postalCode}, ${address.city}, ${address.details}, ${point.lat}, ${point.lng},
          ${input.notes ?? null}, ${t.distanceKm}, ${price.servicePriceCents}, ${price.travelFeeCents}, ${price.serviceFeeCents},
          ${price.discountCents}, ${price.totalCents}, ${commission.rate}, ${commission.tier}, ${price.commissionCents},
          ${price.providerPayoutCents}, ${repeat}, ${tx.json(JSON.parse(JSON.stringify(settings.cancellationPolicy)))},
          ${generateStartCode()}, ${holdExpiresAt}, ${input.rebookedFromId ?? null}, ${o.vatMode}
        )
        on conflict (reference) do nothing
        returning id`;
      if (rows[0]) bookingId = rows[0].id;
    }
    if (!bookingId) throw new ServiceError("internal", "Die Buchung konnte nicht angelegt werden. Bitte versuchen Sie es erneut.");

    if (price.discountCents > 0) {
      await tx`
        insert into public.credit_ledger (user_id, amount_cents, reason, booking_id, note)
        values (${s.userId}, ${-price.discountCents}, 'booking_redemption', ${bookingId}, ${`Eingelöst für ${reference}`})`;
    }
    if (!link) {
      await tx`insert into public.provider_client_links (provider_id, customer_id, source) values (${o.providerId}, ${s.userId}, 'platform') on conflict do nothing`;
    }
    const applicationFee = Math.max(0, price.totalCents - price.providerPayoutCents);
    await tx`
      insert into public.payments (booking_id, provider, status, amount_cents, application_fee_cents)
      values (${bookingId}, ${payments.id}, 'requires_payment_method', ${price.totalCents}, ${applicationFee})`;
    if (!("addressId" in input.address) && input.address.save) {
      const a = input.address;
      const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from public.addresses where user_id = ${s.userId}`;
      await tx`
        insert into public.addresses (user_id, label, kind, street, house_number, postal_code, city, details, is_default)
        values (${s.userId}, ${a.label ?? null}, ${a.kind}, ${a.street}, ${a.houseNumber}, ${a.postalCode}, ${a.city}, ${a.details ?? null}, ${n === 0})`;
    }
    const [{ stripeAccountId }] = await tx<{ stripeAccountId: string | null }[]>`select stripe_account_id from public.providers where id = ${o.providerId}`;
    return {
      bookingId, reference, holdExpiresAt, totalCents: price.totalCents, applicationFee,
      description: `${o.serviceName} · ${reference}`, stripeAccountId, email: customer.email,
    };
  }).catch(rethrowDb);

  // External authorization outside the DB transaction.
  let clientSecret: string | null = null;
  try {
    const auth = await payments.createAuthorization({
      bookingId: created.bookingId, reference: created.reference, amountCents: created.totalCents,
      applicationFeeCents: created.applicationFee, description: created.description,
      providerAccountId: created.stripeAccountId, customerEmail: created.email,
    });
    clientSecret = auth.clientSecret;
    // withService: system bookkeeping of the payment reference for the booking just created.
    await withService((tx) => tx`update public.payments set external_id = ${auth.externalId} where booking_id = ${created.bookingId}`);
  } catch (e) {
    // withService: release the hold of a booking whose payment could not be initialised (system cancellation).
    await withService(async (tx) => {
      const b = await lockBooking(tx, created.bookingId);
      if (b && b.status === "pending_payment") await cancelInTx(tx, b, { actor: "system", actorId: null, reason: "Zahlung konnte nicht gestartet werden" });
    });
    if (e instanceof ServiceError) throw e;
    throw new ServiceError("payment", "Die Zahlung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.");
  }

  return {
    bookingId: created.bookingId,
    reference: created.reference,
    status: "pending_payment",
    holdExpiresAt: created.holdExpiresAt.toISOString(),
    totalCents: created.totalCents,
    paymentProvider: payments.id,
    paymentClientSecret: clientSecret,
  };
}

/** Dev payment simulator ("Testmodus"): authorizes the hold and moves the booking on. */
export async function confirmDevPayment(session: Session, bookingId: string): Promise<{ status: BookingStatus }> {
  const s = requireRoleIn(session, "customer");
  const id = parse(zUuid, bookingId);
  if (getConfig().PAYMENTS_PROVIDER !== "dev") throw new ServiceError("forbidden", "Testzahlungen sind nur im Testmodus möglich.");
  // withService: booking-engine write path; ownership enforced by customer_id in lockBooking.
  return withService(async (tx) => {
    const b = await lockBooking(tx, id, { customerId: s.userId });
    if (!b) throw new ServiceError("not_found", "Buchung nicht gefunden.");
    if (b.status !== "pending_payment") throw new ServiceError("invalid_state", "Diese Buchung wurde bereits bezahlt oder ist nicht mehr aktiv.");
    if (b.holdExpiresAt && b.holdExpiresAt.getTime() < Date.now()) {
      throw new ServiceError("invalid_state", "Ihre Reservierung ist abgelaufen. Bitte wählen Sie den Termin erneut.");
    }
    const status = await authorizeInTx(tx, b, { cardBrand: "visa", cardLast4: "4242" });
    return { status };
  }).catch(rethrowDb);
}

/**
 * Payment authorized by an external provider (Stripe webhook). Idempotent;
 * if the hold already expired the authorization is released.
 */
export async function markPaymentAuthorizedByExternalId(externalId: string, card: { cardBrand?: string | null; cardLast4?: string | null }): Promise<BookingStatus | null> {
  const ops: PaymentOp[] = [];
  // withService: payment webhook (system), authenticated by the webhook signature.
  const status = await withService(async (tx) => {
    const [p] = await tx<{ bookingId: string; provider: "dev" | "stripe"; id: string }[]>`select booking_id, provider, id from public.payments where external_id = ${externalId}`;
    if (!p) return null;
    const b = await lockBooking(tx, p.bookingId);
    if (!b) return null;
    if (b.status === "pending_payment") return authorizeInTx(tx, b, { ...card, externalId });
    if (b.status === "expired" || b.status === "cancelled") {
      await tx`update public.payments set status = 'cancelled' where id = ${p.id}`;
      ops.push({ kind: "release", paymentId: p.id, provider: p.provider, externalId });
    }
    return b.status;
  });
  await runPaymentOps(ops);
  return status;
}

export async function markPaymentFailedByExternalId(externalId: string): Promise<void> {
  // withService: payment webhook (system).
  await withService((tx) => tx`update public.payments set status = 'failed' where external_id = ${externalId} and status = 'requires_payment_method'`);
}

// ---------------------------------------------------------------------------
// Provider actions
// ---------------------------------------------------------------------------
const RespondSchema = z
  .object({ bookingId: zUuid, decision: z.enum(["accept", "decline"]), note: z.string().trim().max(500).optional() })
  .refine((v) => v.decision === "accept" || (v.note && v.note.length >= 3), { message: "Bitte gib einen Grund für die Ablehnung an.", path: ["note"] });

export async function providerRespond(session: Session, bookingId: string, decision: "accept" | "decline", note?: string): Promise<{ status: BookingStatus }> {
  const s = requireRoleIn(session, "provider");
  const input = parse(RespondSchema, { bookingId, decision, note });
  assertNoContactDetails({ note: input.note }, CONTACT_LINT_MESSAGES.providerMessage);
  const ops: Array<PaymentOp | null> = [];
  // withService: booking-engine write path; provider ownership enforced by provider_id in lockBooking.
  const result = await withService(async (tx) => {
    const b = await lockBooking(tx, input.bookingId, { providerId: s.userId });
    if (!b) throw new ServiceError("not_found", "Termin nicht gefunden.");
    if (b.status !== "requested") throw new ServiceError("invalid_state", "Diese Anfrage ist nicht mehr offen.");
    if (b.respondBy && b.respondBy.getTime() < Date.now()) throw new ServiceError("invalid_state", "Die Antwortfrist für diese Anfrage ist abgelaufen.");
    if (input.decision === "accept") {
      await applyTransition(tx, b, "confirmed", "provider", s.userId, {}, input.note ?? null);
      await notify(tx, "booking.confirmed", { bookingId: b.id });
      return { status: "confirmed" as const };
    }
    const r = await cancelInTx(tx, b, { actor: "provider", actorId: s.userId, reason: input.note ?? null, to: "declined" });
    ops.push(r.op);
    return { status: "declined" as const };
  }).catch(rethrowDb);
  await runPaymentOps(ops);
  return result;
}

const StartSchema = z.object({ bookingId: zUuid, code: z.string().trim().regex(/^\d{4}$/, "Der Start-Code hat vier Ziffern.") });

/** confirmed → in_progress, only with the customer's 4-digit Start-Code (max. 5 wrong attempts). */
export async function startBooking(session: Session, bookingId: string, code: string): Promise<{ status: BookingStatus }> {
  const s = requireRoleIn(session, "provider");
  const input = parse(StartSchema, { bookingId, code });
  // withService: booking-engine write path; provider ownership enforced by provider_id in lockBooking.
  const res = await withService(async (tx) => {
    const b = await lockBooking(tx, input.bookingId, { providerId: s.userId });
    if (!b) throw new ServiceError("not_found", "Termin nicht gefunden.");
    if (b.status !== "confirmed") throw new ServiceError("invalid_state", "Dieser Termin kann nicht gestartet werden.");
    if (b.startCodeAttempts >= MAX_START_CODE_ATTEMPTS) {
      throw new ServiceError("rate_limited", "Der Start-Code wurde zu oft falsch eingegeben. Bitte wende dich an den SOMA-Support.");
    }
    if (Date.now() < b.startsAt.getTime() - 30 * 60_000) throw new ServiceError("invalid_state", "Du kannst den Termin frühestens 30 Minuten vor Beginn starten.");
    const ok = b.startCode.length === input.code.length && timingSafeEqual(Buffer.from(b.startCode), Buffer.from(input.code));
    if (!ok) {
      const [r] = await tx<{ startCodeAttempts: number }[]>`
        update public.bookings set start_code_attempts = start_code_attempts + 1 where id = ${b.id} returning start_code_attempts`;
      return { ok: false as const, remaining: Math.max(0, MAX_START_CODE_ATTEMPTS - r.startCodeAttempts) };
    }
    await applyTransition(tx, b, "in_progress", "provider", s.userId, {}, "Start-Code bestätigt");
    return { ok: true as const };
  }).catch(rethrowDb);
  if (!res.ok) {
    throw new ServiceError(
      "validation",
      res.remaining > 0 ? `Der Start-Code ist falsch. Noch ${res.remaining} ${res.remaining === 1 ? "Versuch" : "Versuche"}.` : "Der Start-Code ist falsch. Bitte wende dich an den SOMA-Support.",
      { code: "Falscher Start-Code." },
    );
  }
  return { status: "in_progress" };
}

export async function completeBooking(session: Session, bookingId: string): Promise<{ status: BookingStatus }> {
  const s = requireRoleIn(session, "provider");
  const id = parse(zUuid, bookingId);
  const ops: Array<PaymentOp | null> = [];
  // withService: booking-engine write path (capture, referral credit); provider ownership enforced in lockBooking.
  await withService(async (tx) => {
    const b = await lockBooking(tx, id, { providerId: s.userId });
    if (!b) throw new ServiceError("not_found", "Termin nicht gefunden.");
    if (b.status !== "confirmed" && b.status !== "in_progress") throw new ServiceError("invalid_state", "Dieser Termin kann nicht abgeschlossen werden.");
    if (Date.now() < b.startsAt.getTime()) throw new ServiceError("invalid_state", "Du kannst den Termin erst nach Beginn abschließen.");
    ops.push(await completeInTx(tx, b, "provider", s.userId));
  }).catch(rethrowDb);
  await runPaymentOps(ops);
  return { status: "completed" };
}

export async function markNoShow(session: Session, bookingId: string): Promise<{ status: BookingStatus; feeCents: number }> {
  const s = requireRoleIn(session, "provider");
  const id = parse(zUuid, bookingId);
  const ops: Array<PaymentOp | null> = [];
  // withService: booking-engine write path (fee capture); provider ownership enforced in lockBooking.
  const fee = await withService(async (tx) => {
    const b = await lockBooking(tx, id, { providerId: s.userId });
    if (!b) throw new ServiceError("not_found", "Termin nicht gefunden.");
    if (b.status !== "confirmed") throw new ServiceError("invalid_state", "Für diesen Termin ist „Nicht angetroffen“ nicht möglich.");
    if (Date.now() < b.startsAt.getTime() + 15 * 60_000) throw new ServiceError("invalid_state", "Du kannst das frühestens 15 Minuten nach Terminbeginn melden.");
    const r = await noShowInTx(tx, b, "provider", s.userId);
    ops.push(r.op);
    return r.outcome.feeCents;
  }).catch(rethrowDb);
  await runPaymentOps(ops);
  return { status: "no_show", feeCents: fee };
}

// ---------------------------------------------------------------------------
// Cancellation (customer / provider)
// ---------------------------------------------------------------------------
const CancelSchema = z.object({ bookingId: zUuid, reason: z.string().trim().max(500).optional() });

export async function cancelBooking(session: Session, bookingId: string, reason?: string): Promise<{ status: BookingStatus; feeCents: number; refundCents: number }> {
  const s = requireRoleIn(session, "customer", "provider");
  const input = parse(CancelSchema, { bookingId, reason });
  assertNoContactDetails({ reason: input.reason }, s.role === "provider" ? CONTACT_LINT_MESSAGES.providerMessage : CONTACT_LINT_MESSAGES.customerMessage);
  const ops: Array<PaymentOp | null> = [];
  // withService: booking-engine write path; ownership enforced via customer_id / provider_id in lockBooking.
  const out = await withService(async (tx) => {
    const scope = s.role === "customer" ? { customerId: s.userId } : { providerId: s.userId };
    const b = await lockBooking(tx, input.bookingId, scope);
    if (!b) throw new ServiceError("not_found", "Buchung nicht gefunden.");
    if (s.role === "provider" && b.status === "requested") {
      throw new ServiceError("invalid_state", "Offene Anfragen lehnst du bitte über „Ablehnen“ ab.");
    }
    if (b.status === "confirmed" && Date.now() >= b.startsAt.getTime() && s.role === "customer") {
      throw new ServiceError("invalid_state", "Der Termin hat bereits begonnen. Bitte melden Sie ein Problem über die Buchung.");
    }
    if (s.role === "provider" && !input.reason) throw new ServiceError("validation", "Bitte gib einen Grund für die Stornierung an.", { reason: "Pflichtfeld." });
    const r = await cancelInTx(tx, b, { actor: s.role === "customer" ? "customer" : "provider", actorId: s.userId, reason: input.reason ?? null });
    ops.push(r.op);
    return { status: "cancelled" as const, feeCents: r.outcome.feeCents, refundCents: r.outcome.refundCents };
  }).catch(rethrowDb);
  await runPaymentOps(ops);
  return out;
}

// ---------------------------------------------------------------------------
// Customer reads (RLS: own bookings only)
// ---------------------------------------------------------------------------
interface CustomerBookingRow {
  id: string;
  reference: string;
  providerId: string;
  providerServiceId: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  startsAt: Date;
  endsAt: Date;
  status: BookingStatus;
  bookingMode: "instant" | "request";
  locationKind: "home" | "hotel" | "office" | "other";
  addressLine: string;
  postalCode: string;
  city: string;
  addressDetails: string | null;
  customerNotes: string | null;
  servicePriceCents: number;
  travelFeeCents: number;
  serviceFeeCents: number;
  discountCents: number;
  totalCents: number;
  cancellationPolicy: unknown;
  startCode: string;
  holdExpiresAt: Date | null;
  respondBy: Date | null;
  confirmedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancelledBy: "customer" | "provider" | "admin" | "system" | null;
  cancellationReason: string | null;
  cancellationFeeCents: number;
  refundCents: number;
  categorySlug: string | null;
  providerSlug: string | null;
  providerName: string | null;
  providerAvatarPath: string | null;
  providerRatingAvg: string | null;
  providerRatingCount: number | null;
  vatMode: VatMode;
  createdAt: Date;
}

async function queryCustomerBookings(tx: Queryable, extra: (t: Queryable) => Fragment): Promise<CustomerBookingRow[]> {
  return tx<CustomerBookingRow[]>`
    select b.id, b.reference, b.provider_id, b.provider_service_id, b.service_id, b.service_name, b.duration_minutes,
           b.starts_at, b.ends_at, b.status, b.booking_mode, b.location_kind, b.address_line, b.postal_code, b.city,
           b.address_details, b.customer_notes, b.service_price_cents, b.travel_fee_cents, b.service_fee_cents,
           b.discount_cents, b.total_cents, b.cancellation_policy, b.start_code, b.hold_expires_at, b.respond_by,
           b.confirmed_at, b.started_at, b.completed_at, b.cancelled_at, b.cancelled_by, b.cancellation_reason,
           b.cancellation_fee_cents, b.refund_cents, b.vat_mode, b.created_at,
           c.slug as category_slug, p.slug as provider_slug, p.display_name as provider_name, p.avatar_path as provider_avatar_path,
           p.rating_avg::text as provider_rating_avg, p.rating_count as provider_rating_count
    from public.bookings b
    left join public.categories c on c.id = b.category_id
    left join public.providers p on p.id = b.provider_id
    ${extra(tx)}`;
}

function customerFlags(r: CustomerBookingRow, now: Date, reviewWindowDays: number, disputeWindowHours: number, hasReview: boolean, hasOpenDispute: boolean) {
  const holdLive = r.status === "pending_payment" && (!r.holdExpiresAt || r.holdExpiresAt.getTime() > now.getTime());
  const canCancel =
    holdLive || r.status === "requested" || (r.status === "confirmed" && now.getTime() < r.startsAt.getTime());
  const canReview = r.status === "completed" && !hasReview && !!r.completedAt && now.getTime() - r.completedAt.getTime() <= reviewWindowDays * 86_400_000;
  const disputeBase = r.completedAt ?? (r.status === "no_show" || (r.status === "cancelled" && r.cancellationFeeCents > 0) ? r.cancelledAt : null);
  const canDispute = !!disputeBase && !hasOpenDispute && now.getTime() - disputeBase.getTime() <= disputeWindowHours * 3_600_000;
  const canRebook = ["completed", "cancelled", "declined", "expired", "no_show"].includes(r.status);
  return { holdLive, canCancel, canReview, canDispute, canRebook };
}

export async function getBookingForCustomer(session: Session, bookingId: string): Promise<CustomerBookingDTO | null> {
  const s = requireRoleIn(session, "customer");
  const id = parse(zUuid, bookingId);
  return withUser(s.userId, async (tx) => {
    const [r] = await queryCustomerBookings(tx, (t) => t`where b.id = ${id} and b.customer_id = ${s.userId}`);
    if (!r) return null;
    const settings = await loadSettings(tx);
    const [payment] = await tx<Array<{ provider: "dev" | "stripe"; status: PaymentStatus; amountCents: number; capturedCents: number; refundedCents: number; cardBrand: string | null; cardLast4: string | null }>>`
      select provider, status, amount_cents, captured_cents, refunded_cents, card_brand, card_last4 from public.payments where booking_id = ${id}`;
    const events = await tx<Array<{ fromStatus: BookingStatus | null; toStatus: BookingStatus; actorRole: BookingEventDTO["actorRole"]; note: string | null; createdAt: Date }>>`
      select from_status, to_status, actor_role, note, created_at from public.booking_events where booking_id = ${id} order by created_at, id`;
    const [review] = await tx<{ id: string; rating: number; comment: string | null }[]>`select id, rating, comment from public.reviews where booking_id = ${id}`;
    const [dispute] = await tx<{ x: number }[]>`select 1 as x from public.disputes where booking_id = ${id} and status in ('open', 'investigating')`;
    const now = new Date();
    const flags = customerFlags(r, now, settings.reviewWindowDays, settings.disputeWindowHours, !!review, !!dispute);
    const policy = parsePolicy(r.cancellationPolicy);
    const ifCancelledNow = flags.canCancel
      ? (({ feeCents, refundCents, tierLabel }) => ({ feeCents, refundCents, tierLabel }))(
          computeCancellation(
            { status: r.status, startsAt: r.startsAt, createdAt: r.createdAt, servicePriceCents: r.servicePriceCents, travelFeeCents: r.travelFeeCents, serviceFeeCents: r.serviceFeeCents, discountCents: r.discountCents, totalCents: r.totalCents, cancellationPolicy: policy },
            now,
            "customer",
          ),
        )
      : null;
    return {
      id: r.id,
      reference: r.reference,
      status: r.status,
      statusLabel: STATUS_LABELS_DE[r.status],
      bookingMode: r.bookingMode,
      startsAt: r.startsAt.toISOString(),
      endsAt: r.endsAt.toISOString(),
      durationMinutes: r.durationMinutes,
      serviceId: r.serviceId,
      serviceName: r.serviceName,
      categorySlug: r.categorySlug ?? "",
      providerServiceId: r.providerServiceId,
      provider: {
        id: r.providerId, slug: r.providerSlug ?? "", displayName: r.providerName ?? "Profi",
        avatarUrl: mediaUrl(r.providerAvatarPath), ratingAvg: numOrNull(r.providerRatingAvg), ratingCount: r.providerRatingCount ?? 0,
      },
      location: { kind: r.locationKind, addressLine: r.addressLine, postalCode: r.postalCode, city: r.city, details: r.addressDetails },
      notes: r.customerNotes,
      price: { servicePriceCents: r.servicePriceCents, travelFeeCents: r.travelFeeCents, serviceFeeCents: r.serviceFeeCents, discountCents: r.discountCents, totalCents: r.totalCents },
      vatMode: r.vatMode,
      vatNote: vatNote(r.vatMode, r.totalCents),
      cancellation: { policy: policyToDTO(policy), schedule: policySchedule(policy, r.startsAt, r.createdAt), freeUntil: freeCancellationUntil(policy, r.startsAt, r.createdAt), ifCancelledNow },
      startCode: r.status === "confirmed" || r.status === "in_progress" ? r.startCode : null,
      holdExpiresAt: r.holdExpiresAt?.toISOString() ?? null,
      respondBy: r.respondBy?.toISOString() ?? null,
      confirmedAt: r.confirmedAt?.toISOString() ?? null,
      startedAt: r.startedAt?.toISOString() ?? null,
      completedAt: r.completedAt?.toISOString() ?? null,
      cancelledAt: r.cancelledAt?.toISOString() ?? null,
      cancelledBy: r.cancelledBy,
      cancellationReason: r.cancellationReason,
      cancellationFeeCents: r.cancellationFeeCents,
      refundCents: r.refundCents,
      payment: payment
        ? { provider: payment.provider, status: payment.status, amountCents: payment.amountCents, capturedCents: payment.capturedCents, refundedCents: payment.refundedCents, cardBrand: payment.cardBrand, cardLast4: payment.cardLast4 }
        : null,
      review: review ?? null,
      canPay: flags.holdLive && payment?.status === "requires_payment_method",
      canCancel: flags.canCancel,
      canReview: flags.canReview,
      canDispute: flags.canDispute,
      canRebook: flags.canRebook,
      events: events.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
    };
  });
}

export async function listCustomerBookings(session: Session, scope: "upcoming" | "past", page = 1, pageSize = 20): Promise<Paginated<BookingListItemDTO>> {
  const s = requireRoleIn(session, "customer");
  const sc = parse(z.enum(["upcoming", "past"]), scope);
  const pg = paging(page, pageSize);
  await runBookingMaintenanceLazily();
  return withUser(s.userId, async (tx) => {
    const settings = await loadSettings(tx);
    const cond = (t: Queryable) =>
      sc === "upcoming"
        ? t`b.customer_id = ${s.userId} and b.ends_at > now() and (b.status in ('requested', 'confirmed', 'in_progress') or (b.status = 'pending_payment' and b.hold_expires_at > now()))`
        : t`b.customer_id = ${s.userId} and not (b.ends_at > now() and (b.status in ('requested', 'confirmed', 'in_progress') or (b.status = 'pending_payment' and b.hold_expires_at > now())))
              and not (b.status = 'pending_payment')`;
    const rows = await queryCustomerBookings(tx, (t) =>
      t`where ${cond(t)} order by b.starts_at ${sc === "upcoming" ? t`asc` : t`desc`} limit ${pg.pageSize} offset ${pg.offset}`,
    );
    const [{ total }] = await tx<{ total: number }[]>`select count(*)::int as total from public.bookings b where ${cond(tx)}`;
    const reviewed = new Set(
      (await tx<{ bookingId: string }[]>`select booking_id from public.reviews where customer_id = ${s.userId}`).map((r) => r.bookingId),
    );
    const now = new Date();
    return {
      items: rows.map((r) => ({
        id: r.id, reference: r.reference, status: r.status, statusLabel: STATUS_LABELS_DE[r.status], startsAt: r.startsAt.toISOString(),
        endsAt: r.endsAt.toISOString(), serviceName: r.serviceName, providerName: r.providerName ?? "Profi", providerSlug: r.providerSlug ?? "",
        providerAvatarUrl: mediaUrl(r.providerAvatarPath), totalCents: r.totalCents, city: r.city,
        canReview: customerFlags(r, now, settings.reviewWindowDays, settings.disputeWindowHours, reviewed.has(r.id), false).canReview,
      })),
      total,
      page: pg.page,
      pageSize: pg.pageSize,
    };
  });
}

// ---------------------------------------------------------------------------
// Provider reads (provider_bookings view: no e-mail, address only after confirmation, never the Start-Code)
// ---------------------------------------------------------------------------
interface ProviderBookingRow {
  id: string;
  reference: string;
  status: BookingStatus;
  bookingMode: "instant" | "request";
  startsAt: Date;
  endsAt: Date;
  durationMinutes: number;
  serviceName: string;
  locationKind: "home" | "hotel" | "office" | "other";
  postalCode: string;
  city: string;
  distanceKm: string;
  customerNotes: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
  addressLine: string | null;
  addressDetails: string | null;
  customerPhone: string | null;
  servicePriceCents: number;
  travelFeeCents: number;
  commissionRate: string;
  commissionTier: "base" | "repeat" | "own_client";
  commissionCents: number;
  providerPayoutCents: number;
  isRepeatClient: boolean;
  cancellationFeeCents: number;
  respondBy: Date | null;
  confirmedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancelledBy: "customer" | "provider" | "admin" | "system" | null;
  cancellationReason: string | null;
  customerCompletedCount: number;
}

const PROVIDER_BOOKING_COLUMNS = `id, reference, status, booking_mode, starts_at, ends_at, duration_minutes, service_name, location_kind,
  postal_code, city, distance_km::text as distance_km, customer_notes, customer_first_name, customer_last_name, address_line,
  address_details, customer_phone, service_price_cents, travel_fee_cents, commission_rate::text as commission_rate, commission_tier,
  commission_cents, provider_payout_cents, is_repeat_client, cancellation_fee_cents, respond_by, confirmed_at, started_at,
  completed_at, cancelled_at, cancelled_by, cancellation_reason, customer_completed_count`;

export function toProviderBooking(r: ProviderBookingRow, now = new Date()): ProviderBookingDTO {
  const t = now.getTime();
  const start = r.startsAt.getTime();
  const startFrom = start - START_WINDOW_MINUTES * 60_000;
  const noShowFrom = start + NO_SHOW_AFTER_MINUTES * 60_000;
  const canStart = canTransition(r.status, "in_progress", "provider") && t >= startFrom;
  const canComplete = (r.status === "confirmed" || r.status === "in_progress") && t >= start;
  const canNoShow = r.status === "confirmed" && t >= noShowFrom;
  return {
    id: r.id,
    reference: r.reference,
    status: r.status,
    statusLabel: STATUS_LABELS_DE[r.status],
    bookingMode: r.bookingMode,
    startsAt: r.startsAt.toISOString(),
    endsAt: r.endsAt.toISOString(),
    durationMinutes: r.durationMinutes,
    serviceName: r.serviceName,
    customer: { firstName: r.customerFirstName, lastName: r.customerLastName, phone: r.customerPhone, completedBookings: r.customerCompletedCount },
    location: { kind: r.locationKind, postalCode: r.postalCode, city: r.city, addressLine: r.addressLine, details: r.addressDetails, distanceKm: num(r.distanceKm) },
    notes: r.customerNotes,
    isRepeatClient: r.isRepeatClient,
    earnings: {
      servicePriceCents: r.servicePriceCents, travelFeeCents: r.travelFeeCents, commissionRate: Number(r.commissionRate),
      commissionTier: r.commissionTier, commissionCents: r.commissionCents, payoutCents: r.providerPayoutCents, cancellationFeeCents: r.cancellationFeeCents,
    },
    respondBy: r.respondBy?.toISOString() ?? null,
    confirmedAt: r.confirmedAt?.toISOString() ?? null,
    startedAt: r.startedAt?.toISOString() ?? null,
    completedAt: r.completedAt?.toISOString() ?? null,
    cancelledAt: r.cancelledAt?.toISOString() ?? null,
    cancelledBy: r.cancelledBy,
    cancellationReason: r.cancellationReason,
    actions: {
      canAccept: r.status === "requested" && (!r.respondBy || r.respondBy.getTime() > t),
      canDecline: r.status === "requested" && (!r.respondBy || r.respondBy.getTime() > t),
      canStart,
      canComplete,
      canMarkNoShow: canNoShow,
      canCancel: r.status === "confirmed" && t < start,
    },
    canStart,
    canComplete,
    canNoShow,
    startAvailableAt: r.status === "confirmed" ? new Date(startFrom).toISOString() : null,
    noShowAvailableAt: r.status === "confirmed" ? new Date(noShowFrom).toISOString() : null,
  };
}

export async function queryProviderBookings(tx: Queryable, where: (t: Queryable) => Fragment): Promise<ProviderBookingRow[]> {
  return tx<ProviderBookingRow[]>`select ${tx.unsafe(PROVIDER_BOOKING_COLUMNS)} from public.provider_bookings ${where(tx)}`;
}

export async function getBookingForProvider(session: Session, bookingId: string): Promise<ProviderBookingDTO | null> {
  const s = requireRoleIn(session, "provider");
  const id = parse(zUuid, bookingId);
  return withUser(s.userId, async (tx) => {
    const [r] = await queryProviderBookings(tx, (t) => t`where id = ${id}`);
    return r ? toProviderBooking(r) : null;
  });
}

export async function listProviderBookings(session: Session, filter: ProviderBookingFilter = "upcoming", page = 1, pageSize = 30): Promise<Paginated<ProviderBookingDTO>> {
  const s = requireRoleIn(session, "provider");
  const f = parse(z.enum(["requests", "upcoming", "past", "today", "all"]), filter);
  const pg = paging(page, pageSize, 30);
  await runBookingMaintenanceLazily();
  return withUser(s.userId, async (tx) => {
    const today = todayBerlin();
    const cond = (t: Queryable) => {
      switch (f) {
        case "requests":
          return t`status = 'requested'`;
        case "upcoming":
          return t`status in ('confirmed', 'in_progress') and ends_at > now()`;
        case "past":
          return t`(status not in ('requested', 'confirmed', 'in_progress') or ends_at <= now())`;
        case "today":
          return t`(starts_at at time zone 'Europe/Berlin')::date = ${today}::date and status in ('confirmed', 'in_progress', 'completed', 'requested')`;
        default:
          return t`true`;
      }
    };
    const asc = f === "requests" || f === "upcoming" || f === "today";
    const rows = await queryProviderBookings(tx, (t) => t`where ${cond(t)} order by starts_at ${asc ? t`asc` : t`desc`} limit ${pg.pageSize} offset ${pg.offset}`);
    const [{ total }] = await tx<{ total: number }[]>`select count(*)::int as total from public.provider_bookings where ${cond(tx)}`;
    const now = new Date();
    return { items: rows.map((r) => toProviderBooking(r, now)), total, page: pg.page, pageSize: pg.pageSize };
  });
}

// ---------------------------------------------------------------------------
// Rebooking
// ---------------------------------------------------------------------------
export async function rebookOptions(session: Session, bookingId: string): Promise<RebookOptionsDTO> {
  const s = requireRoleIn(session, "customer");
  const id = parse(zUuid, bookingId);
  const base = await withUser(s.userId, async (tx) => {
    const [b] = await tx<{ id: string; providerId: string; providerServiceId: string; serviceId: string; serviceName: string; durationMinutes: number; postalCode: string; addressLine: string }[]>`
      select id, provider_id, provider_service_id, service_id, service_name, duration_minutes, postal_code, address_line
      from public.bookings where id = ${id} and customer_id = ${s.userId}`;
    if (!b) throw new ServiceError("not_found", "Buchung nicht gefunden.");
    const [prov] = await tx<ProviderCardRow[]>`
      select ${tx.unsafe(PROVIDER_CARD_COLUMNS)} from public.providers p
      left join public.postal_codes pc on pc.postal_code = p.base_postal_code left join public.cities ci on ci.slug = pc.city_slug
      where p.id = ${b.providerId} and p.status = 'approved'`;
    if (!prov) throw new ServiceError("unavailable", "Dieser Profi ist derzeit nicht buchbar.");
    // Same offering if still active, otherwise the provider's active offering of the same service.
    const [offering] = await tx<{ id: string; priceCents: number; durationMinutes: number }[]>`
      select id, price_cents, duration_minutes from public.provider_services
      where provider_id = ${b.providerId} and is_active and (id = ${b.providerServiceId} or service_id = ${b.serviceId})
      order by (id = ${b.providerServiceId}) desc, abs(duration_minutes - ${b.durationMinutes}) limit 1`;
    if (!offering) throw new ServiceError("unavailable", "Diese Leistung wird nicht mehr angeboten.");
    const [addr] = await tx<{ id: string }[]>`
      select id from public.addresses where user_id = ${s.userId} and postal_code = ${b.postalCode}
        and (street || ' ' || house_number) = ${b.addressLine} limit 1`;
    const slots = await queryAvailability(tx, b.providerId, offering.id, todayBerlin(), 7, new Date());
    return { b, prov, offering, addressId: addr?.id ?? null, slots };
  });
  const hasSlot = base.slots.some((d) => d.slots.length > 0);
  let alternatives: RebookOptionsDTO["alternatives"] = [];
  if (!hasSlot) {
    const res = await searchProviders({ postalCode: base.b.postalCode, serviceId: base.b.serviceId, pageSize: 4 }, s, { logDemand: false });
    alternatives = res.results.filter((r) => r.providerId !== base.b.providerId).slice(0, 3);
  }
  return {
    bookingId: base.b.id,
    providerServiceId: base.offering.id,
    provider: toProviderCard(base.prov),
    serviceName: base.b.serviceName,
    durationMinutes: base.offering.durationMinutes,
    priceCents: base.offering.priceCents,
    addressId: base.addressId,
    postalCode: base.b.postalCode,
    slots: base.slots,
    alternatives,
  };
}

