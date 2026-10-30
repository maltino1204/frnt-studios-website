import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDayShort, formatDuration, formatPriceExact, formatSlotRange } from "@/lib/format";
import { AdminCancelButton, RefundButton, type BookingActionContext } from "@/components/admin/booking-actions";
import { formatDateTime, formatPercent } from "@/components/admin/format";
import { ACTOR, BOOKING_STATUS, DISPUTE_REASON, DISPUTE_STATUS, PAYMENT_STATUS, TIER } from "@/components/admin/labels";
import { AdminPageHeader, EMPTY, PanelCard } from "@/components/admin/page";
import { Status } from "@/components/ui/feedback";
import { FactList } from "@/components/ui/layout";
import { PriceBreakdown, type PriceLine } from "@/components/ui/summary";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import type { AdminPayoutState } from "@/server/services/admin-ext";
import { getAdminBooking } from "@/server/services/admin";
import { getAdminBookingOps } from "@/server/services/admin-ext";

export const metadata: Metadata = { title: "Buchung" };

const PAYOUT_STATE: Record<AdminPayoutState, { label: string; tone: "neutral" | "warning" | "success" | "danger" | "accent" }> = {
  none: { label: "Keine Auszahlung fällig", tone: "neutral" },
  on_hold: { label: "In Haltefrist", tone: "warning" },
  eligible: { label: "Auszahlbar", tone: "accent" },
  disputed: { label: "Wegen Streitfall gehalten", tone: "danger" },
  in_batch: { label: "Im Auszahlungslauf", tone: "warning" },
  paid: { label: "Ausgezahlt", tone: "success" },
};

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole("admin", routes.admin.booking(id));
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [b, ops] = await Promise.all([getAdminBooking(session, id), getAdminBookingOps(session, id)]);
  if (!b || !ops) notFound();
  const st = BOOKING_STATUS[b.status];
  const minutes = Math.round((new Date(b.endsAt).getTime() - new Date(b.startsAt).getTime()) / 60_000);
  const lines: PriceLine[] = [
    { label: "Behandlung", detail: `${b.serviceName} · ${formatDuration(minutes)}`, cents: b.price.servicePriceCents },
    { label: "Anfahrt", cents: b.price.travelFeeCents },
  ];
  if (b.price.serviceFeeCents) lines.push({ label: "Servicegebühr", cents: b.price.serviceFeeCents });
  if (b.price.discountCents) lines.push({ label: "Guthaben", cents: b.price.discountCents, kind: "credit" });
  const ctx: BookingActionContext = {
    bookingId: b.id,
    reference: b.reference,
    status: b.status,
    statusLabel: st.label,
    totalCents: b.totalCents,
    commissionRate: b.commissionRate,
    commissionCents: b.commissionCents,
    providerPayoutCents: b.providerPayoutCents,
    adminCancellable: ops.adminCancellable,
    refundableCents: ops.refundableCents,
    paymentCaptured: b.payment?.status === "captured" || b.payment?.status === "partially_refunded",
    inPayout: ops.payout.state === "in_batch" || ops.payout.state === "paid",
    customerCancelNow: ops.customerCancelNow,
  };
  const payout = PAYOUT_STATE[ops.payout.state];

  return (
    <>
      <AdminPageHeader
        back={{ href: routes.admin.bookings(), label: "Buchungen" }}
        title={
          <>
            Buchung <span className="code-ref">{b.reference}</span>
          </>
        }
        meta={
          <span className="flex items-center gap-4">
            <Status tone={st.tone}>{st.label}</Status>
            {b.hasOpenDispute ? <Status tone="danger">Offener Streitfall</Status> : null}
          </span>
        }
        description={`${b.serviceName} · ${formatSlotRange(b.startsAt, b.endsAt)} · ${b.city}`}
        actions={
          ops.adminCancellable || ops.refundableCents > 0 ? (
            <>
              <RefundButton ctx={ctx} />
              <AdminCancelButton ctx={ctx} />
            </>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <PanelCard title="Termin" bodyClassName="px-4">
              <FactList
                items={[
                  { label: "Termin", value: <span className="num">{formatSlotRange(b.startsAt, b.endsAt)}</span> },
                  { label: "Dauer", value: <span className="num">{formatDuration(minutes)}</span> },
                  { label: "Modus", value: b.bookingMode === "instant" ? "Sofort bestätigt" : "Auf Anfrage" },
                  { label: "Ort", value: <span>{b.addressLine}<br /><span className="num">{b.postalCode}</span> {b.city}{b.addressDetails ? <><br /><span className="text-ink-muted">{b.addressDetails}</span></> : null}</span> },
                  { label: "Hinweise", value: b.notes ? <span className="whitespace-pre-line">{b.notes}</span> : EMPTY },
                  { label: "Erstellt", value: <span className="num">{formatDateTime(b.createdAt)}</span> },
                  ...(ops.respondBy && b.status === "requested" ? [{ label: "Antwortfrist", value: <span className="num">{formatDateTime(ops.respondBy)}</span> }] : []),
                  ...(ops.holdExpiresAt && b.status === "pending_payment" ? [{ label: "Reserviert bis", value: <span className="num">{formatDateTime(ops.holdExpiresAt)}</span> }] : []),
                  ...(b.cancellationReason ? [{ label: "Stornogrund", value: <span>{b.cancellationReason}{b.cancelledBy ? <span className="text-ink-muted"> · {ACTOR[b.cancelledBy]}</span> : null}</span> }] : []),
                ]}
              />
            </PanelCard>
            <PanelCard title="Preis & Provision" bodyClassName="flex flex-col gap-2 px-4 py-3">
              <PriceBreakdown lines={lines} totalCents={b.price.totalCents} />
              <FactList
                className="mt-2 border-t border-line"
                items={[
                  { label: "Provisionsstufe", value: `${TIER[b.commissionTier]} · ${formatPercent(b.commissionRate)}` },
                  { label: "Provision SOMA", value: <span className="num">{formatPriceExact(b.commissionCents)}</span> },
                  { label: "Auszahlung Profi", value: <span className="num">{formatPriceExact(b.providerPayoutCents)}</span> },
                  { label: "Stornogebühr", value: <span className="num">{b.cancellationFeeCents ? formatPriceExact(b.cancellationFeeCents) : EMPTY}</span> },
                  { label: "Erstattet", value: <span className="num">{b.refundCents ? formatPriceExact(b.refundCents) : EMPTY}</span> },
                ]}
              />
            </PanelCard>
          </div>

          <PanelCard title="Verlauf" bodyClassName="px-4 py-3">
            {b.events.length === 0 ? (
              <p className="type-body-s text-ink-muted">Keine Ereignisse.</p>
            ) : (
              <ol className="flex flex-col">
                {b.events.map((e, i) => (
                  <li key={i} className="flex gap-3 pb-4 last:pb-0">
                    <span aria-hidden className="relative flex w-2 shrink-0 justify-center pt-1.5">
                      <span className={`size-2 rounded-full ${i === b.events.length - 1 ? "bg-ink" : "bg-line-strong"}`} />
                      {i < b.events.length - 1 ? <span className="absolute top-4 -bottom-0 w-px bg-line" /> : null}
                    </span>
                    <div className="grid min-w-0 flex-1 gap-x-6 gap-y-0.5 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <p className="type-body-s">
                        {e.fromStatus ? <span className="text-ink-muted">{BOOKING_STATUS[e.fromStatus].label} → </span> : null}
                        <span className="font-[520]">{BOOKING_STATUS[e.toStatus].label}</span>
                        <span className="text-ink-muted"> · {ACTOR[e.actorRole]}</span>
                      </p>
                      <p className="type-caption text-ink-muted num sm:text-right">{formatDateTime(e.createdAt)}</p>
                      {e.note ? <p className="type-caption text-ink sm:col-span-2">„{e.note}“</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </PanelCard>

          {b.disputes.length ? (
            <PanelCard title="Streitfälle" bodyClassName="divide-y divide-line">
              {b.disputes.map((d) => (
                <Link key={d.id} href={`${routes.admin.disputes()}?fall=${d.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-sunken">
                  <span className="flex flex-col gap-0.5">
                    <span className="type-body-s font-[520]">{DISPUTE_REASON[d.reason]}</span>
                    <span className="type-caption text-ink-muted num">eröffnet {formatDateTime(d.createdAt)}</span>
                  </span>
                  <Status tone={DISPUTE_STATUS[d.status].tone}>{DISPUTE_STATUS[d.status].label}</Status>
                </Link>
              ))}
            </PanelCard>
          ) : null}
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <PanelCard title="Beteiligte" bodyClassName="px-4">
            <FactList
              items={[
                { label: "Kundschaft", value: <span className="flex flex-col items-end"><span>{b.customerName}</span><a className="type-caption text-accent underline-offset-4 hover:underline" href={`mailto:${b.customerEmail}`}>{b.customerEmail}</a></span> },
                { label: "Profi", value: <Link className="text-accent underline-offset-4 hover:underline" href={routes.admin.provider(b.providerId)}>{b.providerName}</Link> },
              ]}
            />
          </PanelCard>

          <PanelCard
            title="Zahlung"
            action={b.payment ? <span className="code-ref text-ink-muted">{b.payment.provider === "dev" ? "dev" : "stripe"}</span> : null}
            bodyClassName="px-4"
          >
            {b.payment ? (
              <FactList
                items={[
                  { label: "Status", value: <Status tone={PAYMENT_STATUS[b.payment.status].tone}>{PAYMENT_STATUS[b.payment.status].label}</Status> },
                  { label: "Betrag", value: <span className="num">{formatPriceExact(b.payment.amountCents)}</span> },
                  { label: "Eingezogen", value: <span className="num">{formatPriceExact(b.payment.capturedCents)}</span> },
                  { label: "Erstattet", value: <span className="num">{b.payment.refundedCents ? formatPriceExact(b.payment.refundedCents) : EMPTY}</span> },
                  { label: "Noch erstattbar", value: <span className="num">{formatPriceExact(ops.refundableCents)}</span> },
                  { label: "Plattformgebühr", value: <span className="num">{formatPriceExact(b.payment.applicationFeeCents)}</span> },
                  { label: "Karte", value: b.payment.cardBrand ? <span className="num">{b.payment.cardBrand} ·· {b.payment.cardLast4}</span> : EMPTY },
                  { label: "Externe ID", value: b.payment.externalId ? <span className="code-ref break-all">{b.payment.externalId}</span> : EMPTY },
                ]}
              />
            ) : (
              <p className="py-3 type-body-s text-ink-muted">Keine Zahlung angelegt.</p>
            )}
          </PanelCard>

          {b.refunds.length ? (
            <PanelCard title="Erstattungen" bodyClassName="divide-y divide-line">
              {b.refunds.map((r) => (
                <div key={r.id} className="flex flex-col gap-0.5 px-4 py-2.5">
                  <p className="flex justify-between gap-3 type-body-s">
                    <span className="font-[520] num">{formatPriceExact(r.amountCents)}</span>
                    <span className="type-caption text-ink-muted num">{formatDateTime(r.createdAt)}</span>
                  </p>
                  <p className="type-caption text-ink-muted">{r.reason}</p>
                </div>
              ))}
            </PanelCard>
          ) : null}

          <PanelCard title="Auszahlung an Profi" bodyClassName="flex flex-col gap-1 px-4 py-3">
            <Status tone={payout.tone}>{payout.label}</Status>
            {ops.payout.availableAt && (ops.payout.state === "on_hold" || ops.payout.state === "eligible") ? (
              <p className="type-caption text-ink-muted num">
                auszahlbar ab {formatDateTime(ops.payout.availableAt)} ({ops.payout.holdHours} h nach Abschluss)
              </p>
            ) : null}
          </PanelCard>

          <PanelCard title="Stornobedingungen" action={<span className="type-caption text-ink-muted">bei Buchung festgehalten</span>} bodyClassName="px-4 py-2">
            <ul className="flex flex-col">
              {ops.schedule.map((t, i) => (
                <li key={i} className="flex items-baseline justify-between gap-4 py-1.5 type-body-s">
                  <span className="text-ink-muted num">
                    {t.until ? `bis ${formatDayShort(t.until)}, ${formatDateTime(t.until).slice(-5)}` : t.from ? `ab ${formatDayShort(t.from)}, ${formatDateTime(t.from).slice(-5)}` : "jederzeit"}
                  </span>
                  <span className="min-w-0 text-right num">{t.label}</span>
                </li>
              ))}
              <li className="flex items-baseline justify-between gap-4 border-t border-line py-1.5 type-body-s">
                <span className="text-ink-muted">Nicht angetroffen</span>
                <span className="text-right num">{ops.policy.noShowFeePercent} % zzgl. Anfahrt</span>
              </li>
            </ul>
          </PanelCard>
        </aside>
      </div>
    </>
  );
}
