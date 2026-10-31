import type { Metadata } from "next";
import { formatDate } from "@/lib/format";
import { formatInt, fullName } from "@/components/admin/format";
import { PROVIDER_STATUS, ROLE } from "@/components/admin/labels";
import { AdminPageHeader } from "@/components/admin/page";
import { AdminTable, CellLink, hrefWith, numCell, rowAction, rowLink, TablePager } from "@/components/admin/table";
import { FilterForm, SearchField, SegmentedLinks } from "@/components/admin/toolbar";
import { UserBlockButton } from "@/components/admin/user-actions";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState, Status } from "@/components/ui/feedback";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import type { AppRole } from "@/server/dto";
import { listUsersFiltered } from "@/server/services/admin-ext";

export const metadata: Metadata = { title: "Nutzer" };

const ROLES: Array<{ key?: AppRole; label: string }> = [{ label: "Alle" }, { key: "customer", label: "Kundschaft" }, { key: "provider", label: "Profis" }, { key: "admin", label: "Admins" }];
const STATES: Array<{ key?: "active" | "blocked"; label: string }> = [{ label: "Alle" }, { key: "active", label: "Aktiv" }, { key: "blocked", label: "Gesperrt" }];

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; rolle?: string; status?: string; seite?: string }> }) {
  const session = await requireRole("admin", routes.admin.users());
  const sp = await searchParams;
  const role = ROLES.find((r) => r.key === sp.rolle)?.key;
  const status = STATES.find((s) => s.key === sp.status)?.key;
  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.seite) || 1);
  const [list, blocked] = await Promise.all([
    listUsersFiltered(session, { q, role, status, page, pageSize: 25 }),
    listUsersFiltered(session, { status: "blocked", pageSize: 1 }),
  ]);
  const current = { q, rolle: role, status };

  return (
    <>
      <AdminPageHeader group="Marktplatz" title="Nutzer" description={`${formatInt(list.total)} ${q || role || status ? "Treffer" : "Konten"} · ${formatInt(blocked.total)} gesperrt`} />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <FilterForm action={routes.admin.users()} hidden={{ rolle: role, status }} resetHref={q ? hrefWith(routes.admin.users(), {}, { rolle: role, status }) : undefined}>
            <SearchField name="q" defaultValue={q} placeholder="Name oder E-Mail" className="min-w-0 flex-1 sm:w-80 sm:flex-none" />
          </FilterForm>
          <div className="flex flex-col gap-2 md:flex-row md:gap-6">
            <SegmentedLinks
              label="Rolle"
              items={ROLES.map((r) => ({ href: hrefWith(routes.admin.users(), { q, status }, { rolle: r.key }), label: r.label, active: role === r.key }))}
            />
            <SegmentedLinks
              label="Status"
              items={STATES.map((s) => ({ href: hrefWith(routes.admin.users(), { q, rolle: role }, { status: s.key }), label: s.label, active: status === s.key }))}
            />
          </div>
        </div>

        {list.items.length === 0 ? (
          <EmptyState seed="nutzer-leer" title="Keine Konten gefunden.">
            {q ? `Niemand passt zu „${q}“.` : "Für diese Filter gibt es keine Konten."}
          </EmptyState>
        ) : (
          <div>
            <AdminTable label="Nutzer" stickyHeader>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">E-Mail</th>
                  <th scope="col">Rolle</th>
                  <th scope="col">Konto</th>
                  <th scope="col" className="text-right">Buchungen</th>
                  <th scope="col">Registriert</th>
                  <th scope="col" className="text-right">
                    <span className="sr-only">Aktionen</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((u) => {
                  const name = fullName(u.firstName, u.lastName);
                  return (
                    <tr key={u.id} className={rowLink}>
                      <td>
                        <span className="flex items-center gap-2.5">
                          <Avatar name={name} size={24} />
                          <CellLink row href={`/admin/nutzer/${u.id}`}>
                            {name}
                          </CellLink>
                        </span>
                      </td>
                      <td className="max-w-64 truncate text-ink-muted" title={u.email}>
                        {u.email}
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5">
                          {ROLE[u.role]}
                          {u.providerStatus ? <span className="type-caption text-ink-muted">· {PROVIDER_STATUS[u.providerStatus].label}</span> : null}
                        </span>
                      </td>
                      <td>{u.blockedAt ? <Status tone="danger">Gesperrt</Status> : <Status tone="success">Aktiv</Status>}</td>
                      <td className={numCell}>{formatInt(u.bookingsCount)}</td>
                      <td className="num text-ink-muted">{formatDate(u.createdAt)}</td>
                      <td className="text-right">
                        {u.id === session.userId ? (
                          <span className="type-caption text-ink-muted">Eigenes Konto</span>
                        ) : (
                          <span className={`inline-flex ${rowAction}`}>
                            <UserBlockButton userId={u.id} name={name} blocked={!!u.blockedAt} role={ROLE[u.role]} />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </AdminTable>
            <TablePager page={list.page} pageSize={list.pageSize} total={list.total} href={(n) => hrefWith(routes.admin.users(), current, { seite: n })} />
          </div>
        )}
      </div>
    </>
  );
}
