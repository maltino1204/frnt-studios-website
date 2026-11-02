"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "../auth/session";
import {
  deleteExploreCollection,
  saveExploreCollection,
  setExploreCollectionPublished,
  type AdminExploreCollectionInput,
} from "../services/explore-admin";
import { getForYou, setPersonalizedSuggestions, type ForYouDTO } from "../services/explore";
import { input, publicAction, withSession, zGuid } from "./_run";
import type { ActionResult } from "./types";

/**
 * „Entdecken / Für dich“. The /entdecken page is static (ISR); the personal part loads through
 * getForYouAction after hydration. Customer voice: du. Admin voice: neutral.
 */

/** „Für dich“: `guest` for visitors and non-customer roles, `off` when the customer opted out (nothing computed). */
export async function getForYouAction(): Promise<ActionResult<ForYouDTO>> {
  return publicAction(async () => {
    const session = await getSession();
    if (!session || session.role !== "customer") return { state: "guest" } as const;
    return getForYou(session);
  });
}

/** „Persönliche Vorschläge“ on /konto/profil. */
export async function setPersonalizedSuggestionsAction(enabled: boolean): Promise<ActionResult<{ enabled: boolean }>> {
  return withSession(
    "customer",
    async (s) => ({ enabled: await setPersonalizedSuggestions(s, input(z.boolean(), enabled)) }),
    enabled ? "Persönliche Vorschläge sind an." : "Persönliche Vorschläge sind aus.",
  );
}

/** Collection pages are ISR: every admin write refreshes /entdecken, the collection pages and the admin list. */
function revalidateExplore(): void {
  revalidatePath("/entdecken");
  revalidatePath("/entdecken/[slug]", "page");
  revalidatePath("/admin/entdecken", "layout");
  revalidatePath("/ranking"); // names live sponsored placements
  revalidatePath("/sitemap.xml");
}

export async function saveExploreCollectionAction(raw: AdminExploreCollectionInput): Promise<ActionResult<{ id: string; slug: string }>> {
  return withSession("admin", async (s) => {
    const r = await saveExploreCollection(s, raw);
    revalidateExplore();
    return r;
  }, "Sammlung gespeichert.");
}

const PublishSchema = z.object({ id: zGuid, published: z.boolean() });

export async function setExploreCollectionPublishedAction(raw: z.input<typeof PublishSchema>): Promise<ActionResult<{ slug: string; status: string }>> {
  return withSession("admin", async (s) => {
    const v = input(PublishSchema, raw);
    const r = await setExploreCollectionPublished(s, v.id, v.published);
    revalidateExplore();
    return r;
  });
}

export async function deleteExploreCollectionAction(id: string): Promise<ActionResult<{ slug: string }>> {
  return withSession("admin", async (s) => {
    const r = await deleteExploreCollection(s, input(zGuid, id));
    revalidateExplore();
    return r;
  }, "Sammlung gelöscht.");
}
