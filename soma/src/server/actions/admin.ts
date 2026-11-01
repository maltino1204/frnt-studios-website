"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AnonymizeResultDTO, BookingStatus, CategoryDTO, PayoutDTO, ProviderDecision, ProviderDecisionResult, ServiceDTO } from "../dto";
import {
  adjustCredits,
  adminCancelBooking,
  createCommissionRule,
  createPayoutBatch,
  deactivateCommissionRule,
  decideProvider,
  markPayoutPaid,
  moderateReview,
  refundPayment,
  resolveDispute,
  reviewDocument,
  setProviderCommissionOverride,
  setUserBlocked,
  updateDisputeStatus,
  updatePlatformSetting,
  upsertCategory,
  upsertContentBlock,
  upsertService,
  type CategoryInput,
  type ServiceInput,
} from "../services/admin";
import { runBookingMaintenance, type MaintenanceResult } from "../services/booking-maintenance";
import { anonymizeUser, exportFileName, exportUserData } from "../services/privacy";
import { input, withSession, zGuid } from "./_run";
import type { ActionResult } from "./types";

/**
 * Admin actions (neutral voice). withSession("admin") checks the session role;
 * every admin service re-verifies the role in the database and writes audit_log.
 */
const revalidateAdmin = () => revalidatePath("/admin", "layout");
/**
 * Terms, commission and policies are rendered on public pages that are statically generated (ISR, 1 h): the landing
 * (trust rows, FAQ, commission strip), /fuer-profis, /stornierung and /hilfe (docs/landing/INTEGRATION.md C8).
 */
const revalidatePublicTerms = () => {
  for (const path of ["/", "/fuer-profis", "/stornierung", "/hilfe"]) revalidatePath(path);
};

const DecisionSchema = z.object({ providerId: zGuid, decision: z.enum(["approve", "reject", "start_review", "suspend", "reinstate"]), note: z.string().optional() });

export async function decideProviderAction(raw: z.input<typeof DecisionSchema>): Promise<ActionResult<ProviderDecisionResult>> {
  return withSession("admin", async (s) => {
    const v = input(DecisionSchema, raw);
    const r = await decideProvider(s, v.providerId, v.decision as ProviderDecision, v.note);
    revalidateAdmin();
    revalidatePath("/", "layout");
    return r;
  });
}

const DocSchema = z.object({
  documentId: zGuid,
  status: z.enum(["approved", "rejected"]),
  note: z.string().optional(),
  /** "YYYY-MM-DD", inclusive; sets expires_at on approval (insurance mainly) */
  validUntil: z.string().optional(),
});

/** Returns `providerSuspended: true` when a rejection paused an approved provider (audit-2 N4). */
export async function reviewDocumentAction(raw: z.input<typeof DocSchema>): Promise<ActionResult<{ providerSuspended: boolean; offeringsActivated: number }>> {
  return withSession("admin", async (s) => {
    const v = input(DocSchema, raw);
    const r = await reviewDocument(s, v.documentId, v.status, v.note, v.validUntil || null);
    revalidateAdmin();
    if (r.providerSuspended) revalidatePath("/profis", "layout");
    return r;
  });
}

const OverrideSchema = z.object({ providerId: zGuid, rate: z.number().nullable() });

export async function setProviderCommissionOverrideAction(raw: z.input<typeof OverrideSchema>): Promise<ActionResult> {
  return withSession("admin", async (s) => {
    const v = input(OverrideSchema, raw);
    await setProviderCommissionOverride(s, v.providerId, v.rate);
    revalidateAdmin();
  });
}

export async function upsertCategoryAction(raw: CategoryInput & { id?: string }): Promise<ActionResult<CategoryDTO>> {
  return withSession("admin", async (s) => {
    input(z.object({ id: zGuid.optional(), slug: z.string(), name: z.string() }).passthrough(), raw);
    const r = await upsertCategory(s, raw);
    revalidateAdmin();
    revalidatePath("/", "layout");
    return r;
  }, "Kategorie gespeichert.");
}

