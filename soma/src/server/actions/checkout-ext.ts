"use server";

/**
 * Agent 3b extension (checkout): inline account creation / login on /buchen
 * WITHOUT a redirect, so the customer keeps the chosen slot and the address
 * typed so far. Same adapter calls as actions/auth.ts.
 *
 * Guest checkout (audit-1 R16, spec J1 "no password at checkout"): the guest gives
 * only first name, last name, e-mail and mobile number. The account is created with
 * a strong random password nobody knows, and the existing "set password" e-mail
 * (requestPasswordReset) lets the guest claim the account later. An e-mail that
 * already has an account gets the inline login instead.
 */
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthAdapter, getRequestMeta } from "../auth/session";
import { loadSession } from "../auth/session-store";
import { isServiceError } from "../errors";
import { updateProfile } from "../services/account";
import { fail, input, toActionError } from "./_run";
import type { ActionResult } from "./types";

const CheckoutSignUpSchema = z.object({
  firstName: z.string().trim().min(1, "Bitte geben Sie Ihren Vornamen an.").max(80),
  lastName: z.string().trim().min(1, "Bitte geben Sie Ihren Nachnamen an.").max(80),
  email: z.string().trim().email("Bitte geben Sie eine gültige E-Mail-Adresse ein.").max(254),
  phone: z.string().trim().regex(/^\+?[0-9 ()/-]{6,24}$/, "Bitte geben Sie eine gültige Mobilnummer an."),
  marketingOptIn: z.boolean().optional().default(false),
  inviteCode: z.string().trim().max(16).optional(),
});

export type CheckoutSignUpInput = z.input<typeof CheckoutSignUpSchema>;

export type CheckoutSignUpResult =
  /** account created and signed in; `claimEmailSent`: the "Passwort festlegen" e-mail is queued */
  | { kind: "created"; firstName: string; email: string; claimEmailSent: boolean }
  /** this e-mail already has an account: offer the inline login */
  | { kind: "exists"; email: string };

/** 32 random bytes → 43 base64url characters; never shown, only replaced through the e-mail link. */
function strongRandomPassword(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Creates a customer account without a password, signs it in (cookie), saves the
 * mobile number and sends the e-mail to set a password.
 */
export async function checkoutSignUpAction(raw: CheckoutSignUpInput): Promise<ActionResult<CheckoutSignUpResult>> {
  try {
    const v = input(CheckoutSignUpSchema, raw);
    const adapter = await getAuthAdapter();
    let userId: string;
    try {
      ({ userId } = await adapter.signUp(
        {
          email: v.email, password: strongRandomPassword(), firstName: v.firstName, lastName: v.lastName, role: "customer",
          providerInviteCode: v.inviteCode, marketingOptIn: v.marketingOptIn,
        },
        await getRequestMeta(),
      ));
    } catch (e) {
      if (isServiceError(e) && e.code === "conflict") return { ok: true, data: { kind: "exists", email: v.email } };
      throw e;
    }
    const session = await loadSession(userId);
    if (session) await updateProfile(session, { firstName: v.firstName, lastName: v.lastName, phone: v.phone });
    let claimEmailSent = true;
    try {
      // Same adapter path as "Passwort vergessen": a one-time link to set the password.
      await adapter.requestPasswordReset(v.email);
    } catch (e) {
      // The booking must not fail on the e-mail; the guest can still use "Passwort vergessen".
      claimEmailSent = false;
      console.error("[checkout] claim e-mail failed", e);
    }
    revalidatePath("/", "layout");
    return { ok: true, data: { kind: "created", firstName: v.firstName, email: v.email, claimEmailSent } };
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
