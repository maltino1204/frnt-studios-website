import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock, ExternalLink, FileText } from "lucide-react";
import { formatDate, formatDuration, formatPrice, formatRating } from "@/lib/format";
import { formatDateTime, formatPercent } from "@/components/admin/format";
import { DOCUMENT_KIND, DOCUMENT_STATUS, PROVIDER_STATUS } from "@/components/admin/labels";
import { AdminPageHeader, AdminSection, Card, EMPTY, Facts, MutedLink, PanelCard, SectionEmpty } from "@/components/admin/page";
import { CommissionOverrideForm, DocumentReview, ProviderDecisions } from "@/components/admin/provider-actions";
import { AdminTable, numCell } from "@/components/admin/table";
import { Timeline } from "@/components/admin/timeline";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Notice, Status } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
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
        title={
          <span className="flex items-center gap-3">
            <Avatar name={p.profile.displayName} size={40} />
            {p.profile.displayName}
          </span>
        }
        meta={<Status tone={st.tone}>{st.label}</Status>}
        description={
          <span className="flex flex-wrap gap-x-2 sm:pl-[3.25rem]">
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
        <div id="approval-blocked" className="mb-6 lg:mb-8">
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

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 xl:gap-8">
        <div className="flex min-w-0 flex-col gap-8 lg:gap-10">
          <AdminSection id="docs" title="Dokumente" count={p.documents.length || undefined} description="Private Dateien öffnen sich in einem neuen Tab (nur für Admins und den Profi abrufbar).">
            {p.documents.length === 0 ? (
              <SectionEmpty seed={`docs-${p.profile.slug}`} title="Noch keine Dokumente.">
                Der Profi hat bisher nichts hochgeladen.
              </SectionEmpty>
            ) : (
              <>
                <Card as="ul" aria-label="Dokumente" className="flex flex-col divide-y divide-line md:hidden">
                  {p.documents.map((d) => (
                    <li key={d.id} className="flex flex-col gap-3 px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        <span aria-hidden className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-sunken text-ink shadow-[inset_0_0_0_1px_var(--color-line-mid)]">
                          <Icon icon={FileText} size={18} />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="type-body-s font-[520]">{DOCUMENT_KIND[d.kind]}</p>
                            <Status tone={DOCUMENT_STATUS[d.status].tone}>{DOCUMENT_STATUS[d.status].label}</Status>
                          </div>
                          {d.kind === "qualification" ? (
                            <p className="type-caption text-ink-muted">{d.categoryName ? `für ${d.categoryName}` : "ohne Kategorie – zählt für keine Kategorie"}</p>
                          ) : null}
                          <a href={d.url} target="_blank" rel="noopener" className="inline-flex max-w-full items-center gap-1 rounded-[6px] type-caption text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current hover:text-link-hover focus-ring">
                            <span className="truncate">{d.fileName}</span>
                            <Icon icon={ExternalLink} size={12} className="shrink-0" />
                            <span className="sr-only"> (öffnet in neuem Tab)</span>
                          </a>
                          <p className="type-caption text-ink-muted num">
                            hochgeladen {formatDateTime(d.createdAt)}
                            {d.expiresAt ? (
                              <span className={d.expired ? "text-danger" : undefined}>
                                {" · "}
                                {d.expired ? "abgelaufen" : `gültig bis ${formatDate(new Date(new Date(d.expiresAt).getTime() - 1000))}`}
                              </span>
                            ) : null}
                          </p>
                          {d.reviewNote ? <p className="type-caption text-ink-muted">„{d.reviewNote}“</p> : null}
                        </div>
                      </div>
                      <div className="-mb-1 flex justify-end">
                        <DocumentReview documentId={d.id} status={d.status} label={DOCUMENT_KIND[d.kind]} expires={d.kind === "insurance"} />
                      </div>
                    </li>
                  ))}
                </Card>
                <AdminTable label="Dokumente" regionClassName="max-md:hidden">
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
                          <span className="flex items-center gap-3 py-2">
                            <span aria-hidden className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-sunken text-ink shadow-[inset_0_0_0_1px_var(--color-line-mid)]">
                              <Icon icon={FileText} size={18} />
                            </span>
                            <span className="flex min-w-0 flex-col">
                              <span className="font-[520]">{DOCUMENT_KIND[d.kind]}</span>
                              {d.kind === "qualification" ? (
                                <span className="type-caption text-ink-muted">{d.categoryName ? `für ${d.categoryName}` : "ohne Kategorie – zählt für keine Kategorie"}</span>
                              ) : null}
                              <a href={d.url} target="_blank" rel="noopener" className="inline-flex max-w-56 items-center gap-1 rounded-[6px] type-caption text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current hover:text-link-hover focus-ring">
                                <span className="truncate">{d.fileName}</span>
                                <Icon icon={ExternalLink} size={12} className="shrink-0" />
                                <span className="sr-only"> (öffnet in neuem Tab)</span>
                              </a>
                            </span>
                          </span>
                        </td>
                        <td className="num text-ink-muted">{formatDateTime(d.createdAt)}</td>
                        <td>
                          <span className="flex flex-col gap-0.5">
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
              </>
            )}
          </AdminSection>

          <AdminSection id="missing" title="Pflichtdokumente" description="Plattformweite Anforderungen und Nachweise je angebotener Kategorie. Zählt erst, wenn das Dokument geprüft ist.">
            {grouped.length === 0 ? (
              <Notice kind="success" title="Alle Pflichtdokumente liegen geprüft vor." />
            ) : (
              <Card className="divide-y divide-line">
                {grouped.map((g) => (
                  <div key={g.group} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:gap-6 sm:px-5">
                    <p className="type-label-s text-ink-muted sm:w-36 sm:shrink-0 sm:pt-1">{g.group}</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {g.items.map((m) => (
                        <li key={`${m.kind}-${m.label}`}>
                          <Status tone="danger">{m.label}</Status>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </Card>
            )}
          </AdminSection>

          <AdminSection id="services" title="Leistungen" count={p.services.length || undefined}>
            {p.services.length === 0 ? (
              <SectionEmpty seed={`leistungen-${p.profile.slug}`} title="Keine Leistungen angelegt." />
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
              <Card className="flex items-center gap-3 px-4 py-4 type-body-s text-ink-muted sm:px-5">
                <Icon icon={CalendarClock} size={18} />
                Keine Arbeitszeiten hinterlegt.
              </Card>
            ) : (
              <Card as="dl" className="grid grid-cols-2 gap-1.5 p-1.5 sm:grid-cols-4 xl:grid-cols-7">
                {[1, 2, 3, 4, 5, 6, 7].map((wd) => {
                  const w = p.weeklyHours.filter((h) => h.weekday === wd);
                  return (
                    <div key={wd} className={`flex flex-col gap-1 rounded-tile px-3 py-2.5 ${w.length ? "bg-surface-tint shadow-[inset_0_0_0_1px_var(--color-line-mid)]" : "bg-surface-sunken/60"}`}>
                      <dt className="type-label-s text-ink-muted">{WEEKDAYS[wd]}</dt>
                      <dd className="type-body-s num">
                        {w.length ? (
                          w.map((h) => (
                            <span key={`${h.start}-${h.end}`} className="block whitespace-nowrap">
                              {h.start}–{h.end}
                            </span>
                          ))
                        ) : (
                          <span className="text-ink-muted">frei</span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </Card>
            )}
          </AdminSection>
        </div>

        <aside className="flex min-w-0 flex-col gap-3 lg:gap-4">
          <PanelCard title="Profil" bodyClassName="px-4 sm:px-5">
            <Facts
              items={[
                { label: "E-Mail", value: <a className="break-all rounded-[6px] text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current hover:text-link-hover focus-ring" href={`mailto:${p.email}`}>{p.email}</a> },
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
            <PanelCard title="Vorstellung" bodyClassName="flex flex-col gap-2 px-4 py-3.5 sm:px-5">
              {p.profile.headline ? <p className="type-body-s font-[520]">{p.profile.headline}</p> : null}
              {p.profile.bio ? <p className="type-body-s whitespace-pre-line text-ink-muted">{p.profile.bio}</p> : null}
            </PanelCard>
          ) : null}

          <PanelCard title="Statusverlauf" bodyClassName="px-4 py-4 sm:px-5">
            {p.statusEvents.length === 0 ? (
              <p className="type-body-s text-ink-muted">Noch keine Statuswechsel.</p>
            ) : (
              <Timeline
                current={0}
                items={p.statusEvents.map((e, i) => ({
                  key: i,
                  title: (
                    <>
                      {e.fromStatus ? <span className="text-ink-muted">{PROVIDER_STATUS[e.fromStatus].label} → </span> : null}
                      <span className="font-[520]">{PROVIDER_STATUS[e.toStatus].label}</span>
                    </>
                  ),
                  time: formatDateTime(e.createdAt),
                  note: e.note,
                }))}
              />
            )}
          </PanelCard>

          <PanelCard
            title="Provision"
            action={<MutedLink href={routes.admin.commissions()}>Regeln</MutedLink>}
            bodyClassName="flex flex-col gap-3 px-4 py-4 sm:px-5"
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