export async function upsertServiceAction(raw: ServiceInput & { id?: string }): Promise<ActionResult<ServiceDTO>> {
  return withSession("admin", async (s) => {
    input(z.object({ id: zGuid.optional(), categoryId: zGuid, slug: z.string(), name: z.string() }).passthrough(), raw);
    const r = await upsertService(s, raw);
    revalidateAdmin();
    revalidatePath("/", "layout");
    return r;
  }, "Leistung gespeichert.");
}

const AdminCancelSchema = z.object({ bookingId: zGuid, reason: z.string(), feeCents: z.number().int().min(0).default(0) });

export async function adminCancelBookingAction(raw: z.input<typeof AdminCancelSchema>): Promise<ActionResult<{ status: BookingStatus; feeCents: number }>> {
  return withSession("admin", async (s) => {
    const v = input(AdminCancelSchema, raw);
    const r = await adminCancelBooking(s, v.bookingId, v.reason, v.feeCents);
    revalidateAdmin();
    return r;
  }, "Buchung storniert.");
}

const RefundSchema = z.object({ bookingId: zGuid, amountCents: z.number().int(), reason: z.string() });

export async function refundPaymentAction(raw: z.input<typeof RefundSchema>): Promise<ActionResult<{ refundId: string }>> {
  return withSession("admin", async (s) => {
    const v = input(RefundSchema, raw);
    const r = await refundPayment(s, v.bookingId, v.amountCents, v.reason);
    revalidateAdmin();
    return r;
  }, "Erstattung ausgelöst.");
}

const DisputeStatusSchema = z.object({ disputeId: zGuid, status: z.enum(["investigating", "closed"]), note: z.string().optional() });

export async function updateDisputeStatusAction(raw: z.input<typeof DisputeStatusSchema>): Promise<ActionResult> {
  return withSession("admin", async (s) => {
    const v = input(DisputeStatusSchema, raw);
    await updateDisputeStatus(s, v.disputeId, v.status, v.note);
    revalidateAdmin();
  });
}

const ResolveSchema = z.object({ disputeId: zGuid, outcome: z.enum(["refund", "no_action"]), note: z.string(), refundCents: z.number().int().min(0).default(0) });

export async function resolveDisputeAction(raw: z.input<typeof ResolveSchema>): Promise<ActionResult> {
  return withSession("admin", async (s) => {
    const v = input(ResolveSchema, raw);
    await resolveDispute(s, v.disputeId, v.outcome, v.note, v.refundCents);
    revalidateAdmin();
  }, "Streitfall abgeschlossen.");
}

const RuleSchema = z.object({
  scope: z.enum(["global", "category", "provider"]),
  categoryId: zGuid.nullable().optional(),
  providerId: zGuid.nullable().optional(),
  rate: z.number(),
  repeatClientRate: z.number(),
  ownClientRate: z.number(),
});

export async function createCommissionRuleAction(raw: z.input<typeof RuleSchema>): Promise<ActionResult<{ id: string }>> {
  return withSession("admin", async (s) => {
    const r = await createCommissionRule(s, input(RuleSchema, raw));
    revalidateAdmin();
    revalidatePublicTerms();
    return r;
  }, "Provisionsregel gespeichert. Bestehende Buchungen behalten ihren Satz.");
}

export async function deactivateCommissionRuleAction(ruleId: string): Promise<ActionResult> {
  return withSession("admin", async (s) => {
    await deactivateCommissionRule(s, input(zGuid, ruleId));
    revalidateAdmin();
    revalidatePublicTerms();
  });
}

export async function createPayoutBatchAction(): Promise<ActionResult<{ payouts: PayoutDTO[]; totalCents: number; bookingCount: number }>> {
  return withSession("admin", async (s) => {
    const r = await createPayoutBatch(s);
    revalidateAdmin();
    return r;
  });
}

