import type { Metadata } from "next";
import { formatDate } from "@/lib/format";
import { formatInt } from "@/components/admin/format";
import { PROVIDER_STATUS } from "@/components/admin/labels";
import { AdminPageHeader, EMPTY } from "@/components/admin/page";
import { adminTable, CellLink, hrefWith, numCell, TablePager } from "@/components/admin/table";
import { FilterForm } from "@/components/admin/toolbar";
import { Table } from "@/components/ui/data";
import { EmptyState, Status } from "@/components/ui/feedback";
import { Input } from "@/components/ui/field";
import { TabLinks } from "@/components/ui/tabs";
import { Rating } from "@/components/ui/trust";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import type { ProviderStatus } from "@/server/dto";
import { listProvidersAdmin } from "@/server/services/admin";
import { listCategories, listCities } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Profis & Verifizierung" };

const TABS: Array<{ key: string; label: string; statuses?: ProviderStatus[] }> = [
  { key: "pruefung", label: "Zu prüfen", statuses: ["submitted", "in_review"] },
  { key: "freigegeben", label: "Freigegeben", statuses: ["approved"] },
  { key: "abgelehnt", label: "Abgelehnt", statuses: ["rejected"] },
  { key: "gesperrt", label: "Gesperrt", statuses: ["suspended"] },
  { key: "entwurf", label: "Entwurf", statuses: ["draft"] },
  { key: "alle", label: "Alle" },
];

export default async function ProvidersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; seite?: string }> }) {
  const session = await requireRole("admin", routes.admin.providers());
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.status) ?? TABS[TABS.length - 1];
  const page = Math.max(1, Number(sp.seite) || 1);
  const q = sp.q?.trim() || undefined;

  const [list, counts, categories, cities] = await Promise.all([
    listProvidersAdmin(session, { status: tab.statuses, q, page, pageSize: 25 }),
    Promise.all(TABS.filter((t) => t.statuses).map((t) => listProvidersAdmin(session, { status: t.statuses, pageSize: 1 }).then((r) => [t.key, r.total] as const))),
    listCategories(),
    listCities(),
  ]);
  const count = Object.fromEntries(counts) as Record<string, number>;
  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;
  const cityName = (slug: string | null) => (slug ? cities.find((c) => c.slug === slug)?.name ?? slug : EMPTY);
  const current = { status: sp.status, q };

  return (
    <>
      <AdminPageHeader
        group="Marktplatz"
        title="Profis & Verifizierung"
        description={`${formatInt(count.freigegeben ?? 0)} freigegeben · ${formatInt(count.pruefung ?? 0)} zu prüfen · ${formatInt(count.gesperrt ?? 0)} gesperrt`}
      />
      <div className="flex flex-col gap-4">
        <TabLinks
          label="Status"
          items={TABS.map((t) => ({
            href: hrefWith(routes.admin.providers(), {}, { status: t.key === "alle" ? undefined : t.key, q }),
            label: t.label,
            count: t.key === "pruefung" ? count.pruefung : undefined,
            active: t.key === tab.key,
          }))}
        />
        <FilterForm action={routes.admin.providers()} hidden={{ status: sp.status }} resetHref={q ? hrefWith(routes.admin.providers(), {}, { status: sp.status }) : undefined}>
          <Input dense label="Suche" hideLabel name="q" defaultValue={q} placeholder="Name oder Profil-Slug" className="w-full sm:w-72" type="search" />
        </FilterForm>

        {list.items.length === 0 ? (
          <EmptyState title={q ? "Keine Treffer." : "Hier ist niemand."}>
            {q ? `Keine Profis für „${q}“ in dieser Ansicht.` : "In diesem Status gibt es gerade keine Profis."}
          </EmptyState>
        ) : (
          <div>
            <Table dense className={adminTable}>
              <thead>
                <tr>
                  <th scope="col">Profi</th>
                  <th scope="col">Status</th>
                  <th scope="col">Stadt</th>
                  <th scope="col">Kategorien</th>
                  <th scope="col">Eingereicht</th>
                  <th scope="col" className="text-right">Ungeprüft</th>
                  <th scope="col" className="text-right">Fehlend</th>
                  <th scope="col">Bewertung</th>
                  <th scope="col" className="text-right">Abgeschlossen</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((p) => (
                  <tr key={p.providerId}>
                    <td>
                      <CellLink href={routes.admin.provider(p.providerId)}>{p.displayName}</CellLink>
                    </td>
                    <td>
                      <Status tone={PROVIDER_STATUS[p.status].tone}>{PROVIDER_STATUS[p.status].label}</Status>
                    </td>
                    <td>{cityName(p.citySlug)}</td>
                    <td className="max-w-64 truncate text-ink-muted" title={p.categories.map(catName).join(", ")}>
                      {p.categories.length ? p.categories.map(catName).join(", ") : EMPTY}
                    </td>
                    <td className="num text-ink-muted">{p.submittedAt ? formatDate(p.submittedAt) : EMPTY}</td>
                    <td className={numCell}>{p.documentsPending ? <span className="text-warning">{p.documentsPending}</span> : <span className="text-ink-muted">0</span>}</td>
                    <td className={numCell}>{p.missingDocuments ? <span className="text-danger">{p.missingDocuments}</span> : <span className="text-ink-muted">0</span>}</td>
                    <td>
                      <Rating avg={p.ratingAvg} count={p.ratingAvg != null ? 3 : 0} showCount={false} />
                    </td>
                    <td className={numCell}>{formatInt(p.completedCount)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <TablePager page={list.page} pageSize={list.pageSize} total={list.total} href={(n) => hrefWith(routes.admin.providers(), current, { seite: n })} />
          </div>
        )}
        <p className="type-caption text-ink-muted">„Fehlend“ zählt Pflichtdokumente, die fehlen oder noch nicht geprüft sind (plattformweit und je angebotener Kategorie).</p>
      </div>
    </>
  );
}
