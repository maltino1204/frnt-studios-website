import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CalendarRange, Check, ChevronRight, CircleCheckBig, Search, Wallet } from "lucide-react";
import { BarList, type BarTone } from "@/components/admin/bars";
import { delta, formatDateTime, formatInt, formatPercent, formatShortDateTime, formatSince } from "@/components/admin/format";
import { DeltaPill, MetricTile } from "@/components/admin/kpi";
import { BOOKING_STATUS, BOOKING_STATUS_ORDER, DISPUTE_REASON, DISPUTE_STATUS, PAYMENT_STATUS, PROVIDER_STATUS } from "@/components/admin/labels";
import { AdminPageHeader, AdminSection, MutedLink, PanelCard } from "@/components/admin/page";
import { RangeSwitch } from "@/components/admin/range-switch";
import { TrendChart } from "@/components/admin/trend-chart";
import { Avatar } from "@/components/ui/avatar";
import { StatGrid, StatTile } from "@/components/ui/data";
import { CountPill, Status } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { Count } from "@/components/admin/count";
import { formatPrice, formatRating, formatRelative } from "@/lib/format";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { listDisputes, listVerificationQueue } from "@/server/services/admin";
import { getOpsQueues } from "@/server/services/admin-ext";
import { getMarketplaceKpis, getTimeSeries } from "@/server/services/analytics";
import { listCities } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Übersicht" };

const euro = (cents: number) => formatPrice(Math.round(cents / 100) * 100);
const RANGES = [7, 30, 90];
const STATUS_BAR: Record<string, BarTone> = { success: "accent", accent: "accent", warning: "accent", neutral: "accent", danger: "accent" };