export async function markPayoutPaidAction(payoutId: string): Promise<ActionResult> {
  return withSession("admin", async (s) => {
    await markPayoutPaid(s, input(zGuid, payoutId));
    revalidateAdmin();
  });
}

const ContentSchema = z.object({ key: z.string(), value: z.json() });

export async function upsertContentBlockAction(raw: z.input<typeof ContentSchema>): Promise<ActionResult> {
  return withSession("admin", async (s) => {
    const v = input(ContentSchema, raw);
    await upsertContentBlock(s, v.key, v.value);
    revalidateAdmin();
    revalidatePath("/", "layout");
  }, "Inhalt gespeichert.");
}

const SettingSchema = z.object({ key: z.string(), value: z.json() });

export async function updatePlatformSettingAction(raw: z.input<typeof SettingSchema>): Promise<ActionResult> {
  return withSession("admin", async (s) => {
    const v = input(SettingSchema, raw);
    await updatePlatformSetting(s, v.key, v.value);
    revalidateAdmin();
    revalidatePublicTerms();
  }, "Einstellung gespeichert.");
}

const BlockSchema = z.object({ userId: zGuid, blocked: z.boolean(), reason: z.string() });

export async function setUserBlockedAction(raw: z.input<typeof BlockSchema>): Promise<ActionResult> {
  return withSession("admin", async (s) => {
    const v = input(BlockSchema, raw);
    await setUserBlocked(s, v.userId, v.blocked, v.reason);
    revalidateAdmin();
  });
}

const CreditSchema = z.object({ userId: zGuid, amountCents: z.number().int(), note: z.string(), reason: z.enum(["admin_adjustment", "goodwill"]).default("admin_adjustment") });

export async function adjustCreditsAction(raw: z.input<typeof CreditSchema>): Promise<ActionResult> {
  return withSession("admin", async (s) => {
    const v = input(CreditSchema, raw);
    await adjustCredits(s, v.userId, v.amountCents, v.note, v.reason);
    revalidateAdmin();
  }, "Guthaben gebucht.");
}

const ModerateSchema = z.object({ reviewId: zGuid, isPublished: z.boolean(), note: z.string().trim().max(500).optional() });

export async function moderateReviewAction(raw: z.input<typeof ModerateSchema>): Promise<ActionResult> {
  return withSession("admin", async (s) => {
    const v = input(ModerateSchema, raw);
    await moderateReview(s, v.reviewId, v.isPublished, v.note);
    revalidateAdmin();
    revalidatePath("/profis", "layout");
    revalidatePath("/"); // the landing's provider cards show ratings
  }, raw.isPublished ? "Bewertung wieder sichtbar." : "Bewertung ausgeblendet.");
}

const UserIdSchema = z.object({ userId: zGuid });

/** DSGVO export for one user (audited); the client offers `json` as a download named `fileName`. */
export async function exportUserDataAction(raw: z.input<typeof UserIdSchema>): Promise<ActionResult<{ fileName: string; json: string }>> {
  return withSession("admin", async (s) => {
    const v = input(UserIdSchema, raw);
    const data = await exportUserData(s, v.userId);
    revalidatePath("/admin/protokoll");
    return { fileName: exportFileName(v.userId), json: JSON.stringify(data, null, 2) };
  }, "Datenexport erstellt.");
}

const AnonymizeSchema = z.object({ userId: zGuid, reason: z.string() });

/** "Konto anonymisieren" (customers without open bookings/disputes); audited, sessions revoked. */
export async function anonymizeUserAction(raw: z.input<typeof AnonymizeSchema>): Promise<ActionResult<AnonymizeResultDTO>> {
  return withSession("admin", async (s) => {
    const v = input(AnonymizeSchema, raw);
    const r = await anonymizeUser(s, v.userId, v.reason);
    revalidateAdmin();
    return r;
  }, "Konto anonymisiert.");
}

/** Manual trigger of the booking maintenance job from the admin board. */
export async function runMaintenanceAction(): Promise<ActionResult<MaintenanceResult>> {
  return withSession("admin", async () => runBookingMaintenance());
}
