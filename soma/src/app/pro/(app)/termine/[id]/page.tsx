import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Lock, MapPin, Navigation, Phone, Quote } from "lucide-react";
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
import { CardSection } from "@/components/pro/ui";
import { AuraArt } from "@/components/ui/aura";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Notice, Status } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { SuccessCheck } from "@/components/ui/success";
import { cn } from "@/lib/cn";
import { formatDay, formatDayShort, formatDistance, formatDuration, formatTime, plural } from "@/lib/format";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import type { ProviderBookingDTO } from "@/server/dto";
import { getBookingForProvider } from "@/server/services/bookings";
import { getProviderTerms } from "@/server/services/pro-ext";

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
  const [b, terms] = await Promise.all([getBookingForProvider(session, id), getProviderTerms()]);
  if (!b) notFound();
  const now = Date.now();
  const st = proStatus(b, now);
  const live = isLive(b, now);
  const settled = ["cancelled", "declined", "expired", "no_show"].includes(b.status);
  const confirmedish = b.status === "confirmed" || b.status === "in_progress" || b.status === "completed";
  const name = customerLabel(b.customer);

  return (
    <ProPage>
      <ProHeader
        back={{ href: routes.pro.bookings(), label: "Termine" }}
        overline={
          <>
            <Status tone={live ? "accent" : st.tone}>{live ? "Läuft jetzt" : st.label}</Status>
            <Badge size="s" className="code-ref">
              {b.reference}
            </Badge>
          </>
        }
        title={b.serviceName}
        description={
          <span className="num">
            {formatDay(b.startsAt)} · {formatTime(b.startsAt)}–{formatTime(b.endsAt)} · {formatDuration(b.durationMinutes)}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
        <aside className="order-1 flex min-w-0 flex-col gap-6 lg:order-2 lg:col-span-5" aria-label="Aktionen">
          <div className="relative flex flex-col overflow-hidden rounded-card bg-surface-raised shadow-raised lg:sticky lg:top-6">
            {live ? <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-aura" /> : null}
            <div className="relative flex flex-col gap-5 p-5 lg:p-6">
              <ActionArea booking={b} live={live} settled={settled} now={now} windowHours={terms.requestResponseHours} />
            </div>
            <div className="flex flex-col gap-2 border-t border-line bg-surface/50 p-5 lg:p-6">
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

        <div className="order-2 flex min-w-0 flex-col gap-6 lg:order-1 lg:col-span-7">
          <CardSection id="kunde" title="Kundschaft">
            <div className="flex items-center gap-4">
              <Avatar name={name} size={48} />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="type-heading-s">{name}</p>
                <p className="type-caption text-ink-muted">
                  {b.isRepeatClient
                    ? "Stammkundschaft bei dir"
                    : b.customer.completedBookings > 0
                      ? `${plural(b.customer.completedBookings, "abgeschlossener Termin", "abgeschlossene Termine")} auf SOMA`
                      : "Erste Buchung auf SOMA"}
                </p>
              </div>
            </div>
            <dl className="mt-4 flex flex-col border-y border-line">
              <div className="flex min-h-14 items-center justify-between gap-4 py-2">
                <dt className="type-body-s text-ink-muted">Telefon</dt>
                <dd>
                  {b.customer.phone ? (
                    <a href={`tel:${b.customer.phone.replace(/\s/g, "")}`} className={cn(buttonClasses({ variant: "secondary", size: "s" }), "num")}>
                      <Icon icon={Phone} size={16} />
                      {b.customer.phone}
                    </a>
                  ) : (
                    b.status === "requested" ? (
                      <span className="flex items-center gap-1.5 type-body-s text-ink-muted">
                        <Icon icon={Lock} size={16} className="size-3.5!" />
                        Nach Bestätigung sichtbar
                      </span>
                    ) : (
                      <span className="type-body-s text-ink-muted">—</span>
                    )
                  )}
                </dd>
              </div>
            </dl>
            <p className="mt-3 type-caption text-ink-muted">Kontaktdaten sind nur rund um bestätigte Termine sichtbar. Bitte vereinbare Termine immer über SOMA – so bleiben Zahlung und Absicherung bestehen.</p>
          </CardSection>

          <section aria-labelledby="ort-title" className="flex flex-col overflow-hidden rounded-card bg-surface-raised shadow-raised">
            <div aria-hidden className="relative h-28 overflow-hidden">
              <AuraArt seed={`ort-${b.location.postalCode}`} tone="brows-lashes" />
              <span className="absolute top-1/2 left-1/2 size-40 -translate-1/2 rounded-full border border-white/50" />
              <span className="absolute top-1/2 left-1/2 size-24 -translate-1/2 rounded-full border border-white/60" />
              <span className="absolute top-1/2 left-1/2 flex size-10 -translate-1/2 items-center justify-center rounded-full glass-strong glass-edge text-accent shadow-float">
                <MapPin size={18} strokeWidth={1.8} absoluteStrokeWidth />
              </span>
              <span className="absolute right-3 bottom-3 inline-flex h-7 items-center rounded-full glass-strong glass-edge px-3 type-label-s text-ink num">
                {formatDistance(b.location.distanceKm)}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 p-5 lg:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 id="ort-title" className="type-heading-m">
                  Ort
                </h2>
                <Badge size="s">{LOCATION_LABEL[b.location.kind]}</Badge>
              </div>
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
              {b.location.details ? <p className="mt-2 rounded-tile bg-surface-sunken px-3.5 py-2.5 type-body-s text-ink">{b.location.details}</p> : null}
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
            <CardSection id="hinweise" title="Hinweise der Kundschaft">
              <blockquote className="flex gap-3 rounded-tile bg-surface-sunken px-4 py-3.5 type-body text-ink">
                <Icon icon={Quote} size={18} className="mt-1 shrink-0 text-ink-muted" />
                <span>{b.notes}</span>
              </blockquote>
            </CardSection>
          ) : null}

          <CardSection id="verlauf" title="Verlauf">
            <Timeline booking={b} now={now} />
          </CardSection>
        </div>
      </div>
    </ProPage>
  );
}