export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<{ tage?: string }> }) {
  const session = await requireRole("admin", routes.admin.root());
  const sp = await searchParams;
  const days = RANGES.includes(Number(sp.tage)) ? Number(sp.tage) : 30;
  const now = new Date();
  const from = new Date(now.getTime() - days * 86_400_000);
  const prevFrom = new Date(from.getTime() - days * 86_400_000);

  const [kpi, prev, series, queue, open, investigating, ops, cities] = await Promise.all([
    getMarketplaceKpis(session, { from: from.toISOString(), to: now.toISOString() }),
    getMarketplaceKpis(session, { from: prevFrom.toISOString(), to: from.toISOString() }),
    getTimeSeries(session, { days }),
    listVerificationQueue(session),
    listDisputes(session, { status: "open" }),
    listDisputes(session, { status: "investigating" }),
    getOpsQueues(session, { limit: 5 }),
    listCities(),
  ]);
  const cityName = (slug: string) => cities.find((c) => c.slug === slug)?.name ?? slug;
  const disputes = [...open, ...investigating];
  const deltaLabel = "ggü. Vorperiode";
  const takeRate = kpi.gmvCents > 0 ? kpi.netRevenueCents / kpi.gmvCents : null;
  const statusTotal = BOOKING_STATUS_ORDER.reduce((a, s) => a + (kpi.bookingsByStatus[s] ?? 0), 0);
  const statusRows = BOOKING_STATUS_ORDER.filter((s) => (kpi.bookingsByStatus[s] ?? 0) > 0).map((s) => ({
    key: s,
    label: <Status tone={BOOKING_STATUS[s].tone}>{BOOKING_STATUS[s].label}</Status>,
    value: kpi.bookingsByStatus[s] ?? 0,
    display: (
      <>
        {formatInt(kpi.bookingsByStatus[s] ?? 0)}
        <span className="ml-1.5 inline-block w-12 text-ink-muted">{formatPercent(statusTotal ? (kpi.bookingsByStatus[s] ?? 0) / statusTotal : 0, 0)}</span>
      </>
    ),
    tone: STATUS_BAR[BOOKING_STATUS[s].tone],
  }));
  const dates = series.map((p) => p.date);
  const col = (k: "bookings" | "completed" | "gmvCents" | "searches") => series.map((p) => p[k]);
  const sum = (k: "bookings" | "completed" | "gmvCents" | "searches") => series.reduce((a, p) => a + p[k], 0);
  const openWork = queue.length + disputes.length + ops.openRequests + ops.documentAlertsTotal + ops.failedPaymentsTotal;

  return (
    <>
      <AdminPageHeader
        group="Betrieb"
        title="Übersicht"
        description={
          <>
            Letzte {days} Tage · Stand {formatDateTime(now)} · {formatInt(kpi.activeProviders)} aktive Profis
          </>
        }
        actions={<RangeSwitch value={days} options={RANGES} />}
      />

      <div className="flex flex-col gap-10 lg:gap-12">
        <section aria-label="Kennzahlen" className="flex flex-col gap-3 lg:gap-4">
          <StatGrid>
            <StatTile
              icon={<Icon icon={Wallet} size={16} />}
              label="GMV"
              value={<Count value={Math.round(kpi.gmvCents / 100)} suffix={" €"} />}
              delta={delta(kpi.gmvCents, prev.gmvCents)}
              deltaLabel={deltaLabel}
              spark={col("gmvCents")}
            />
            <StatTile
              icon={<Icon icon={CalendarRange} size={16} />}
              label="Buchungen"
              value={<Count value={kpi.bookingsCreated} />}
              delta={delta(kpi.bookingsCreated, prev.bookingsCreated)}
              deltaLabel={deltaLabel}
              spark={col("bookings")}
            />
            <StatTile
              icon={<Icon icon={CircleCheckBig} size={16} />}
              label="Abgeschlossen"
              value={<Count value={kpi.completedBookings} />}
              delta={delta(kpi.completedBookings, prev.completedBookings)}
              deltaLabel={deltaLabel}
              spark={col("completed")}
            />
            <StatTile
              icon={<Icon icon={Search} size={16} />}
              label="Suchen"
              value={<Count value={kpi.searches} />}
              delta={delta(kpi.searches, prev.searches)}
              deltaLabel={deltaLabel}
              hint="ohne Vergleichswert"
              spark={col("searches")}
            />
          </StatGrid>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4 xl:grid-cols-6">
            <MetricTile
              label="Nettoumsatz"
              value={euro(kpi.netRevenueCents)}
              delta={delta(kpi.netRevenueCents, prev.netRevenueCents)}
              hint={takeRate != null ? `Take Rate ${formatPercent(takeRate)}` : undefined}
            />
            <MetricTile label="Suche → Buchung" value={formatPercent(kpi.conversionRate)} delta={delta(kpi.conversionRate, prev.conversionRate)} />
            <MetricTile label="Wiederbuchungsrate" value={formatPercent(kpi.repeatRate)} delta={delta(kpi.repeatRate, prev.repeatRate)} />
            <MetricTile
              label="Ø Bewertung"
              value={kpi.avgRating != null ? formatRating(kpi.avgRating) : "—"}
              delta={kpi.avgRating != null && prev.avgRating != null ? delta(kpi.avgRating, prev.avgRating) : null}
              hint={kpi.avgRating == null ? "Keine Bewertungen im Zeitraum" : undefined}
            />
            <MetricTile label="Auslastung Profis" value={formatPercent(kpi.providerUtilisation)} delta={delta(kpi.providerUtilisation, prev.providerUtilisation)} />
            <MetricTile label="Neue Kundschaft" value={formatInt(kpi.newCustomers)} delta={delta(kpi.newCustomers, prev.newCustomers)} />
          </div>
        </section>

        <AdminSection
          id="queues"
          title="Zu erledigen"
          count={openWork ? `${formatInt(openWork)} offen` : undefined}
          description="Arbeitslisten, älteste und dringendste zuerst."
        >
          <div className="grid items-start gap-3 lg:grid-cols-2 lg:gap-4">
            <div className="flex min-w-0 flex-col gap-3 lg:gap-4">
              <PanelCard
                title="Verifizierung"
                count={queue.length ? <CountPill accent>{queue.length}</CountPill> : null}
                action={<MutedLink href={`${routes.admin.providers()}?status=pruefung`}>Alle anzeigen</MutedLink>}
              >
                {queue.length === 0 ? (
                  <QueueEmpty>Keine Profis warten auf Prüfung.</QueueEmpty>
                ) : (
                  <QueueList>
                    {queue.slice(0, 5).map((p) => (
                      <QueueRow
                        key={p.providerId}
                        href={routes.admin.provider(p.providerId)}
                        lead={<Avatar name={p.displayName} size={32} />}
                        title={p.displayName}
                        meta={[p.citySlug ? cityName(p.citySlug) : "Ohne Einsatzgebiet", p.submittedAt ? `eingereicht ${formatRelative(p.submittedAt)}` : null]}
                        aside={
                          <Aside>
                            <Status tone={PROVIDER_STATUS[p.status].tone}>{PROVIDER_STATUS[p.status].label}</Status>
                            <span className={p.missingDocuments ? "type-caption text-warning num" : "type-caption text-ink-muted num"}>
                              {p.missingDocuments ? `${p.missingDocuments} Dokumente offen` : "Dokumente vollständig"}
                            </span>
                          </Aside>
                        }
                      />
                    ))}
                  </QueueList>
                )}
              </PanelCard>

              <PanelCard
                title="Offene Streitfälle"
                count={disputes.length ? <CountPill accent>{disputes.length}</CountPill> : null}
                action={<MutedLink href={routes.admin.disputes()}>Alle anzeigen</MutedLink>}
              >
                {disputes.length === 0 ? (
                  <QueueEmpty>Keine offenen Streitfälle.</QueueEmpty>
                ) : (
                  <QueueList>
                    {disputes.slice(0, 5).map((d) => (
                      <QueueRow
                        key={d.id}
                        href={`${routes.admin.disputes()}?fall=${d.id}`}
                        title={<RefTitle reference={d.bookingReference}>{DISPUTE_REASON[d.reason]}</RefTitle>}
                        meta={[`${d.customerName} ↔ ${d.providerName}`, formatSince(d.createdAt, now)]}
                        aside={<Status tone={DISPUTE_STATUS[d.status].tone}>{DISPUTE_STATUS[d.status].label}</Status>}
                      />
                    ))}
                  </QueueList>
                )}
              </PanelCard>

              <PanelCard
                title="Dokumente & Sperren"
                count={ops.documentAlertsTotal ? <CountPill accent>{ops.documentAlertsTotal}</CountPill> : null}
                action={
                  <MutedLink href={`${routes.admin.providers()}?status=gesperrt`}>
                    <span className="sm:hidden">Gesperrt</span>
                    <span className="max-sm:hidden">Gesperrte Profis</span>
                  </MutedLink>
                }
              >
                {ops.documentAlerts.length === 0 ? (
                  <QueueEmpty>Keine abgelaufenen oder abgelehnten Pflichtdokumente.</QueueEmpty>
                ) : (
                  <QueueList>
                    {ops.documentAlerts.map((a) => (
                      <QueueRow
                        key={`${a.providerId}-${a.at}`}
                        href={routes.admin.provider(a.providerId)}
                        lead={<Avatar name={a.displayName} size={32} />}
                        title={a.displayName}
                        meta={[a.note, a.status === "approved" ? `am ${formatShortDateTime(a.at)}` : formatSince(a.at, now)]}
                        aside={
                          <Status tone={a.status === "suspended" ? "danger" : "warning"}>
                            {a.status === "suspended" ? "Automatisch pausiert" : a.status === "awaiting" ? "Wartet auf Nachweis" : "Läuft bald ab"}
                          </Status>
                        }
                      />
                    ))}
                  </QueueList>
                )}
              </PanelCard>
            </div>

            <div className="flex min-w-0 flex-col gap-3 lg:gap-4">
              <PanelCard
                title="Offene Anfragen"
                count={ops.openRequests ? <CountPill accent>{ops.openRequests}</CountPill> : null}
                action={<MutedLink href={`${routes.admin.bookings()}?status=requested`}>Alle anzeigen</MutedLink>}
              >
                {ops.expiringRequests.length === 0 ? (
                  <QueueEmpty>Keine offenen Anfragen.</QueueEmpty>
                ) : (
                  <QueueList>
                    {ops.expiringRequests.map((r) => {
                      const left = r.respondBy ? new Date(r.respondBy).getTime() - now.getTime() : null;
                      const urgent = left !== null && left < 3 * 3_600_000;
                      return (
                        <QueueRow
                          key={r.id}
                          href={routes.admin.booking(r.id)}
                          title={<RefTitle reference={r.reference}>{r.serviceName}</RefTitle>}
                          meta={[`${r.providerName} · ${r.customerName}`, `Termin ${formatShortDateTime(r.startsAt)}`]}
                          aside={
                            r.respondBy ? (
                              <Aside>
                                <Status tone={urgent ? "danger" : "warning"}>{left !== null && left < 0 ? "Frist abgelaufen" : `läuft ab ${formatRelative(r.respondBy, now)}`}</Status>
                                <span className="type-caption text-ink-muted num">bis {formatShortDateTime(r.respondBy)}</span>
                              </Aside>
                            ) : (
                              <Status tone="warning">Ohne Frist</Status>
                            )
                          }
                        />
                      );
                    })}
                  </QueueList>
                )}
              </PanelCard>

              <PanelCard
                title="Fehlgeschlagene Zahlungen"
                count={ops.failedPaymentsTotal ? <CountPill accent>{ops.failedPaymentsTotal}</CountPill> : null}
                action={<MutedLink href={`${routes.admin.payments()}?status=failed`}>Alle anzeigen</MutedLink>}
              >
                {ops.failedPayments.length === 0 ? (
                  <QueueEmpty>Keine fehlgeschlagenen Zahlungen.</QueueEmpty>
                ) : (
                  <QueueList>
                    {ops.failedPayments.map((p) => (
                      <QueueRow
                        key={p.id}
                        href={routes.admin.booking(p.bookingId)}
                        title={<RefTitle reference={p.bookingReference}>{p.customerName}</RefTitle>}
                        meta={[formatDateTime(p.createdAt), p.provider === "dev" ? "Testzahlung" : "Stripe"]}
                        aside={
                          <Aside>
                            <span className="type-label-s num">{formatPrice(p.amountCents)}</span>
                            <Status tone={PAYMENT_STATUS[p.status].tone}>{PAYMENT_STATUS[p.status].label}</Status>
                          </Aside>
                        }
                      />
                    ))}
                  </QueueList>
                )}
              </PanelCard>
            </div>
          </div>
        </AdminSection>

        <AdminSection id="trend" title="Entwicklung" description={`Tageswerte der letzten ${days} Tage, Europe/Berlin.`}>
          <div className="grid gap-3 md:grid-cols-2 lg:gap-4 xl:grid-cols-3">
            <ChartCard
              label="Buchungen"
              value={formatInt(sum("bookings"))}
              unit="erstellt"
              change={delta(kpi.bookingsCreated, prev.bookingsCreated)}
              className="md:col-span-2 xl:col-span-1"
            >
              <TrendChart
                title="Buchungen pro Tag"
                dates={dates}
                series={[
                  { key: "b", label: "Erstellt", tone: "accent", values: col("bookings") },
                  { key: "c", label: "Abgeschlossen", tone: "violet", values: col("completed") },
                ]}
              />
            </ChartCard>
            <ChartCard label="GMV" value={euro(sum("gmvCents"))} unit="abgeschlossen" change={delta(kpi.gmvCents, prev.gmvCents)}>
              <TrendChart title="GMV pro Tag (abgeschlossene Buchungen)" dates={dates} series={[{ key: "g", label: "GMV", tone: "accent", values: col("gmvCents") }]} unit="euro" />
            </ChartCard>
            <ChartCard label="Suchen" value={formatInt(sum("searches"))} unit="gesamt" change={delta(kpi.searches, prev.searches)}>
              <TrendChart title="Suchen pro Tag" dates={dates} series={[{ key: "s", label: "Suchen", tone: "accent", values: col("searches") }]} />
            </ChartCard>
          </div>
        </AdminSection>

        <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
          <PanelCard title="Buchungen nach Status" action={<span className="type-caption text-ink-muted">erstellt im Zeitraum</span>} bodyClassName="px-4 py-2 sm:px-5">
            {statusRows.length ? <BarList rows={statusRows} /> : <QueueEmpty>Keine Buchungen im Zeitraum.</QueueEmpty>}
          </PanelCard>
          <PanelCard title="Funnel" action={<span className="type-caption text-ink-muted">Suche → Buchung → Abschluss</span>} bodyClassName="flex flex-col px-4 py-2 sm:px-5">
            <BarList
              rows={[
                { key: "s", label: "Suchen", value: kpi.searches },
                {
                  key: "z",
                  label: "davon ohne Ergebnis",
                  value: kpi.zeroResultSearches,
                  tone: "danger",
                  display: (
                    <>
                      {formatInt(kpi.zeroResultSearches)}
                      <span className="ml-1.5 inline-block w-12 text-ink-muted">{formatPercent(kpi.searches ? kpi.zeroResultSearches / kpi.searches : 0)}</span>
                    </>
                  ),
                },
                {
                  key: "b",
                  label: "Buchungen erstellt",
                  value: kpi.bookingsCreated,
                  display: (
                    <>
                      {formatInt(kpi.bookingsCreated)}
                      <span className="ml-1.5 inline-block w-12 text-ink-muted">{formatPercent(kpi.conversionRate)}</span>
                    </>
                  ),
                },
                { key: "c", label: "Abgeschlossen", value: kpi.completedBookings, tone: "violet" },
                { key: "w", label: "Wartelisten-Eintragungen", value: kpi.waitlistSignups, tone: "muted" },
              ]}
              max={Math.max(1, kpi.searches)}
            />
            <p className="pt-1 pb-3">
              <Link
                href={routes.admin.regions()}
                className="group/gap -ml-2 inline-flex h-7 items-center gap-1 rounded-full px-2 type-label-s text-accent transition-colors duration-fast pressable hover:bg-accent-soft hover:text-accent-hover focus-ring"
              >
                Angebotslücken nach Region <Icon icon={ArrowRight} size={14} className="transition-transform duration-fast group-hover/gap:translate-x-0.5" />
              </Link>
            </p>
          </PanelCard>
        </div>
      </div>
    </>
  );
}

