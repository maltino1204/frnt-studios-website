import { ProHeader, ProPage } from "@/components/pro/page";
import { ReviewReply } from "@/components/pro/review-reply";
import { ButtonLink } from "@/components/ui/button";
import { PaginationLabel } from "@/components/ui/data";
import { EmptyState } from "@/components/ui/feedback";
import { Stars } from "@/components/ui/trust";
import { formatDate, formatRating, plural } from "@/lib/format";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { listMyReviews } from "@/server/services/pro";

export const metadata = { title: "Bewertungen" };

export default async function ProReviewsPage({ searchParams }: PageProps<"/pro/bewertungen">) {
  const session = await requireRole("provider", "/pro/bewertungen");
  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.seite === "string" ? sp.seite : 1) || 1);
  const list = await listMyReviews(session, page);
  const max = Math.max(1, ...Object.values(list.distribution));
  const from = (list.page - 1) * list.pageSize + 1;
  const to = from + list.items.length - 1;

  return (
    <ProPage width="narrow">
      <ProHeader back={{ href: routes.pro.profile(), label: "Profil" }} title="Bewertungen" description="Nur Kundschaft mit abgeschlossenem Termin kann bewerten. Eine freundliche Antwort zeigt, wie du arbeitest." />

      {list.ratingCount > 0 ? (
        <section className="grid gap-6 border-y border-line py-6 sm:grid-cols-[auto_1fr] sm:gap-10" aria-label="Überblick">
          <div className="flex flex-col gap-2">
            <p className="type-stat">{list.ratingAvg ? formatRating(list.ratingAvg) : "—"}</p>
            <Stars value={list.ratingAvg ?? 0} />
            <p className="type-caption text-ink-muted">{plural(list.ratingCount, "Bewertung", "Bewertungen")}</p>
          </div>
          <dl className="flex flex-col gap-1.5">
            {(["5", "4", "3", "2", "1"] as const).map((k) => (
              <div key={k} className="grid grid-cols-[1.5rem_1fr_2rem] items-center gap-3">
                <dt className="type-caption text-ink-muted num">{k} ★</dt>
                <dd className="h-1.5 bg-line" aria-hidden>
                  <span className="block h-full bg-ink" style={{ width: `${(list.distribution[k] / max) * 100}%` }} />
                </dd>
                <dd className="text-right type-caption text-ink-muted num">{list.distribution[k]}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {list.items.length ? (
        <ul className="flex flex-col">
          {list.items.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 border-b border-line py-6 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars value={r.rating} size={14} />
                <span className="type-caption text-ink-muted num">{formatDate(r.createdAt)}</span>
              </div>
              <p className="type-label-s text-ink">
                {r.authorName ?? "Kundschaft"} <span className="font-normal text-ink-muted">· {r.serviceName}</span>
              </p>
              {r.comment ? <p className="type-body text-ink">{r.comment}</p> : <p className="type-body-s text-ink-muted">Ohne Kommentar</p>}
              {r.tags.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {r.tags.map((t) => (
                    <li key={t} className="rounded-full border border-line px-2.5 py-1 type-caption text-ink-muted">
                      {t}
                    </li>
                  ))}
                </ul>
              ) : null}
              {r.providerReply ? (
                <div className="flex flex-col gap-1 border-l-2 border-ink pl-4">
                  <p className="type-label-s text-ink">
                    Deine Antwort {r.providerRepliedAt ? <span className="font-normal text-ink-muted num">· {formatDate(r.providerRepliedAt)}</span> : null}
                  </p>
                  <p className="type-body-s text-ink">{r.providerReply}</p>
                </div>
              ) : (
                <ReviewReply reviewId={r.id} authorName={r.authorName} />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState className="py-2!" title="Noch keine Bewertungen.">
          Nach jedem abgeschlossenen Termin bitten wir die Kundschaft um eine Bewertung. Ab drei Bewertungen erscheint dein Schnitt im Profil.
        </EmptyState>
      )}

      {list.total > list.pageSize ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PaginationLabel from={from} to={to} total={list.total} />
          <div className="flex gap-2">
            {page > 1 ? (
              <ButtonLink href={`${routes.pro.reviews()}?seite=${page - 1}`} variant="ghost">
                Zurück
              </ButtonLink>
            ) : null}
            {to < list.total ? (
              <ButtonLink href={`${routes.pro.reviews()}?seite=${page + 1}`} variant="secondary">
                Weiter
              </ButtonLink>
            ) : null}
          </div>
        </div>
      ) : null}
    </ProPage>
  );
}
