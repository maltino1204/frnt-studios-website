import type { Metadata } from "next";
import Link from "next/link";
import { formatDateTime, tzName } from "@/components/admin/format";
import { AdminPageHeader, EMPTY } from "@/components/admin/page";
import { adminTable, hrefWith, TablePager } from "@/components/admin/table";
import { FilterForm } from "@/components/admin/toolbar";
import { Table } from "@/components/ui/data";
import { EmptyState } from "@/components/ui/feedback";
import { Select } from "@/components/ui/field";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { listAuditFacets, listAuditLogFiltered } from "@/server/services/admin-ext";

export const metadata: Metadata = { title: "Protokoll" };

const ENTITY: Record<string, string> = {
  booking: "Buchung",
  provider: "Profi",
  provider_document: "Dokument",
  category: "Kategorie",
  service: "Leistung",
  commission_rule: "Provisionsregel",
  payout: "Auszahlung",
  dispute: "Streitfall",
  content_block: "Inhalt",
  platform_setting: "Einstellung",
  profile: "Konto",
  review: "Bewertung",
};

const ACTION: Record<string, string> = {
  "provider.approve": "Profi freigegeben",
  "provider.reject": "Profi abgelehnt",
  "provider.start_review": "Prüfung gestartet",
  "provider.suspend": "Profi gesperrt",
  "provider.reinstate": "Profi reaktiviert",
  "provider.commission_override": "Fester Provisionssatz",
  "document.approved": "Dokument geprüft",
  "document.rejected": "Dokument abgelehnt",
  "category.create": "Kategorie angelegt",
  "category.update": "Kategorie geändert",
  "service.create": "Leistung angelegt",
  "service.update": "Leistung geändert",
  "booking.admin_cancel": "Buchung storniert",
  "payment.refund": "Erstattung",
  "dispute.investigating": "Streitfall in Prüfung",
  "dispute.closed": "Streitfall geschlossen",
  "dispute.resolve": "Streitfall entschieden",
  "commission.create": "Provisionsregel gespeichert",
  "commission.deactivate": "Provisionsregel deaktiviert",
  "payout.batch": "Auszahlungslauf erstellt",
  "payout.paid": "Auszahlung bezahlt",
  "content.upsert": "Inhalt gespeichert",
  "setting.update": "Einstellung geändert",
  "user.block": "Konto gesperrt",
  "user.unblock": "Konto entsperrt",
  "credits.adjust": "Guthaben gebucht",
  "review.publish": "Bewertung veröffentlicht",
  "review.unpublish": "Bewertung ausgeblendet",
};

function entityHref(entity: string, id: string | null): string | null {
  if (!id) return null;
  if (entity === "booking") return routes.admin.booking(id);
  if (entity === "provider") return routes.admin.provider(id);
  if (entity === "dispute") return `${routes.admin.disputes()}?fall=${id}`;
  if (entity === "content_block") return `${routes.admin.content()}?block=${encodeURIComponent(id)}`;
  if (entity === "commission_rule") return `${routes.admin.commissions()}?verlauf=1`;
  if (entity === "platform_setting") return `${routes.admin.commissions()}#settings`;
  return null;
}

