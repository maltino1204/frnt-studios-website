"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { BookingStatus, DocumentDTO, DocumentKind, ProOnboardingDTO, ProProfileDTO, ProServiceDTO, ProSettingsDTO, WeeklyHoursDTO } from "../dto";
import { cancelBooking, completeBooking, markNoShow, providerRespond, startBooking } from "../services/bookings";
import {
  addTimeOff,
  deleteDocument,
  deletePortfolioItem,
  deleteProService,
  deleteTimeOff,
  getPayoutOnboardingLink,
  setWeeklyHours,
  submitForReview,
  updatePortfolioItem,
  updateProProfile,
  updateProSettings,
  updateServiceArea,
  uploadDocument,
  uploadPortfolioImage,
  upsertProService,
} from "../services/pro";
import { replyToReview } from "../services/reviews";
import { fileFrom, formToObject, input, toActionError, withSession, zGuid } from "./_run";
import type { ActionResult } from "./types";

/** Provider app actions (voice: "du"). All require role provider. */

const revalidatePro = () => revalidatePath("/pro", "layout");

const ProfileSchema = z.object({
  displayName: z.string(),
  headline: z.string().optional(),
  bio: z.string().optional(),
  yearsExperience: z.number().int().nullable().optional(),
  languages: z.array(z.string()),
});

export async function updateProProfileAction(raw: z.input<typeof ProfileSchema>): Promise<ActionResult<ProProfileDTO>> {
  return withSession("provider", async (s) => {
    const r = await updateProProfile(s, input(ProfileSchema, raw));
    revalidatePro();
    return r;
  }, "Profil gespeichert.");
}

const AreaSchema = z.object({
  basePostalCode: z.string(),
  serviceRadiusKm: z.number(),
  travelFeeBaseCents: z.number().int(),
  travelFeeIncludedKm: z.number(),
  travelFeePerKmCents: z.number().int(),
});

export async function updateServiceAreaAction(raw: z.input<typeof AreaSchema>): Promise<ActionResult<ProProfileDTO>> {
  return withSession("provider", async (s) => {
    const r = await updateServiceArea(s, input(AreaSchema, raw));
    revalidatePro();
    return r;
  }, "Einsatzgebiet gespeichert.");
}

const ServiceSchema = z.object({ serviceId: zGuid, durationMinutes: z.number().int(), priceCents: z.number().int(), isActive: z.boolean().optional() });

export async function upsertProServiceAction(raw: z.input<typeof ServiceSchema>): Promise<ActionResult<ProServiceDTO>> {
  return withSession("provider", async (s) => {
    const r = await upsertProService(s, input(ServiceSchema, raw));
    revalidatePro();
    return r;
  }).then((res) =>
    res.ok
      ? {
          ...res,
          message: res.data.awaitingDocuments
            ? `Leistung gespeichert. Sie wird freigeschaltet, sobald dein Nachweis geprüft ist: ${res.data.missingDocuments.join(", ") || "Qualifikationsnachweis"}. Lade ihn unter „Verifizierung“ hoch.`
            : "Leistung gespeichert.",
        }
      : res,
  );
}

export async function deleteProServiceAction(providerServiceId: string): Promise<ActionResult<{ deleted: boolean; deactivated: boolean }>> {
  return withSession("provider", async (s) => {
    const r = await deleteProService(s, input(zGuid, providerServiceId));
    revalidatePro();
    return r;
  });
}

const WindowsSchema = z.array(z.object({ weekday: z.number().int(), start: z.string(), end: z.string() })).max(42);

export async function setWeeklyHoursAction(windows: z.input<typeof WindowsSchema>): Promise<ActionResult<WeeklyHoursDTO[]>> {
  return withSession("provider", async (s) => {
    const r = await setWeeklyHours(s, input(WindowsSchema, windows));
    revalidatePro();
    return r;
  }, "Verfügbarkeit gespeichert.");
}

const TimeOffSchema = z.object({ start: z.string(), end: z.string(), reason: z.string().optional() });

