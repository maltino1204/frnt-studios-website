"use server";

import { z } from "zod";
import { getSession } from "../auth/session";
import type { PostalCodeDTO } from "../dto";
import { lookupPostalCode } from "../services/catalog";
import { getRebookSuggestion, nearestPostalCode, type RebookSuggestionDTO } from "../services/site-ext";
import { input, publicAction } from "./_run";
import type { ActionResult } from "./types";

/** Discovery & brand surfaces (Agent 3a). Public, read-only. Voice: "Sie". */

const zPlz = z.string().trim().regex(/^\d{5}$/, "Bitte geben Sie eine fünfstellige Postleitzahl ein.");

/** Booking entry "Wo?": resolves a PLZ to its city ("10115 · Berlin"). `null` = unknown PLZ. */
export async function lookupPostalCodeAction(plz: string): Promise<ActionResult<PostalCodeDTO | null>> {
  return publicAction(async () => lookupPostalCode(input(zPlz, plz)));
}

const GeoSchema = z.object({ lat: z.number(), lng: z.number() });

/** Booking entry "Standort verwenden": nearest PLZ to the browser's location. */
export async function nearestPostalCodeAction(raw: { lat: number; lng: number }): Promise<ActionResult<PostalCodeDTO | null>> {
  return publicAction(async () => {
    const g = input(GeoSchema, raw);
    return nearestPostalCode(g.lat, g.lng);
  });
}

/** Home "Erneut buchen" row. Always ok; `null` for guests, other roles or no match. */
export async function getRebookSuggestionAction(): Promise<ActionResult<RebookSuggestionDTO | null>> {
  return publicAction(async () => {
    const session = await getSession();
    if (!session || session.role !== "customer") return null;
    return getRebookSuggestion(session);
  });
}
