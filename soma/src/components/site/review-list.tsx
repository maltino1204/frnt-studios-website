import Link from "next/link";
import { formatDateLong, formatRating, plural } from "@/lib/format";
import type { ReviewListDTO } from "@/server/dto";
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
      <div className="flex flex-col gap-2">
        <p className="type-body text-ink">{`${providerName} ist neu auf SOMA.`}</p>
        <p className="type-body-s text-ink-muted">Bewertungen erscheinen hier, sobald Kundinnen und Kunden ihren Termin abgeschlossen und bewertet haben.</p>
      </div>
    );
  }
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-8 gap-y-2">
        <div className="flex flex-col gap-1">
          <p className="font-display text-[3rem] leading-none font-[380] num">{ratingAvg ? formatRating(ratingAvg) : "–"}</p>
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
                  <dd aria-hidden className="h-1 bg-surface-sunken">
                    <span className="block h-full bg-ink" style={{ width: `${pct}%` }} />
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

      <ul className="flex flex-col border-t border-line">
        {items.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 border-b border-line py-5">
            <div className="flex items-center justify-between gap-4">
              <Stars value={r.rating} size={14} />
              <p className="type-caption text-ink-muted">{formatDateLong(r.createdAt)}</p>
            </div>
            {r.comment ? <p className="type-body text-ink">{r.comment}</p> : null}
            {r.tags.length ? (
              <ul className="flex flex-wrap gap-1.5" aria-label="Schlagworte">
                {r.tags.map((t) => (
                  <li key={t} className="rounded-full border border-line px-2.5 py-1 type-caption text-ink-muted">
                    {t}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="type-caption text-ink-muted">
              {`${r.authorName ?? "Kundin oder Kunde"} · ${r.serviceName} · Verifizierte Buchung`}
            </p>
            {r.providerReply ? (
              <div className="mt-2 border-l border-line-strong pl-4">
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
            <Link href={pageHref(page - 1)} scroll={false} className="inline-flex h-touch items-center type-label text-ink underline-offset-4 hover:underline">
              Neuere
            </Link>
          ) : (
            <span />
          )}
          <p className="type-caption text-ink-muted num">{`Seite ${page} von ${pages}`}</p>
          {page < pages ? (
            <Link href={pageHref(page + 1)} scroll={false} className="inline-flex h-touch items-center type-label text-ink underline-offset-4 hover:underline">
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
