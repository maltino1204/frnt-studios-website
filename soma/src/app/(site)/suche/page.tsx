import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSession } from "@/server/auth/guards";
import { isServiceError } from "@/server/errors";
import { listCatalog } from "@/server/services/catalog";
import { searchProviders } from "@/server/services/search";
import { getPriceFloors } from "@/server/services/site-ext";
import { listNearbyPostalCodes, type NearbyPostalCodeDTO } from "@/server/services/site-ext-2";
import type { CategoryWithServicesDTO, SearchInput, SearchResultDTO, ServiceDTO } from "@/server/dto";
import { AuraBackground } from "@/components/ui/aura";
import { chipClasses } from "@/components/ui/chip";
import { EmptyArt } from "@/components/ui/feedback";
import { Container, Overline } from "@/components/ui/layout";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ProviderRow } from "@/components/site/provider-row";
import {
  dayLabel,
  languageName,
  NBSP,
  SORT_LABEL,
  SORT_PARAM,
  TIME_OF_DAY_LABEL,
  TIME_OF_DAY_PARAM,
} from "@/components/site/checkout-format";
import { berlinDateKey, formatDay, formatDuration, plural } from "@/lib/format";
import { routes } from "@/lib/routes";
import { InlineFilters, SearchChips, SearchDateStrip, SearchNavProvider, SearchResultsRegion } from "./_components/search-controls";
import { SearchPrompt } from "./_components/search-prompt";
import { PRICE_CAPS, searchHref, type CatalogLite, type SearchState } from "./_components/search-state";
import { WaitlistForm } from "./_components/waitlist-form";

