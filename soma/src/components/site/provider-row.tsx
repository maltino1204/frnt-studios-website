import type React from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { berlinDateKey, formatDistance, formatDuration, formatPrice, formatPriceExact } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { ProviderSearchResult } from "@/server/dto";
import { AiLabel } from "@/components/ui/ai-label";
import { Portrait } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Rating, VerifiedBadge } from "@/components/ui/trust";
import { FavoriteButton } from "./favorite-button";
import { SlotChipLink } from "./discovery-slot-link";
import { dayLabel, NBSP, slotChipLabel } from "./checkout-format";

/** Booking mode marker: "Sofort bestätigt" (CalendarCheck) or "Auf Anfrage" (Clock), caption size. */
export function ModeLabel({ mode, className }: { mode: "instant" | "request"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 type-caption whitespace-nowrap text-ink", className)}>
      <Icon icon={mode === "instant" ? CalendarCheck : Clock} size={14} />
      {mode === "instant" ? "Sofort bestätigt" : "Auf Anfrage"}
    </span>
  );
}

/**
 * Rating + booking mode. Stacked on narrow screens and joined by "·" from sm, so a
 * wrapped line never ends on a dangling separator.
 */
export function MetaLine({ children, className }: { children: [React.ReactNode, React.ReactNode]; className?: string }) {
  return (
    <p className={cn("flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2", className)}>
      {children[0]}
      <span aria-hidden className="hidden text-ink-muted sm:inline">
        ·
      </span>
      {children[1]}
    </p>
  );
}

/**
 * Search result card (design-guideline v2 §8): a level-1 card that lifts on
 * hover (pointer devices). Portrait + name link to the profile; slot chips are
 * separate links straight to checkout and settle into ink when pressed.
 */
export function ProviderRow({
  result,
  postalCode,
  date,
  canFavorite,
  inviteCode,
  priority,
  headingLevel = "h2",
}: {
  result: ProviderSearchResult;
  postalCode: string;
  /** requested local date; when null, chips carry a day label */
  date: string | null;
  canFavorite: boolean;
  inviteCode?: string;
  priority?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const r = result;
  const profileHref = routes.provider(r.slug, {
    leistung: r.offering.serviceSlug,
    dauer: r.offering.durationMinutes,
    plz: postalCode,
    datum: date ?? undefined,
  });
  const now = new Date();
  const multiDay = !date || new Set(r.nextSlots.map((s) => s.slice(0, 10))).size > 1;
  const slots = r.nextSlots.slice(0, 5);
  // All chips on one day: name the day once and keep the chips to the time (the accessible name keeps both).
  const groupDay = multiDay && slots.length > 0 && new Set(slots.map((s) => berlinDateKey(s))).size === 1 ? dayLabel(slots[0], now) : null;
  const H = headingLevel;
  return (
    <article
      className={cn(
        "relative rounded-card bg-surface-raised p-4 shadow-raised md:p-5 [&+article]:mt-3",
        "transition-[translate,box-shadow] duration-base ease-settle [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-float",
      )}
      aria-labelledby={`pr-${r.providerId}`}
    >
      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 md:grid-cols-[80px_minmax(0,1fr)]">
        <Link href={profileHref} tabIndex={-1} aria-hidden className="block w-[72px] md:w-20">
          <Portrait src={r.avatarUrl} name={r.displayName} sizes="80px" priority={priority} shape="oval" className="w-full" />
        </Link>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="-mt-2.5 -mr-2.5 flex items-start justify-between gap-2">
            <H id={`pr-${r.providerId}`} className="flex min-w-0 items-center gap-1.5 pt-2 type-title-serif">
              <Link href={profileHref} className="-my-1 truncate rounded-control py-1 focus-ring hover:underline hover:decoration-1 hover:underline-offset-4">
                {r.displayName}
              </Link>
              <VerifiedBadge className="shrink-0" />
            </H>
            <FavoriteButton providerId={r.providerId} providerName={r.displayName} initial={r.isFavorite} canToggle={canFavorite} />
          </div>
          <div className="-mt-1.5 flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <MetaLine>
                <Rating avg={r.ratingAvg} count={r.ratingCount} />
                <ModeLabel mode={r.bookingMode} />
              </MetaLine>
              {r.headline ? <p className="truncate type-body-s text-ink-muted">{r.headline}</p> : null}
              <AiLabel src={r.avatarUrl} />
            </div>
            <p className="shrink-0 text-right">
              <span className="block type-heading-m num">{formatPrice(r.totalPriceCents)}</span>
              <span className="block type-caption whitespace-nowrap text-ink-muted">inkl. Anfahrt</span>
            </p>
          </div>
          <p className="mt-0.5 flex flex-col gap-1 type-caption text-ink-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
            <span>
              <span className="text-ink">{r.offering.serviceName}</span>
              <span className="whitespace-nowrap">{` · ${formatDuration(r.offering.durationMinutes).replace(" ", NBSP)}`}</span>
            </span>
            <span aria-hidden className="hidden size-[3px] rounded-full bg-line-strong sm:block" />
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Icon icon={MapPin} size={13} />
              {`${formatDistance(r.distanceKm).replace(" ", NBSP)} · ${r.travelFeeCents > 0 ? `Anfahrt${NBSP}${formatPriceExact(r.travelFeeCents)}` : "Anfahrt inklusive"}`}
            </span>
          </p>
        </div>
      </div>
      {slots.length ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          {groupDay ? <p className="shrink-0 type-label-s text-ink-muted num sm:w-24">{groupDay}</p> : null}
          <ul
            aria-label={`Freie Termine bei ${r.displayName}`}
            className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 scrollbar-none sm:mx-0 sm:flex-1 sm:flex-wrap sm:px-0"
          >
            {slots.map((iso) => (
              <li key={iso} className="shrink-0">
                <SlotChipLink
                  href={`${routes.checkout({ angebot: r.offering.providerServiceId, start: iso, plz: postalCode })}${inviteCode ? `&einladung=${encodeURIComponent(inviteCode)}` : ""}`}
                  aria-label={`${slotChipLabel(iso, true, now)} Uhr bei ${r.displayName} buchen`}
                >
                  {slotChipLabel(iso, multiDay && !groupDay, now)}
                </SlotChipLink>
              </li>
            ))}
          </ul>
          <Link
            href={profileHref}
            className="group inline-flex h-touch shrink-0 items-center gap-1.5 self-start rounded-full type-label-s text-ink focus-ring hover:text-link-hover sm:self-auto"
          >
            <span className="underline decoration-line-strong decoration-1 underline-offset-[0.2em] group-hover:decoration-current">Weitere Zeiten</span>
            <Icon icon={ArrowRight} size={16} className="transition-transform duration-base ease-settle group-hover:translate-x-0.5" />
          </Link>
        </div>
      ) : null}
    </article>
  );
}
