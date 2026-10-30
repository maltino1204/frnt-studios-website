import "server-only";

import { setActor, type Tx } from "../db/client";
import type { DocumentKind } from "../dto";
import { audit, loadSettings } from "./_shared";
import { notify } from "./notifications";
import { queryMissingDocuments } from "./pro";

/**
 * Verification follows the current documents (audit-2 N4): when a required
 * document of an APPROVED provider is rejected or reaches `expires_at`, the
 * provider is suspended automatically (out of search and profile, no badge,
 * no new bookings; existing bookings stay). The admin sees it in the overview
 * queue; the provider is told what to upload (du). Reinstating goes through
 * decideProvider("reinstate"), which is gated by all documents being approved.
 */

export const AUTO_SUSPEND_PREFIX = "Automatisch pausiert";

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  id_document: "Ausweisdokument",
  business_registration: "Gewerbeanmeldung",
  qualification: "Qualifikationsnachweis",
  insurance: "Berufshaftpflicht",
  other: "Dokument",
};

/** Suspends an approved provider whose required documents are no longer complete. Returns true when suspended. */
export async function suspendIfDocumentsIncomplete(tx: Tx, providerId: string, cause: string): Promise<boolean> {
  const [p] = await tx<{ status: string }[]>`select status from public.providers where id = ${providerId} for update`;
  if (!p || p.status !== "approved") return false;
  const missing = await queryMissingDocuments(tx, providerId, await loadSettings(tx), true);
  if (missing.length === 0) return false;
  const labels = missing.map((m) => `${m.label}${m.categoryName ? ` (${m.categoryName})` : ""}`);
  const note = `${AUTO_SUSPEND_PREFIX}: ${cause}. Fehlend oder ungeprüft: ${labels.join(", ")}.`;
  await setActor(tx, { actorId: null, actorRole: "system", note });
  await tx`update public.providers set status = 'suspended' where id = ${providerId}`;
  await audit(tx, null, "provider.auto_suspend", "provider", providerId, { cause, missing: labels });
  await notify(tx, "provider.suspended_documents", { providerId, note: `${cause}. Bitte lade ${labels.length === 1 ? "das fehlende Dokument" : "die fehlenden Dokumente"} hoch: ${labels.join(", ")}.` });
  return true;
}

/**
 * Maintenance step: approved documents past `expires_at` become "rejected" (note "Abgelaufen am …"),
 * then each affected approved provider is checked for suspension.
 */
export async function expireDocumentsInTx(tx: Tx, now: Date): Promise<{ expiredDocuments: number; suspendedProviders: number }> {
  const rows = await tx<{ providerId: string; kind: DocumentKind; expiresAt: Date }[]>`
    update public.provider_documents
    set status = 'rejected', reviewed_by = null, reviewed_at = ${now},
        review_note = 'Abgelaufen am ' || to_char(expires_at at time zone 'Europe/Berlin' - interval '1 second', 'DD.MM.YYYY')
                      || ' – bitte lade ein aktuelles Dokument hoch.'
    where status = 'approved' and expires_at is not null and expires_at <= ${now}
    returning provider_id, kind, expires_at`;
  let suspended = 0;
  const byProvider = new Map<string, DocumentKind[]>();
  for (const r of rows) byProvider.set(r.providerId, [...(byProvider.get(r.providerId) ?? []), r.kind]);
  for (const [providerId, kinds] of byProvider) {
    const what = [...new Set(kinds)].map((k) => DOCUMENT_KIND_LABELS[k]).join(", ");
    if (await suspendIfDocumentsIncomplete(tx, providerId, `${what} abgelaufen`)) suspended += 1;
  }
  return { expiredDocuments: rows.length, suspendedProviders: suspended };
}