function ActionHeading({ title, children, tone }: { title: string; children?: ReactNode; tone?: "live" | "done" }) {
  return (
    <div className="flex items-start gap-3">
      {tone === "done" ? <SuccessCheck size={40} glow={false} /> : null}
      {tone === "live" ? (
        <span aria-hidden className="relative mt-2 size-2.5 shrink-0 rounded-full bg-accent">
          <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-50 [animation-duration:2.4s]" />
        </span>
      ) : null}
      <div className="flex flex-col gap-1">
        <h2 className="type-heading-l">{title}</h2>
        {children ? <div className="type-body-s text-ink-muted">{children}</div> : null}
      </div>
    </div>
  );
}

function ActionArea({ booking: b, live, settled, now, windowHours }: { booking: ProviderBookingDTO; live: boolean; settled: boolean; now: number; windowHours: number }) {
  if (b.status === "requested") {
    return (
      <div className="flex flex-col gap-5">
        <ActionHeading title="Neue Anfrage">Sag zu, solange die Frist läuft. Die Zahlung ist bis dahin nur reserviert.</ActionHeading>
        <div className="rounded-tile bg-surface-sunken px-4 py-3 inset-shadow-sunken">
          <ResponseCountdown until={b.respondBy} serverNow={now} windowHours={windowHours} />
        </div>
        <RequestActions bookingId={b.id} canRespond={b.actions.canAccept} withNote />
      </div>
    );
  }
  if (b.status === "in_progress") {
    return (
      <div className="flex flex-col gap-5">
        <ActionHeading title="Termin läuft" tone="live">
          Gestartet um {b.startedAt ? formatTime(b.startedAt) : "—"} Uhr. Schließe ab, wenn du fertig bist.
        </ActionHeading>
        <CompleteBookingButton bookingId={b.id} payoutCents={b.earnings.payoutCents} canComplete={b.actions.canComplete} startsAt={b.startsAt} />
      </div>
    );
  }
  if (b.status === "confirmed") {
    const ended = Date.parse(b.endsAt) <= now;
    return (
      <div className="flex flex-col gap-4">
        <ActionHeading title={live ? "Jetzt vor Ort" : ended ? "Termin vorbei" : "Bestätigt"} tone={live ? "live" : undefined}>
          {ended
            ? "Starte mit dem Start-Code, um den Termin abzuschließen. Ohne Abschluss wird er 24 Stunden nach Ende automatisch abgeschlossen."
            : `Starte den Termin vor Ort mit dem Start-Code von ${b.customer.firstName ?? "der Kundschaft"}.`}
        </ActionHeading>
        <div className="flex flex-col gap-2 pt-1">
          <StartBookingButton booking={b} />
          {b.actions.canMarkNoShow ? <NoShowButton bookingId={b.id} firstName={b.customer.firstName} /> : null}
          {b.actions.canCancel ? <CancelBookingButton bookingId={b.id} startsAt={b.startsAt} /> : null}
        </div>
      </div>
    );
  }
  if (b.status === "completed") {
    return (
      <ActionHeading title="Abgeschlossen" tone="done">
        {b.completedAt ? `Am ${formatDayShort(b.completedAt)} um ${formatTime(b.completedAt)} Uhr.` : null} Danke für deine Arbeit.
      </ActionHeading>
    );
  }
  if (settled) {
    const title = b.status === "declined" ? "Abgelehnt" : b.status === "expired" ? "Abgelaufen" : b.status === "no_show" ? "Nicht angetroffen" : "Storniert";
    return (
      <div className="flex flex-col gap-4">
        <ActionHeading title={title}>
          {b.status === "expired"
            ? "Die Anfrage wurde nicht rechtzeitig beantwortet. Die Kundschaft wurde nicht belastet."
            : b.cancelledAt
              ? `${title}${b.cancelledBy ? ` ${CANCELLED_BY[b.cancelledBy] ?? ""}` : ""} am ${formatDayShort(b.cancelledAt)} um ${formatTime(b.cancelledAt)} Uhr.`
              : null}
        </ActionHeading>
        {b.cancellationReason ? <Notice kind="info" title="Grund">{b.cancellationReason}</Notice> : null}
      </div>
    );
  }
  return <p className="type-body-s text-ink-muted">{b.statusLabel}</p>;
}

