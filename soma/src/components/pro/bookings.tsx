import Link from "next/link";
import { CalendarClock, ChevronRight, MapPin, Quote } from "lucide-react";
import { AuraLine } from "@/components/ui/aura";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Status } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { berlinDateKey, formatDayShort, formatDistance, formatDuration, formatPrice, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { ProviderBookingDTO } from "@/server/dto";
import { RequestActions } from "./booking-actions";
import { ResponseCountdown } from "./countdown";
import { BOOKING_TONE, LOCATION_LABEL, TIER_LABEL, customerLabel, formatPercent } from "./labels";
import { DateTile } from "./ui";

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

/** Where: the street once confirmed, otherwise the area line. */
function placeLine(b: ProviderBookingDTO): string {
  return b.location.addressLine ? `${b.location.addressLine}, ${b.location.postalCode}` : areaLine(b);
}

/* ------------------------------------------------------------------------ */
/* Agenda timeline (Heute, Als Nächstes)                                     */
/* ------------------------------------------------------------------------ */

/**
 * Refined day timeline: time column, a hairline rail with state dots (live
 * pings in ultramarine, past is quiet) and a floating card per appointment.
 */
export function AgendaTimeline({ bookings, now = Date.now(), showDate = false, label }: { bookings: ProviderBookingDTO[]; now?: number; showDate?: boolean; label: string }) {
  return (
    <ol className="flex flex-col" aria-label={label}>
      {bookings.map((b, i) => {
        const live = isLive(b, now);
        const ended = Date.parse(b.endsAt) <= now;
        const st = proStatus(b, now);
        const first = i === 0;
        const last = i === bookings.length - 1;
        return (
          <li key={b.id} className={cn("grid gap-x-2 sm:gap-x-3", showDate ? "grid-cols-[3.75rem_1.25rem_minmax(0,1fr)] sm:grid-cols-[4.5rem_1.5rem_minmax(0,1fr)]" : "grid-cols-[3rem_1.25rem_minmax(0,1fr)] sm:grid-cols-[3.75rem_1.5rem_minmax(0,1fr)]")}>
            <div className={cn("flex flex-col items-end pt-4 text-right num", live ? "text-info" : ended ? "text-ink-muted" : "text-ink")}>
              {showDate ? <span className="type-caption whitespace-nowrap text-ink-muted">{formatDayShort(b.startsAt).replace(/,.*/, "")}</span> : null}
              <span className="type-label">{formatTime(b.startsAt)}</span>
              <span className="type-caption text-ink-muted">{formatTime(b.endsAt)}</span>
            </div>
            <div aria-hidden className="relative flex justify-center">
              {bookings.length > 1 ? (
                <span className={cn("absolute left-1/2 w-px -translate-x-1/2 bg-line", first ? "top-[1.5rem] bottom-0" : last ? "top-0 h-[1.5rem]" : "inset-y-0")} />
              ) : null}
              <span className="absolute top-[1.5rem] left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                {live ? (
                  <span className="relative size-3 rounded-full bg-info shadow-[0_0_0_3px_var(--color-surface)]" />
                ) : ended ? (
                  <span className="size-2 rounded-full bg-ink-disabled shadow-[0_0_0_3px_var(--color-surface)]" />
                ) : (
                  <span className="size-2.5 rounded-full bg-surface-raised shadow-[0_0_0_2px_var(--color-line-strong),0_0_0_5px_var(--color-surface)]" />
                )}
              </span>
            </div>
            <div className={cn("min-w-0", !last && "pb-3")}>
              <Link
                href={routes.pro.booking(b.id)}
                className={cn(
                  "group relative flex min-h-16 items-center gap-3 overflow-hidden rounded-card bg-surface-raised py-3 pr-3 pl-4 shadow-raised lift focus-ring",
                  live && "ring-1 ring-info-line",
                )}
              >
                {live ? <span aria-hidden className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-info" /> : null}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn("line-clamp-2 type-body-s font-[560] hyphens-none", ended && !live ? "text-ink-muted" : "text-ink")}>
                    {customerLabel(b.customer)} <span className="font-normal text-ink-muted">·</span> {b.serviceName}
                  </span>
                  <span className="flex min-w-0 items-center gap-1 type-caption text-ink-muted">
                    <Icon icon={MapPin} size={16} className="size-3.5! shrink-0" />
                    <span className="truncate">{placeLine(b)}</span>
                  </span>
                  {/* A5-7: status always as a word (guideline §4.3); on phones it sits under the place line. */}
                  <span className="flex pt-1 sm:hidden">
                    <Status tone={live ? "accent" : st.tone}>{live ? "Jetzt" : st.label}</Status>
                  </span>
                </span>
                <Status tone={live ? "accent" : st.tone} className="max-sm:hidden">
                  {live ? "Jetzt" : st.label}
                </Status>
                <Icon icon={ChevronRight} size={16} className="shrink-0 text-ink-muted transition-transform duration-fast group-hover:translate-x-0.5" />
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------------ */
/* List row for the "Termine" tabs                                           */
/* ------------------------------------------------------------------------ */

/** Date tile · time and treatment · client and area · status · payout. Stacked below md. */
export function BookingListRow({ booking: b, now = Date.now() }: { booking: ProviderBookingDTO; now?: number }) {
  const st = proStatus(b, now);
  const live = isLive(b, now);
  const today = berlinDateKey(b.startsAt) === berlinDateKey(now);
  const status = <Status tone={live ? "accent" : st.tone}>{live ? "Läuft jetzt" : st.label}</Status>;
  const who = `${customerLabel(b.customer)}${b.isRepeatClient ? " · Stammkundschaft" : ""} · ${areaLine(b)}`;
  return (
    <li>
      <Link
        href={routes.pro.booking(b.id)}
        className="group relative flex items-start gap-4 px-4 py-3.5 transition-colors duration-fast focus-ring hover:bg-surface-tint sm:px-5 md:items-center"
      >
        {live ? <span aria-hidden className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-info" /> : null}
        <DateTile date={b.startsAt} today={today} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline justify-between gap-3 md:justify-start">
            <span className="type-label num whitespace-nowrap text-ink">
              {formatTime(b.startsAt)}–{formatTime(b.endsAt)}
            </span>
            <span className="type-label num md:hidden">{formatPrice(b.earnings.payoutCents)}</span>
          </span>
          <span className="type-body-s font-[560] text-ink hyphens-none">
            {b.serviceName} <span className="font-normal whitespace-nowrap text-ink-muted">· {formatDuration(b.durationMinutes)}</span>
          </span>
          <span className="truncate type-caption text-ink-muted">{who}</span>
          <span className="pt-1.5 md:hidden">{status}</span>
        </span>
        <span className="hidden w-36 shrink-0 md:block">{status}</span>
        <span className="hidden w-24 shrink-0 flex-col items-end gap-0.5 text-right md:flex">
          <span className="type-label num">{formatPrice(b.earnings.payoutCents)}</span>
          <span className="type-caption text-ink-muted">für dich</span>
        </span>
        <Icon icon={ChevronRight} size={16} className="hidden shrink-0 text-ink-muted transition-transform duration-fast group-hover:translate-x-0.5 sm:block" />
      </Link>
    </li>
  );
}

/* ------------------------------------------------------------------------ */
/* Open request card                                                         */
/* ------------------------------------------------------------------------ */

function clientBadge(b: ProviderBookingDTO) {
  if (b.isRepeatClient) return <Badge tone="success" size="s" dot>Stammkundschaft</Badge>;
  if (b.customer.completedBookings > 0) return <Badge size="s">{`${b.customer.completedBookings} ${b.customer.completedBookings === 1 ? "Termin" : "Termine"} auf SOMA`}</Badge>;
  return (
    <Badge size="s" icon={<span aria-hidden className="size-1.5 shrink-0 rounded-full bg-line-strong" />}>
      Neu auf SOMA
    </Badge>
  );
}

/** Open request: countdown ring, payout, client, large Annehmen / Ablehnen with an accept moment. */
export function RequestPanel({
  booking: b,
  headingLevel = "h3",
  serverNow,
  windowHours,
}: {
  booking: ProviderBookingDTO;
  headingLevel?: "h2" | "h3";
  serverNow: number;
  windowHours?: number;
}) {
  const H = headingLevel;
  const tierNote = b.isRepeatClient && b.earnings.commissionTier === "repeat" ? null : TIER_LABEL[b.earnings.commissionTier];
  return (
    <article className="@container relative flex flex-col overflow-hidden rounded-card bg-surface-raised shadow-raised" aria-labelledby={`req-${b.id}`}>
      <div className="flex flex-col gap-4 p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="flex items-center gap-2 type-overline text-ink-muted">
              <AuraLine className="w-4" />
              Neue Anfrage
            </p>
            {/* Long one-word services ("Entspannungsmassage") may hyphenate so the card never exceeds 320 px (F9). */}
            <H id={`req-${b.id}`} className="type-heading-m hyphens-auto break-words">
              <Link href={routes.pro.booking(b.id)} className="rounded-control focus-ring hover:underline hover:decoration-1 hover:underline-offset-4">
                {b.serviceName}
              </Link>
            </H>
            <p className="flex items-center gap-1.5 type-body-s num text-ink">
              <Icon icon={CalendarClock} size={16} className="shrink-0 text-ink-muted" />
              {/* Comma instead of "·": on narrow cards the line may wrap after the date without a dangling separator. */}
              <span>
                <span className="whitespace-nowrap">{`${formatDayShort(b.startsAt)},`}</span>{" "}
                <span className="whitespace-nowrap">{`${formatTime(b.startsAt)}–${formatTime(b.endsAt)}`}</span>
              </span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end text-right">
            <span className="type-heading-l num tracking-[-0.025em]">{formatPrice(b.earnings.payoutCents)}</span>
            <span className="type-caption text-ink-muted">für dich</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Avatar name={b.customer.firstName ?? "Kundschaft"} size={32} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="type-label-s text-ink">{b.customer.firstName ?? "Kundschaft"}</span>
              {clientBadge(b)}
            </p>
            <p className="flex min-w-0 items-center gap-1 type-caption text-ink-muted">
              <Icon icon={MapPin} size={16} className="size-3.5! shrink-0" />
              <span className="truncate">{areaLine(b)}</span>
            </p>
          </div>
        </div>

        <p className="flex flex-wrap gap-1.5">
          <Badge size="s">{`${tierNote ? `${tierNote} · ` : ""}${formatPercent(b.earnings.commissionRate)} Provision`}</Badge>
          {b.earnings.travelFeeCents > 0 ? <Badge size="s">{`inkl. ${formatPrice(b.earnings.travelFeeCents)} Anfahrt, provisionsfrei`}</Badge> : null}
          <Badge size="s">{formatDuration(b.durationMinutes)}</Badge>
        </p>

        {b.notes ? (
          <blockquote className="flex gap-2.5 rounded-tile bg-surface-sunken px-4 py-3 type-body-s text-ink">
            <Icon icon={Quote} size={16} className="mt-0.5 shrink-0 text-ink-muted" />
            <span>{b.notes}</span>
          </blockquote>
        ) : null}
      </div>

      <div className="mt-auto flex flex-col gap-4 border-t border-line bg-surface/60 px-5 py-4 @xl:flex-row @xl:items-center @xl:justify-between lg:px-6">
        <ResponseCountdown until={b.respondBy} serverNow={serverNow} windowHours={windowHours} />
        <RequestActions bookingId={b.id} canRespond={b.actions.canAccept} className="@xl:w-[20rem] @xl:shrink-0" />
      </div>
    </article>
  );
}