export async function addTimeOffAction(raw: z.input<typeof TimeOffSchema>): Promise<ActionResult<{ id: string; conflictingBookings: number }>> {
  return withSession("provider", async (s) => {
    const r = await addTimeOff(s, input(TimeOffSchema, raw));
    revalidatePro();
    return r;
  });
}

export async function deleteTimeOffAction(timeOffId: string): Promise<ActionResult> {
  return withSession("provider", async (s) => {
    await deleteTimeOff(s, input(zGuid, timeOffId));
    revalidatePro();
  });
}

const DocumentFormSchema = z.object({
  kind: z.enum(["id_document", "business_registration", "qualification", "insurance", "other"]),
  categoryId: zGuid.optional(),
  /** "YYYY-MM-DD", inclusive (e.g. end of the insurance period) */
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte ein gültiges Datum angeben.").optional(),
});

/** Form action — fields: file (pdf/jpg/png ≤ 10 MB), kind, categoryId (optional), validUntil (optional, YYYY-MM-DD). */
export async function uploadDocumentAction(_prev: ActionResult<DocumentDTO> | null, formData: FormData): Promise<ActionResult<DocumentDTO>> {
  return withSession("provider", async (s) => {
    const v = input(DocumentFormSchema, formToObject(formData));
    const r = await uploadDocument(s, v.kind as DocumentKind, await fileFrom(formData), v.categoryId ?? null, v.validUntil ?? null);
    revalidatePro();
    return r;
  }, "Dokument hochgeladen. Wir prüfen es innerhalb von 48 Stunden.");
}

export async function deleteDocumentAction(documentId: string): Promise<ActionResult> {
  return withSession("provider", async (s) => {
    await deleteDocument(s, input(zGuid, documentId));
    revalidatePro();
  });
}

const PortfolioFormSchema = z.object({ caption: z.string().max(200).optional(), categoryId: zGuid.optional() });

/** Form action — fields: file (jpg/png/webp ≤ 8 MB), caption, categoryId. */
export async function uploadPortfolioImageAction(_prev: ActionResult<{ id: string; url: string }> | null, formData: FormData): Promise<ActionResult<{ id: string; url: string }>> {
  return withSession("provider", async (s) => {
    const v = input(PortfolioFormSchema, formToObject(formData));
    const r = await uploadPortfolioImage(s, await fileFrom(formData), v);
    revalidatePro();
    return r;
  }, "Bild hinzugefügt.");
}

const PortfolioUpdateSchema = z.object({ itemId: zGuid, caption: z.string().nullable().optional(), sortOrder: z.number().int().optional(), categoryId: zGuid.nullable().optional() });

export async function updatePortfolioItemAction(raw: z.input<typeof PortfolioUpdateSchema>): Promise<ActionResult> {
  return withSession("provider", async (s) => {
    const { itemId, ...rest } = input(PortfolioUpdateSchema, raw);
    await updatePortfolioItem(s, itemId, rest);
    revalidatePro();
  });
}

export async function deletePortfolioItemAction(itemId: string): Promise<ActionResult> {
  return withSession("provider", async (s) => {
    await deletePortfolioItem(s, input(zGuid, itemId));
    revalidatePro();
  });
}

const SubmitSchema = z.object({
  termsAccepted: z.literal(true, { error: "Bitte bestätige die AGB für Profis und den SOMA-Verhaltenskodex." }),
  vatMode: z.enum(["regular", "small_business"]).optional(),
});

/** Requires `termsAccepted: true` (onboarding "Prüfen" checkbox); optional `vatMode`. */
export async function submitForReviewAction(raw: z.input<typeof SubmitSchema>): Promise<ActionResult<ProOnboardingDTO>> {
  return withSession("provider", async (s) => {
    const r = await submitForReview(s, input(SubmitSchema, raw ?? {}));
    revalidatePro();
    return r;
  }, "Danke, wir prüfen dein Profil innerhalb von 48 Stunden.");
}

