import type { Metadata } from "next";
import { formatDate } from "@/lib/format";
import { formatInt } from "@/components/admin/format";
import { AdminPageHeader, EMPTY } from "@/components/admin/page";
import { ReviewModerationButton } from "@/components/admin/review-actions";
import { AdminTable, CellLink, hrefWith, TablePager } from "@/components/admin/table";
import { ChipFilter, FilterForm } from "@/components/admin/toolbar";
import { ChipLink } from "@/components/ui/chip";
import { EmptyState, Status } from "@/components/ui/feedback";
import { Input } from "@/components/ui/field";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import type { AdminReviewFilter, AdminReviewVisibility } from "@/server/dto";
import { listReviewsAdmin } from "@/server/services/admin-ext";

export const metadata: Metadata = { title: "Bewertungen" };

const BASE = "/admin/bewertungen";
const VISIBILITY: Array<{ key?: AdminReviewVisibility; label: string }> = [{ label: "Alle" }, { key: "published", label: "Sichtbar" }, { key: "hidden", label: "Ausgeblendet" }];
const RATINGS: Array<{ key?: string; label: string }> = [{ label: "Alle" }, { key: "kritisch", label: "1–2 Sterne" }, { key: "3", label: "3 Sterne" }, { key: "4", label: "4 Sterne" }, { key: "5", label: "5 Sterne" }];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1.5 num">
      <span aria-hidden className={rating <= 2 ? "text-danger" : "text-ink"}>
        {"★".repeat(rating)}
        <span className="text-line-strong">{"★".repeat(5 - rating)}</span>
      </span>
      <span className="sr-only">{rating} von 5 Sternen</span>
    </span>
  );
}

export default async function ReviewsModerationPage({ searchParams }: { searchParams: Promise<{ q?: string; sichtbar?: string; sterne?: string; kontakt?: string; seite?: string }> }) {
  const session = await requireRole("admin", BASE);
  const sp = await searchParams;
  const visibility = VISIBILITY.find((v) => v.key && v.key === sp.sichtbar)?.key;
  const ratingKey = RATINGS.find((r) => r.key && r.key === sp.sterne)?.key;
  const rating: AdminReviewFilter["rating"] = ratingKey === "kritisch" ? "critical" : ratingKey ? Number(ratingKey) : undefined;
  const flagged = sp.kontakt === "1";
  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.seite) || 1);
  const [list, hidden, critical] = await Promise.all([
    listReviewsAdmin(session, { visibility, rating, q, flagged, page, pageSize: 25 }),
    listReviewsAdmin(session, { visibility: "hidden", pageSize: 1 }),
    listReviewsAdmin(session, { rating: "critical", visibility: "published", pageSize: 1 }),
  ]);
  const current = { q, sichtbar: visibility, sterne: ratingKey, kontakt: flagged ? "1" : undefined };

  return (
    <>
      <AdminPageHeader
        group="Marktplatz"
        title="Bewertungen"
        description={`${formatInt(list.total)} ${q || visibility || rating || flagged ? "Treffer" : "Bewertungen"} · ${formatInt(hidden.total)} ausgeblendet · ${formatInt(critical.total)} kritische sichtbar`}
      />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <FilterForm action={BASE} hidden={{ sichtbar: visibility, sterne: ratingKey, kontakt: flagged ? "1" : undefined }} resetHref={q ? hrefWith(BASE, {}, { sichtbar: visibility, sterne: ratingKey }) : undefined}>
            <Input dense label="Suche" hideLabel type="search" name="q" defaultValue={q} placeholder="Text, Profi oder Buchungsnummer" className="w-full sm:w-72" />
          </FilterForm>
          <div className="flex min-w-0 flex-col gap-3 md:flex-row md:flex-wrap md:gap-x-8">
            <ChipFilter label="Status">
              {VISIBILITY.map((v) => (
                <ChipLink key={v.label} href={hrefWith(BASE, current, { sichtbar: v.key, seite: undefined })} selected={visibility === v.key}>
                  {v.label}
                </ChipLink>
              ))}
            </ChipFilter>
            <ChipFilter label="Sterne">
              {RATINGS.map((r) => (
                <ChipLink key={r.label} href={hrefWith(BASE, current, { sterne: r.key, seite: undefined })} selected={ratingKey === r.key}>
                  {r.label}
                </ChipLink>
              ))}
            </ChipFilter>
            <ChipFilter label="Hinweise">
              <ChipLink href={hrefWith(BASE, current, { kontakt: flagged ? undefined : "1", seite: undefined })} selected={flagged}>
                Mit Kontaktdaten
              </ChipLink>
            </ChipFilter>
          </div>
        </div>

        {list.items.length === 0 ? (
          <EmptyState title="Keine Bewertungen gefunden.">{q ? `Nichts passt zu „${q}“.` : "Für diese Filter gibt es keine Bewertungen."}</EmptyState>
        ) : (
          <div>
            <AdminTable label="Bewertungen">
              <thead>
                <tr>
                  <th scope="col">Datum</th>
                  <th scope="col">Sterne</th>
                  <th scope="col">Text</th>
                  <th scope="col">Profi</th>
                  <th scope="col">Kundschaft</th>
                  <th scope="col">Buchung</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">
                    <span className="sr-only">Aktionen</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="num text-ink-muted">{formatDate(r.createdAt)}</td>
                    <td>
                      <Stars rating={r.rating} />
                    </td>
                    <td className="min-w-64 max-w-[28rem] py-2.5 !whitespace-normal">
                      <p className="line-clamp-3 type-body-s text-ink" title={r.comment ?? undefined}>
                        {r.comment ?? <span className="text-ink-muted">Ohne Text</span>}
                      </p>
                      {r.tags.length ? <p className="type-caption text-ink-muted">{r.tags.join(" · ")}</p> : null}
                      {r.providerReply ? <p className="mt-1 line-clamp-2 type-caption text-ink-muted">Antwort: {r.providerReply}</p> : null}
                      {r.contactFlags.length ? <p className="mt-1 type-caption text-danger">Kontaktdaten: {r.contactFlags.join(", ")}</p> : null}
                    </td>
                    <td>
                      <CellLink href={routes.admin.provider(r.providerId)} sub={r.serviceName}>
                        {r.providerName}
                      </CellLink>
                    </td>
                    <td>{r.customerName ? <CellLink href={`/admin/nutzer/${r.customerId}`}>{r.customerName}</CellLink> : <span className="text-ink-muted">{EMPTY}</span>}</td>
                    <td>
                      <CellLink href={routes.admin.booking(r.bookingId)}>
                        <span className="code-ref">{r.bookingReference}</span>
                      </CellLink>
                    </td>
                    <td>{r.isPublished ? <Status tone="success">Sichtbar</Status> : <Status tone="neutral">Ausgeblendet</Status>}</td>
                    <td className="text-right">
                      <ReviewModerationButton reviewId={r.id} isPublished={r.isPublished} label={`Die Bewertung von ${r.customerName ?? "dieser Kundschaft"}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
            <TablePager page={list.page} pageSize={list.pageSize} total={list.total} href={(n) => hrefWith(BASE, current, { seite: n })} />
          </div>
        )}
      </div>
    </>
  );
}
