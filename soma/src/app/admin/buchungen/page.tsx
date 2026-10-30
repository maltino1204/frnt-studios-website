import type { Metadata } from "next";
import { formatDate, formatPrice, formatTime } from "@/lib/format";
import { formatInt } from "@/components/admin/format";
import { BOOKING_STATUS, BOOKING_STATUS_ORDER } from "@/components/admin/labels";
import { AdminPageHeader } from "@/components/admin/page";
import { AdminTable, CellLink, hrefWith, numCell, TablePager } from "@/components/admin/table";
import { FilterForm } from "@/components/admin/toolbar";
import { EmptyState, Status } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/field";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import type { BookingStatus } from "@/server/dto";
import { listProvidersAdmin } from "@/server/services/admin";
import { listAdminBookingsFiltered } from "@/server/services/admin-ext";
import { listCities } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Buchungen" };

type SP = { q?: string; status?: string; stadt?: string; profi?: string; von?: string; bis?: string; seite?: string };
const isDate = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
const isUuid = (v?: string) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : undefined);

export default async function BookingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await requireRole("admin", routes.admin.bookings());
  const sp = await searchParams;
  const status = BOOKING_STATUS_ORDER.includes(sp.status as BookingStatus) ? (sp.status as BookingStatus) : undefined;
  const cities = await listCities();
  const citySlug = cities.some((c) => c.slug === sp.stadt) ? sp.stadt : undefined;
  const filter = { q: sp.q?.trim() || undefined, status, citySlug, providerId: isUuid(sp.profi), from: isDate(sp.von), to: isDate(sp.bis) };
  const page = Math.max(1, Number(sp.seite) || 1);
  const [list, providers] = await Promise.all([
    listAdminBookingsFiltered(session, { ...filter, page, pageSize: 25 }),
    listProvidersAdmin(session, { status: ["approved", "suspended"], pageSize: 100 }),
  ]);
  const current: Record<string, string | undefined> = { q: filter.q, status, stadt: citySlug, profi: filter.providerId, von: filter.from, bis: filter.to };
  const active = Object.values(current).some(Boolean);

  return (
    <>
      <AdminPageHeader group="Betrieb" title="Buchungen" description={`${formatInt(list.total)} ${active ? "Treffer" : "Buchungen insgesamt"} · sortiert nach Termin, neueste zuerst`} />
      <div className="flex flex-col gap-4">
        <FilterForm action={routes.admin.bookings()} resetHref={active ? routes.admin.bookings() : undefined} label="Buchungen filtern">
          <Input dense label="Suche" name="q" type="search" defaultValue={filter.q} placeholder="Referenz, Name, Leistung" className="w-full sm:w-52" />
          <Select dense label="Status" name="status" defaultValue={status ?? ""} className="w-[calc(50%-6px)] sm:w-40">
            <option value="">Alle</option>
            {BOOKING_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {BOOKING_STATUS[s].label}
              </option>
            ))}
          </Select>
          <Select dense label="Stadt" name="stadt" defaultValue={citySlug ?? ""} className="w-[calc(50%-6px)] sm:w-36">
            <option value="">Alle</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select dense label="Profi" name="profi" defaultValue={filter.providerId ?? ""} className="w-full sm:w-40">
            <option value="">Alle</option>
            {providers.items.map((p) => (
              <option key={p.providerId} value={p.providerId}>
                {p.displayName}
              </option>
            ))}
          </Select>
          <Input dense label="Termin von" name="von" type="date" defaultValue={filter.from} className="w-[calc(50%-6px)] sm:w-36" />
          <Input dense label="bis" name="bis" type="date" defaultValue={filter.to} className="w-[calc(50%-6px)] sm:w-36" />
        </FilterForm>

        {list.items.length === 0 ? (
          <EmptyState title="Keine Buchungen gefunden.">{active ? "Für diese Filter gibt es keine Buchungen. Filter lockern oder zurücksetzen." : "Sobald Kundschaft bucht, erscheinen Buchungen hier."}</EmptyState>
        ) : (
          <div>
            <AdminTable label="Buchungen">
              <thead>
                <tr>
                  <th scope="col">Referenz</th>
                  <th scope="col">Termin</th>
                  <th scope="col">Leistung</th>
                  <th scope="col">Kundschaft</th>
                  <th scope="col">Profi</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">Betrag</th>
                  <th scope="col" className="text-right">Provision</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <CellLink href={routes.admin.booking(b.id)}>
                        <span className="code-ref">{b.reference}</span>
                      </CellLink>
                    </td>
                    <td className="num">
                      {formatDate(b.startsAt)} <span className="text-ink-muted">{formatTime(b.startsAt)} · {b.city}</span>
                    </td>
                    <td className="max-w-52 truncate" title={b.serviceName}>
                      {b.serviceName}
                    </td>
                    <td>{b.customerName}</td>
                    <td>{b.providerName}</td>
                    <td>
                      <span className="flex items-center gap-3">
                        <Status tone={BOOKING_STATUS[b.status].tone}>{BOOKING_STATUS[b.status].label}</Status>
                        {b.hasOpenDispute ? <Status tone="danger" className="text-danger">Streitfall</Status> : null}
                      </span>
                    </td>
                    <td className={numCell}>{formatPrice(b.totalCents)}</td>
                    <td className={`${numCell} text-ink-muted`}>{formatPrice(b.commissionCents)}</td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
            <TablePager page={list.page} pageSize={list.pageSize} total={list.total} href={(n) => hrefWith(routes.admin.bookings(), current, { seite: n })} />
          </div>
        )}
      </div>
    </>
  );
}