const SettingsSchema = z.object({
  bookingMode: z.enum(["instant", "request"]),
  leadTimeMinutes: z.number().int(),
  travelBufferMinutes: z.number().int(),
  maxAdvanceDays: z.number().int(),
  vatMode: z.enum(["regular", "small_business"]).optional(),
  notificationPreferences: z.object({ emailBookings: z.boolean(), emailReminders: z.boolean(), emailMarketing: z.boolean(), smsReminders: z.boolean(), pushBookings: z.boolean() }).optional(),
});

export async function updateProSettingsAction(raw: z.input<typeof SettingsSchema>): Promise<ActionResult<ProSettingsDTO>> {
  return withSession("provider", async (s) => {
    const r = await updateProSettings(s, input(SettingsSchema, raw));
    revalidatePro();
    return r;
  }, "Einstellungen gespeichert.");
}

/** Redirects to Stripe Connect onboarding (or back to /pro/einnahmen in Testmodus). */
export async function startPayoutOnboardingAction(): Promise<ActionResult> {
  let url: string;
  try {
    const r = await withSession("provider", (s) => getPayoutOnboardingLink(s));
    if (!r.ok) return r;
    url = r.data.url;
  } catch (e) {
    return toActionError(e);
  }
  revalidatePro();
  redirect(url);
}

// --- booking lifecycle (provider side) -----------------------------------------
const RespondSchema = z.object({ bookingId: zGuid, decision: z.enum(["accept", "decline"]), note: z.string().optional() });

export async function respondToRequestAction(raw: z.input<typeof RespondSchema>): Promise<ActionResult<{ status: BookingStatus }>> {
  return withSession("provider", async (s) => {
    const v = input(RespondSchema, raw);
    const r = await providerRespond(s, v.bookingId, v.decision, v.note);
    revalidatePro();
    return r;
  });
}

const StartSchema = z.object({ bookingId: zGuid, code: z.string() });

export async function startBookingAction(raw: z.input<typeof StartSchema>): Promise<ActionResult<{ status: BookingStatus }>> {
  return withSession("provider", async (s) => {
    const v = input(StartSchema, raw);
    const r = await startBooking(s, v.bookingId, v.code);
    revalidatePro();
    return r;
  }, "Termin gestartet. Viel Freude beim Termin.");
}

export async function completeBookingAction(bookingId: string): Promise<ActionResult<{ status: BookingStatus }>> {
  return withSession("provider", async (s) => {
    const r = await completeBooking(s, input(zGuid, bookingId));
    revalidatePro();
    return r;
  }, "Termin abgeschlossen.");
}

export async function markNoShowAction(bookingId: string): Promise<ActionResult<{ status: BookingStatus; feeCents: number }>> {
  return withSession("provider", async (s) => {
    const r = await markNoShow(s, input(zGuid, bookingId));
    revalidatePro();
    return r;
  });
}

const ProCancelSchema = z.object({ bookingId: zGuid, reason: z.string().trim().min(3, "Bitte gib einen Grund an.").max(500) });

export async function cancelBookingAsProviderAction(raw: z.input<typeof ProCancelSchema>): Promise<ActionResult<{ status: BookingStatus; feeCents: number; refundCents: number }>> {
  return withSession("provider", async (s) => {
    const v = input(ProCancelSchema, raw);
    const r = await cancelBooking(s, v.bookingId, v.reason);
    revalidatePro();
    return r;
  }, "Termin storniert. Die Kundin bzw. der Kunde erhält den vollen Betrag zurück.");
}

const ReplySchema = z.object({ reviewId: zGuid, reply: z.string() });

export async function replyToReviewAction(raw: z.input<typeof ReplySchema>): Promise<ActionResult> {
  return withSession("provider", async (s) => {
    const v = input(ReplySchema, raw);
    await replyToReview(s, v.reviewId, v.reply);
    revalidatePro();
  }, "Antwort veröffentlicht.");
}