/** Chart panel: muted label, the period total as a tabular figure with its delta pill, then the chart. */
function ChartCard({ label, value, unit, change, children, className }: { label: string; value: string; unit: string; change: number | null; children: ReactNode; className?: string }) {
  return (
    <section aria-label={label} className={`flex min-w-0 flex-col gap-4 rounded-card bg-surface-raised p-4 shadow-raised sm:p-5 ${className ?? ""}`}>
      <div className="flex flex-col gap-1">
        <h3 className="type-label-s text-ink-muted">{label}</h3>
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="type-heading-l text-ink num">{value}</span>
          <span className="type-caption text-ink-muted">{unit}</span>
          {change != null ? <DeltaPill value={change} className="self-center" /> : null}
        </p>
      </div>
      {children}
    </section>
  );
}

/** "SM-AB12CD · Text": monospace reference, muted separator. */
function RefTitle({ reference, children }: { reference: string; children: ReactNode }) {
  return (
    <>
      <span className="code-ref">{reference}</span>
      <span className="text-ink-muted"> · </span>
      {children}
    </>
  );
}

/** Queue row aside: inline below the text on mobile, stacked and right-aligned from sm. */
function Aside({ children }: { children: ReactNode }) {
  return <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 sm:flex-col sm:items-end">{children}</span>;
}

