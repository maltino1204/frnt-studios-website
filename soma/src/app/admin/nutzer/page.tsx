import type { Metadata } from "next";
import { formatDate } from "@/lib/format";
import { formatInt, fullName } from "@/components/admin/format";
import { PROVIDER_STATUS, ROLE } from "@/components/admin/labels";
import { AdminPageHeader } from "@/components/admin/page";
import { AdminTable, CellLink, hrefWith, numCell, TablePager } from "@/components/admin/table";
import { ChipFilter, FilterForm } from "@/components/admin/toolbar";
import { UserBlockButton } from "@/components/admin/user-actions";
import { ChipLink } from "@/components/ui/chip";
import { EmptyState, Status } from "@/components/ui/feedback";
import { Input } from "@/components/ui/field";
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
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <FilterForm action={routes.admin.users()} hidden={{ rolle: role, status }} resetHref={q ? hrefWith(routes.admin.users(), {}, { rolle: role, status }) : undefined}>
            <Input dense label="Suche" hideLabel type="search" name="q" defaultValue={q} placeholder="Name oder E-Mail" className="w-full sm:w-72" />
          </FilterForm>
          <div className="flex flex-col gap-3 md:flex-row md:gap-8">
            <ChipFilter label="Rolle">
              {ROLES.map((r) => (
                <ChipLink key={r.label} href={hrefWith(routes.admin.users(), { q, status }, { rolle: r.key })} selected={role === r.key}>
                  {r.label}
                </ChipLink>
              ))}
            </ChipFilter>
            <ChipFilter label="Status">
              {STATES.map((s) => (
                <ChipLink key={s.label} href={hrefWith(routes.admin.users(), { q, rolle: role }, { status: s.key })} selected={status === s.key}>
                  {s.label}
                </ChipLink>
              ))}
            </ChipFilter>
          </div>
        </div>

        {list.items.length === 0 ? (
          <EmptyState title="Keine Konten gefunden.">{q ? `Niemand passt zu „${q}“.` : "Für diese Filter gibt es keine Konten."}</EmptyState>
        ) : (
          <div>
            <AdminTable label="Nutzer">
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
                    <tr key={u.id}>
                      <td>
                        <CellLink href={`/admin/nutzer/${u.id}`}>{name}</CellLink>
                      </td>
                      <td className="max-w-64 truncate text-ink-muted" title={u.email}>
                        {u.email}
                      </td>
                      <td>
                        <span className="flex items-center gap-2">
                          {ROLE[u.role]}
                          {u.providerStatus ? <span className="type-caption text-ink-muted">· {PROVIDER_STATUS[u.providerStatus].label}</span> : null}
                        </span>
                      </td>
                      <td>
                        {u.blockedAt ? (
                          <Status tone="danger">Gesperrt</Status>
                        ) : (
                          <Status tone="success">Aktiv</Status>
                        )}
                      </td>
                      <td className={numCell}>{formatInt(u.bookingsCount)}</td>
                      <td className="num text-ink-muted">{formatDate(u.createdAt)}</td>
                      <td className="text-right">
                        {u.id === session.userId ? <span className="type-caption text-ink-muted">Eigenes Konto</span> : <UserBlockButton userId={u.id} name={name} blocked={!!u.blockedAt} role={ROLE[u.role]} />}
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