function summary(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (v == null || (Array.isArray(v) && v.length === 0)) continue;
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    parts.push(`${k}: ${s.length > 60 ? `${s.slice(0, 57)}…` : s}`);
  }
  return parts.join(" · ");
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ bereich?: string; aktion?: string; person?: string; seite?: string }> }) {
  const session = await requireRole("admin", routes.admin.audit());
  const sp = await searchParams;
  const facets = await listAuditFacets(session);
  const entity = facets.entities.includes(sp.bereich ?? "") ? sp.bereich : undefined;
  const action = facets.actions.includes(sp.aktion ?? "") ? sp.aktion : undefined;
  const actorId = facets.actors.some((a) => a.id === sp.person) ? sp.person : undefined;
  const page = Math.max(1, Number(sp.seite) || 1);
  const list = await listAuditLogFiltered(session, { entity, action, actorId, page, pageSize: 50 });
  const current = { bereich: entity, aktion: action, person: actorId };
  const active = Object.values(current).some(Boolean);

  return (
    <>
      <AdminPageHeader group="System" title="Protokoll" description={`Jede Änderung durch Admins wird hier unveränderlich festgehalten. Zeiten in ${tzName()}.`} />
      <div className="flex flex-col gap-4">
        <FilterForm action={routes.admin.audit()} resetHref={active ? routes.admin.audit() : undefined} label="Protokoll filtern">
          <Select dense label="Bereich" name="bereich" defaultValue={entity ?? ""} className="w-[calc(50%-6px)] sm:w-44">
            <option value="">Alle</option>
            {facets.entities.map((e) => (
              <option key={e} value={e}>
                {ENTITY[e] ?? e}
              </option>
            ))}
          </Select>
          <Select dense label="Aktion" name="aktion" defaultValue={action ?? ""} className="w-[calc(50%-6px)] sm:w-60">
            <option value="">Alle</option>
            {facets.actions.map((a) => (
              <option key={a} value={a}>
                {ACTION[a] ?? a}
              </option>
            ))}
          </Select>
          <Select dense label="Person" name="person" defaultValue={actorId ?? ""} className="w-full sm:w-48">
            <option value="">Alle</option>
            {facets.actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name || "Ohne Namen"}
              </option>
            ))}
          </Select>
        </FilterForm>

        {list.items.length === 0 ? (
          <EmptyState title="Keine Einträge.">{active ? "Für diese Filter gibt es keine Einträge." : "Sobald Admins etwas ändern, erscheint es hier."}</EmptyState>
        ) : (
          <div>
            <Table dense className={adminTable}>
              <thead>
                <tr>
                  <th scope="col">Zeitpunkt</th>
                  <th scope="col">Person</th>
                  <th scope="col">Aktion</th>
                  <th scope="col">Bereich</th>
                  <th scope="col">Objekt</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((e) => {
                  const href = entityHref(e.entity, e.entityId);
                  const details = summary(e.data);
                  return (
                    <tr key={e.id}>
                      <td className="num text-ink-muted">{formatDateTime(e.createdAt)}</td>
                      <td>{e.actorName ?? "System"}</td>
                      <td>
                        <span className="font-[520]" title={e.action}>
                          {ACTION[e.action] ?? <span className="code-ref">{e.action}</span>}
                        </span>
                      </td>
                      <td className="text-ink-muted">{ENTITY[e.entity] ?? e.entity}</td>
                      <td>
                        {e.entityId ? (
                          href ? (
                            <Link href={href} className="code-ref text-accent underline-offset-4 hover:underline" title={e.entityId}>
                              {e.entityId.length > 20 ? `${e.entityId.slice(0, 8)}…` : e.entityId}
                            </Link>
                          ) : (
                            <span className="code-ref text-ink-muted" title={e.entityId}>
                              {e.entityId.length > 20 ? `${e.entityId.slice(0, 8)}…` : e.entityId}
                            </span>
                          )
                        ) : (
                          EMPTY
                        )}
                      </td>
                      <td className="max-w-[28rem]">
                        {details ? (
                          <details className="group">
                            <summary className="cursor-pointer truncate text-ink-muted marker:content-none [&::-webkit-details-marker]:hidden" title="Details anzeigen">
                              {details}
                            </summary>
                            <pre className="mt-2 mb-2 max-h-60 overflow-auto bg-surface-sunken p-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-ink">{JSON.stringify(e.data, null, 2)}</pre>
                          </details>
                        ) : (
                          EMPTY
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <TablePager page={list.page} pageSize={list.pageSize} total={list.total} href={(n) => hrefWith(routes.admin.audit(), current, { seite: n })} />
          </div>
        )}
      </div>
    </>
  );
}