type Entry = { label: string; at: string | null; state: "done" | "next" | "stop"; note?: string };

/** Vertical timeline: what happened (with time), and the next step, muted. */
function Timeline({ booking: b, now }: { booking: ProviderBookingDTO; now: number }) {
  const entries: Entry[] = [
    b.confirmedAt ? { label: "Bestätigt", at: b.confirmedAt, state: "done" as const } : null,
    b.startedAt ? { label: "Gestartet mit Start-Code", at: b.startedAt, state: "done" as const } : null,
    b.completedAt ? { label: "Abgeschlossen", at: b.completedAt, state: "done" as const } : null,
    b.cancelledAt
      ? { label: b.status === "declined" ? "Abgelehnt" : b.status === "no_show" ? "Nicht angetroffen" : "Storniert", at: b.cancelledAt, state: "stop" as const }
      : null,
  ].filter((e): e is NonNullable<typeof e> => !!e);
  if (b.status === "requested") entries.push({ label: "Wartet auf deine Antwort", at: b.respondBy, state: "next", note: "Antwortfrist" });
  else if (b.status === "confirmed" && Date.parse(b.endsAt) > now) entries.push({ label: "Start mit Start-Code", at: b.startsAt, state: "next", note: "geplant" });
  else if (b.status === "confirmed") entries.push({ label: "Abschluss offen", at: null, state: "next" });
  else if (b.status === "in_progress") entries.push({ label: "Abschließen", at: b.endsAt, state: "next", note: "geplantes Ende" });

  if (!entries.length) return <p className="type-body-s text-ink-muted">Noch keine Einträge.</p>;
  return (
    <ol className="flex flex-col">
      {entries.map((e, i) => {
        const last = i === entries.length - 1;
        return (
          <li key={`${e.label}-${i}`} className="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3">
            <span aria-hidden className="relative flex justify-center">
              {!last ? <span className={cn("absolute top-4 -bottom-0 w-px", entries[i + 1].state === "next" ? "bg-[repeating-linear-gradient(to_bottom,var(--color-line-mid)_0_3px,transparent_3px_6px)]" : "bg-line")} /> : null}
              <span
                className={cn(
                  "relative mt-1.5 flex size-3 items-center justify-center rounded-full",
                  e.state === "done" && "bg-ink shadow-[0_0_0_3px_var(--color-surface-raised)]",
                  e.state === "stop" && "bg-danger shadow-[0_0_0_3px_var(--color-surface-raised)]",
                  e.state === "next" && "bg-surface-raised shadow-[0_0_0_1.5px_var(--color-line-strong)]",
                )}
              />
            </span>
            <div className={cn("flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5", !last && "pb-5")}>
              <span className={cn("type-body-s font-[520]", e.state === "next" ? "text-ink-muted" : "text-ink")}>{e.label}</span>
              {e.at ? (
                <span className="type-caption text-ink-muted num">
                  {e.note ? `${e.note} · ` : ""}
                  {formatDayShort(e.at)} · {formatTime(e.at)}
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
