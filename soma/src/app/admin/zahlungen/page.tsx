import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, formatPriceExact } from "@/lib/format";
import { formatDateTime, formatInt } from "@/components/admin/format";
import { PAYMENT_STATUS, PAYOUT_STATUS } from "@/components/admin/labels";
import { AdminPageHeader, AdminSection, EMPTY, SectionEmpty } from "@/components/admin/page";
import { CreatePayoutBatchButton, MarkPayoutPaidButton } from "@/components/admin/payout-actions";
import { AdminTable, CellLink, hrefWith, numCell, rowAction, rowLink, TablePager } from "@/components/admin/table";
import { ChipFilter, SegmentedLinks } from "@/components/admin/toolbar";
import { ChipLink } from "@/components/ui/chip";
import { StatGrid, StatTile } from "@/components/ui/data";
import { CountUp as Count } from "@/components/ui/motion";
import { EmptyState, Notice, Status } from "@/components/ui/feedback";
import { TabLinks } from "@/components/ui/tabs";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import type { PaymentProviderId, PaymentStatus } from "@/server/dto";
import { listPayouts } from "@/server/services/admin";
import { getPayoutPreview, listPaymentsFiltered, listRefunds } from "@/server/services/admin-ext";

export const metadata: Metadata = { title: "Zahlungen & Auszahlungen" };

type SP = { ansicht?: string; status?: string; anbieter?: string; seite?: string };
const STATUS_CHIPS: PaymentStatus[] = ["authorized", "captured", "partially_refunded", "refunded", "cancelled", "failed"];

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await requireRole("admin", routes.admin.payments());
  const sp = await searchParams;
  const view = sp.ansicht === "erstattungen" || sp.ansicht === "auszahlungen" ? sp.ansicht : "zahlungen";
  const page = Math.max(1, Number(sp.seite) || 1);
  const status = STATUS_CHIPS.includes(sp.status as PaymentStatus) ? (sp.status as PaymentStatus) : undefined;
  const provider = sp.anbieter === "dev" || sp.anbieter === "stripe" ? (sp.anbieter as PaymentProviderId) : undefined;
  const failed = await listPaymentsFiltered(session, { status: "failed", pageSize: 1 });

  const tabs = (
    <TabLinks
      label="Ansicht"
      items={[
        { href: routes.admin.payments(), label: "Zahlungen", active: view === "zahlungen" },
        { href: hrefWith(routes.admin.payments(), {}, { ansicht: "erstattungen" }), label: "Erstattungen", active: view === "erstattungen" },
        { href: hrefWith(routes.admin.payments(), {}, { ansicht: "auszahlungen" }), label: "Auszahlungen", active: view === "auszahlungen" },
      ]}
    />
  );

  return (
    <>
      <AdminPageHeader group="Finanzen" title="Zahlungen & Auszahlungen" description="Zahlungen werden bei Buchung reserviert und nach dem Termin eingezogen. Profis erhalten ihren Anteil 48 Stunden nach Abschluss." />
      <div className="flex flex-col gap-6">
        {tabs}
        {failed.total > 0 && view === "zahlungen" && status !== "failed" ? (
          <Notice kind="danger" title={`${failed.total} fehlgeschlagene Zahlung${failed.total === 1 ? "" : "en"}`}>
            <Link href={hrefWith(routes.admin.payments(), {}, { status: "failed" })}>Fehlgeschlagene anzeigen</Link>
          </Notice>
        ) : null}
        {view === "zahlungen" ? <PaymentsView session={session} page={page} status={status} provider={provider} /> : null}
        {view === "erstattungen" ? <RefundsView session={session} page={page} /> : null}
        {view === "auszahlungen" ? <PayoutsView session={session} /> : null}
      </div>
    </>
  );
}

type S = Awaited<ReturnType<typeof requireRole>>;

