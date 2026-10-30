import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Status } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import { formatDayShort, formatDistance, formatDuration, formatPrice, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { ProviderBookingDTO } from "@/server/dto";
import { RequestActions } from "./booking-actions";
import { ResponseCountdown } from "./countdown";
import { BOOKING_TONE, LOCATION_LABEL, TIER_LABEL, customerLabel, formatPercent } from "./labels";

/** "10435 Berlin · 2,4 km · Zuhause" */
export function areaLine(b: Pick<ProviderBookingDTO, "location">): string {
  return [`${b.location.postalCode} ${b.location.city}`, formatDistance(b.location.distanceKm), LOCATION_LABEL[b.location.kind]].join(" · ");
}

export function isLive(b: Pick<ProviderBookingDTO, "status" | "startsAt" | "endsAt">, now = Date.now()): boolean {
  return b.status === "in_progress" || (b.status === "confirmed" && Date.parse(b.startsAt) <= now && Date.parse(b.endsAt) > now);
}

/** Status word for the provider: ended-but-open appointments read "Abschluss offen". */
export function proStatus(b: Pick<ProviderBookingDTO, "status" | "statusLabel" | "endsAt">, now = Date.now()) {
  if ((b.status === "confirmed" || b.status === "in_progress") && Date.parse(b.endsAt) <= now) {
    return { tone: "warning" as const, label: "Abschluss offen" };
  }
  return { tone: BOOKING_TONE[b.status], label: b.statusLabel };
}

/** 64px agenda row: time · client + treatment · status. Live appointment gets a 2px accent bar. */
export function AgendaRow({ booking: b, showDate = false, compact = false, now = Date.now() }: { booking: ProviderBookingDTO; showDate?: boolean; compact?: boolean; now?: number }) {
  const live = isLive(b, now);
  const st = proStatus(b, now);
  return (
    <li className="border-b border-line last:border-b-0">
      <Link
        href={routes.pro.booking(b.id)}
        className={cn(
          "group relative grid min-h-16 items-center gap-x-4 py-3 pr-1 transition-colors duration-fast hover:bg-surface-sunken",
          showDate ? "grid-cols-[6rem_minmax(0,1fr)_auto]" : compact ? "grid-cols-[3rem_minmax(0,1fr)_auto] gap-x-3" : "grid-cols-[4rem_minmax(0,1fr)_auto] sm:grid-cols-[4.5rem_minmax(0,1fr)_auto]",
          live && "bg-accent-soft/40",
        )}
      >
        {live ? <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" /> : null}
        <span className={cn("flex flex-col", compact ? "pl-2" : "pl-3", live && "text-accent")}>
          {showDate ? <span className="type-caption whitespace-nowrap text-ink-muted">{formatDayShort(b.startsAt)}</span> : null}
          <span className="type-label num">{formatTime(b.startsAt)}</span>
          <span className="type-caption text-ink-muted num">{formatTime(b.endsAt)}</span>
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="line-clamp-2 type-body-s font-[520] text-ink">
            {customerLabel(b.customer)} <span className="text-ink-muted">·</span> {b.serviceName}
          </span>
          <span className="truncate type-caption text-ink-muted">
            {b.location.addressLine ? `${b.location.addressLine}, ${b.location.postalCode}` : areaLine(b)}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <Status tone={live ? "accent" : st.tone}>
            <span className="sr-only sm:not-sr-only">{live ? "Jetzt" : st.label}</span>
          </Status>
          <ChevronRight size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden className="text-ink-muted" />
        </span>
      </Link>
    </li>
  );
}

/** List row for the "Termine" tabs: date + time, client, treatment, area, payout and status. */
export function BookingListRow({ booking: b, now = Date.now() }: { booking: ProviderBookingDTO; now?: number }) {
  const st = proStatus(b, now);
  const live = isLive(b, now);
  return (
    <li className="border-b border-line last:border-b-0">
      <Link
        href={routes.pro.booking(b.id)}
        className="relative flex items-start gap-4 py-4 pr-1 pl-3 transition-colors duration-fast hover:bg-surface-sunken md:items-center"
      >
        {live ? <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" /> : null}
        <span className="flex w-20 shrink-0 flex-col gap-0.5 md:w-28">
          <span className="type-caption text-ink-muted">{formatDayShort(b.startsAt)}</span>
          <span className="type-label num">
            {formatTime(b.startsAt)}
            <span className="text-ink-muted">–{formatTime(b.endsAt)}</span>
          </span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="type-body-s font-[520] text-ink">
            {b.serviceName} <span className="font-normal text-ink-muted">· {formatDuration(b.durationMinutes)}</span>
          </span>
          <span className="type-caption text-ink-muted">
            {customerLabel(b.customer)}
            {b.isRepeatClient ? " · Stammkundschaft" : ""} · {areaLine(b)}
          </span>
          <span className="md:hidden">
            <Status tone={live ? "accent" : st.tone}>{live ? "Läuft jetzt" : st.label}</Status>
          </span>
        </span>
        <span className="hidden w-36 shrink-0 md:block">
          <Status tone={live ? "accent" : st.tone}>{live ? "Läuft jetzt" : st.label}</Status>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          <span className="type-label num">{formatPrice(b.earnings.payoutCents)}</span>
          <span className="type-caption text-ink-muted">für dich</span>
        </span>
      </Link>
    </li>
  );
}

/** Open request with countdown and the large Annehmen / Ablehnen buttons. */
export function RequestPanel({ booking: b }: { booking: ProviderBookingDTO }) {
  return (
    <article className="flex flex-col gap-5 border border-line bg-surface-raised p-5 lg:p-6" aria-labelledby={`req-${b.id}`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="type-overline text-ink-muted">Neue Anfrage</p>
            <h3 id={`req-${b.id}`} className="type-heading-m">
              <Link href={routes.pro.booking(b.id)} className="hover:underline hover:decoration-1 hover:underline-offset-4">
                {b.serviceName}
              </Link>
            </h3>
            <p className="type-body num text-ink">
              {formatDayShort(b.startsAt)} · {formatTime(b.startsAt)}–{formatTime(b.endsAt)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end text-right">
            <span className="type-heading-m num">{formatPrice(b.earnings.payoutCents)}</span>
            <span className="type-caption text-ink-muted">für dich</span>
          </div>
        </div>
        <p className="type-body-s text-ink-muted">
          {b.customer.firstName ?? "Kundschaft"} · {b.isRepeatClient ? "Stammkundschaft" : b.customer.completedBookings > 0 ? `${b.customer.completedBookings} Termine auf SOMA` : "Neu auf SOMA"} · {areaLine(b)}
        </p>
        <p className="type-caption text-ink-muted">
          {TIER_LABEL[b.earnings.commissionTier]} · {formatPercent(b.earnings.commissionRate)} Provision
          {b.earnings.travelFeeCents > 0 ? ` · inkl. ${formatPrice(b.earnings.travelFeeCents)} Anfahrt (provisionsfrei)` : ""}
        </p>
        {b.notes ? <p className="border-l-2 border-line pl-3 type-body-s text-ink">„{b.notes}“</p> : null}
      </div>
      <ResponseCountdown until={b.respondBy} />
      <RequestActions bookingId={b.id} canRespond={b.actions.canAccept} />
    </article>
  );
}
