import { notFound } from "next/navigation";
import { Lock, Navigation, Phone } from "lucide-react";
import {
  CancelBookingButton,
  CompleteBookingButton,
  NoShowButton,
  RequestActions,
  StartBookingButton,
} from "@/components/pro/booking-actions";
import { isLive, proStatus } from "@/components/pro/bookings";
import { ResponseCountdown } from "@/components/pro/countdown";
import { EarningsLines } from "@/components/pro/earnings-lines";
import { LOCATION_LABEL, customerLabel } from "@/components/pro/labels";
import { ProHeader, ProPage } from "@/components/pro/page";
import { buttonClasses } from "@/components/ui/button";
import { Notice, Status } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { FactList } from "@/components/ui/layout";
import { cn } from "@/lib/cn";
import { formatDay, formatDayShort, formatDistance, formatDuration, formatTime, plural } from "@/lib/format";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import type { ProviderBookingDTO } from "@/server/dto";
import { getBookingForProvider } from "@/server/services/bookings";

export const metadata = { title: "Termin" };

const CANCELLED_BY: Record<string, string> = {
  customer: "von der Kundschaft",
  provider: "von dir",
  admin: "von SOMA",
  system: "automatisch",
};

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export default async function ProBookingDetailPage({ params }: PageProps<"/pro/termine/[id]">) {
  const { id } = await params;
  const session = await requireRole("provider", `/pro/termine/${id}`);
  if (!isUuid(id)) notFound();
  const b = await getBookingForProvider(session, id);
  if (!b) notFound();
  const now = Date.now();
  const st = proStatus(b, now);
  const live = isLive(b, now);
  const settled = ["cancelled", "declined", "expired", "no_show"].includes(b.status);
  const confirmedish = b.status === "confirmed" || b.status === "in_progress" || b.status === "completed";

  return (
    <ProPage>
      <ProHeader
        back={{ href: routes.pro.bookings(), label: "Termine" }}
        overline={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 normal-case tracking-normal">
            <Status tone={live ? "accent" : st.tone}>{live ? "Läuft jetzt" : st.label}</Status>
            <span className="code-ref text-ink-muted">{b.reference}</span>
          </span>
        }
        title={b.serviceName}
        description={
          <span className="num">
            {formatDay(b.startsAt)} · {formatTime(b.startsAt)}–{formatTime(b.endsAt)} · {formatDuration(b.durationMinutes)}
          </span>
        }
      />

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="order-2 flex flex-col gap-10 lg:order-1 lg:col-span-7">
          <section className="flex flex-col gap-3" aria-labelledby="kunde">
            <h2 id="kunde" className="type-heading-m">
              Kundschaft
            </h2>
            <FactList
              className="border-y border-line"
              items={[
                { label: "Name", value: customerLabel(b.customer) },
                {
                  label: "Auf SOMA",
                  value: b.isRepeatClient
                    ? "Stammkundschaft bei dir"
                    : b.customer.completedBookings > 0
                      ? plural(b.customer.completedBookings, "abgeschlossener Termin", "abgeschlossene Termine")
                      : "Erste Buchung",
                },
                {
                  label: "Telefon",
                  value: b.customer.phone ? (
                    <a href={`tel:${b.customer.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 text-accent underline decoration-1 underline-offset-[0.2em] num">
                      <Icon icon={Phone} size={16} />
                      {b.customer.phone}
                    </a>
                  ) : (
                    <span className="text-ink-muted">{b.status === "requested" ? "Nach Bestätigung sichtbar" : "—"}</span>
                  ),
                },
              ]}
            />
            <p className="type-caption text-ink-muted">Kontaktdaten sind nur rund um bestätigte Termine sichtbar. Bitte vereinbare Termine immer über SOMA – so bleiben Zahlung und Absicherung bestehen.</p>
          </section>

          <section className="flex flex-col gap-3" aria-labelledby="ort">
            <h2 id="ort" className="type-heading-m">
              Ort
            </h2>
            <div className="flex flex-col gap-1 border-y border-line py-4">
              <p className="type-label-s text-ink-muted">{LOCATION_LABEL[b.location.kind]}</p>
              {b.location.addressLine ? (
                <p className="type-body text-ink">
                  {b.location.addressLine}
                  <br />
                  {b.location.postalCode} {b.location.city}
                </p>
              ) : (
                <>
                  <p className="type-body text-ink">
                    {b.location.postalCode} {b.location.city}
                  </p>
                  <p className="flex items-center gap-1.5 type-body-s text-ink-muted">
                    <Icon icon={Lock} size={16} />
                    {b.status === "requested" ? "Adresse nach Bestätigung sichtbar" : "Adresse nicht mehr sichtbar"}
                  </p>
                </>
              )}
              <p className="type-caption text-ink-muted num">{formatDistance(b.location.distanceKm)} von deinem Standort</p>
              {b.location.details ? <p className="mt-2 type-body-s text-ink">{b.location.details}</p> : null}
              {b.location.addressLine ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${b.location.addressLine}, ${b.location.postalCode} ${b.location.city}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClasses({ variant: "secondary" }), "mt-3 self-start")}
                >
                  <Icon icon={Navigation} />
                  Route öffnen
                </a>
              ) : null}
            </div>
          </section>

          {b.notes ? (
            <section className="flex flex-col gap-3" aria-labelledby="hinweise">
              <h2 id="hinweise" className="type-heading-m">
                Hinweise der Kundschaft
              </h2>
              <p className="border-l-2 border-line pl-4 type-body text-ink">{b.notes}</p>
            </section>
          ) : null}

          <section className="flex flex-col gap-3" aria-labelledby="verlauf">
            <h2 id="verlauf" className="type-heading-m">
              Verlauf
            </h2>
            <Timeline booking={b} />
          </section>
        </div>

        <aside className="order-1 flex flex-col gap-6 lg:order-2 lg:col-span-5" aria-label="Aktionen">
          <div className="flex flex-col gap-5 border border-line bg-surface-raised p-5 lg:sticky lg:top-6 lg:p-6">
            <ActionArea booking={b} live={live} settled={settled} />
            <div className="flex flex-col gap-2 border-t border-line pt-5">
              <h2 className="type-heading-s">Verdienst</h2>
              <EarningsLines earnings={b.earnings} settled={settled} />
              {confirmedish ? (
                <p className="type-caption text-ink-muted">Auszahlung 48 Stunden nach dem Termin, sofern kein Einspruch eingeht.</p>
              ) : b.status === "requested" ? (
                <p className="type-caption text-ink-muted">Die Zahlung ist reserviert und wird erst nach dem Termin eingezogen.</p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </ProPage>
  );
}

function ActionArea({ booking: b, live, settled }: { booking: ProviderBookingDTO; live: boolean; settled: boolean }) {
  if (b.status === "requested") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="type-heading-m">Neue Anfrage</h2>
          <ResponseCountdown until={b.respondBy} />
        </div>
        <RequestActions bookingId={b.id} canRespond={b.actions.canAccept} withNote />
      </div>
    );
  }
  if (b.status === "in_progress") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="type-heading-m">Termin läuft</h2>
          <p className="type-body-s text-ink-muted">Gestartet um {b.startedAt ? formatTime(b.startedAt) : "—"} Uhr. Schließe ab, wenn du fertig bist.</p>
        </div>
        <CompleteBookingButton bookingId={b.id} payoutCents={b.earnings.payoutCents} canComplete={b.actions.canComplete} startsAt={b.startsAt} />
      </div>
    );
  }
  if (b.status === "confirmed") {
    const ended = Date.parse(b.endsAt) <= Date.now();
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="type-heading-m">{live ? "Jetzt vor Ort" : ended ? "Termin vorbei" : "Bestätigt"}</h2>
          <p className="type-body-s text-ink-muted">
            {ended
              ? "Starte mit dem Start-Code, um den Termin abzuschließen. Ohne Abschluss wird er 24 Stunden nach Ende automatisch abgeschlossen."
              : `Starte den Termin vor Ort mit dem Start-Code von ${b.customer.firstName ?? "der Kundschaft"}.`}
          </p>
        </div>
        <StartBookingButton booking={b} />
        {b.actions.canMarkNoShow ? <NoShowButton bookingId={b.id} firstName={b.customer.firstName} /> : null}
        {b.actions.canCancel ? <CancelBookingButton bookingId={b.id} startsAt={b.startsAt} /> : null}
      </div>
    );
  }
  if (b.status === "completed") {
    return (
      <div className="flex flex-col gap-1">
        <h2 className="type-heading-m">Abgeschlossen</h2>
        <p className="type-body-s text-ink-muted">
          {b.completedAt ? `Am ${formatDayShort(b.completedAt)} um ${formatTime(b.completedAt)} Uhr.` : null} Danke für deine Arbeit.
        </p>
      </div>
    );
  }
  if (settled) {
    const title = b.status === "declined" ? "Abgelehnt" : b.status === "expired" ? "Abgelaufen" : b.status === "no_show" ? "Nicht angetroffen" : "Storniert";
    return (
      <div className="flex flex-col gap-3">
        <h2 className="type-heading-m">{title}</h2>
        <p className="type-body-s text-ink-muted">
          {b.status === "expired"
            ? "Die Anfrage wurde nicht rechtzeitig beantwortet. Die Kundschaft wurde nicht belastet."
            : b.cancelledAt
              ? `${title}${b.cancelledBy ? ` ${CANCELLED_BY[b.cancelledBy] ?? ""}` : ""} am ${formatDayShort(b.cancelledAt)} um ${formatTime(b.cancelledAt)} Uhr.`
              : null}
        </p>
        {b.cancellationReason ? <Notice kind="info" title="Grund">{b.cancellationReason}</Notice> : null}
      </div>
    );
  }
  return <p className="type-body-s text-ink-muted">{b.statusLabel}</p>;
}

function Timeline({ booking: b }: { booking: ProviderBookingDTO }) {
  const entries = [
    b.confirmedAt ? { label: "Bestätigt", at: b.confirmedAt } : null,
    b.startedAt ? { label: "Gestartet", at: b.startedAt } : null,
    b.completedAt ? { label: "Abgeschlossen", at: b.completedAt } : null,
    b.cancelledAt ? { label: b.status === "declined" ? "Abgelehnt" : b.status === "no_show" ? "Nicht angetroffen" : "Storniert", at: b.cancelledAt } : null,
  ].filter((e): e is { label: string; at: string } => !!e);
  if (!entries.length) {
    return <p className="border-y border-line py-3 type-body-s text-ink-muted">{b.status === "requested" ? "Angefragt – wartet auf deine Antwort." : "Noch keine Einträge."}</p>;
  }
  return (
    <FactList
      className="border-y border-line"
      items={entries.map((e) => ({ label: e.label, value: <span className="num">{`${formatDayShort(e.at)} · ${formatTime(e.at)}`}</span> }))}
    />
  );
}