export const metadata: Metadata = {
  title: "Verfügbare Profis",
  description: "Verifizierte Beauty- und Wellness-Profis mit freien Terminen in Ihrer Nähe – mit Endpreis inklusive Anfahrt.",
  robots: { index: false, follow: true },
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || null;

function resolveService(catalog: CategoryWithServicesDTO[], leistung: string | null, kategorie: string | null) {
  let service: ServiceDTO | null = null;
  let category: CategoryWithServicesDTO | null = null;
  if (leistung) {
    for (const c of catalog) {
      const s = c.services.find((x) => x.slug === leistung || x.id === leistung);
      if (s) {
        service = s;
        category = c;
        break;
      }
    }
    // A category slug in `leistung` (from the compact prompt) means "all services of the category".
    if (!service) category = catalog.find((c) => c.slug === leistung) ?? null;
  }
  if (!category && kategorie) category = catalog.find((c) => c.slug === kategorie) ?? null;
  return { service, category };
}

/** " heute", " morgen" or " am Sa., 31. Okt." – never "am Morgen" (which would mean "in the morning"). */
function onDay(datum: string): string {
  const l = dayLabel(datum);
  return l === "Heute" ? " heute" : l === "Morgen" ? " morgen" : ` am ${l}`;
}

export default async function SuchePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [catalog, session] = await Promise.all([listCatalog(), getSession()]);
  const lite: CatalogLite = catalog.map((c) => ({
    slug: c.slug,
    name: c.name,
    services: c.services.map((s) => ({ id: s.id, slug: s.slug, name: s.name, durations: s.durations, defaultDuration: s.defaultDuration })),
  }));

  const { service, category } = resolveService(catalog, one(sp.leistung), one(sp.kategorie));
  const dauerN = Number(one(sp.dauer));
  const dauer = service && Number.isInteger(dauerN) && service.durations.includes(dauerN) ? dauerN : null;
  const today = berlinDateKey();
  const datumRaw = one(sp.datum);
  const datum = datumRaw && /^\d{4}-\d{2}-\d{2}$/.test(datumRaw) && datumRaw >= today ? datumRaw : null;
  const zeitRaw = one(sp.zeit);
  const zeit = zeitRaw && zeitRaw in TIME_OF_DAY_PARAM ? zeitRaw : null;
  const sortRaw = one(sp.sort);
  const sort = sortRaw && sortRaw in SORT_LABEL ? sortRaw : "empfohlen";
  const sprache = one(sp.sprache)?.slice(0, 5) ?? null;
  const seite = Math.max(1, Math.min(4, Number(one(sp.seite)) || 1));
  const plz = one(sp.plz);
  // F15: price cap incl. travel, applied to the ranked list on this page (no extra search).
  const preisN = Number(one(sp.preis));
  const preis = (PRICE_CAPS as readonly number[]).includes(preisN) ? preisN : null;

  const state: SearchState = {
    plz,
    cityName: null,
    kategorie: category?.slug ?? null,
    leistung: service?.slug ?? null,
    dauer,
    datum,
    zeit,
    sort,
    sofort: one(sp.sofort) === "1",
    bewertung: !!one(sp.bewertung),
    sprache,
    preis,
  };

  // --- No PLZ yet / malformed PLZ: compact booking prompt ----------------------
  if (!plz || !/^\d{5}$/.test(plz)) {
    return (
      <PromptLayout
        overline={category ? category.name : "Termin finden"}
        title="Wo dürfen wir Sie besuchen?"
        tone={category?.slug}
        lead="Geben Sie Ihre Postleitzahl ein. Wir zeigen Ihnen verifizierte Profis mit freien Terminen und dem Endpreis inklusive Anfahrt."
      >
        <SearchPrompt
          catalog={lite}
          plz={plz}
          leistung={service?.slug}
          kategorie={category?.slug}
          plzError={plz ? "Bitte geben Sie eine fünfstellige Postleitzahl ein." : null}
        />
      </PromptLayout>
    );
  }

  const input: SearchInput = {
    postalCode: plz,
    serviceId: service?.id,
    categorySlug: service ? undefined : category?.slug,
    durationMinutes: dauer ?? undefined,
    date: datum ?? undefined,
    timeOfDay: zeit ? TIME_OF_DAY_PARAM[zeit] : undefined,
    sort: SORT_PARAM[sort],
    page: 1,
    // With a price cap the page filters the ranked list itself, so it asks for the maximum.
    pageSize: preis ? 50 : Math.min(50, 15 * seite),
    instantOnly: state.sofort || undefined,
    minRating: state.bewertung ? 4.5 : undefined,
    language: sprache ?? undefined,
  };

  let result: SearchResultDTO | null = null;
  try {
    result = await searchProviders(input, session);
  } catch (e) {
    if (!(isServiceError(e) && e.code === "validation")) throw e;
  }
  const withinCap = <T extends { totalPriceCents: number }>(list: T[]): T[] => (preis ? list.filter((r) => r.totalPriceCents <= preis * 100) : list);
  if (result && preis) {
    const within = withinCap(result.results);
    result = { ...result, results: within.slice(0, 15 * seite), total: within.length };
  }

  // --- Unknown PLZ --------------------------------------------------------------
  if (!result) {
    return (
      <PromptLayout
        overline="Postleitzahl unbekannt"
        title={`Die Postleitzahl ${plz} kennen wir nicht.`}
        tone={category?.slug}
        lead="Bitte prüfen Sie die Eingabe. Wir arbeiten mit fünfstelligen deutschen Postleitzahlen."
      >
        <SearchPrompt catalog={lite} plz={plz} leistung={service?.slug} kategorie={category?.slug} plzError="Unbekannte Postleitzahl." />
      </PromptLayout>
    );
  }

  state.cityName = result.location.cityName;
  const city = result.location.cityName;
  const what = service ? service.name : category ? category.name : "Beauty & Wellness";
  const canFavorite = session?.role === "customer";
  const filtersActive = state.sofort || state.bewertung || !!state.sprache || !!state.zeit || !!state.preis;
  const empty = result.results.length === 0;
  const notLaunched = empty && !result.location.isLaunchCity;

  // Empty in a launch city: does anyone in the city offer this at all (A4-6)? Coverage only, no slots.
  // No supply is a different message than "booked out", whatever the day or filters.
  let noSupply = false;
  let categoryHasSupply = false;
  if (empty && !notLaunched && result.location.citySlug) {
    const floors = await getPriceFloors({ citySlug: result.location.citySlug, categorySlug: category?.slug }).catch(() => null);
    if (floors) {
      categoryHasSupply = floors.some((f) => f.providerCount > 0);
      noSupply = service ? !floors.some((f) => f.serviceId === service.id && f.providerCount > 0) : !categoryHasSupply;
    }
  }

  // Booked-out day → look at the following days (real searches, not logged as demand).
  let nextDays: Array<{ date: string; total: number }> = [];
  if (empty && datum && !notLaunched && !noSupply) {
    const dates = Array.from({ length: 6 }, (_, i) => berlinDateKey(new Date(new Date(`${datum}T12:00:00Z`).getTime() + (i + 1) * 86_400_000)));
    const totals = await Promise.all(
      dates.map((d) =>
        searchProviders({ ...input, date: d, pageSize: preis ? 50 : 1 }, session, { logDemand: false })
          .then((r) => ({ date: d, total: preis ? withinCap(r.results).length : r.total }))
          .catch(() => ({ date: d, total: 0 })),
      ),
    );
    nextDays = totals.filter((t) => t.total > 0).slice(0, 4);
  }

  // Thin supply (1–2 results, N13): at most one extra search (other days, only when a day was
  // picked) plus one cheap coverage query for neighbouring PLZ. Both are hints and never fail the page.
  const thin = !empty && result.total < 3 && result.location.isLaunchCity;
  let moreDays: string[] = [];
  let nearby: NearbyPostalCodeDTO[] = [];
  if (thin) {
    const [week, near] = await Promise.all([
      datum ? searchProviders({ ...input, date: undefined, pageSize: 50 }, session, { logDemand: false }).catch(() => null) : Promise.resolve(null),
      listNearbyPostalCodes({ postalCode: plz, serviceId: service?.id, categorySlug: service ? undefined : category?.slug }).catch(() => []),
    ]);
    nearby = near;
    if (week && datum) {
      // Distinct providers per day from the week's first free slots; only days with more choice than now.
      const perDay = new Map<string, Set<string>>();
      for (const r of withinCap(week.results)) for (const slot of r.nextSlots) {
        const d = berlinDateKey(slot);
        if (d !== datum) perDay.set(d, (perDay.get(d) ?? new Set()).add(r.providerId));
      }
      moreDays = [...perDay.entries()].filter(([, ids]) => ids.size > result.total).sort(([a], [b]) => a.localeCompare(b)).slice(0, 2).map(([d]) => d);
    }
  }

  const countText = empty
    ? "Keine Profis mit freien Terminen gefunden."
    : `${plural(result.total, "Profi", "Profis")} mit freien Terminen${datum ? onDay(datum) : " in den nächsten 7\u00a0Tagen"}`;

  const resetFilters = searchHref({ ...state, sofort: false, bewertung: false, sprache: null, zeit: null, preis: null });
  const emptySeed = `suche:${plz}:${category?.slug ?? "alle"}`;

  return (
    <div>
      <SearchNavProvider state={state}>
        <Container width="page" className="pt-6 pb-16 lg:pt-10 lg:pb-24">
          <div className="lg:grid lg:grid-cols-12 lg:gap-6">
            <div className="flex min-w-0 flex-col lg:col-span-7 xl:col-span-8">
              <Overline>Verfügbare Profis</Overline>
              <h1 className="mt-3 type-heading-l">
                {`${what}${dauer ? ` · ${formatDuration(dauer)}` : ""} in ${plz}${city ? ` ${city}` : ""}`}
              </h1>

              {/* Sticky glass filter bar: full-bleed on phones, a floating capsule from lg. */}
              <div className="sticky top-(--header-height) z-20 -mx-(--space-gutter) mt-4 glass-strong px-(--space-gutter) py-2 shadow-[0_1px_0_var(--color-line)] lg:mx-0 lg:mt-5 lg:rounded-card lg:px-2 lg:py-1.5 lg:glass-edge lg:shadow-raised">
                <SearchChips catalog={lite} />
              </div>
              {service ? (
                <div className="mt-4">
                  <SearchDateStrip />
                </div>
              ) : null}
              <p aria-live="polite" role="status" className="mt-5 mb-3 type-body-s text-ink-muted num">
                {!empty ? <span aria-hidden className="mr-2 inline-block size-1.5 -translate-y-px rounded-full bg-success align-middle" /> : null}
                {countText}
              </p>

              <SearchResultsRegion>
                {!empty ? (
                  <>
                    <div className="flex flex-col">
                      {result.results.map((r, i) => (
                        <ProviderRow key={r.providerId} result={r} postalCode={plz} date={datum} canFavorite={canFavorite} priority={i < 3} />
                      ))}
                    </div>
                    {thin && (moreDays.length || nearby.length || filtersActive) ? (
                      <div className="mt-4 flex flex-col gap-3 rounded-card bg-surface-tint p-5 shadow-[inset_0_0_0_1px_rgb(61_79_240/0.12)]">
                        <p className="type-heading-s text-ink">So finden Sie mehr Auswahl:</p>
                        {moreDays.length ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="type-body-s text-ink-muted">An anderen Tagen</span>
                            {moreDays.map((d) => (
                              <Link key={d} href={searchHref({ ...state, datum: d })} scroll={false} className={chipClasses(false, "num")}>
                                {dayLabel(d)}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                        {nearby.length ? (
                          <p className="type-body-s text-ink-muted">
                            {"Wenn Sie auch an einem anderen Ort sein können, etwa im Büro: auch in der Nähe "}
                            {nearby.map((n, i) => (
                              <span key={n.postalCode}>
                                {i > 0 ? " · " : null}
                                <Link href={searchHref({ ...state, plz: n.postalCode })} className="text-accent underline underline-offset-[0.2em] num hover:text-accent-hover">
                                  {n.postalCode}
                                </Link>
                              </span>
                            ))}
                          </p>
                        ) : null}
                        {filtersActive ? (
                          <Link href={resetFilters} className="inline-flex min-h-touch items-center self-start type-label-s text-accent underline underline-offset-[0.2em]">
                            Ohne Filter suchen
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                    {result.total > result.results.length && seite < 4 ? (
                      <div className="flex justify-center pt-8">
                        <ButtonLink href={searchHref(state, { seite: seite + 1 })} variant="secondary" size="l" scroll={false}>
                          Weitere Profis anzeigen
                        </ButtonLink>
                      </div>
                    ) : null}
                  </>
                ) : notLaunched ? (
                  <EmptyCard seed={emptySeed} tone={category?.slug} title="In Ihrer Gegend sind wir noch nicht.">
                    <p className="type-body-s text-ink-muted">
                      {`SOMA startet in Berlin, Hamburg, München, Köln, Frankfurt und Düsseldorf. Sollen wir Ihnen Bescheid geben, sobald es in ${plz} losgeht?`}
                    </p>
                    <WaitlistForm postalCode={plz} categorySlug={category?.slug} />
                  </EmptyCard>
                ) : noSupply ? (
                  <EmptyCard seed={emptySeed} tone={category?.slug} title={`In ${city ?? plz} gibt es noch keine Profis für ${what}.`}>
                    <p className="type-body-s text-ink-muted">{`Hinterlassen Sie Ihre E-Mail-Adresse – wir melden uns, sobald ${what} in ${plz} buchbar ist.`}</p>
                    {service && category && categoryHasSupply ? (
                      <ButtonLink href={searchHref({ ...state, leistung: null, dauer: null })} variant="secondary">
                        {`Alle ${category.name}-Leistungen`}
                      </ButtonLink>
                    ) : null}
                    <WaitlistForm postalCode={plz} categorySlug={category?.slug} />
                  </EmptyCard>
                ) : datum ? (
                  <EmptyCard seed={emptySeed} tone={category?.slug} title={`Am ${formatDay(`${datum}T12:00:00Z`)}, ist in ${plz} alles ausgebucht.`}>
                    {nextDays.length ? (
                      <>
                        <p className="type-body-s text-ink-muted">An diesen Tagen sind noch Termine frei:</p>
                        <ul className="flex flex-wrap gap-2">
                          {nextDays.map((d) => (
                            <li key={d.date}>
                              <Link href={searchHref({ ...state, datum: d.date })} scroll={false} className={chipClasses(false, "h-11 gap-2 rounded-tile px-4 num")}>
                                {dayLabel(d.date)}
                                <span className="type-caption text-ink-muted">{plural(d.total, "Profi", "Profis")}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="type-body-s text-ink-muted">Auch an den Folgetagen ist nichts frei. Lassen Sie sich benachrichtigen, sobald ein Termin frei wird.</p>
                    )}
                    {filtersActive ? (
                      <Link href={resetFilters} className="type-label-s text-accent underline underline-offset-[0.2em]">
                        Ohne Filter suchen
                      </Link>
                    ) : null}
                    {!nextDays.length ? <WaitlistForm postalCode={plz} categorySlug={category?.slug} cta="Benachrichtigen, wenn frei" /> : null}
                  </EmptyCard>
                ) : (
                  <EmptyCard
                    seed={emptySeed}
                    tone={category?.slug}
                    title={filtersActive ? "Mit diesen Filtern ist gerade nichts frei." : `In ${plz} ist in den nächsten 7${NBSP}Tagen nichts frei.`}
                  >
                    <p className="type-body-s text-ink-muted">
                      {filtersActive
                        ? "Lockern Sie die Filter oder wählen Sie einen späteren Tag."
                        : `Für ${what} ist in Ihrer Nähe derzeit kein Termin frei. Wählen Sie einen späteren Tag oder lassen Sie sich benachrichtigen.`}
                    </p>
                    {filtersActive || (service && category) ? (
                      <div className="flex flex-wrap gap-3">
                        {filtersActive ? (
                          <ButtonLink href={resetFilters} variant="secondary">
                            Filter zurücksetzen
                          </ButtonLink>
                        ) : null}
                        {service && category ? (
                          <ButtonLink href={searchHref({ ...state, leistung: null, dauer: null })} variant="secondary">
                            {`Alle ${category.name}-Leistungen`}
                          </ButtonLink>
                        ) : null}
                      </div>
                    ) : null}
                    {!filtersActive ? <WaitlistForm postalCode={plz} categorySlug={category?.slug} cta="Benachrichtigen, wenn frei" /> : null}
                  </EmptyCard>
                )}
              </SearchResultsRegion>
            </div>

            <aside aria-label="Ihre Suche und Filter" className="hidden lg:col-span-5 lg:block xl:col-span-4">
              <div className="sticky top-[calc(var(--header-height)+1.5rem)] flex flex-col gap-6 rounded-card bg-surface-raised p-6 shadow-raised">
                <div className="flex flex-col gap-3">
                  <p className="type-overline text-ink-muted">Ihre Suche</p>
                  <dl className="flex flex-col divide-y divide-line">
                    <SummaryRow label="Ort" value={`${plz}${city ? ` ${city}` : ""}`} num />
                    <SummaryRow label="Behandlung" value={what} />
                    <SummaryRow label="Wann" value={`${datum ? dayLabel(datum) : "So bald wie möglich"}${zeit ? ` · ${TIME_OF_DAY_LABEL[zeit]}` : ""}`} />
                    {preis ? <SummaryRow label="Preis" value={`bis ${preis}${NBSP}€ inkl. Anfahrt`} num /> : null}
                    {sprache ? <SummaryRow label="Sprache" value={languageName(sprache)} /> : null}
                  </dl>
                </div>
                <InlineFilters />
                <p className="border-t border-line pt-4 type-caption text-ink-muted">
                  Alle Preise sind Endpreise inklusive Anfahrt. Profis zahlen nicht für ihre Platzierung.{" "}
                  <Link href="/ranking" className="text-accent underline underline-offset-[0.2em]">
                    So sortieren wir
                  </Link>
                </p>
              </div>
            </aside>
          </div>
          <p className="mt-10 type-caption text-ink-muted lg:hidden">
            Alle Preise sind Endpreise inklusive Anfahrt. Profis zahlen nicht für ihre Platzierung.{" "}
            <Link href="/ranking" className="text-accent underline underline-offset-[0.2em]">
              So sortieren wir
            </Link>
          </p>
          {empty && !notLaunched ? (
            <div className="mt-6">
              <ButtonLink href={routes.categories()} variant="ghost" iconRight={<Icon icon={ArrowRight} />}>
                Alle Behandlungen ansehen
              </ButtonLink>
            </div>
          ) : null}
        </Container>
      </SearchNavProvider>
    </div>
  );
}

function SummaryRow({ label, value, num }: { label: string; value: string; num?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="shrink-0 type-body-s text-ink-muted hyphens-none">{label}</dt>
      <dd className={cn("text-right type-body-s text-ink", num && "num")}>{value}</dd>
    </div>
  );
}

/** Empty and zero-supply states: seeded aura art, a calm headline, the next useful action. */
function EmptyCard({ seed, tone, title, children }: { seed: string; tone?: string | null; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby="leer-titel" className="relative isolate mt-1 overflow-clip rounded-panel bg-surface-raised p-6 shadow-raised md:p-8">
      <AuraBackground variant="subtle" placement="right" fade="none" animate={false} />
      <div className="flex max-w-reading flex-col items-start gap-4">
        <EmptyArt seed={seed} tone={tone ?? undefined} className="mb-2" />
        <h2 id="leer-titel" className="type-display-s">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

/** No or unknown PLZ: a calm prompt on a soft aura, the form as a floating card. */
function PromptLayout({ overline, title, lead, children }: { overline: string; title: string; lead: string; tone?: string | null; children: ReactNode }) {
  return (
    <div className="relative isolate overflow-clip">
      <AuraBackground placement="right" variant="section" fade="both" />
      <Container width="content" className="grid gap-8 pt-8 pb-16 lg:grid-cols-12 lg:items-start lg:gap-6 lg:pt-16 lg:pb-24">
        <div className="flex max-w-reading flex-col gap-4 lg:col-span-6">
          <Overline>{overline}</Overline>
          <h1 className="type-display-m">{title}</h1>
          <p className="type-body-l text-ink-muted">{lead}</p>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          {children}
        </div>
      </Container>
    </div>
  );
}
