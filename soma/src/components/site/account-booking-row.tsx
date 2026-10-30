import Link from "next/link";
import type { ReactNode } from "react";
import type { BookingListItemDTO } from "@/server/dto";
import { Status } from "@/components/ui/feedback";
import { dateParts, formatPrice, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import { statusTone } from "./checkout-format";

/** Appointment list row: date block, service + provider (links to /buchung/[id]), status, total; actions sit outside the link. */
export function AccountBookingRow({ b, actions }: { b: BookingListItemDTO; actions?: ReactNode }) {
  const p = dateParts(b.startsAt);
  return (
    <li className="flex flex-col gap-3 border-b border-line py-4">
      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-start gap-x-4">
        <div aria-hidden className="flex flex-col items-center pt-0.5">
          <span className="type-caption text-ink-muted">{p.weekday}</span>
          <span className="type-heading-l num leading-none">{p.day}</span>
          <span className="type-caption text-ink-muted">{p.month}</span>
        </div>
        <Link href={routes.booking(b.id)} className="group flex min-w-0 flex-col gap-1">
          <span className="type-heading-s group-hover:underline group-hover:underline-offset-4">{b.serviceName}</span>
          <span className="type-body-s text-ink-muted num">{`${b.providerName} · ${formatTime(b.startsAt)}–${formatTime(b.endsAt)} · ${b.city}`}</span>
          <span className="sr-only">{`am ${p.weekday} ${p.day}. ${p.month}`}</span>
          <Status tone={statusTone(b.status)} className="mt-1">
            {b.statusLabel}
          </Status>
        </Link>
        <p className="text-right type-label num">{formatPrice(b.totalCents)}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2 pl-[4.5rem]">{actions}</div> : null}
    </li>
  );
}
