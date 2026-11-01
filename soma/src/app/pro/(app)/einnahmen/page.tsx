import Link from "next/link";
import { ArrowRight, CalendarRange, Hourglass, Landmark, Wallet } from "lucide-react";
import {
  PAYOUT_STATE_LABEL,
  PAYOUT_STATE_TONE,
  PAYOUT_STATUS_LABEL,
  PAYOUT_STATUS_TONE,
  TIER_DESCRIPTION,
  TIER_LABEL,
  formatPercent,
} from "@/components/pro/labels";
import { ProHeader, ProPage, ProSection } from "@/components/pro/page";
import { PayoutButton } from "@/components/pro/payout-button";
import { MoneyCount, monthKeyOf, monthlySeries } from "@/components/pro/stats";
import { berlinToIso } from "@/components/pro/time";
import { IconTile } from "@/components/pro/ui";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { AreaChart } from "@/components/ui/chart";
import { StatGrid, StatTile, Table } from "@/components/ui/data";
import { EmptyState, Notice, Status } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { formatDate, formatDayShort, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import type { CommissionTier, EarningsItemDTO } from "@/server/dto";
import { getEarnings, getProSettings } from "@/server/services/pro";
import { getProviderTerms } from "@/server/services/pro-ext";

export const metadata = { title: "Einnahmen" };

const monthFmt = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", month: "long", year: "numeric" });
const monthShort = new Intl.DateTimeFormat("de-DE", { timeZone: "UTC", month: "short" });
const monthLong = new Intl.DateTimeFormat("de-DE", { timeZone: "UTC", month: "long" });
const ITEMS_PREVIEW = 12;

function rateOf(i: EarningsItemDTO): number {
  return i.servicePriceCents > 0 ? i.commissionCents / i.servicePriceCents : 0;
}

function stateLine(i: EarningsItemDTO): string {
  if (i.disputed) return "Einspruch offen";
  if (i.payoutState === "pending" && i.availableAt) return `ab ${formatDayShort(i.availableAt)}`;
  return PAYOUT_STATE_LABEL[i.payoutState];
}

/** What the client paid for this item (treatment + travel, or the retained fee). */
const revenueOf = (i: EarningsItemDTO) => (i.status === "completed" ? i.servicePriceCents + i.travelFeeCents : i.payoutCents + i.commissionCents);

export default async function ProEarningsPage({ searchParams }: PageProps<"/pro/einnahmen">) {
  const session = await requireRole("provider", "/pro/einnahmen");
  const sp = await searchParams;
  const [earnings, settings, terms] = await Promise.all([getEarnings(session, { limit: 200 }), getProSettings(session), getProviderTerms()]);
  const devPayments = (process.env.PAYMENTS_PROVIDER ?? "dev") !== "stripe";
  const justConnected = sp.testmodus === "auszahlung" || sp.auszahlung === "fertig";
  const showAll = sp.alle === "1";
  const { totals, items, payouts } = earnings;
  const now = Date.now();

  // Monthly table (all months with activity, newest first).
  const months = new Map<string, { label: string; count: number; gross: number; commission: number; travel: number; payout: number }>();
  for (const i of items) {
    const at = i.completedAt ?? i.startsAt;
    const k = monthKeyOf(at);
    const m = months.get(k) ?? { label: monthFmt.format(new Date(at)), count: 0, gross: 0, commission: 0, travel: 0, payout: 0 };
    m.count += 1;
    m.gross += i.status === "completed" ? i.servicePriceCents : 0;
    m.commission += i.commissionCents;
    m.travel += i.status === "completed" ? i.travelFeeCents : 0;
    m.payout += i.payoutCents;
    months.set(k, m);
  }
  const monthRows = [...months.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 12);

  // Chart and KPI series from the same items (Berlin months).
  const six = monthlySeries(items, 6, (i) => i.payoutCents, now);
  const sixRevenue = monthlySeries(items, 6, revenueOf, now);
  const sixTotal = six.reduce((a, m) => a + m.value, 0);
  const label = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return monthShort.format(new Date(Date.UTC(y, m - 1, 15)));
  };
  const longLabel = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return monthLong.format(new Date(Date.UTC(y, m - 1, 15)));
  };
  const peak = six.reduce((a, b) => (b.value > a.value ? b : a), six[0]);
  const summary = `Deine Einnahmen der letzten sechs Monate: zusammen ${formatPrice(sixTotal)}, von ${formatPrice(six[0].value)} im ${longLabel(six[0].key)} bis ${formatPrice(six[5].value)} im ${longLabel(six[5].key)}; Höchstwert ${formatPrice(peak.value)} im ${longLabel(peak.key)}. Gestrichelt: Umsatz inklusive Provision und Anfahrt.`;

  const curKey = monthKeyOf(now);
  const monthStart = Date.parse(berlinToIso(`${curKey}-01`, "00:00"));
  const prevKey = six[4].key;
  const prevStart = Date.parse(berlinToIso(`${prevKey}-01`, "00:00"));
  const sumBetween = (a: number, b: number) =>
    items.filter((i) => i.completedAt && Date.parse(i.completedAt) >= a && Date.parse(i.completedAt) < b).reduce((s, i) => s + i.payoutCents, 0);
  const monthSoFar = sumBetween(monthStart, now + 1);
  const prevSoFar = sumBetween(prevStart, Math.min(monthStart, prevStart + (now - monthStart)));
  const monthDelta = prevSoFar > 0 ? Math.round(((monthSoFar - prevSoFar) / prevSoFar) * 1000) / 10 : null;
  const paidSeries = [...payouts]
    .filter((p) => p.status === "paid")
    .sort((a, b) => Date.parse(a.paidAt ?? a.createdAt) - Date.parse(b.paidAt ?? b.createdAt))
    .reduce<number[]>((acc, p) => [...acc, (acc.at(-1) ?? 0) + p.amountCents], [0]);

  const rates = terms.commission;
  const tierRate: Record<CommissionTier, number | null> = {
    base: rates?.rate ?? null,
    repeat: rates?.repeatClientRate ?? null,
    own_client: rates?.ownClientRate ?? null,
  };
  const tierStats = (t: CommissionTier) => {
    const list = items.filter((i) => i.commissionTier === t);
    return { count: list.length, commission: list.reduce((a, i) => a + i.commissionCents, 0) };
  };
  const shownItems = showAll ? items : items.slice(0, ITEMS_PREVIEW);

  return (
    <ProPage>
      <ProHeader title="Einnahmen" description={`Du bekommst dein Geld ${terms.payoutHoldHours} Stunden nach dem Termin, sofern kein Einspruch eingeht. Die Anfahrt ist immer provisionsfrei.`} />

      {justConnected && settings.payoutsEnabled ? (
        <Notice kind="success" title="Auszahlungen eingerichtet.">
          {devPayments ? "Im Testmodus wurde die Einrichtung simuliert – es wurden keine echten Konto- oder Ausweisdaten abgefragt." : "Dein Auszahlungskonto ist verbunden."}
        </Notice>
      ) : null}

      <StatGrid>
        <StatTile label="Verfügbar" icon={<Icon icon={Wallet} size={16} />} value={<MoneyCount cents={totals.availableCents} />} hint="geht mit der nächsten Auszahlung raus" />
        <StatTile label="Ausstehend" icon={<Icon icon={Hourglass} size={16} />} value={<MoneyCount cents={totals.pendingCents} />} hint={`frei nach ${terms.payoutHoldHours} Std.`} />
        <StatTile label="Ausgezahlt" icon={<Icon icon={Landmark} size={16} />} value={<MoneyCount cents={totals.paidOutCents} />} hint="insgesamt" spark={paidSeries.length > 2 ? paidSeries : undefined} />
        <StatTile
          label="Diesen Monat"
          icon={<Icon icon={CalendarRange} size={16} />}
          value={<MoneyCount cents={monthSoFar} />}
          delta={monthDelta}
          deltaLabel="ggü. Vormonat"
          hint={`${formatPrice(totals.yearCents)} in diesem Jahr`}
          spark={six.map((m) => m.value)}
        />
      </StatGrid>

      <section aria-labelledby="verlauf-title" className="flex flex-col gap-5 rounded-card bg-surface-raised p-5 shadow-raised lg:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="verlauf-title" className="type-label-s text-ink-muted">
              Für dich · letzte 6 Monate
            </h2>
            <p className="type-stat">
              <MoneyCount cents={sixTotal} tile={false} />
            </p>
          </div>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 type-caption text-ink-muted" aria-label="Legende">
            <li className="inline-flex items-center gap-2">
              <span aria-hidden className="h-0.5 w-4 rounded-full bg-chart-1" />
              Für dich
            </li>
            <li className="inline-flex items-center gap-2">
              <span aria-hidden className="h-0 w-4 border-t-[1.5px] border-dashed border-chart-5" />
              Umsatz
            </li>
          </ul>
        </div>
        <AreaChart
          data={six.map((m) => ({ label: label(m.key), value: Math.round(m.value) / 100 }))}
          compare={sixRevenue.map((m) => Math.round(m.value) / 100)}
          unit=" €"
          height={220}
          summary={summary}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-card bg-surface-raised p-5 shadow-raised sm:flex-row sm:items-center sm:justify-between lg:p-6" aria-labelledby="konto">
        <div className="flex items-start gap-4">
          <IconTile icon={Landmark} tone={settings.payoutsEnabled ? "success" : "warning"} size={44} />
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="konto" className="type-heading-m">
                Auszahlungskonto
              </h2>
              {settings.payoutsEnabled ? <Status tone="success">Aktiv · Stripe Connect</Status> : <Status tone="warning">Noch nicht eingerichtet</Status>}
            </div>
            <p className="max-w-reading type-body-s text-ink-muted">
              {settings.payoutsEnabled
                ? "Stripe überweist deine verfügbaren Einnahmen auf dein hinterlegtes Konto."
                : "Damit wir dir dein Geld überweisen können, verbindest du einmalig ein Auszahlungskonto bei Stripe (Identität und IBAN)."}
              {devPayments ? " Testmodus: Die Einrichtung wird simuliert, es werden keine echten Daten abgefragt." : ""}
            </p>
          </div>
        </div>
        {!settings.payoutsEnabled ? <PayoutButton /> : !devPayments ? <PayoutButton label="Konto bei Stripe verwalten" variant="secondary" /> : null}
      </section>

      <ProSection id="provision" title="Deine Provision" description="Drei Stufen, automatisch je Buchung. Anfahrtskosten sind immer provisionsfrei.">
        <ul className="grid gap-3 sm:grid-cols-3 lg:gap-4">
          {(["base", "repeat", "own_client"] as CommissionTier[]).map((t) => {
            const rate = tierRate[t];
            const keep = rate != null ? 1 - rate : null;
            const s = tierStats(t);
            const best = t === "own_client";
            return (
              <li key={t} className={cn("relative flex flex-col gap-4 overflow-hidden rounded-card p-5 lg:p-6", best ? "bg-surface-raised shadow-raised ring-1 ring-ink" : "bg-surface-raised shadow-raised")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="type-label text-ink hyphens-none">{TIER_LABEL[t]}</p>
                    <p className="type-caption text-ink-muted">{TIER_DESCRIPTION[t]}</p>
                  </div>
                  {best ? <Badge tone="aura" size="s" dot>Dein Link</Badge> : null}
                </div>
                <p className="flex items-baseline gap-2">
                  <span className="type-stat">{rate != null ? formatPercent(rate) : "—"}</span>
                  <span className="type-caption text-ink-muted">Provision</span>
                </p>
                {keep != null ? (
                  <div className="flex flex-col gap-2">
                    <div aria-hidden className="flex h-2 overflow-hidden rounded-full bg-surface-sunken">
                      <span className="h-full rounded-l-full bg-ink" style={{ width: `${keep * 100}%` }} />
                      <span className="h-full bg-chart-2" style={{ width: `${(1 - keep) * 100}%` }} />
                    </div>
                    <p className="type-caption text-ink">
                      Von 100&nbsp;€ bleiben dir <span className="font-[600] num">{formatPrice(Math.round(keep * 10000))}</span>
                    </p>
                  </div>
                ) : null}
                <p className="mt-auto border-t border-line pt-3 type-caption text-ink-muted num">
                  {s.count ? `${s.count} ${s.count === 1 ? "Termin" : "Termine"} · ${formatPrice(s.commission)} Provision bisher` : "Noch keine Termine in dieser Stufe"}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="type-caption text-ink-muted">
          Bring eigene Kundschaft über deinen{" "}
          <Link href={routes.pro.settings()} className="text-ink underline decoration-line-strong underline-offset-[0.2em] hover:text-link-hover hover:decoration-current">
            Einladungslink
          </Link>{" "}
          mit.
        </p>
      </ProSection>

      <ProSection id="monate" title="Monatsübersicht">
        {monthRows.length ? (
          <>
            <div className="hidden md:block">
              <Table>
                <thead>
                  <tr>
                    <th>Monat</th>
                    <th className="text-right">Termine</th>
                    <th className="text-right">Behandlungen</th>
                    <th className="text-right">Anfahrt</th>
                    <th className="text-right">Provision</th>
                    <th className="text-right">Für dich</th>
                  </tr>
                </thead>
                <tbody>
                  {monthRows.map(([k, m]) => (
                    <tr key={k}>
                      <td className="text-ink">{m.label}</td>
                      <td className="text-right num">{m.count}</td>
                      <td className="text-right num">{formatPrice(m.gross)}</td>
                      <td className="text-right num">{formatPrice(m.travel)}</td>
                      <td className="text-right text-ink-muted num">−{formatPrice(m.commission)}</td>
                      <td className="text-right font-semibold text-ink num">{formatPrice(m.payout)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <ul className="divide-y divide-line overflow-hidden rounded-card bg-surface-raised shadow-raised md:hidden">
              {monthRows.map(([k, m]) => (
                <li key={k} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="type-body-s font-[560]">{m.label}</span>
                    <span className="type-caption text-ink-muted num">
                      {m.count} Termine · −{formatPrice(m.commission)} Provision
                    </span>
                  </div>
                  <span className="type-label num">{formatPrice(m.payout)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="rounded-card bg-surface-raised px-5 shadow-raised">
            <EmptyState className="py-6!" seed="pro-einnahmen" title="Noch keine Einnahmen.">
              Sobald du den ersten Termin abschließt, siehst du hier, was du verdienst.
            </EmptyState>
          </div>
        )}
      </ProSection>

      {items.length ? (
        <ProSection
          id="termine"
          title="Pro Termin"
          description={showAll ? `${items.length} Termine` : `Die letzten ${Math.min(ITEMS_PREVIEW, items.length)} von ${items.length}`}
        >
          <div className="hidden md:block">
            <Table stickyHeader={showAll}>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Leistung</th>
                  <th>Provision</th>
                  <th className="text-right">Umsatz</th>
                  <th className="text-right">Für dich</th>
                  <th>Auszahlung</th>
                </tr>
              </thead>
              <tbody>
                {shownItems.map((i) => (
                  <tr key={i.bookingId}>
                    <td className="whitespace-nowrap num">{formatDate(i.completedAt ?? i.startsAt)}</td>
                    <td className="py-2">
                      <Link href={routes.pro.booking(i.bookingId)} className="rounded-control text-ink focus-ring hover:underline hover:underline-offset-4">
                        {i.serviceName}
                      </Link>
                      <span className="block type-caption text-ink-muted">
                        <span className="code-ref">{i.reference}</span>
                        {i.status !== "completed" ? " · Ausfallgebühr" : ""}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      {TIER_LABEL[i.commissionTier]} <span className="text-ink-muted num">· {formatPercent(rateOf(i))}</span>
                    </td>
                    <td className="text-right num">{formatPrice(i.servicePriceCents + i.travelFeeCents)}</td>
                    <td className="text-right font-semibold text-ink num">{formatPrice(i.payoutCents)}</td>
                    <td className="whitespace-nowrap">
                      <Status tone={i.disputed ? "danger" : PAYOUT_STATE_TONE[i.payoutState]}>{stateLine(i)}</Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-card bg-surface-raised shadow-raised md:hidden">
            {shownItems.map((i) => (
              <li key={i.bookingId}>
                <Link href={routes.pro.booking(i.bookingId)} className="flex items-start justify-between gap-4 px-4 py-3.5 transition-colors duration-fast focus-ring hover:bg-surface-tint">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="type-body-s font-[560] text-ink">{i.serviceName}</span>
                    <span className="type-caption text-ink-muted num">
                      {formatDate(i.completedAt ?? i.startsAt)} · {TIER_LABEL[i.commissionTier]} {formatPercent(rateOf(i))}
                    </span>
                    <Status tone={i.disputed ? "danger" : PAYOUT_STATE_TONE[i.payoutState]} className="mt-0.5">
                      {stateLine(i)}
                    </Status>
                  </div>
                  <span className="flex shrink-0 flex-col items-end">
                    <span className="type-label num">{formatPrice(i.payoutCents)}</span>
                    <span className="type-caption text-ink-muted num">von {formatPrice(i.servicePriceCents + i.travelFeeCents)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {!showAll && items.length > ITEMS_PREVIEW ? (
            <ButtonLink href={`${routes.pro.earnings()}?alle=1#termine`} variant="secondary" className="self-start" iconRight={<Icon icon={ArrowRight} />} scroll={false}>
              Alle {items.length} Termine anzeigen
            </ButtonLink>
          ) : null}
        </ProSection>
      ) : null}

      <ProSection id="auszahlungen" title="Auszahlungen">
        {payouts.length ? (
          <>
            <div className="hidden md:block">
              <Table>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Zeitraum</th>
                    <th className="text-right">Termine</th>
                    <th>Status</th>
                    <th className="text-right">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="whitespace-nowrap text-ink num">{formatDate(p.paidAt ?? p.createdAt)}</td>
                      <td className="whitespace-nowrap text-ink-muted num">{p.periodStart && p.periodEnd ? `${formatDate(p.periodStart)}–${formatDate(p.periodEnd)}` : "—"}</td>
                      <td className="text-right num">{p.bookingCount}</td>
                      <td>
                        <Status tone={PAYOUT_STATUS_TONE[p.status]}>{PAYOUT_STATUS_LABEL[p.status]}</Status>
                      </td>
                      <td className="text-right font-semibold text-ink num">{formatPrice(p.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <ul className="divide-y divide-line overflow-hidden rounded-card bg-surface-raised shadow-raised md:hidden">
              {payouts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <div className="flex flex-col gap-1">
                    <span className="type-body-s font-[560] num">{formatDate(p.paidAt ?? p.createdAt)}</span>
                    <span className="type-caption text-ink-muted num">
                      {p.bookingCount} {p.bookingCount === 1 ? "Termin" : "Termine"}
                      {p.periodStart && p.periodEnd ? ` · ${formatDate(p.periodStart)}–${formatDate(p.periodEnd)}` : ""}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="type-label num">{formatPrice(p.amountCents)}</span>
                    <Status tone={PAYOUT_STATUS_TONE[p.status]}>{PAYOUT_STATUS_LABEL[p.status]}</Status>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="rounded-card bg-surface-raised px-5 py-4 type-body-s text-ink-muted shadow-raised">Noch keine Auszahlungen. Verfügbare Beträge werden gesammelt überwiesen.</p>
        )}
      </ProSection>
    </ProPage>
  );
}