function QueueList({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col p-1.5">{children}</ul>;
}

function QueueEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 px-4 py-5 type-body-s text-ink-muted sm:px-5">
      <span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
        <Icon icon={Check} size={14} strokeWidth={2} />
      </span>
      {children}
    </p>
  );
}

function QueueRow({ href, title, meta, aside, lead }: { href: string; title: ReactNode; meta: Array<string | null>; aside: ReactNode; lead?: ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="group/q relative grid min-h-14 items-center gap-x-4 gap-y-2 rounded-tile px-2.5 py-2.5 transition-[background-color] duration-fast hover:bg-accent-tint focus-ring sm:grid-cols-[minmax(0,1fr)_auto_auto]"
      >
        <span className="flex min-w-0 items-center gap-3">
          {lead ? <span className="shrink-0">{lead}</span> : null}
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate type-body-s font-[520] text-ink">{title}</span>
            <span className="truncate type-caption text-ink-muted">{meta.filter(Boolean).join(" · ")}</span>
          </span>
        </span>
        <span className={lead ? "pl-11 sm:pl-0" : undefined}>{aside}</span>
        <Icon
          icon={ChevronRight}
          size={16}
          className="-ml-2 shrink-0 text-ink-muted opacity-0 transition-[opacity,translate] duration-fast ease-standard group-hover/q:translate-x-0.5 group-hover/q:opacity-100 max-sm:hidden"
        />
      </Link>
    </li>
  );
}
