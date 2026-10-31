import { ProHeader, ProPage } from "@/components/pro/page";
import { ReviewReply } from "@/components/pro/review-reply";
import { CountUp } from "@/components/ui/motion";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { PaginationLabel } from "@/components/ui/data";
import { EmptyState } from "@/components/ui/feedback";
import { Stars } from "@/components/ui/trust";
import { formatDate, plural } from "@/lib/format";
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
  const total = Object.values(list.distribution).reduce((a, b) => a + b, 0);

  return (
    <ProPage width="narrow">
      <ProHeader back={{ href: routes.pro.profile(), label: "Profil" }} title="Bewertungen" description="Nur Kundschaft mit abgeschlossenem Termin kann bewerten. Eine freundliche Antwort zeigt, wie du arbeitest." />

      {list.ratingCount > 0 ? (
        <section className="grid gap-6 rounded-card bg-surface-raised p-5 shadow-raised sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-10 lg:p-6" aria-label="Überblick">
          <div className="flex flex-col gap-2 sm:pr-10 sm:shadow-[1px_0_0_var(--color-line)]">
            <p className="type-display-m tracking-[-0.04em] num">
              {list.ratingAvg ? <CountUp value={list.ratingAvg} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} /> : "—"}
            </p>
            <Stars value={list.ratingAvg ?? 0} size={18} />
            <p className="type-caption text-ink-muted">{plural(list.ratingCount, "Bewertung", "Bewertungen")}</p>
          </div>
          <div className="flex flex-col gap-2">
            <dl className="flex flex-col gap-2">
              {(["5", "4", "3", "2", "1"] as const).map((k) => (
                <div key={k} className="grid grid-cols-[3.5rem_minmax(0,1fr)_2rem] items-center gap-3">
                  <dt className="type-caption text-ink-muted num">{k} Sterne</dt>
                  <dd aria-hidden className="h-2 overflow-hidden rounded-full bg-surface-sunken inset-shadow-sunken">
                    <span className="block h-full rounded-full bg-ink" style={{ width: `${(list.distribution[k] / max) * 100}%` }} />
                  </dd>
                  <dd className="text-right type-caption text-ink-muted num">
                    {list.distribution[k]}
                    <span className="sr-only"> {list.distribution[k] === 1 ? "Bewertung" : "Bewertungen"}</span>
                  </dd>
                </div>
              ))}
            </dl>
            {/* A5-3: the footnote sits after the <dl>, not inside it. */}
            {total ? <p className="pt-1 type-caption text-ink-muted num">{Math.round(((list.distribution["5"] + list.distribution["4"]) / total) * 100)} % mit vier oder fünf Sternen</p> : null}
          </div>
        </section>
      ) : null}

      {list.items.length ? (
        <ul className="flex flex-col gap-3">
          {list.items.map((r) => (
            <li key={r.id} className="flex flex-col gap-3.5 rounded-card bg-surface-raised p-5 shadow-raised lg:p-6">
              <div className="flex items-start gap-3">
                <Avatar name={r.authorName ?? "Kundschaft"} size={40} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="type-label text-ink">{r.authorName ?? "Kundschaft"}</p>
                  <p className="truncate type-caption text-ink-muted">{r.serviceName}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Stars value={r.rating} size={14} />
                  <span className="type-caption text-ink-muted num">{formatDate(r.createdAt)}</span>
                </div>
              </div>
              {r.comment ? <p className="type-body text-ink">{r.comment}</p> : <p className="type-body-s text-ink-muted">Ohne Kommentar</p>}
              {r.tags.length ? (
                <ul className="flex flex-wrap gap-1.5" aria-label="Schlagworte">
                  {r.tags.map((t) => (
                    <li key={t} className="inline-flex h-7 items-center rounded-full bg-surface-sunken px-3 type-caption text-ink-muted">
                      {t}
                    </li>
                  ))}
                </ul>
              ) : null}
              {r.providerReply ? (
                <div className="relative flex flex-col gap-1 rounded-tile bg-surface-tint px-4 py-3 ring-1 ring-accent/10 ring-inset">
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
        <div className="rounded-card bg-surface-raised px-5 shadow-raised">
          <EmptyState className="py-6!" seed="pro-bewertungen" title="Noch keine Bewertungen.">
            Nach jedem abgeschlossenen Termin bitten wir die Kundschaft um eine Bewertung. Ab drei Bewertungen erscheint dein Schnitt im Profil.
          </EmptyState>
        </div>
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
