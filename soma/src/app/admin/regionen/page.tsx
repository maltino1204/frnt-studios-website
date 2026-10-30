import type { Metadata } from "next";
import { InlineBar } from "@/components/admin/bars";
import { formatInt, formatPercent } from "@/components/admin/format";
import { AdminPageHeader, AdminSection, EMPTY, MutedLink } from "@/components/admin/page";
import { RangeSwitch } from "@/components/admin/range-switch";
import { AdminTable, hrefWith, numCell } from "@/components/admin/table";
import { EmptyState, Status } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { requireRole } from "@/server/auth/guards";
import { listPlatformSettings } from "@/server/services/admin";
import { getDemandByPostalRegion } from "@/server/services/admin-ext";
import { getSupplyDemandByCity } from "@/server/services/analytics";

export const metadata: Metadata = { title: "Regionen" };

const RANGES = [7, 30, 90];
/** Live gate per city (product-spec §10, assumption): ≥ 8 active pros and ≥ 120 open slot-hours per week. */
const GATE = { providers: 8, hours: 120 };

export default async function RegionsPage({ searchParams }: { searchParams: Promise<{ tage?: string; plz?: string }> }) {
  const session = await requireRole("admin", routes.admin.regions());
  const sp = await searchParams;
  const days = RANGES.includes(Number(sp.tage)) ? Number(sp.tage) : 30;
  const [cities, regions, settings] = await Promise.all([getSupplyDemandByCity(session, { days }), getDemandByPostalRegion(session, { days }), listPlatformSettings(session)]);
  const minProviders = Number(settings.find((s) => s.key === "coverage_min_providers")?.value ?? 2) || 2;

  const gaps = cities
    .flatMap((c) => c.byCategory.map((cat) => ({ city: c.cityName, citySlug: c.citySlug, ...cat })))
    .filter((g) => (g.searches > 0 || g.waitlist > 0) && g.providers < minProviders)
    .sort((a, b) => (a.providers === 0 ? 0 : 1) - (b.providers === 0 ? 0 : 1) || b.searches + b.waitlist * 3 - (a.searches + a.waitlist * 3));
  const categories = cities[0]?.byCategory.map((c) => ({ slug: c.categorySlug, name: c.categoryName })) ?? [];
  const maxSearches = Math.max(1, ...cities.map((c) => c.searches));
  const maxRegion = Math.max(1, ...regions.map((r) => r.searches));
  const showAll = sp.plz === "alle";
  const regionRows = showAll ? regions : regions.slice(0, 15);
  const totals = cities.reduce((a, c) => ({ searches: a.searches + c.searches, zero: a.zero + c.zeroResultSearches, waitlist: a.waitlist + c.waitlistSignups }), { searches: 0, zero: 0, waitlist: 0 });

  return (
    <>
      <AdminPageHeader
        group="Marktplatz"
        title="Regionen"
        description={`Angebot und Nachfrage, letzte ${days} Tage · ${formatInt(totals.searches)} Suchen, davon ${formatInt(totals.zero)} ohne Ergebnis · ${formatInt(totals.waitlist)} auf der Warteliste`}
        actions={<RangeSwitch value={days} options={RANGES} />}
      />
      <div className="flex flex-col gap-12">
        <AdminSection id="gaps" title="Angebotslücken" description={`Kategorien mit Nachfrage, aber weniger als ${minProviders} Profis in der Stadt (unter dieser Schwelle sind SEO-Seiten nicht indexierbar).`}>
          {gaps.length === 0 ? (
            <EmptyState title="Keine Lücken." className="py-4">
              Jede nachgefragte Kategorie hat mindestens {minProviders} Profis.
            </EmptyState>
          ) : (
            <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
              {gaps.slice(0, 9).map((g) => (
                <li key={`${g.citySlug}-${g.categorySlug}`} className="flex flex-col gap-1.5 bg-surface-raised px-4 py-3.5">
                  <Status tone={g.providers === 0 ? "danger" : "warning"}>
                    {g.categoryName} in {g.city}
                  </Status>
                  <p className="pl-4 type-body-s text-ink-muted num">
                    <span className="text-ink">{formatInt(g.searches)} Suchen</span>, {formatInt(g.providers)} {g.providers === 1 ? "Profi" : "Profis"}
                    {g.waitlist ? `, ${formatInt(g.waitlist)} auf der Warteliste` : ""}
                  </p>
                </li>
              ))}
              {gaps.length % 3 !== 0 && gaps.length < 9 ? <li aria-hidden className="hidden bg-surface-raised xl:block" style={{ gridColumn: `span ${3 - (gaps.length % 3)}` }} /> : null}
            </ul>
          )}
          {gaps.length > 9 ? <p className="type-caption text-ink-muted">Weitere {gaps.length - 9} Lücken in der Matrix unten.</p> : null}
        </AdminSection>

        <AdminSection id="cities" title="Städte" description={`Live-Schwelle je Stadt (Annahme): mindestens ${GATE.providers} aktive Profis und ${GATE.hours} offene Termin-Stunden in den nächsten 7 Tagen.`}>
          <AdminTable label="Städte">
            <thead>
              <tr>
                <th scope="col">Stadt</th>
                <th scope="col" className="text-right">Profis</th>
                <th scope="col" className="text-right">Offene Std. (7 T.)</th>
                <th scope="col">Suchen</th>
                <th scope="col" className="text-right">Ohne Ergebnis</th>
                <th scope="col" className="text-right">Warteliste</th>
                <th scope="col" className="text-right">Buchungen</th>
                <th scope="col" className="text-right">Buchung je Suche</th>
                <th scope="col">Live-Schwelle</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((c) => {
                const zeroShare = c.searches ? c.zeroResultSearches / c.searches : 0;
                const live = c.approvedProviders >= GATE.providers && c.openSlotHours7d >= GATE.hours;
                return (
                  <tr key={c.citySlug}>
                    <td className="font-[520]">{c.cityName}</td>
                    <td className={numCell}>{formatInt(c.approvedProviders)}</td>
                    <td className={numCell}>{formatInt(c.openSlotHours7d)}</td>
                    <td>
                      <span className="flex items-center gap-3">
                        <InlineBar value={c.searches} max={maxSearches} />
                        <span className="num">{formatInt(c.searches)}</span>
                      </span>
                    </td>
                    <td className={numCell}>
                      <span className={zeroShare >= 0.2 ? "text-danger" : undefined}>
                        {formatInt(c.zeroResultSearches)} <span className="text-ink-muted">· {formatPercent(zeroShare, 0)}</span>
                      </span>
                    </td>
                    <td className={numCell}>{formatInt(c.waitlistSignups)}</td>
                    <td className={numCell}>{formatInt(c.bookings)}</td>
                    <td className={numCell}>{c.searches ? formatPercent(c.bookings / c.searches) : EMPTY}</td>
                    <td>
                      <Status tone={live ? "success" : "warning"}>{live ? "Erreicht" : c.approvedProviders < GATE.providers ? (GATE.providers - c.approvedProviders === 1 ? "1 Profi fehlt" : `${GATE.providers - c.approvedProviders} Profis fehlen`) : "Zu wenig Termine"}</Status>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTable>
        </AdminSection>

        <AdminSection id="matrix" title="Stadt × Kategorie" description="Je Zelle: Profis · Suchen. Rot: Nachfrage ohne Profi. Gelb: unter der Indexierungs-Schwelle.">
          <AdminTable label="Stadt × Kategorie" className={cn("[&_td]:px-3 [&_th]:px-3")}>
            <thead>
              <tr>
                <th scope="col">Stadt</th>
                {categories.map((c) => (
                  <th key={c.slug} scope="col" className="condensed text-right">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cities.map((c) => (
                <tr key={c.citySlug}>
                  <td className="font-[520]">{c.cityName}</td>
                  {c.byCategory.map((cat) => {
                    const demand = cat.searches > 0 || cat.waitlist > 0;
                    const tone = demand && cat.providers === 0 ? "danger" : demand && cat.providers < minProviders ? "warning" : null;
                    return (
                      <td
                        key={cat.categorySlug}
                        className={cn("text-right num", tone === "danger" && "bg-danger-soft", tone === "warning" && "bg-warning-soft")}
                        title={`${cat.categoryName} in ${c.cityName}: ${cat.providers} Profis, ${cat.searches} Suchen, ${cat.waitlist} Warteliste`}
                      >
                        <span className={cn(cat.providers === 0 ? "text-ink-muted" : "text-ink", tone === "danger" && "text-danger")}>{cat.providers}</span>
                        <span className="text-ink-muted"> · {cat.searches}</span>
                        {tone ? <span className="sr-only">{tone === "danger" ? " (Lücke)" : " (unter Schwelle)"}</span> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </AdminSection>

        <AdminSection
          id="plz"
          title="PLZ-Regionen"
          description="Zweistellige Leitregionen, nach Nachfrage sortiert. Profis zählen nach ihrer Basis-PLZ."
          actions={regions.length > 15 ? <MutedLink href={hrefWith(routes.admin.regions(), { tage: String(days) }, { plz: showAll ? undefined : "alle" })}>{showAll ? "Top 15" : `Alle ${regions.length} anzeigen`}</MutedLink> : null}
        >
          {regions.length === 0 ? (
            <EmptyState title="Noch keine Daten." className="py-4" />
          ) : (
            <AdminTable label="PLZ-Regionen">
              <thead>
                <tr>
                  <th scope="col">Region</th>
                  <th scope="col">Stadt</th>
                  <th scope="col">Suchen</th>
                  <th scope="col" className="text-right">Ohne Ergebnis</th>
                  <th scope="col" className="text-right">Warteliste</th>
                  <th scope="col" className="text-right">Profis</th>
                  <th scope="col" className="text-right">Buchungen</th>
                </tr>
              </thead>
              <tbody>
                {regionRows.map((r) => (
                  <tr key={r.region}>
                    <td>
                      <span className="code-ref font-[520]">{r.region}xxx</span>
                    </td>
                    <td className="text-ink-muted">{r.cityName ?? "außerhalb"}</td>
                    <td>
                      <span className="flex items-center gap-3">
                        <InlineBar value={r.searches} max={maxRegion} />
                        <span className="num">{formatInt(r.searches)}</span>
                      </span>
                    </td>
                    <td className={numCell}>{r.zeroResultSearches ? <span className={r.zeroResultSearches / Math.max(1, r.searches) >= 0.2 ? "text-danger" : undefined}>{formatInt(r.zeroResultSearches)}</span> : <span className="text-ink-muted">0</span>}</td>
                    <td className={numCell}>{formatInt(r.waitlistSignups)}</td>
                    <td className={numCell}>{r.providers ? formatInt(r.providers) : <span className={r.searches ? "text-danger" : "text-ink-muted"}>0</span>}</td>
                    <td className={numCell}>{formatInt(r.bookings)}</td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </AdminSection>
      </div>
    </>
  );
}
