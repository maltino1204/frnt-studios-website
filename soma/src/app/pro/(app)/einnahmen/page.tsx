import Link from "next/link";
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
import { StatGrid, StatTile, Table } from "@/components/ui/data";
import { EmptyState, Notice, Status } from "@/components/ui/feedback";
import { formatDate, formatDayShort, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import type { CommissionTier, EarningsItemDTO } from "@/server/dto";
import { getEarnings, getProSettings } from "@/server/services/pro";
import { getProviderTerms } from "@/server/services/pro-ext";

export const metadata = { title: "Einnahmen" };

const monthFmt = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", month: "long", year: "numeric" });
const monthKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit" });

function rateOf(i: EarningsItemDTO): number {
  return i.servicePriceCents > 0 ? i.commissionCents / i.servicePriceCents : 0;
}

function stateLine(i: EarningsItemDTO): string {
  if (i.disputed) return "Einspruch offen";
  if (i.payoutState === "pending" && i.availableAt) return `ab ${formatDayShort(i.availableAt)}`;
  return PAYOUT_STATE_LABEL[i.payoutState];
}

export default async function ProEarningsPage({ searchParams }: PageProps<"/pro/einnahmen">) {
  const session = await requireRole("provider", "/pro/einnahmen");
  const sp = await searchParams;
  const [earnings, settings, terms] = await Promise.all([getEarnings(session, { limit: 200 }), getProSettings(session), getProviderTerms()]);
  const devPayments = (process.env.PAYMENTS_PROVIDER ?? "dev") !== "stripe";
  const justConnected = sp.testmodus === "auszahlung" || sp.auszahlung === "fertig";
  const { totals, items, payouts } = earnings;

  const months = new Map<string, { label: string; count: number; gross: number; commission: number; travel: number; payout: number }>();
  for (const i of items) {
    const at = i.completedAt ?? i.startsAt;
    const k = monthKey.format(new Date(at));
    const m = months.get(k) ?? { label: monthFmt.format(new Date(at)), count: 0, gross: 0, commission: 0, travel: 0, payout: 0 };
    m.count += 1;
    m.gross += i.status === "completed" ? i.servicePriceCents : 0;
    m.commission += i.commissionCents;
    m.travel += i.status === "completed" ? i.travelFeeCents : 0;
    m.payout += i.payoutCents;
    months.set(k, m);
  }
  const monthRows = [...months.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 12);
  const rates = terms.commission;
  const tierRate: Record<CommissionTier, number | null> = {
    base: rates?.rate ?? null,
    repeat: rates?.repeatClientRate ?? null,
    own_client: rates?.ownClientRate ?? null,
  };

  return (
    <ProPage>
      <ProHeader title="Einnahmen" description={`Du bekommst dein Geld ${terms.payoutHoldHours} Stunden nach dem Termin, sofern kein Einspruch eingeht. Die Anfahrt ist immer provisionsfrei.`} />

      {justConnected && settings.payoutsEnabled ? (
        <Notice kind="success" title="Auszahlungen eingerichtet.">
          {devPayments ? "Im Testmodus wurde die Einrichtung simuliert – es wurden keine echten Konto- oder Ausweisdaten abgefragt." : "Dein Auszahlungskonto ist verbunden."}
        </Notice>
      ) : null}

      <StatGrid>
        <StatTile label="Verfügbar" value={formatPrice(totals.availableCents)} hint="geht mit der nächsten Auszahlung raus" />
        <StatTile label="Ausstehend" value={formatPrice(totals.pendingCents)} hint={`frei nach ${terms.payoutHoldHours} Std.`} />
        <StatTile label="Ausgezahlt" value={formatPrice(totals.paidOutCents)} hint="insgesamt" />
        <StatTile label="Diesen Monat" value={formatPrice(totals.monthCents)} hint={`${formatPrice(totals.yearCents)} in diesem Jahr`} />
      </StatGrid>

      <section className="flex flex-col gap-4 border border-line bg-surface-raised p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6" aria-labelledby="konto">
        <div className="flex flex-col gap-1.5">
          <h2 id="konto" className="type-heading-m">
            Auszahlungskonto
          </h2>
          {settings.payoutsEnabled ? (
            <Status tone="success">Aktiv · Auszahlungen über Stripe Connect</Status>
          ) : (
            <Status tone="warning">Noch nicht eingerichtet</Status>
          )}
          <p className="max-w-reading type-body-s text-ink-muted">
            {settings.payoutsEnabled
              ? "Stripe überweist deine verfügbaren Einnahmen auf dein hinterlegtes Konto."
              : "Damit wir dir dein Geld überweisen können, verbindest du einmalig ein Auszahlungskonto bei Stripe (Identität und IBAN)."}
            {devPayments ? " Testmodus: Die Einrichtung wird simuliert, es werden keine echten Daten abgefragt." : ""}
          </p>
        </div>
        {!settings.payoutsEnabled ? <PayoutButton /> : !devPayments ? <PayoutButton label="Konto bei Stripe verwalten" variant="secondary" /> : null}
      </section>

      <ProSection id="provision" title="Deine Provision">
        <dl className="grid gap-px border border-line bg-line sm:grid-cols-3">
          {(["base", "repeat", "own_client"] as CommissionTier[]).map((t) => (
            <div key={t} className="flex flex-col gap-1 bg-surface-raised p-5">
              <dt className="type-label-s text-ink-muted hyphens-none">{TIER_LABEL[t]}</dt>
              <dd className="type-stat">{tierRate[t] != null ? formatPercent(tierRate[t]!) : "—"}</dd>
              <dd className="type-caption text-ink-muted">{TIER_DESCRIPTION[t]}</dd>
            </div>
          ))}
        </dl>
        <p className="type-caption text-ink-muted">
          Bring eigene Kundschaft über deinen <Link href={routes.pro.settings()} className="text-accent underline underline-offset-[0.2em]">Einladungslink</Link> mit. Anfahrtskosten sind immer provisionsfrei.
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
                      <td className="text-right num">−{formatPrice(m.commission)}</td>
                      <td className="text-right font-semibold num">{formatPrice(m.payout)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <ul className="border-y border-line md:hidden">
              {monthRows.map(([k, m]) => (
                <li key={k} className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="type-body-s font-[520]">{m.label}</span>
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
          <EmptyState className="py-2!" title="Noch keine Einnahmen.">
            Sobald du den ersten Termin abschließt, siehst du hier, was du verdienst.
          </EmptyState>
        )}
      </ProSection>

      {items.length ? (
        <ProSection id="termine" title="Pro Termin">
          <div className="hidden md:block">
            <Table>
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
                {items.map((i) => (
                  <tr key={i.bookingId}>
                    <td className="whitespace-nowrap num">{formatDate(i.completedAt ?? i.startsAt)}</td>
                    <td>
                      <Link href={routes.pro.booking(i.bookingId)} className="text-ink hover:underline hover:underline-offset-4">
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
                    <td className="text-right font-semibold num">{formatPrice(i.payoutCents)}</td>
                    <td className="whitespace-nowrap">
                      <Status tone={i.disputed ? "danger" : PAYOUT_STATE_TONE[i.payoutState]}>{stateLine(i)}</Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <ul className="border-y border-line md:hidden">
            {items.map((i) => (
              <li key={i.bookingId} className="border-b border-line last:border-b-0">
                <Link href={routes.pro.booking(i.bookingId)} className="flex items-start justify-between gap-4 py-3 hover:bg-surface-sunken">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="type-body-s font-[520] text-ink">{i.serviceName}</span>
                    <span className="type-caption text-ink-muted num">
                      {formatDate(i.completedAt ?? i.startsAt)} · {TIER_LABEL[i.commissionTier]} {formatPercent(rateOf(i))}
                    </span>
                    <Status tone={i.disputed ? "danger" : PAYOUT_STATE_TONE[i.payoutState]}>{stateLine(i)}</Status>
                  </div>
                  <span className="flex shrink-0 flex-col items-end">
                    <span className="type-label num">{formatPrice(i.payoutCents)}</span>
                    <span className="type-caption text-ink-muted num">von {formatPrice(i.servicePriceCents + i.travelFeeCents)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ProSection>
      ) : null}

      <ProSection id="auszahlungen" title="Auszahlungen">
        {payouts.length ? (
          <ul className="border-y border-line">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0">
                <div className="flex flex-col gap-1">
                  <span className="type-body-s font-[520] num">{formatDate(p.paidAt ?? p.createdAt)}</span>
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
        ) : (
          <p className="border-y border-line py-4 type-body-s text-ink-muted">Noch keine Auszahlungen. Verfügbare Beträge werden gesammelt überwiesen.</p>
        )}
      </ProSection>
    </ProPage>
  );
}
