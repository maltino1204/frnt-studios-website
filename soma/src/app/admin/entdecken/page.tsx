import type { Metadata } from "next";
import { ExternalLink, Plus } from "lucide-react";
import { ExploreRowActions } from "@/components/admin/explore-row-actions";
import { formatDateTime } from "@/components/admin/format";
import { AdminPageHeader } from "@/components/admin/page";
import { AdminTable, CellLink, numCell, rowAction, rowLink } from "@/components/admin/table";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Notice, Status, type StatusTone } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { COLLECTION_STATUS_LABEL, type CollectionStatus } from "@/server/domain/explore";
import { listExploreCollectionsAdmin } from "@/server/services/explore-admin";

export const metadata: Metadata = { title: "Entdecken" };

const TONE: Record<CollectionStatus, StatusTone> = { draft: "neutral", scheduled: "accent", live: "success", ended: "neutral" };

function windowText(from: string | null, until: string | null): string {
  if (!from && !until) return "Unbegrenzt";
  if (from && until) return `${formatDateTime(from)} – ${formatDateTime(until)}`;
  return from ? `ab ${formatDateTime(from)}` : `bis ${formatDateTime(until as string)}`;
}

/** „Von SOMA ausgewählt“: the collections on /entdecken. Admin only; every write is audited. */
export default async function AdminEntdeckenPage() {
  const session = await requireRole("admin", routes.admin.explore());
  const rows = await listExploreCollectionsAdmin(session);
  return (
    <>
      <AdminPageHeader
        group="System"
        title="Entdecken"
        description="Themen für „Von SOMA ausgewählt“ auf /entdecken. Öffentlich erscheint eine Sammlung, wenn sie aktiv ist und ihr Zeitraum läuft. Änderungen sind sofort live und werden protokolliert."
        actions={
          <>
            <ButtonLink href={routes.explore()} target="_blank" size="s" variant="ghost" icon={<Icon icon={ExternalLink} size={16} />}>
              Entdecken öffnen
            </ButtonLink>
            <ButtonLink href={routes.admin.exploreNew()} size="s" icon={<Icon icon={Plus} size={16} />}>
              Sammlung anlegen
            </ButtonLink>
          </>
        }
      />
      <Notice kind="info" className="mb-6 max-w-3xl">
        Ohne Bezahlung tragen Sammlungen den Hinweis „Von SOMA ausgewählt“. Eine bezahlte Platzierung muss als Anzeige mit Auftraggeber markiert werden; sie erscheint dann
        mit „Anzeige“ (UWG § 5a Abs. 4, DSA Art. 26).
      </Notice>
      {rows.length === 0 ? (
        <EmptyState title="Noch keine Sammlungen." seed="entdecken-leer" action={<ButtonLink href={routes.admin.exploreNew()}>Sammlung anlegen</ButtonLink>}>
          Die erste Sammlung erscheint auf /entdecken, sobald sie aktiv ist.
        </EmptyState>
      ) : (
        <AdminTable label="Sammlungen" className="min-w-[920px]">
          <thead>
            <tr>
              <th scope="col">Sammlung</th>
              <th scope="col">Status</th>
              <th scope="col">Zeitraum</th>
              <th scope="col">Kennzeichnung</th>
              <th scope="col" className="text-right">Einträge</th>
              <th scope="col" className="text-right">Sortierung</th>
              <th scope="col" className="text-right">
                <span className="sr-only">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={rowLink} data-testid={`sammlung-${r.slug}`}>
                <td>
                  <CellLink row href={routes.admin.exploreCollection(r.id)} sub={<span className="code-ref">/entdecken/{r.slug}</span>}>
                    {r.title}
                  </CellLink>
                </td>
                <td>
                  <Status tone={TONE[r.status]}>{COLLECTION_STATUS_LABEL[r.status]}</Status>
                </td>
                <td className="text-ink-muted num">{windowText(r.activeFrom, r.activeUntil)}</td>
                <td>{r.isSponsored ? <span className="font-[520] text-ink">{`Anzeige · ${r.sponsorName ?? ""}`}</span> : <span className="text-ink-muted">Von SOMA ausgewählt</span>}</td>
                <td className={numCell}>{r.itemCount}</td>
                <td className={`${numCell} text-ink-muted`}>{r.sortOrder}</td>
                <td className="text-right">
                  <div className={`${rowAction} inline-flex items-center justify-end gap-1`}>
                    <ExploreRowActions id={r.id} title={r.title} published={r.isPublished} previewHref={routes.explorePreview(r.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </>
  );
}
