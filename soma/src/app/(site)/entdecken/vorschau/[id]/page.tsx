import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionView } from "@/components/site/explore-collection-view";
import { Notice } from "@/components/ui/feedback";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { COLLECTION_STATUS_LABEL } from "@/server/domain/explore";
import { getExploreCollectionPreview } from "@/server/services/explore-admin";

export const metadata: Metadata = { title: "Vorschau", robots: { index: false, follow: false } };

/**
 * Admin preview of a collection in any state (draft, scheduled, ended), resolved exactly like the public page.
 * Request-time (reads the session); the public collection pages stay static.
 */
export default async function SammlungVorschauPage({ params }: PageProps<"/entdecken/vorschau/[id]">) {
  const { id } = await params;
  const session = await requireRole("admin", routes.explorePreview(id));
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await getExploreCollectionPreview(session, id);
  if (!c) notFound();
  return (
    <CollectionView
      collection={c}
      notice={
        <Notice kind="info" title={`Vorschau · ${COLLECTION_STATUS_LABEL[c.status]}`}>
          {c.status === "live" ? "So sieht die Sammlung öffentlich aus." : "Nur für Admins sichtbar. Öffentlich erscheint die Sammlung, sobald sie aktiv ist und ihr Zeitraum begonnen hat."}{" "}
          <Link href={routes.admin.exploreCollection(c.id)}>Zurück zur Bearbeitung</Link>
        </Notice>
      }
    />
  );
}
