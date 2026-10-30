"use server";

/**
 * Agent 3b extension (checkout): inline account creation / login on /buchen
 * WITHOUT a redirect, so the customer keeps the chosen slot and the address
 * typed so far. Same adapter calls and validation rules as actions/auth.ts;
 * additionally stores the mobile number given at checkout on the profile.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthAdapter, getRequestMeta } from "../auth/session";
import { loadSession } from "../auth/session-store";
import { updateProfile } from "../services/account";
import { fail, input, toActionError } from "./_run";
import type { ActionResult } from "./types";

const CheckoutSignUpSchema = z.object({
  firstName: z.string().trim().min(1, "Bitte geben Sie Ihren Vornamen an.").max(80),
  lastName: z.string().trim().min(1, "Bitte geben Sie Ihren Nachnamen an.").max(80),
  email: z.string().trim().email("Bitte geben Sie eine gültige E-Mail-Adresse ein.").max(254),
  phone: z.string().trim().regex(/^\+?[0-9 ()/-]{6,24}$/, "Bitte geben Sie eine gültige Mobilnummer an."),
  password: z.string().min(10, "Mindestens 10 Zeichen.").max(200),
  acceptTerms: z.boolean().refine((v) => v, { message: "Bitte akzeptieren Sie die AGB und die Datenschutzerklärung." }),
  marketingOptIn: z.boolean().optional().default(false),
  inviteCode: z.string().trim().max(16).optional(),
});

export type CheckoutSignUpInput = z.input<typeof CheckoutSignUpSchema>;

/** Creates a customer account, signs it in (cookie) and saves the phone number. */
export async function checkoutSignUpAction(raw: CheckoutSignUpInput): Promise<ActionResult<{ firstName: string }>> {
  try {
    const v = input(CheckoutSignUpSchema, raw);
    const adapter = await getAuthAdapter();
    const { userId } = await adapter.signUp(
      {
        email: v.email, password: v.password, firstName: v.firstName, lastName: v.lastName, role: "customer",
        providerInviteCode: v.inviteCode, marketingOptIn: v.marketingOptIn,
      },
      await getRequestMeta(),
    );
    const session = await loadSession(userId);
    if (session) await updateProfile(session, { firstName: v.firstName, lastName: v.lastName, phone: v.phone });
    revalidatePath("/", "layout");
    return { ok: true, data: { firstName: v.firstName } };
  } catch (e) {
    return toActionError(e);
  }
}

const CheckoutSignInSchema = z.object({
  email: z.string().trim().email("Bitte geben Sie eine gültige E-Mail-Adresse ein."),
  password: z.string().min(1, "Bitte geben Sie Ihr Passwort ein."),
});

/** Signs in without leaving the checkout. Only customer accounts can book. */
export async function checkoutSignInAction(raw: z.input<typeof CheckoutSignInSchema>): Promise<ActionResult<{ firstName: string | null }>> {
  try {
    const v = input(CheckoutSignInSchema, raw);
    const adapter = await getAuthAdapter();
    const { userId } = await adapter.signIn(v.email, v.password, await getRequestMeta());
    const session = await loadSession(userId);
    if (!session) return fail("Dieses Konto ist gesperrt. Bitte wenden Sie sich an den SOMA-Support.");
    revalidatePath("/", "layout");
    if (session.role !== "customer") return fail("Mit diesem Konto sind keine Buchungen möglich. Bitte melden Sie sich mit einem Kundenkonto an.");
    return { ok: true, data: { firstName: session.firstName } };
  } catch (e) {
    return toActionError(e);
  }
}
