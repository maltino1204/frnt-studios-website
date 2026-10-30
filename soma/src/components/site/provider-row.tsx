import type React from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDistance, formatDuration, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { ProviderSearchResult } from "@/server/dto";
import { Portrait } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Rating, VerifiedBadge } from "@/components/ui/trust";
import { FavoriteButton } from "./favorite-button";
import { NBSP, slotChipLabel } from "./checkout-format";

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
 * Search result row (design-guideline §8 "Provider list row"): full width, never a card.
 * Portrait + name link to the profile; slot chips are separate links straight to checkout.
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
  const H = headingLevel;
  return (
    <article className="relative border-b border-line py-4" aria-labelledby={`pr-${r.providerId}`}>
      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4">
        <Link href={profileHref} tabIndex={-1} aria-hidden className="block size-[72px]">
          <Portrait src={r.avatarUrl} name={r.displayName} sizes="72px" priority={priority} />
        </Link>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="-mt-2.5 -mr-2.5 flex items-start justify-between gap-2">
            <H id={`pr-${r.providerId}`} className="flex min-w-0 items-center gap-1.5 pt-2.5 type-heading-m">
              <Link href={profileHref} className="truncate hover:underline hover:underline-offset-4">
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
            </div>
            <p className="shrink-0 text-right">
              <span className="block type-label font-semibold num">{formatPrice(r.totalPriceCents)}</span>
              <span className="block type-caption whitespace-nowrap text-ink-muted">inkl. Anfahrt</span>
            </p>
          </div>
          <p className="type-caption text-ink-muted">
            <span className="text-ink">{r.offering.serviceName}</span>
            <span className="whitespace-nowrap">{` · ${formatDuration(r.offering.durationMinutes).replace(" ", NBSP)}`}</span>
            <span className="whitespace-nowrap">{` · ${formatDistance(r.distanceKm).replace(" ", NBSP)}`}</span>
          </p>
        </div>
      </div>
      {slots.length ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <ul
            aria-label={`Freie Termine bei ${r.displayName}`}
            className="-mx-(--space-gutter) flex gap-2 overflow-x-auto px-(--space-gutter) py-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0"
          >
            {slots.map((iso) => (
              <li key={iso} className="shrink-0">
                <Link
                  href={`${routes.checkout({ angebot: r.offering.providerServiceId, start: iso, plz: postalCode })}${inviteCode ? `&einladung=${encodeURIComponent(inviteCode)}` : ""}`}
                  aria-label={`${slotChipLabel(iso, true, now)} Uhr bei ${r.displayName} buchen`}
                  className="relative inline-flex h-9 items-center rounded-xs border border-line bg-surface-raised px-3 type-label-s whitespace-nowrap num text-ink transition-colors duration-fast before:absolute before:-inset-y-1 before:inset-x-0 hover:border-ink"
                >
                  {slotChipLabel(iso, multiDay, now)}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={profileHref}
            className="inline-flex h-touch shrink-0 items-center gap-1.5 self-start type-label-s text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover sm:self-auto"
          >
            Weitere Zeiten
            <Icon icon={ArrowRight} size={16} />
          </Link>
        </div>
      ) : null}
    </article>
  );
}
