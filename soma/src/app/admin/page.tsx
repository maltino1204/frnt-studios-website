import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BarList } from "@/components/admin/bars";
import { delta, formatDateTime, formatInt, formatPercent, formatShortDateTime } from "@/components/admin/format";
import { BOOKING_STATUS, BOOKING_STATUS_ORDER, DISPUTE_REASON, DISPUTE_STATUS, PAYMENT_STATUS, PROVIDER_STATUS } from "@/components/admin/labels";
import { LineChart } from "@/components/admin/line-chart";
import { AdminPageHeader, AdminSection, MutedLink, PanelCard } from "@/components/admin/page";
import { RangeSwitch } from "@/components/admin/range-switch";
import { StatGrid, StatTile } from "@/components/ui/data";
import { CountPill, Status } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
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
  const statusRows = BOOKING_STATUS_ORDER.filter((s) => (kpi.bookingsByStatus[s] ?? 0) > 0).map((s) => ({
    key: s,
    label: <Status tone={BOOKING_STATUS[s].tone}>{BOOKING_STATUS[s].label}</Status>,
    value: kpi.bookingsByStatus[s] ?? 0,
  }));
  const dates = series.map((p) => p.date);
  const sum = (k: "bookings" | "completed" | "gmvCents" | "searches") => series.reduce((a, p) => a + p[k], 0);

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

      <div className="flex flex-col gap-10">
        <section aria-label="Kennzahlen" className="flex flex-col gap-px">
          <StatGrid>
            <StatTile label="GMV (abgeschlossen)" value={euro(kpi.gmvCents)} delta={delta(kpi.gmvCents, prev.gmvCents)} deltaLabel={deltaLabel} />
            <StatTile
              label="Nettoumsatz"
              value={euro(kpi.netRevenueCents)}
              delta={delta(kpi.netRevenueCents, prev.netRevenueCents)}
              deltaLabel={deltaLabel}
              hint={takeRate != null ? `Take Rate ${formatPercent(takeRate)}` : undefined}
            />
            <StatTile label="Buchungen" value={formatInt(kpi.bookingsCreated)} delta={delta(kpi.bookingsCreated, prev.bookingsCreated)} deltaLabel={deltaLabel} />
            <StatTile
              label="Conversion Suche → Buchung"
              value={formatPercent(kpi.conversionRate)}
              delta={delta(kpi.conversionRate, prev.conversionRate)}
              deltaLabel={deltaLabel}
              hint={`${formatInt(kpi.searches)} Suchen`}
            />
          </StatGrid>
          <StatGrid className="border-t-0">
            <StatTile label="Wiederbuchungsrate" value={formatPercent(kpi.repeatRate)} delta={delta(kpi.repeatRate, prev.repeatRate)} deltaLabel={deltaLabel} />
            <StatTile
              label="Ø Bewertung"
              value={kpi.avgRating != null ? formatRating(kpi.avgRating) : "—"}
              delta={kpi.avgRating != null && prev.avgRating != null ? delta(kpi.avgRating, prev.avgRating) : null}
              deltaLabel={deltaLabel}
              hint="Keine Bewertungen im Zeitraum"
            />
            <StatTile
              label="Auslastung Profis"
              value={formatPercent(kpi.providerUtilisation)}
              delta={delta(kpi.providerUtilisation, prev.providerUtilisation)}
              deltaLabel={deltaLabel}
            />
            <StatTile label="Neue Kundschaft" value={formatInt(kpi.newCustomers)} delta={delta(kpi.newCustomers, prev.newCustomers)} deltaLabel={deltaLabel} />
          </StatGrid>
        </section>

        <AdminSection id="queues" title="Zu erledigen" description="Arbeitslisten, älteste und dringendste zuerst.">
          <div className="grid gap-4 lg:grid-cols-2">
            <PanelCard
              title={
                <>
                  Verifizierung {queue.length ? <CountPill accent>{queue.length}</CountPill> : null}
                </>
              }
              action={<MutedLink href={`${routes.admin.providers()}?status=pruefung`}>Alle anzeigen</MutedLink>}
            >
              {queue.length === 0 ? (
                <QueueEmpty>Keine Profis warten auf Prüfung.</QueueEmpty>
              ) : (
                <ul className="divide-y divide-line">
                  {queue.slice(0, 5).map((p) => (
                    <QueueRow
                      key={p.providerId}
                      href={routes.admin.provider(p.providerId)}
                      title={p.displayName}
                      meta={[p.citySlug ? cityName(p.citySlug) : "Ohne Einsatzgebiet", p.submittedAt ? `eingereicht ${formatRelative(p.submittedAt)}` : null]}
                      aside={
                        <span className="flex flex-col items-end gap-1">
                          <Status tone={PROVIDER_STATUS[p.status].tone}>{PROVIDER_STATUS[p.status].label}</Status>
                          <span className={p.missingDocuments ? "type-caption text-warning num" : "type-caption text-ink-muted num"}>
                            {p.missingDocuments ? `${p.missingDocuments} Dokumente offen` : "Dokumente vollständig"}
                          </span>
                        </span>
                      }
                    />
                  ))}
                </ul>
              )}
            </PanelCard>

            <PanelCard
              title={
                <>
                  Offene Streitfälle {disputes.length ? <CountPill accent>{disputes.length}</CountPill> : null}
                </>
              }
              action={<MutedLink href={routes.admin.disputes()}>Alle anzeigen</MutedLink>}
            >
              {disputes.length === 0 ? (
                <QueueEmpty>Keine offenen Streitfälle.</QueueEmpty>
              ) : (
                <ul className="divide-y divide-line">
                  {disputes.slice(0, 5).map((d) => (
                    <QueueRow
                      key={d.id}
                      href={`${routes.admin.disputes()}?fall=${d.id}`}
                      title={
                        <>
                          <span className="code-ref">{d.bookingReference}</span> · {DISPUTE_REASON[d.reason]}
                        </>
                      }
                      meta={[`${d.customerName} ↔ ${d.providerName}`, `seit ${formatRelative(d.createdAt)}`]}
                      aside={<Status tone={DISPUTE_STATUS[d.status].tone}>{DISPUTE_STATUS[d.status].label}</Status>}
                    />
                  ))}
                </ul>
              )}
            </PanelCard>

            <PanelCard
              title={
                <>
                  Unbeantwortete Anfragen {ops.openRequests ? <CountPill accent>{ops.openRequests}</CountPill> : null}
                </>
              }
              action={<MutedLink href={`${routes.admin.bookings()}?status=requested`}>Alle anzeigen</MutedLink>}
            >
              {ops.expiringRequests.length === 0 ? (
                <QueueEmpty>Keine offenen Anfragen.</QueueEmpty>
              ) : (
                <ul className="divide-y divide-line">
                  {ops.expiringRequests.map((r) => {
                    const left = r.respondBy ? new Date(r.respondBy).getTime() - now.getTime() : null;
                    const urgent = left !== null && left < 3 * 3_600_000;
                    return (
                      <QueueRow
                        key={r.id}
                        href={routes.admin.booking(r.id)}
                        title={
                          <>
                            <span className="code-ref">{r.reference}</span> · {r.serviceName}
                          </>
                        }
                        meta={[`${r.providerName} · ${r.customerName}`, `Termin ${formatShortDateTime(r.startsAt)}`]}
                        aside={
                          r.respondBy ? (
                            <span className="flex flex-col items-end gap-1">
                              <Status tone={urgent ? "danger" : "warning"}>{left !== null && left < 0 ? "Frist abgelaufen" : `läuft ab ${formatRelative(r.respondBy, now)}`}</Status>
                              <span className="type-caption text-ink-muted num">bis {formatShortDateTime(r.respondBy)}</span>
                            </span>
                          ) : (
                            <Status tone="warning">Ohne Frist</Status>
                          )
                        }
                      />
                    );
                  })}
                </ul>
              )}
            </PanelCard>

            <PanelCard
              title={
                <>
                  Dokumente &amp; Sperren {ops.documentAlertsTotal ? <CountPill accent>{ops.documentAlertsTotal}</CountPill> : null}
                </>
              }
              action={<MutedLink href={`${routes.admin.providers()}?status=gesperrt`}>Gesperrte Profis</MutedLink>}
            >
              {ops.documentAlerts.length === 0 ? (
                <QueueEmpty>Keine abgelaufenen oder abgelehnten Pflichtdokumente.</QueueEmpty>
              ) : (
                <ul className="divide-y divide-line">
                  {ops.documentAlerts.map((a) => (
                    <QueueRow
                      key={`${a.providerId}-${a.at}`}
                      href={routes.admin.provider(a.providerId)}
                      title={a.displayName}
                      meta={[a.note, a.status === "suspended" ? `seit ${formatRelative(a.at, now)}` : `am ${formatShortDateTime(a.at)}`]}
                      aside={<Status tone={a.status === "suspended" ? "danger" : "warning"}>{a.status === "suspended" ? "Automatisch pausiert" : "Läuft bald ab"}</Status>}
                    />
                  ))}
                </ul>
              )}
            </PanelCard>

            <PanelCard
              title={
                <>
                  Fehlgeschlagene Zahlungen {ops.failedPaymentsTotal ? <CountPill accent>{ops.failedPaymentsTotal}</CountPill> : null}
                </>
              }
              action={<MutedLink href={`${routes.admin.payments()}?status=failed`}>Alle anzeigen</MutedLink>}
            >
              {ops.failedPayments.length === 0 ? (
                <QueueEmpty>Keine fehlgeschlagenen Zahlungen.</QueueEmpty>
              ) : (
                <ul className="divide-y divide-line">
                  {ops.failedPayments.map((p) => (
                    <QueueRow
                      key={p.id}
                      href={routes.admin.booking(p.bookingId)}
                      title={
                        <>
                          <span className="code-ref">{p.bookingReference}</span> · {p.customerName}
                        </>
                      }
                      meta={[formatDateTime(p.createdAt), p.provider === "dev" ? "Testzahlung" : "Stripe"]}
                      aside={
                        <span className="flex flex-col items-end gap-1">
                          <span className="type-label-s num">{formatPrice(p.amountCents)}</span>
                          <Status tone={PAYMENT_STATUS[p.status].tone}>{PAYMENT_STATUS[p.status].label}</Status>
                        </span>
                      }
                    />
                  ))}
                </ul>
              )}
            </PanelCard>
          </div>
        </AdminSection>

        <AdminSection id="trend" title="Entwicklung" description={`Tageswerte der letzten ${days} Tage, Europe/Berlin.`}>
          <div className="grid gap-4 lg:grid-cols-3">
            <PanelCard title="Buchungen" action={<span className="type-label-s text-ink-muted num">{formatInt(sum("bookings"))} erstellt</span>} bodyClassName="p-4">
              <LineChart
                title="Buchungen pro Tag"
                dates={dates}
                series={[
                  { key: "b", label: "Erstellt", tone: "ink", values: series.map((p) => p.bookings) },
                  { key: "c", label: "Abgeschlossen", tone: "accent", values: series.map((p) => p.completed) },
                ]}
              />
            </PanelCard>
            <PanelCard title="GMV" action={<span className="type-label-s text-ink-muted num">{euro(sum("gmvCents"))}</span>} bodyClassName="p-4">
              <LineChart
                title="GMV pro Tag (abgeschlossene Buchungen)"
                dates={dates}
                series={[{ key: "g", label: "GMV", tone: "ink", values: series.map((p) => p.gmvCents) }]}
                unit="euro"
              />
            </PanelCard>
            <PanelCard title="Suchen" action={<span className="type-label-s text-ink-muted num">{formatInt(sum("searches"))} gesamt</span>} bodyClassName="p-4">
              <LineChart title="Suchen pro Tag" dates={dates} series={[{ key: "s", label: "Suchen", tone: "ink", values: series.map((p) => p.searches) }]} />
            </PanelCard>
          </div>
        </AdminSection>

        <div className="grid gap-4 lg:grid-cols-2">
          <PanelCard title="Buchungen nach Status" action={<span className="type-caption text-ink-muted">erstellt im Zeitraum</span>} bodyClassName="px-4 py-2">
            {statusRows.length ? <BarList rows={statusRows} /> : <QueueEmpty>Keine Buchungen im Zeitraum.</QueueEmpty>}
          </PanelCard>
          <PanelCard title="Funnel" action={<span className="type-caption text-ink-muted">Suche → Buchung → Abschluss</span>} bodyClassName="px-4 py-2">
            <BarList
              rows={[
                { key: "s", label: "Suchen", value: kpi.searches },
                { key: "z", label: "davon ohne Ergebnis", value: kpi.zeroResultSearches, tone: "danger", display: `${formatInt(kpi.zeroResultSearches)} · ${formatPercent(kpi.searches ? kpi.zeroResultSearches / kpi.searches : 0)}` },
                { key: "b", label: "Buchungen erstellt", value: kpi.bookingsCreated, display: `${formatInt(kpi.bookingsCreated)} · ${formatPercent(kpi.conversionRate)}` },
                { key: "c", label: "Abgeschlossen", value: kpi.completedBookings, tone: "accent" },
                { key: "w", label: "Wartelisten-Eintragungen", value: kpi.waitlistSignups, tone: "muted" },
              ]}
              max={Math.max(1, kpi.searches)}
            />
            <p className="pb-2 type-caption text-ink-muted">
              <Link href={routes.admin.regions()} className="inline-flex items-center gap-1 rounded-xs text-accent underline underline-offset-[0.2em] hover:text-accent-hover">
                Angebotslücken nach Region <Icon icon={ArrowRight} size={14} />
              </Link>
            </p>
          </PanelCard>
        </div>
      </div>
    </>
  );
}

function QueueEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 px-4 py-6 type-body-s text-ink-muted">
      <span aria-hidden className="block h-0.5 w-4 bg-line-strong" />
      {children}
    </p>
  );
}

function QueueRow({ href, title, meta, aside }: { href: string; title: React.ReactNode; meta: Array<string | null>; aside: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="group flex min-h-14 items-center justify-between gap-4 px-4 py-2.5 transition-colors hover:bg-surface-sunken">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate type-body-s font-[520] text-ink group-hover:underline group-hover:underline-offset-4">{title}</span>
          <span className="truncate type-caption text-ink-muted">{meta.filter(Boolean).join(" · ")}</span>
        </span>
        <span className="shrink-0">{aside}</span>
      </Link>
    </li>
  );
}
