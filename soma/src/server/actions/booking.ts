"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type {
  CreateBookingInput,
  CreateBookingResult,
  DisputeReason,
  QuoteDTO,
  QuoteInput,
  RebookOptionsDTO,
  SlotsByDayDTO,
  BookingStatus,
} from "../dto";
import { getSession } from "../auth/session";
import { openDispute } from "../services/account";
import { cancelBooking, confirmDevPayment, createBooking, CreateBookingInputSchema, quoteBooking, QuoteInputSchema, rebookOptions } from "../services/bookings";
import { getProviderAvailability } from "../services/providers";
import { createReview } from "../services/reviews";
import { joinWaitlist } from "../services/search";
import { formToObject, input, publicAction, withSession, zGuid } from "./_run";
import type { ActionResult } from "./types";

/** Customer booking actions (voice: "du"). */

const AvailabilitySchema = z.object({
  providerId: zGuid,
  providerServiceId: zGuid,
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum."),
  days: z.number().int().min(1).max(31).default(7),
});

/** Public: slots for the client-side slot picker. */
export async function loadAvailabilityAction(raw: z.input<typeof AvailabilitySchema>): Promise<ActionResult<SlotsByDayDTO[]>> {
  return publicAction(async () => {
    const v = input(AvailabilitySchema, raw);
    return getProviderAvailability(v.providerId, v.providerServiceId, v.from, v.days);
  });
}

/** Public (credits/saved addresses only with a customer session). */
export async function quoteBookingAction(raw: QuoteInput): Promise<ActionResult<QuoteDTO>> {
  return publicAction(async () => {
    input(QuoteInputSchema, raw);
    return quoteBooking(raw, await getSession());
  });
}

export async function createBookingAction(raw: CreateBookingInput): Promise<ActionResult<CreateBookingResult>> {
  return withSession("customer", async (s) => {
    input(CreateBookingInputSchema, raw);
    const result = await createBooking(s, raw);
    revalidatePath("/konto", "layout");
    return result;
  });
}

/** Testmodus: simulates the card authorization for the dev payment provider. */
export async function confirmDevPaymentAction(bookingId: string): Promise<ActionResult<{ status: BookingStatus }>> {
  return withSession("customer", async (s) => {
    const id = input(zGuid, bookingId);
    const r = await confirmDevPayment(s, id);
    revalidatePath(`/buchung/${id}`);
    revalidatePath("/konto", "layout");
    return r;
  }, "Zahlung im Testmodus bestätigt.");
}

const CancelSchema = z.object({ bookingId: zGuid, reason: z.string().trim().max(500).optional() });

export async function cancelBookingAction(raw: z.input<typeof CancelSchema>): Promise<ActionResult<{ status: BookingStatus; feeCents: number; refundCents: number }>> {
  return withSession("customer", async (s) => {
    const v = input(CancelSchema, raw);
    const r = await cancelBooking(s, v.bookingId, v.reason);
    revalidatePath(`/buchung/${v.bookingId}`);
    revalidatePath("/konto", "layout");
    return r;
  }, "Dein Termin wurde storniert.");
}

export async function rebookOptionsAction(bookingId: string): Promise<ActionResult<RebookOptionsDTO>> {
  return withSession("customer", async (s) => rebookOptions(s, input(zGuid, bookingId)));
}

const RATING_ERROR = "Bitte vergib 1 bis 5 Sterne.";

const ReviewSchema = z.object({
  bookingId: zGuid,
  // missing / non-numeric / out of range → one clear field error (audit-2 N5)
  rating: z.coerce.number({ error: RATING_ERROR }).int({ error: RATING_ERROR }).min(1, RATING_ERROR).max(5, RATING_ERROR),
  comment: z.string().trim().max(2000).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional().transform((t) => (t === undefined ? [] : Array.isArray(t) ? t : [t])),
});

/** Form action (useActionState) — fields: bookingId, rating, comment, tags (multiple). */
export async function createReviewAction(_prev: ActionResult<{ reviewId: string }> | null, formData: FormData): Promise<ActionResult<{ reviewId: string }>> {
  return withSession("customer", async (s) => {
    const v = input(ReviewSchema, formToObject(formData));
    const r = await createReview(s, v.bookingId, v.rating, v.comment ?? null, v.tags);
    revalidatePath(`/buchung/${v.bookingId}`);
    return r;
  }, "Danke für deine Bewertung.");
}

const DisputeSchema = z.object({
  bookingId: zGuid,
  reason: z.enum(["quality", "provider_no_show", "customer_no_show", "damage", "payment", "safety", "other"]),
  description: z.string().trim().min(10, "Bitte das Problem in mindestens 10 Zeichen beschreiben.").max(4000),
});

/** "Problem melden" — form action; fields: bookingId, reason, description. */
export async function openDisputeAction(_prev: ActionResult<{ disputeId: string }> | null, formData: FormData): Promise<ActionResult<{ disputeId: string }>> {
  return withSession(["customer", "provider"], async (s) => {
    const v = input(DisputeSchema, formToObject(formData));
    const r = await openDispute(s, v.bookingId, v.reason as DisputeReason, v.description);
    revalidatePath(`/buchung/${v.bookingId}`);
    return r;
  }, "Danke – wir kümmern uns darum und melden uns, sobald wir den Fall geprüft haben.");
}

const WaitlistSchema = z.object({
  email: z.string().trim().email("Bitte gib eine gültige E-Mail-Adresse ein."),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Bitte gib eine gültige Postleitzahl ein."),
  categorySlug: z.string().trim().max(60).optional(),
});

/** "Benachrichtigen, sobald verfügbar" — public form action. */
export async function joinWaitlistAction(_prev: ActionResult<{ joined: true }> | null, formData: FormData): Promise<ActionResult<{ joined: true }>> {
  return publicAction(async () => joinWaitlist(input(WaitlistSchema, formToObject(formData))), "Danke, wir sagen dir Bescheid, sobald Profis in deiner Nähe buchbar sind.");
}
