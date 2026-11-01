"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertNotDemoAccount } from "../auth/demo-accounts";
import { authorize } from "../auth/guards";
import { verifyPasswordWithLimit } from "../auth/reauth";
import { getAuthAdapter } from "../auth/session";
import type { AddressDTO, NotificationPreferencesDTO, ProfileDTO } from "../dto";
import { ServiceError } from "../errors";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
  toggleFavorite,
  updateAddress,
  updateNotificationPreferences,
  updateProfile,
  uploadAvatar,
} from "../services/account";
import { markNotificationsRead } from "../services/notifications";
import { anonymizeOwnAccount, exportFileName, exportMyData } from "../services/privacy";
import { fileFrom, formToObject, input, toActionError, withSession, zGuid } from "./_run";
import type { ActionResult } from "./types";

/** Customer account actions (voice: "du"). Profile/notification actions work for every role. */

const ProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  marketingOptIn: z.boolean().optional().default(false),
});

/** Form action — fields: firstName, lastName, phone, marketingOptIn (checkbox). */
export async function updateProfileAction(_prev: ActionResult<ProfileDTO> | null, formData: FormData): Promise<ActionResult<ProfileDTO>> {
  return withSession(undefined, async (s) => {
    const r = await updateProfile(s, input(ProfileSchema, formToObject(formData)));
    revalidatePath("/konto", "layout");
    return r;
  }, "Deine Angaben sind gespeichert.");
}

const AddressFormSchema = z.object({
  id: zGuid.optional(),
  label: z.string().optional(),
  kind: z.enum(["home", "hotel", "office", "other"]).default("home"),
  street: z.string(),
  houseNumber: z.string(),
  postalCode: z.string(),
  city: z.string(),
  details: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

/** Form action — create (no id) or update (with id). */
export async function saveAddressAction(_prev: ActionResult<AddressDTO> | null, formData: FormData): Promise<ActionResult<AddressDTO>> {
  return withSession("customer", async (s) => {
    const { id, ...v } = input(AddressFormSchema, formToObject(formData));
    const r = id ? await updateAddress(s, id, v) : await createAddress(s, v);
    revalidatePath("/konto/adressen");
    return r;
  }, "Adresse gespeichert.");
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  return withSession("customer", async (s) => {
    await deleteAddress(s, input(zGuid, addressId));
    revalidatePath("/konto/adressen");
  }, "Adresse gelöscht.");
}

export async function setDefaultAddressAction(addressId: string): Promise<ActionResult> {
  return withSession("customer", async (s) => {
    await setDefaultAddress(s, input(zGuid, addressId));
    revalidatePath("/konto/adressen");
  });
}

export async function toggleFavoriteAction(providerId: string): Promise<ActionResult<{ favorite: boolean }>> {
  return withSession("customer", async (s) => {
    const r = await toggleFavorite(s, input(zGuid, providerId));
    revalidatePath("/konto/favoriten");
    return r;
  });
}

const PrefsSchema = z.object({
  emailBookings: z.boolean(), emailReminders: z.boolean(), emailMarketing: z.boolean(), smsReminders: z.boolean(), pushBookings: z.boolean(),
});

export async function updateNotificationPreferencesAction(prefs: NotificationPreferencesDTO): Promise<ActionResult<NotificationPreferencesDTO>> {
  return withSession(undefined, async (s) => {
    const r = await updateNotificationPreferences(s, input(PrefsSchema, prefs));
    revalidatePath("/konto/benachrichtigungen");
    return r;
  }, "Einstellungen gespeichert.");
}

export async function markNotificationsReadAction(ids: string[] | "all"): Promise<ActionResult<{ count: number }>> {
  return withSession(undefined, async (s) => {
    const list = ids === "all" ? "all" : input(z.array(zGuid).max(200), ids);
    return { count: await markNotificationsRead(s, list) };
  });
}

/** Form action — field `file` (jpeg/png/webp ≤ 8 MB). Customers and providers. */
export async function uploadAvatarAction(_prev: ActionResult<{ avatarUrl: string }> | null, formData: FormData): Promise<ActionResult<{ avatarUrl: string }>> {
  return withSession(["customer", "provider"], async (s) => {
    const r = await uploadAvatar(s, await fileFrom(formData));
    revalidatePath("/konto", "layout");
    revalidatePath("/pro", "layout");
    return r;
  }, "Foto gespeichert.");
}

// ---------------------------------------------------------------------------
// Datenschutz (DSGVO Art. 15/17/20) — audit-1 R20
// ---------------------------------------------------------------------------

/** "Meine Daten exportieren": JSON of profile, addresses, bookings, reviews, credits, notifications. */
export async function requestDataExportAction(): Promise<ActionResult<{ fileName: string; json: string }>> {
  return withSession(["customer", "provider"], async (s) => {
    const data = await exportMyData(s);
    return { fileName: exportFileName(s.userId), json: JSON.stringify(data, null, 2) };
  }, "Dein Datenexport ist bereit.");
}

const DeletionSchema = z.object({ password: z.string().min(1, "Bitte gib dein Passwort ein.").max(200) });

/**
 * Form action — field: password. Re-confirms the password, anonymises the account
 * (names, phone, addresses, login, sessions; bookings stay anonymised for accounting),
 * signs out and redirects to "/?konto=geloescht".
 */
export async function requestAccountDeletionAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const session = await authorize(["customer", "provider"]);
    await assertNotDemoAccount(session.userId);
    const v = input(DeletionSchema, formToObject(formData));
    const adapter = await getAuthAdapter();
    if (!(await verifyPasswordWithLimit(session.userId, v.password, (id, pw) => adapter.verifyPassword(id, pw)))) {
      throw new ServiceError("validation", "Das Passwort ist nicht korrekt.", { password: "Das Passwort ist nicht korrekt." });
    }
    await anonymizeOwnAccount(session);
    try {
      await adapter.signOut();
    } catch (e) {
      console.error("[account] sign-out after deletion failed", e);
    }
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/", "layout");
  redirect("/?konto=geloescht");
}
