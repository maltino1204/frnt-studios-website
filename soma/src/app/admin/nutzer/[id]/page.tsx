import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, formatPriceExact } from "@/lib/format";
import { formatDateTime, formatInt, fullName } from "@/components/admin/format";
import { BOOKING_STATUS, PROVIDER_STATUS, ROLE } from "@/components/admin/labels";
import { AdminPageHeader, AdminSection, EMPTY, PanelCard } from "@/components/admin/page";
import { AdminTable, CellLink, numCell } from "@/components/admin/table";
import { CreditAdjustForm, UserAnonymizeButton, UserBlockButton, UserExportButton } from "@/components/admin/user-actions";
import { EmptyState, Notice, Status } from "@/components/ui/feedback";
import { FactList } from "@/components/ui/layout";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { getUserForAdmin } from "@/server/services/admin-ext";

export const metadata: Metadata = { title: "Nutzer" };

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole("admin", `/admin/nutzer/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const d = await getUserForAdmin(session, id);
  if (!d) notFound();
  const u = d.user;
  const anonymized = Boolean(d.anonymizedAt);
  const name = anonymized ? "Anonymisiertes Konto" : fullName(u.firstName, u.lastName);
  const self = u.id === session.userId;
  const isCustomer = u.role === "customer";

  return (
    <>
      <AdminPageHeader
        back={{ href: routes.admin.users(), label: "Nutzer" }}
        title={name}
        meta={
          <span className="flex flex-wrap items-center gap-4">
            <span className="type-body-s text-ink-muted">{ROLE[u.role]}</span>
            {anonymized ? <Status tone="neutral">Anonymisiert</Status> : u.blockedAt ? <Status tone="danger">Gesperrt</Status> : <Status tone="success">Aktiv</Status>}
          </span>
        }
        description={anonymized ? `Anonymisiert am ${formatDateTime(d.anonymizedAt!)}` : u.email}
        actions={
          !self && !anonymized ? (
            <>
              {u.role === "provider" ? (
                <CellLink href={routes.admin.provider(u.id)}>Profi-Profil verwalten</CellLink>
              ) : null}
              <UserBlockButton userId={u.id} name={name} blocked={!!u.blockedAt} role={ROLE[u.role]} />
            </>
          ) : null
        }
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-10">
          <AdminSection id="bookings" title="Buchungen" description={`Die letzten ${Math.min(20, u.bookingsCount)} von ${formatInt(u.bookingsCount)} Buchungen.`}>
            {d.bookings.length === 0 ? (
              <EmptyState title="Noch keine Buchungen." className="py-4" />
            ) : (
              <AdminTable label="Buchungen">
                <thead>
                  <tr>
                    <th scope="col">Buchung</th>
                    <th scope="col">Termin</th>
                    <th scope="col">Leistung</th>
                    <th scope="col">{u.role === "provider" ? "Kundschaft" : "Profi"}</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {d.bookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <CellLink href={routes.admin.booking(b.id)}>
                          <span className="code-ref">{b.reference}</span>
                        </CellLink>
                      </td>
                      <td className="num text-ink-muted">{formatDateTime(b.startsAt)}</td>
                      <td>{b.serviceName}</td>
                      <td>{b.counterpartName ?? <span className="text-ink-muted">{EMPTY}</span>}</td>
                      <td>
                        <Status tone={BOOKING_STATUS[b.status].tone}>{BOOKING_STATUS[b.status].label}</Status>
                      </td>
                      <td className={numCell}>{formatPriceExact(b.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            )}
          </AdminSection>

          {isCustomer ? (
            <AdminSection id="credits" title="Guthaben" description={`Aktueller Stand: ${formatPriceExact(d.credits.balanceCents)}. Jede Buchung wird protokolliert.`}>
              {!anonymized ? (
                <div className="border border-line bg-surface-raised px-4 py-4">
                  <CreditAdjustForm userId={u.id} balanceCents={d.credits.balanceCents} />
                </div>
              ) : null}
              {d.credits.entries.length === 0 ? (
                <EmptyState title="Noch keine Guthabenbewegungen." className="py-4" />
              ) : (
                <AdminTable label="Guthabenbewegungen">
                  <thead>
                    <tr>
                      <th scope="col">Datum</th>
                      <th scope="col">Art</th>
                      <th scope="col">Hinweis</th>
                      <th scope="col">Buchung</th>
                      <th scope="col">Von</th>
                      <th scope="col" className="text-right">Betrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.credits.entries.map((e) => (
                      <tr key={e.id}>
                        <td className="num text-ink-muted">{formatDateTime(e.createdAt)}</td>
                        <td>{e.reasonLabel}</td>
                        <td className="max-w-64 truncate text-ink-muted" title={e.note ?? undefined}>
                          {e.note ?? EMPTY}
                        </td>
                        <td>{e.bookingId && e.bookingReference ? <CellLink href={routes.admin.booking(e.bookingId)}><span className="code-ref">{e.bookingReference}</span></CellLink> : <span className="text-ink-muted">{EMPTY}</span>}</td>
                        <td className="text-ink-muted">{e.createdByName ?? "System"}</td>
                        <td className={`${numCell} ${e.amountCents < 0 ? "text-danger" : "text-success"}`}>
                          {e.amountCents > 0 ? "+" : "−"}
                          {formatPriceExact(Math.abs(e.amountCents))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              )}
            </AdminSection>
          ) : null}
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <PanelCard title="Konto" bodyClassName="px-4 py-1">
            <FactList
              items={[
                { label: "E-Mail", value: <span className="break-all">{u.email}</span> },
                { label: "Telefon", value: u.phone ?? EMPTY },
                { label: "Rolle", value: u.providerStatus ? `${ROLE[u.role]} · ${PROVIDER_STATUS[u.providerStatus].label}` : ROLE[u.role] },
                { label: "Registriert", value: <span className="num">{formatDate(u.createdAt)}</span> },
                { label: "Letzte Anmeldung", value: d.lastSignInAt ? <span className="num">{formatDateTime(d.lastSignInAt)}</span> : EMPTY },
                { label: "Empfehlungscode", value: <span className="code-ref">{d.referralCode}</span> },
                { label: "Newsletter", value: d.marketingOptIn ? "Ja" : "Nein" },
                { label: "Adressen", value: formatInt(d.addressesCount) },
                { label: "Bewertungen", value: formatInt(d.reviewsCount) },
                { label: "Offene Buchungen", value: formatInt(d.activeBookings) },
                { label: "Offene Streitfälle", value: d.openDisputes ? <span className="text-danger">{formatInt(d.openDisputes)}</span> : "0" },
              ]}
            />
          </PanelCard>

          <PanelCard title="Datenschutz" bodyClassName="flex flex-col gap-4 px-4 py-4">
            <div className="flex flex-col gap-2">
              <p className="type-body-s text-ink-muted">Auskunft nach Art. 15 DSGVO: Profil, Adressen, Buchungen, Bewertungen, Guthaben und Benachrichtigungen als JSON. Der Export wird protokolliert.</p>
              <div>
                <UserExportButton userId={u.id} />
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <p className="type-body-s text-ink-muted">Löschung nach Art. 17 DSGVO: persönliche Daten und Login werden entfernt, Buchungen bleiben anonymisiert für die Buchhaltung.</p>
              {d.anonymizeBlockers.length ? (
                <div id="anonymize-blockers">
                  <Notice kind="info" title="Zurzeit nicht möglich">
                    <ul className="list-disc pl-4">
                      {d.anonymizeBlockers.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </Notice>
                </div>
              ) : null}
              <div>
                <UserAnonymizeButton userId={u.id} name={name} blockers={d.anonymizeBlockers} />
              </div>
            </div>
          </PanelCard>
        </aside>
      </div>
    </>
  );
}
