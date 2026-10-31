import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { formatInt } from "@/components/admin/format";
import { AdminPageHeader, EMPTY } from "@/components/admin/page";
import { ReviewModerationButton } from "@/components/admin/review-actions";
import { AdminTable, CellLink, hrefWith, rowAction, TablePager } from "@/components/admin/table";
import { ChipFilter, FilterForm, SearchField, SegmentedLinks } from "@/components/admin/toolbar";
import { ChipLink } from "@/components/ui/chip";
import { EmptyState, Status } from "@/components/ui/feedback";
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
    <span className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2 ${rating <= 2 ? "bg-danger-soft" : "bg-surface-sunken"}`}>
      <span aria-hidden className="flex items-center gap-px text-[13px] leading-none tracking-[-0.04em]">
        <span className={rating <= 2 ? "text-danger" : "text-ink"}>{"★".repeat(rating)}</span>
        <span className="text-line-mid">{"★".repeat(5 - rating)}</span>
      </span>
      <span aria-hidden className={`type-caption font-[600] num ${rating <= 2 ? "text-danger" : "text-ink"}`}>{rating}</span>
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
        <div className="flex flex-col gap-3">
          <FilterForm action={BASE} hidden={{ sichtbar: visibility, sterne: ratingKey, kontakt: flagged ? "1" : undefined }} resetHref={q ? hrefWith(BASE, {}, { sichtbar: visibility, sterne: ratingKey }) : undefined}>
            <SearchField name="q" defaultValue={q} placeholder="Text, Profi oder Buchungsnummer" className="min-w-0 flex-1 sm:w-80 sm:flex-none" />
          </FilterForm>
          <div className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-x-6">
            <SegmentedLinks
              label="Status"
              items={VISIBILITY.map((v) => ({ href: hrefWith(BASE, current, { sichtbar: v.key, seite: undefined }), label: v.label, active: visibility === v.key }))}
            />
            <SegmentedLinks
              label="Sterne"
              items={RATINGS.map((r) => ({ href: hrefWith(BASE, current, { sterne: r.key, seite: undefined }), label: r.label, active: ratingKey === r.key }))}
            />
            <ChipFilter label="Hinweise">
              <ChipLink href={hrefWith(BASE, current, { kontakt: flagged ? undefined : "1", seite: undefined })} selected={flagged}>
                Mit Kontaktdaten
              </ChipLink>
            </ChipFilter>
          </div>
        </div>

        {list.items.length === 0 ? (
          <EmptyState seed="bewertungen-leer" title="Keine Bewertungen gefunden.">{q ? `Nichts passt zu „${q}“.` : "Für diese Filter gibt es keine Bewertungen."}</EmptyState>
        ) : (
          <div>
            <AdminTable label="Bewertungen" stickyHeader>
              <thead>
                <tr>
                  <th scope="col">Bewertung</th>
                  <th scope="col">Text</th>
                  <th scope="col">Profi</th>
                  <th scope="col">Kundschaft · Buchung</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">
                    <span className="sr-only">Aktionen</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((r) => (
                  <tr key={r.id} className="align-top [&>td]:py-3">
                    <td>
                      <span className="flex flex-col items-start gap-1">
                        <Stars rating={r.rating} />
                        <span className="type-caption text-ink-muted num">{formatDate(r.createdAt)}</span>
                      </span>
                    </td>
                    <td className="w-[36%] min-w-72 !whitespace-normal">
                      <p className="line-clamp-3 type-body-s text-pretty text-ink" title={r.comment ?? undefined}>
                        {r.comment ?? <span className="text-ink-muted">Ohne Text</span>}
                      </p>
                      {r.tags.length ? <p className="mt-0.5 type-caption text-ink-muted">{r.tags.join(" · ")}</p> : null}
                      {r.providerReply ? <p className="mt-1.5 line-clamp-2 border-l-2 border-line-mid pl-2.5 type-caption text-ink-muted">Antwort: {r.providerReply}</p> : null}
                      {r.contactFlags.length ? (
                        <p className="mt-1.5 inline-flex rounded-full bg-danger-soft px-2 py-0.5 type-caption font-[520] text-danger">Kontaktdaten: {r.contactFlags.join(", ")}</p>
                      ) : null}
                    </td>
                    <td className="max-w-56">
                      <CellLink href={routes.admin.provider(r.providerId)} sub={<span className="block truncate">{r.serviceName}</span>}>
                        {r.providerName}
                      </CellLink>
                    </td>
                    <td>
                      <span className="flex flex-col items-start">
                        {r.customerName ? <CellLink href={`/admin/nutzer/${r.customerId}`}>{r.customerName}</CellLink> : <span className="text-ink-muted">{EMPTY}</span>}
                        <Link href={routes.admin.booking(r.bookingId)} className="rounded-[6px] py-1 code-ref text-ink-muted underline-offset-4 hover:text-ink hover:underline focus-ring">
                          {r.bookingReference}
                        </Link>
                      </span>
                    </td>
                    <td>{r.isPublished ? <Status tone="success">Sichtbar</Status> : <Status tone="neutral">Ausgeblendet</Status>}</td>
                    <td className="text-right">
                      <span className={`inline-flex ${rowAction}`}>
                        <ReviewModerationButton reviewId={r.id} isPublished={r.isPublished} label={`Die Bewertung von ${r.customerName ?? "dieser Kundschaft"}`} />
                      </span>
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
