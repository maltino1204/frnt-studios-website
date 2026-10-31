import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { BookingListItemDTO } from "@/server/dto";
import { Status } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { dateParts, formatPrice, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import { statusTone } from "./checkout-format";

/**
 * Appointment row as a level-1 card: date tile, service + provider, status pill and
 * total, all one link to /buchung/[id]; actions sit below the link, never inside it.
 */
export function AccountBookingRow({ b, actions, muted }: { b: BookingListItemDTO; actions?: ReactNode; muted?: boolean }) {
  const p = dateParts(b.startsAt);
  return (
    <li className="rounded-card bg-surface-raised shadow-raised transition-[box-shadow,translate] duration-base ease-settle has-[a:hover]:-translate-y-px has-[a:hover]:shadow-float">
      <Link href={routes.booking(b.id)} className="group grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-4 rounded-card p-3.5 pressable focus-ring md:gap-x-5 md:p-4">
        <span
          aria-hidden
          className={cn(
            "flex h-16 flex-col items-center justify-center rounded-tile",
            muted ? "bg-surface-sunken text-ink-muted" : "bg-surface-sunken text-ink shadow-[inset_0_0_0_1px_var(--color-line)]",
          )}
        >
          <span className="type-caption text-ink-muted">{p.weekday}</span>
          <span className="type-heading-l leading-none num">{p.day}</span>
          <span className="type-caption text-ink-muted">{p.month}</span>
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="line-clamp-2 type-heading-s text-ink">{b.serviceName}</span>
          <span className="line-clamp-2 type-body-s text-ink-muted num">{`${b.providerName} · ${formatTime(b.startsAt)}–${formatTime(b.endsAt)} · ${b.city}`}</span>
          <span className="sr-only">{`am ${p.weekday} ${p.day}. ${p.month}`}</span>
          <Status tone={statusTone(b.status)} className="mt-1">
            {b.statusLabel}
          </Status>
        </span>
        <span className="flex flex-col items-end gap-3 self-stretch justify-between py-0.5">
          <span className="type-label text-ink num">{formatPrice(b.totalCents)}</span>
          <Icon icon={ChevronRight} size={18} className="text-ink-muted transition-transform duration-fast group-hover:translate-x-0.5" />
        </span>
      </Link>
      {actions ? <div className="flex flex-wrap gap-2 border-t border-line px-3.5 py-3 md:px-4">{actions}</div> : null}
    </li>
  );
}