async function PaymentsView({ session, page, status, provider }: { session: S; page: number; status?: PaymentStatus; provider?: PaymentProviderId }) {
  const list = await listPaymentsFiltered(session, { status, provider, page, pageSize: 25 });
  const current = { status, anbieter: provider };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-8">
        <ChipFilter label="Status">
          <ChipLink href={hrefWith(routes.admin.payments(), { anbieter: provider }, {})} selected={!status}>
            Alle
          </ChipLink>
          {STATUS_CHIPS.map((s) => (
            <ChipLink key={s} href={hrefWith(routes.admin.payments(), { anbieter: provider }, { status: s })} selected={status === s}>
              {PAYMENT_STATUS[s].label}
            </ChipLink>
          ))}
        </ChipFilter>
        <SegmentedLinks
          label="Anbieter"
          items={[
            { href: hrefWith(routes.admin.payments(), { status }, {}), label: "Alle", active: !provider },
            { href: hrefWith(routes.admin.payments(), { status }, { anbieter: "dev" }), label: "Testmodus", active: provider === "dev" },
            { href: hrefWith(routes.admin.payments(), { status }, { anbieter: "stripe" }), label: "Stripe", active: provider === "stripe" },
          ]}
        />
      </div>
      {list.items.length === 0 ? (
        <EmptyState seed="zahlungen-leer" title="Keine Zahlungen.">{status || provider ? "Für diese Filter gibt es keine Zahlungen." : "Zahlungen entstehen mit jeder Buchung."}</EmptyState>
      ) : (
        <div>
          <AdminTable label="Zahlungen" stickyHeader>
            <thead>
              <tr>
                <th scope="col">Buchung</th>
                <th scope="col">Angelegt</th>
                <th scope="col">Anbieter</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-right">Betrag</th>
                <th scope="col" className="text-right">Eingezogen</th>
                <th scope="col" className="text-right">Erstattet</th>
                <th scope="col" className="text-right">Plattformgebühr</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((p) => (
                <tr key={p.id} className={rowLink}>
                  <td>
                    <CellLink row href={routes.admin.booking(p.bookingId)}>
                      <span className="code-ref">{p.bookingReference}</span>
                    </CellLink>
                  </td>
                  <td className="num text-ink-muted">{formatDateTime(p.createdAt)}</td>
                  <td>
                    <span className="inline-flex h-5 items-center rounded-full bg-surface-sunken px-2 code-ref text-ink-muted">{p.provider}</span>
                  </td>
                  <td>
                    <Status tone={PAYMENT_STATUS[p.status].tone}>{PAYMENT_STATUS[p.status].label}</Status>
                  </td>
                  <td className={`${numCell} font-[520]`}>{formatPriceExact(p.amountCents)}</td>
                  <td className={numCell}>{p.capturedCents ? formatPriceExact(p.capturedCents) : EMPTY}</td>
                  <td className={numCell}>{p.refundedCents ? formatPriceExact(p.refundedCents) : EMPTY}</td>
                  <td className={`${numCell} text-ink-muted`}>{p.applicationFeeCents ? formatPriceExact(p.applicationFeeCents) : EMPTY}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
          <TablePager page={list.page} pageSize={list.pageSize} total={list.total} href={(n) => hrefWith(routes.admin.payments(), current, { seite: n })} />
        </div>
      )}
    </div>
  );
}

async function RefundsView({ session, page }: { session: S; page: number }) {
  const list = await listRefunds(session, { page, pageSize: 25 });
  if (list.items.length === 0) {
    return <EmptyState seed="erstattungen-leer" title="Noch keine Erstattungen.">Erstattungen entstehen aus Buchungsdetails oder bei der Lösung eines Streitfalls.</EmptyState>;
  }
  return (
    <div>
      <AdminTable label="Erstattungen" stickyHeader>
        <thead>
          <tr>
            <th scope="col">Buchung</th>
            <th scope="col">Zeitpunkt</th>
            <th scope="col" className="text-right">Betrag</th>
            <th scope="col">Grund</th>
            <th scope="col">Status</th>
            <th scope="col">Durch</th>
          </tr>
        </thead>
        <tbody>
          {list.items.map((r) => (
            <tr key={r.id} className={rowLink}>
              <td>
                <CellLink row href={routes.admin.booking(r.bookingId)}>
                  <span className="code-ref">{r.bookingReference}</span>
                </CellLink>
              </td>
              <td className="num text-ink-muted">{formatDateTime(r.createdAt)}</td>
              <td className={numCell}>{formatPriceExact(r.amountCents)}</td>
              <td className="max-w-80 truncate" title={r.reason}>
                {r.reason}
              </td>
              <td>
                <Status tone={r.status === "succeeded" ? "success" : r.status === "failed" ? "danger" : "warning"}>
                  {r.status === "succeeded" ? "Erfolgreich" : r.status === "failed" ? "Fehlgeschlagen" : "Ausstehend"}
                </Status>
              </td>
              <td className="text-ink-muted">{r.createdByName ?? "System"}</td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
      <TablePager page={list.page} pageSize={list.pageSize} total={list.total} href={(n) => hrefWith(routes.admin.payments(), { ansicht: "erstattungen" }, { seite: n })} />
    </div>
  );
}

async function PayoutsView({ session }: { session: S }) {
  const [preview, payouts] = await Promise.all([getPayoutPreview(session), listPayouts(session)]);
  const open = payouts.filter((p) => p.status === "pending" || p.status === "in_transit");
  const openCents = open.reduce((a, p) => a + p.amountCents, 0);
  const rows = preview.rows.filter((r) => r.eligibleCents || r.onHoldCents || r.disputedCents);
  return (
    <div className="flex flex-col gap-10">
      <StatGrid>
        <StatTile label="Jetzt auszahlbar" value={<Euro cents={preview.totals.eligibleCents} />} hint={`${formatInt(preview.totals.eligibleCount)} Buchungen · ${preview.totals.providers} Profis`} />
        <StatTile label={`In Haltefrist (${preview.holdHours} h)`} value={<Euro cents={preview.totals.onHoldCents} />} hint="wird danach auszahlbar" />
        <StatTile label="Wegen Streitfall gehalten" value={<Euro cents={preview.totals.disputedCents} />} hint="bis zur Lösung des Falls" />
        <StatTile label="Offene Auszahlungen" value={<Euro cents={openCents} />} hint={`${open.length} noch nicht als bezahlt markiert`} />
      </StatGrid>

      <AdminSection
        id="balances"
        title="Guthaben je Profi"
        description={`Auszahlbar ${preview.holdHours} Stunden nach Abschluss, ohne offenen Streitfall. Gilt auch für einbehaltene Stornogebühren.`}
        actions={<CreatePayoutBatchButton eligibleCents={preview.totals.eligibleCents} eligibleCount={preview.totals.eligibleCount} providers={preview.totals.providers} holdHours={preview.holdHours} />}
      >
        {rows.length === 0 ? (
          <SectionEmpty seed="auszahlungen-alles" title="Alles ausgezahlt.">
            Derzeit gibt es keine offenen Profi-Anteile.
          </SectionEmpty>
        ) : (
          <AdminTable label="Guthaben je Profi">
            <thead>
              <tr>
                <th scope="col">Profi</th>
                <th scope="col" className="text-right">Auszahlbar</th>
                <th scope="col" className="text-right">Buchungen</th>
                <th scope="col" className="text-right">In Haltefrist</th>
                <th scope="col">Nächste frei ab</th>
                <th scope="col" className="text-right">Gehalten</th>
                <th scope="col">Auszahlungskonto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.providerId} className={rowLink}>
                  <td>
                    <CellLink row href={routes.admin.provider(r.providerId)}>{r.providerName}</CellLink>
                  </td>
                  <td className={`${numCell} font-[520]`}>{r.eligibleCents ? formatPriceExact(r.eligibleCents) : EMPTY}</td>
                  <td className={numCell}>{r.eligibleCount || EMPTY}</td>
                  <td className={numCell}>{r.onHoldCents ? `${formatPriceExact(r.onHoldCents)} (${r.onHoldCount})` : EMPTY}</td>
                  <td className="num text-ink-muted">{r.nextAvailableAt ? formatDateTime(r.nextAvailableAt) : EMPTY}</td>
                  <td className={numCell}>{r.disputedCents ? <span className="text-danger">{formatPriceExact(r.disputedCents)}</span> : EMPTY}</td>
                  <td>
                    <Status tone={r.payoutsEnabled ? "success" : "warning"}>{r.payoutsEnabled ? "Eingerichtet" : "Fehlt"}</Status>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminSection>

      <AdminSection id="payouts" title="Auszahlungen" description="Neueste zuerst.">
        {payouts.length === 0 ? (
          <SectionEmpty seed="auszahlungen-leer" title="Noch keine Auszahlungen." />
        ) : (
          <AdminTable label="Auszahlungen" stickyHeader>
            <thead>
              <tr>
                <th scope="col">Profi</th>
                <th scope="col">Angelegt</th>
                <th scope="col">Zeitraum</th>
                <th scope="col" className="text-right">Buchungen</th>
                <th scope="col" className="text-right">Betrag</th>
                <th scope="col">Status</th>
                <th scope="col">Ausgezahlt am</th>
                <th scope="col" className="text-right">
                  <span className="sr-only">Aktion</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className={rowLink}>
                  <td>
                    <CellLink row href={routes.admin.provider(p.providerId)}>{p.providerName ?? "Profi"}</CellLink>
                  </td>
                  <td className="num text-ink-muted">{formatDateTime(p.createdAt)}</td>
                  <td className="num text-ink-muted">{p.periodStart && p.periodEnd ? `${formatDate(p.periodStart)}–${formatDate(p.periodEnd)}` : EMPTY}</td>
                  <td className={numCell}>{p.bookingCount}</td>
                  <td className={`${numCell} font-[520]`}>{formatPriceExact(p.amountCents)}</td>
                  <td>
                    <Status tone={PAYOUT_STATUS[p.status].tone}>{PAYOUT_STATUS[p.status].label}</Status>
                  </td>
                  <td className="num text-ink-muted">{p.paidAt ? formatDateTime(p.paidAt) : EMPTY}</td>
                  <td className="text-right">
                    {p.status === "pending" || p.status === "in_transit" ? (
                      <span className={`inline-flex ${rowAction}`}>
                        <MarkPayoutPaidButton payoutId={p.id} providerName={p.providerName ?? "Profi"} amountCents={p.amountCents} />
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminSection>
    </div>
  );
}

/** Euro amount that counts up (two decimals, tabular). */
function Euro({ cents }: { cents: number }) {
  return <Count value={cents / 100} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} suffix={"\u00a0€"} />;
}
