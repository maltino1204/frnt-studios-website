"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { homeForRole } from "../auth/guards";
import { getAuthAdapter, getRequestMeta, getSession } from "../auth/session";
import { loadSession } from "../auth/session-store";
import { fail, formToObject, input, safeNext, toActionError, withSession } from "./_run";
import type { ActionResult } from "./types";

/**
 * Auth actions (forms with useActionState). On success they redirect
 * (redirect() is called outside try/catch, as required by Next.js).
 */

const SignInSchema = z.object({
  email: z.string().trim().email("Bitte geben Sie eine gültige E-Mail-Adresse ein."),
  password: z.string().min(1, "Bitte geben Sie Ihr Passwort ein."),
  next: z.string().optional(),
});

export async function signInAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  let target: string;
  try {
    const v = input(SignInSchema, formToObject(formData));
    const adapter = await getAuthAdapter();
    const { userId } = await adapter.signIn(v.email, v.password, await getRequestMeta());
    const session = await loadSession(userId);
    if (!session) return fail("Dieses Konto ist gesperrt. Bitte wenden Sie sich an den SOMA-Support.");
    target = safeNext(v.next) ?? homeForRole(session.role);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/", "layout");
  redirect(target);
}

const SignUpSchema = z.object({
  email: z.string().trim().email("Bitte geben Sie eine gültige E-Mail-Adresse ein.").max(254),
  password: z.string().min(10, "Mindestens 10 Zeichen.").max(200),
  firstName: z.string().trim().min(1, "Bitte geben Sie Ihren Vornamen an.").max(80),
  lastName: z.string().trim().min(1, "Bitte geben Sie Ihren Nachnamen an.").max(80),
  role: z.enum(["customer", "provider"]).default("customer"),
  referralCode: z.string().trim().max(16).optional(),
  inviteCode: z.string().trim().max(16).optional(),
  marketingOptIn: z.boolean().optional().default(false),
  acceptTerms: z.literal(true, { error: "Bitte akzeptieren Sie die AGB und die Datenschutzerklärung." }),
  next: z.string().optional(),
});

export async function signUpAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  let target: string;
  try {
    const v = input(SignUpSchema, formToObject(formData));
    const adapter = await getAuthAdapter();
    await adapter.signUp(
      {
        email: v.email, password: v.password, firstName: v.firstName, lastName: v.lastName, role: v.role,
        referralCode: v.referralCode, providerInviteCode: v.inviteCode, marketingOptIn: v.marketingOptIn,
      },
      await getRequestMeta(),
    );
    target = safeNext(v.next) ?? (v.role === "provider" ? "/pro/registrieren" : "/konto");
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/", "layout");
  redirect(target);
}

export async function signOutAction(): Promise<void> {
  try {
    await (await getAuthAdapter()).signOut();
  } catch (e) {
    console.error("[auth] sign-out failed", e);
  }
  revalidatePath("/", "layout");
  redirect("/");
}

const EmailSchema = z.object({ email: z.string().trim().email("Bitte geben Sie eine gültige E-Mail-Adresse ein.") });

/** Always answers with the same message (no account enumeration). */
export async function requestPasswordResetAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const v = input(EmailSchema, formToObject(formData));
    await (await getAuthAdapter()).requestPasswordReset(v.email);
    return { ok: true, data: undefined, message: "Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link geschickt." };
  } catch (e) {
    return toActionError(e);
  }
}

const ResetSchema = z
  .object({ token: z.string().min(10, "Der Link ist ungültig."), password: z.string().min(10, "Mindestens 10 Zeichen.").max(200), passwordConfirm: z.string() })
  .refine((v) => v.password === v.passwordConfirm, { message: "Die Passwörter stimmen nicht überein.", path: ["passwordConfirm"] });

export async function resetPasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const v = input(ResetSchema, formToObject(formData));
    await (await getAuthAdapter()).resetPassword(v.token, v.password);
  } catch (e) {
    return toActionError(e);
  }
  redirect("/anmelden?passwort=neu");
}

const ChangeSchema = z
  .object({ currentPassword: z.string().min(1, "Bitte geben Sie Ihr aktuelles Passwort ein."), newPassword: z.string().min(10, "Mindestens 10 Zeichen.").max(200), newPasswordConfirm: z.string() })
  .refine((v) => v.newPassword === v.newPasswordConfirm, { message: "Die Passwörter stimmen nicht überein.", path: ["newPasswordConfirm"] });

export async function changePasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return withSession(undefined, async (s) => {
    const v = input(ChangeSchema, formToObject(formData));
    await (await getAuthAdapter()).changePassword(s.userId, v.currentPassword, v.newPassword);
  }, "Ihr Passwort wurde geändert.");
}

/** Current session for Client Components that need it after hydration (null when signed out). */
export async function getSessionAction(): Promise<ActionResult<{ userId: string; role: string; firstName: string | null } | null>> {
  const s = await getSession();
  return { ok: true, data: s ? { userId: s.userId, role: s.role, firstName: s.firstName } : null };
}
