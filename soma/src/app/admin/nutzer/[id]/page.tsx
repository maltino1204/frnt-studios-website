import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, formatPriceExact } from "@/lib/format";
import { formatDateTime, formatInt, fullName } from "@/components/admin/format";
import { BOOKING_STATUS, PROVIDER_STATUS, ROLE } from "@/components/admin/labels";
import { AdminPageHeader, AdminSection, Card, EMPTY, Facts, MutedLink, PanelCard, SectionEmpty } from "@/components/admin/page";
import { AdminTable, CellLink, numCell, rowLink } from "@/components/admin/table";
import { Avatar } from "@/components/ui/avatar";
import { CreditAdjustForm, UserAnonymizeButton, UserBlockButton, UserExportButton } from "@/components/admin/user-actions";
import { Notice, Status } from "@/components/ui/feedback";
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
        title={
          <span className="flex items-center gap-3">
            <Avatar name={name} size={40} />
            {name}
          </span>
        }
        meta={
          <span className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-6 items-center rounded-full bg-surface-sunken px-2.5 type-label-s text-ink-muted">{ROLE[u.role]}</span>
            {anonymized ? <Status tone="neutral">Anonymisiert</Status> : u.blockedAt ? <Status tone="danger">Gesperrt</Status> : <Status tone="success">Aktiv</Status>}
          </span>
        }
        description={<span className="sm:pl-[3.25rem]">{anonymized ? `Anonymisiert am ${formatDateTime(d.anonymizedAt!)}` : u.email}</span>}
        actions={
          !self && !anonymized ? (
            <>
              {u.role === "provider" ? <MutedLink href={routes.admin.provider(u.id)}>Profi-Profil verwalten</MutedLink> : null}
              <UserBlockButton userId={u.id} name={name} blocked={!!u.blockedAt} role={ROLE[u.role]} />
            </>
          ) : null
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 xl:gap-8">
        <div className="flex min-w-0 flex-col gap-8 lg:gap-10">
          <AdminSection id="bookings" title="Buchungen" description={u.bookingsCount ? `Die letzten ${Math.min(20, u.bookingsCount)} von ${formatInt(u.bookingsCount)} Buchungen.` : undefined}>
            {d.bookings.length === 0 ? (
              <SectionEmpty seed={`nutzer-buchungen-${u.id}`} title="Noch keine Buchungen." />
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
                    <tr key={b.id} className={rowLink}>
                      <td>
                        <CellLink row href={routes.admin.booking(b.id)}>
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
                <Card className="px-4 py-4 sm:px-5 sm:py-5">
                  <CreditAdjustForm userId={u.id} balanceCents={d.credits.balanceCents} />
                </Card>
              ) : null}
              {d.credits.entries.length === 0 ? (
                <SectionEmpty seed={`guthaben-${u.id}`} title="Noch keine Guthabenbewegungen." />
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

        <aside className="flex min-w-0 flex-col gap-3 lg:gap-4">
          <PanelCard title="Konto" bodyClassName="px-4 sm:px-5">
            <Facts
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

          <PanelCard title="Datenschutz" bodyClassName="flex flex-col gap-4 px-4 py-4 sm:px-5">
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
