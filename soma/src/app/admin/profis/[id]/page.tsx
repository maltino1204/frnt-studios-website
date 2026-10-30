import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";
import { formatDate, formatDuration, formatPrice, formatRating } from "@/lib/format";
import { formatDateTime, formatPercent } from "@/components/admin/format";
import { DOCUMENT_KIND, DOCUMENT_STATUS, PROVIDER_STATUS } from "@/components/admin/labels";
import { AdminPageHeader, AdminSection, EMPTY, MutedLink, PanelCard } from "@/components/admin/page";
import { CommissionOverrideForm, DocumentReview, ProviderDecisions } from "@/components/admin/provider-actions";
import { AdminTable, numCell } from "@/components/admin/table";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Notice, Status } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { FactList } from "@/components/ui/layout";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import type { MissingDocumentDTO } from "@/server/dto";
import { getProviderForAdmin } from "@/server/services/admin";
import { listCities, lookupPostalCode } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Profi" };

const WEEKDAYS = ["", "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default async function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole("admin", routes.admin.provider(id));
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const p = await getProviderForAdmin(session, id);
  if (!p) notFound();
  const [plz, cities] = await Promise.all([p.profile.basePostalCode ? lookupPostalCode(p.profile.basePostalCode) : null, listCities()]);
  const city = plz?.citySlug ? cities.find((c) => c.slug === plz.citySlug)?.name : plz?.cityName;
  const st = PROVIDER_STATUS[p.profile.status];
  const missingLabels = p.missingDocuments.map((m) => `${m.label}${m.categoryName ? ` (${m.categoryName})` : ""}`);
  const grouped = groupMissing(p.missingDocuments);
  const lastSubmit = p.statusEvents.find((e) => e.toStatus === "submitted");
  const inQueue = p.profile.status === "submitted" || p.profile.status === "in_review";

  return (
    <>
      <AdminPageHeader
        back={{ href: routes.admin.providers(), label: "Profis & Verifizierung" }}
        title={p.profile.displayName}
        meta={<Status tone={st.tone}>{st.label}</Status>}
        description={
          <span className="flex flex-wrap gap-x-2">
            <span className="code-ref">{p.profile.slug}</span>
            <span aria-hidden>·</span>
            <span>{city ?? "Kein Einsatzgebiet"}</span>
            {lastSubmit ? (
              <>
                <span aria-hidden>·</span>
                <span className="num">eingereicht {formatDateTime(lastSubmit.createdAt)}</span>
              </>
            ) : null}
          </span>
        }
        actions={
          <>
            {p.profile.status === "approved" ? (
              <ButtonLink href={routes.provider(p.profile.slug)} target="_blank" size="s" variant="ghost" icon={<Icon icon={ExternalLink} size={16} />}>
                Öffentliches Profil
              </ButtonLink>
            ) : null}
            <ProviderDecisions providerId={p.profile.providerId} status={p.profile.status} missing={missingLabels} />
          </>
        }
      />

      {(inQueue || p.profile.status === "suspended" || p.profile.status === "rejected" || p.profile.status === "draft") && p.missingDocuments.length > 0 ? (
        <div id="approval-blocked" className="mb-8">
          <Notice
            kind="warning"
            title={p.missingDocuments.length === 1 ? "1 Pflichtdokument fehlt oder ist ungeprüft." : `${p.missingDocuments.length} Pflichtdokumente fehlen oder sind ungeprüft.`}
          >
            <p>Eine Freigabe ist erst möglich, wenn alle Pflichtdokumente vorliegen und geprüft sind:</p>
            <ul className="mt-1 list-disc pl-4">
              {missingLabels.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Notice>
        </div>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-10">
          <AdminSection id="docs" title="Dokumente" description="Private Dateien öffnen sich in einem neuen Tab (nur für Admins und den Profi abrufbar).">
            {p.documents.length === 0 ? (
              <EmptyState title="Noch keine Dokumente." className="py-4">Der Profi hat bisher nichts hochgeladen.</EmptyState>
            ) : (
              <AdminTable label="Dokumente">
                <thead>
                  <tr>
                    <th scope="col">Dokument</th>
                    <th scope="col">Hochgeladen</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">
                      <span className="sr-only">Aktionen</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {p.documents.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <span className="flex flex-col py-1.5">
                          <span className="font-[520]">{DOCUMENT_KIND[d.kind]}</span>
                          <a href={d.url} target="_blank" rel="noopener" className="inline-flex max-w-56 items-center gap-1 rounded-xs type-caption text-accent underline-offset-4 hover:underline">
                            <Icon icon={FileText} size={14} className="shrink-0" />
                            <span className="truncate">{d.fileName}</span>
                            <span className="sr-only"> (öffnet in neuem Tab)</span>
                          </a>
                        </span>
                      </td>
                      <td className="num text-ink-muted">{formatDateTime(d.createdAt)}</td>
                      <td>
                        <span className="flex flex-col">
                          <Status tone={DOCUMENT_STATUS[d.status].tone}>{DOCUMENT_STATUS[d.status].label}</Status>
                          {d.reviewNote ? <span className="max-w-48 truncate type-caption text-ink-muted" title={d.reviewNote}>{d.reviewNote}</span> : null}
                          {d.expiresAt ? (
                            <span className={`type-caption num ${d.expired ? "text-danger" : "text-ink-muted"}`}>
                              {d.expired ? "abgelaufen" : `gültig bis ${formatDate(new Date(new Date(d.expiresAt).getTime() - 1000))}`}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="text-right">
                        <DocumentReview documentId={d.id} status={d.status} label={DOCUMENT_KIND[d.kind]} expires={d.kind === "insurance"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            )}
          </AdminSection>

          <AdminSection id="missing" title="Pflichtdokumente" description="Plattformweite Anforderungen und Nachweise je angebotener Kategorie. Zählt erst, wenn das Dokument geprüft ist.">
            {grouped.length === 0 ? (
              <Notice kind="success" title="Alle Pflichtdokumente liegen geprüft vor." />
            ) : (
              <div className="divide-y divide-line border border-line bg-surface-raised">
                {grouped.map((g) => (
                  <div key={g.group} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:gap-6">
                    <p className="type-label-s text-ink-muted sm:w-36 sm:shrink-0 sm:pt-0.5">{g.group}</p>
                    <ul className="flex flex-col gap-1.5">
                      {g.items.map((m) => (
                        <li key={`${m.kind}-${m.label}`}>
                          <Status tone="danger" className="font-normal">
                            {m.label}
                          </Status>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </AdminSection>

          <AdminSection id="services" title="Leistungen">
            {p.services.length === 0 ? (
              <EmptyState title="Keine Leistungen angelegt." className="py-4" />
            ) : (
              <AdminTable label="Leistungen">
                <thead>
                  <tr>
                    <th scope="col">Leistung</th>
                    <th scope="col">Kategorie</th>
                    <th scope="col" className="text-right">Dauer</th>
                    <th scope="col" className="text-right">Preis</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {p.services.map((s) => (
                    <tr key={s.providerServiceId}>
                      <td className="font-[520]">{s.serviceName}</td>
                      <td className="text-ink-muted">{s.categoryName}</td>
                      <td className={numCell}>{formatDuration(s.durationMinutes)}</td>
                      <td className={numCell}>{formatPrice(s.priceCents)}</td>
                      <td>
                        <Status tone={s.isActive ? "success" : "neutral"}>{s.isActive ? "Aktiv" : "Inaktiv"}</Status>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            )}
          </AdminSection>

          <AdminSection id="hours" title="Arbeitszeiten">
            {p.weeklyHours.length === 0 ? (
              <p className="type-body-s text-ink-muted">Keine Arbeitszeiten hinterlegt.</p>
            ) : (
              <dl className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4 xl:grid-cols-7">
                {[1, 2, 3, 4, 5, 6, 7].map((wd) => {
                  const w = p.weeklyHours.filter((h) => h.weekday === wd);
                  return (
                    <div key={wd} className="flex flex-col gap-1 bg-surface-raised px-3 py-2.5">
                      <dt className="type-label-s text-ink-muted">{WEEKDAYS[wd]}</dt>
                      <dd className="type-body-s num">{w.length ? w.map((h) => `${h.start}–${h.end}`).join(", ") : <span className="text-ink-muted">frei</span>}</dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </AdminSection>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <PanelCard title="Profil" bodyClassName="px-4">
            <FactList
              items={[
                { label: "E-Mail", value: <a className="text-accent underline-offset-4 hover:underline" href={`mailto:${p.email}`}>{p.email}</a> },
                { label: "Telefon", value: p.phone ?? EMPTY },
                { label: "Basis-PLZ", value: p.profile.basePostalCode ? <span className="num">{p.profile.basePostalCode}{city ? ` · ${city}` : ""}</span> : EMPTY },
                { label: "Radius", value: <span className="num">{p.profile.serviceRadiusKm} km</span> },
                { label: "Anfahrt", value: <span className="num">{formatPrice(p.profile.travelFeeBaseCents)} inkl. {p.profile.travelFeeIncludedKm} km, dann {formatPrice(p.profile.travelFeePerKmCents)}/km</span> },
                { label: "Buchungsmodus", value: p.bookingMode === "instant" ? "Sofort bestätigt" : "Auf Anfrage" },
                { label: "Erfahrung", value: p.profile.yearsExperience != null ? <span className="num">{p.profile.yearsExperience} Jahre</span> : EMPTY },
                { label: "Sprachen", value: p.profile.languages.length ? p.profile.languages.map((l) => l.toUpperCase()).join(", ") : EMPTY },
                { label: "Bewertung", value: p.ratingAvg != null ? <span className="num">{formatRating(p.ratingAvg)} ({p.ratingCount})</span> : EMPTY },
                { label: "Abgeschlossen", value: <span className="num">{p.completedCount}</span> },
                { label: "Auszahlungen", value: <Status tone={p.payoutsEnabled ? "success" : "warning"}>{p.payoutsEnabled ? "Eingerichtet" : "Nicht eingerichtet"}</Status> },
              ]}
            />
          </PanelCard>

          {p.profile.headline || p.profile.bio ? (
            <PanelCard title="Vorstellung" bodyClassName="flex flex-col gap-2 px-4 py-3">
              {p.profile.headline ? <p className="type-body-s font-[520]">{p.profile.headline}</p> : null}
              {p.profile.bio ? <p className="type-body-s whitespace-pre-line text-ink-muted">{p.profile.bio}</p> : null}
            </PanelCard>
          ) : null}

          <PanelCard title="Statusverlauf" bodyClassName="px-4 py-3">
            {p.statusEvents.length === 0 ? (
              <p className="type-body-s text-ink-muted">Noch keine Statuswechsel.</p>
            ) : (
              <ol className="flex flex-col">
                {p.statusEvents.map((e, i) => (
                  <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                    <span aria-hidden className="relative flex w-2 shrink-0 justify-center pt-1.5">
                      <span className={`size-2 rounded-full ${i === 0 ? "bg-ink" : "bg-line-strong"}`} />
                      {i < p.statusEvents.length - 1 ? <span className="absolute top-4 -bottom-0 w-px bg-line" /> : null}
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="type-body-s">
                        {e.fromStatus ? `${PROVIDER_STATUS[e.fromStatus].label} → ` : ""}
                        <span className="font-[520]">{PROVIDER_STATUS[e.toStatus].label}</span>
                      </p>
                      <p className="type-caption text-ink-muted num">{formatDateTime(e.createdAt)}</p>
                      {e.note ? <p className="type-caption whitespace-pre-line text-ink">„{e.note}“</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </PanelCard>

          <PanelCard
            title="Provision"
            action={<MutedLink href={routes.admin.commissions()}>Regeln</MutedLink>}
            bodyClassName="flex flex-col gap-3 px-4 py-3"
          >
            <p className="type-body-s text-ink-muted">
              {p.commissionRateOverride != null ? (
                <>
                  Fester Satz: <span className="font-[520] text-ink num">{formatPercent(p.commissionRateOverride)}</span>
                </>
              ) : (
                "Es gelten die Provisionsregeln (Profi → Kategorie → global)."
              )}
            </p>
            <CommissionOverrideForm providerId={p.profile.providerId} rate={p.commissionRateOverride} />
          </PanelCard>
        </aside>
      </div>
    </>
  );
}

function groupMissing(list: MissingDocumentDTO[]): Array<{ group: string; items: MissingDocumentDTO[] }> {
  const map = new Map<string, MissingDocumentDTO[]>();
  for (const m of list) {
    const key = m.categoryName ?? "Plattformweit";
    map.set(key, [...(map.get(key) ?? []), m]);
  }
  return [...map.entries()].sort((a, b) => (a[0] === "Plattformweit" ? -1 : b[0] === "Plattformweit" ? 1 : a[0].localeCompare(b[0], "de"))).map(([group, items]) => ({ group, items }));
}
