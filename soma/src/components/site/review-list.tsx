import Link from "next/link";
import { formatDateLong, formatRating, plural } from "@/lib/format";
import type { ReviewListDTO } from "@/server/dto";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { EmptyArt } from "@/components/ui/feedback";
import { Stars } from "@/components/ui/trust";

/**
 * Real, published reviews only (verified bookings). Summary with distribution,
 * paginated list with provider replies. Pagination is server-side via `pageHref`.
 */
export function ReviewList({
  reviews,
  providerName,
  pageHref,
}: {
  reviews: ReviewListDTO;
  providerName: string;
  pageHref: (page: number) => string;
}) {
  const { items, total, page, pageSize, ratingAvg, ratingCount, distribution } = reviews;
  if (ratingCount === 0 || items.length === 0) {
    return (
      <div className="flex items-start gap-4 rounded-card bg-surface-raised p-5 shadow-raised md:p-6">
        <EmptyArt seed={`bewertungen:${providerName}`} className="size-16" />
        <div className="flex flex-col gap-1.5">
          <p className="flex items-center gap-2 type-heading-m text-ink">
            <span aria-hidden className="size-1.5 rounded-full bg-line-strong" />
            {`${providerName} ist neu auf SOMA.`}
          </p>
          <p className="type-body-s text-ink-muted">Bewertungen erscheinen hier, sobald Kundinnen und Kunden ihren Termin abgeschlossen und bewertet haben.</p>
        </div>
      </div>
    );
  }
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-6 gap-y-2 rounded-card bg-surface-raised p-5 shadow-raised md:gap-x-10 md:p-6">
        <div className="flex flex-col gap-1.5">
          <p className="type-display-m leading-none num">{ratingAvg ? formatRating(ratingAvg) : "–"}</p>
          <Stars value={ratingAvg ?? 0} size={14} />
          <p className="type-caption text-ink-muted">{plural(ratingCount, "Bewertung", "Bewertungen")}</p>
        </div>
        <div role="group" aria-label="Verteilung der Bewertungen">
          <dl className="flex flex-col gap-1.5">
            {(["5", "4", "3", "2", "1"] as const).map((k) => {
              const n = distribution[k] ?? 0;
              const pct = ratingCount ? Math.round((n / ratingCount) * 100) : 0;
              return (
                <div key={k} className="grid grid-cols-[1.25rem_minmax(0,1fr)_2rem] items-center gap-2">
                  <dt className="type-caption text-ink-muted num">
                    {k}
                    <span className="sr-only"> Sterne</span>
                  </dt>
                  <dd aria-hidden className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                    <span className="block h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
                  </dd>
                  <dd className="text-right type-caption text-ink-muted num">
                    {n}
                    <span className="sr-only">{n === 1 ? " Bewertung" : " Bewertungen"}</span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-line rounded-card bg-surface-raised px-5 shadow-raised md:px-6">
        {items.map((r) => (
          <li key={r.id} className="flex flex-col gap-2.5 py-5">
            <div className="flex items-center justify-between gap-4">
              <Stars value={r.rating} size={14} />
              <p className="type-caption text-ink-muted">{formatDateLong(r.createdAt)}</p>
            </div>
            {r.comment ? <p className="type-body text-ink">{r.comment}</p> : null}
            {r.tags.length ? (
              <ul className="flex flex-wrap gap-1.5" aria-label="Schlagworte">
                {r.tags.map((t) => (
                  <li key={t} className="rounded-full bg-surface-sunken px-2.5 py-1 type-caption text-ink-muted">
                    {t}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="flex items-center gap-2.5 type-caption text-ink-muted">
              <Avatar name={r.authorName ?? "Kundin oder Kunde"} size={24} />
              <span>
                <span className="font-[560] text-ink">{r.authorName ?? "Kundin oder Kunde"}</span>
                {` · ${r.serviceName} · Verifizierte Buchung`}
              </span>
            </p>
            {r.providerReply ? (
              <div className="mt-1 rounded-tile bg-surface-sunken/70 px-4 py-3">
                <p className="type-label-s text-ink">{`Antwort von ${providerName}`}</p>
                <p className="mt-1 type-body-s text-ink-muted">{r.providerReply}</p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {pages > 1 ? (
        <nav aria-label="Weitere Bewertungen" className="flex items-center justify-between gap-4">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} scroll={false} className={buttonClasses({ variant: "secondary", size: "s", className: "h-touch" })}>
              Neuere
            </Link>
          ) : (
            <span />
          )}
          <p className="type-caption text-ink-muted num">{`Seite ${page} von ${pages}`}</p>
          {page < pages ? (
            <Link href={pageHref(page + 1)} scroll={false} className={buttonClasses({ variant: "secondary", size: "s", className: "h-touch" })}>
              Ältere
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
