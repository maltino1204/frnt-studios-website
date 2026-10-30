"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AddressDTO, NotificationPreferencesDTO, ProfileDTO } from "../dto";
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
import { fileFrom, formToObject, input, withSession, zGuid } from "./_run";
import type { ActionResult } from "./types";

/** Customer account actions (voice: "Sie"). Profile/notification actions work for every role. */

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
  }, "Ihre Angaben wurden gespeichert.");
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
