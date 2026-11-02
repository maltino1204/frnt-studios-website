import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExploreEditor } from "@/components/admin/explore-editor";
import { exploreCoverOptions } from "@/components/admin/explore-images";
import { formatDateTime } from "@/components/admin/format";
import { AdminPageHeader } from "@/components/admin/page";
import { Status, type StatusTone } from "@/components/ui/feedback";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { COLLECTION_STATUS_LABEL, type CollectionStatus } from "@/server/domain/explore";
import { getExploreCollectionAdmin, getExploreEditorOptions } from "@/server/services/explore-admin";

export const metadata: Metadata = { title: "Sammlung bearbeiten" };

const TONE: Record<CollectionStatus, StatusTone> = { draft: "neutral", scheduled: "accent", live: "success", ended: "neutral" };

export default async function SammlungBearbeitenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole("admin", routes.admin.exploreCollection(id));
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [collection, options] = await Promise.all([getExploreCollectionAdmin(session, id), getExploreEditorOptions(session)]);
  if (!collection) notFound();
  return (
    <>
      <AdminPageHeader
        back={{ href: routes.admin.explore(), label: "Entdecken" }}
        title={collection.title}
        meta={<Status tone={TONE[collection.status]}>{COLLECTION_STATUS_LABEL[collection.status]}</Status>}
        description={`Zuletzt geändert ${formatDateTime(collection.updatedAt)}${collection.updatedByName ? ` von ${collection.updatedByName}` : ""}.`}
      />
      <ExploreEditor key={collection.updatedAt} initial={collection} options={options} covers={exploreCoverOptions()} />
    </>
  );
}
