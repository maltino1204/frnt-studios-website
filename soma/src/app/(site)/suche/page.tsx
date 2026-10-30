import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSession } from "@/server/auth/guards";
import { isServiceError } from "@/server/errors";
import { listCatalog } from "@/server/services/catalog";
import { searchProviders } from "@/server/services/search";
import type { CategoryWithServicesDTO, SearchInput, SearchResultDTO, ServiceDTO } from "@/server/dto";
import { Container, Overline } from "@/components/ui/layout";
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
import { searchHref, type CatalogLite, type SearchState } from "./_components/search-state";
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
  };

  // --- No PLZ yet / malformed PLZ: compact booking prompt ----------------------
  if (!plz || !/^\d{5}$/.test(plz)) {
    return (
      <div>
        <Container width="content" className="flex flex-col gap-8 pt-8 pb-16 lg:pt-14 lg:pb-24">
          <div className="flex max-w-reading flex-col gap-4">
            <Overline>{category ? category.name : "Termin finden"}</Overline>
            <h1 className="type-display-m">Wo dürfen wir Sie besuchen?</h1>
            <p className="type-body text-ink-muted">
              Geben Sie Ihre Postleitzahl ein. Wir zeigen Ihnen verifizierte Profis mit freien Terminen und dem Endpreis inklusive Anfahrt.
            </p>
          </div>
          <SearchPrompt
            catalog={lite}
            plz={plz}
            leistung={service?.slug}
            kategorie={category?.slug}
            plzError={plz ? "Bitte geben Sie eine fünfstellige Postleitzahl ein." : null}
          />
        </Container>
      </div>
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
    pageSize: Math.min(50, 15 * seite),
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

  // --- Unknown PLZ --------------------------------------------------------------
  if (!result) {
    return (
      <div>
        <Container width="content" className="flex flex-col gap-8 pt-8 pb-16 lg:pt-14 lg:pb-24">
          <div className="flex max-w-reading flex-col gap-4">
            <Overline>Postleitzahl unbekannt</Overline>
            <h1 className="type-display-m">{`Die Postleitzahl ${plz} kennen wir nicht.`}</h1>
            <p className="type-body text-ink-muted">Bitte prüfen Sie die Eingabe. Wir arbeiten mit fünfstelligen deutschen Postleitzahlen.</p>
          </div>
          <SearchPrompt catalog={lite} plz={plz} leistung={service?.slug} kategorie={category?.slug} plzError="Unbekannte Postleitzahl." />
        </Container>
      </div>
    );
  }

  state.cityName = result.location.cityName;
  const city = result.location.cityName;
  const what = service ? service.name : category ? category.name : "Beauty & Wellness";
  const canFavorite = session?.role === "customer";
  const filtersActive = state.sofort || state.bewertung || !!state.sprache || !!state.zeit;
  const empty = result.results.length === 0;
  const notLaunched = empty && !result.location.isLaunchCity;

  // Booked-out day → look at the following days (real searches, not logged as demand).
  let nextDays: Array<{ date: string; total: number }> = [];
  if (empty && datum && !notLaunched) {
    const dates = Array.from({ length: 6 }, (_, i) => berlinDateKey(new Date(new Date(`${datum}T12:00:00Z`).getTime() + (i + 1) * 86_400_000)));
    const totals = await Promise.all(
      dates.map((d) =>
        searchProviders({ ...input, date: d, pageSize: 1 }, session, { logDemand: false })
          .then((r) => ({ date: d, total: r.total }))
          .catch(() => ({ date: d, total: 0 })),
      ),
    );
    nextDays = totals.filter((t) => t.total > 0).slice(0, 4);
  }

  const countText = empty
    ? "Keine Profis mit freien Terminen gefunden."
    : `${plural(result.total, "Profi", "Profis")} mit freien Terminen${datum ? onDay(datum) : " in den nächsten 7\u00a0Tagen"}`;

  return (
    <div>
      <SearchNavProvider state={state}>
        <Container width="page" className="pt-6 pb-16 lg:pt-10 lg:pb-24">
          <div className="lg:grid lg:grid-cols-12 lg:gap-6">
            <div className="flex min-w-0 flex-col lg:col-span-7">
              <Overline>Verfügbare Profis</Overline>
              <h1 className="mt-3 type-heading-l">
                {`${what}${dauer ? ` · ${formatDuration(dauer)}` : ""} in ${plz}${city ? ` ${city}` : ""}`}
              </h1>
              <div className="mt-5">
                <SearchChips catalog={lite} />
              </div>
              {service ? (
                <div className="mt-4">
                  <SearchDateStrip />
                </div>
              ) : null}
              <p aria-live="polite" role="status" className="mt-5 border-b border-line pb-3 type-body-s text-ink-muted num">
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
                    {result.total > result.results.length && seite < 4 ? (
                      <div className="pt-6">
                        <ButtonLink href={searchHref(state, { seite: seite + 1 })} variant="secondary" scroll={false}>
                          Weitere Profis anzeigen
                        </ButtonLink>
                      </div>
                    ) : null}
                  </>
                ) : notLaunched ? (
                  <section className="flex max-w-reading flex-col items-start gap-4 py-10" aria-labelledby="leer-titel">
                    <span aria-hidden className="block h-0.5 w-6 bg-ink" />
                    <h2 id="leer-titel" className="type-display-s">
                      In Ihrer Gegend sind wir noch nicht.
                    </h2>
                    <p className="type-body-s text-ink-muted">
                      {`SOMA startet in Berlin, Hamburg, München, Köln, Frankfurt und Düsseldorf. Sollen wir Ihnen Bescheid geben, sobald es in ${plz} losgeht?`}
                    </p>
                    <WaitlistForm postalCode={plz} categorySlug={category?.slug} />
                  </section>
                ) : datum ? (
                  <section className="flex max-w-reading flex-col items-start gap-4 py-10" aria-labelledby="leer-titel">
                    <span aria-hidden className="block h-0.5 w-6 bg-ink" />
                    <h2 id="leer-titel" className="type-display-s">
                      {`Am ${formatDay(`${datum}T12:00:00Z`)}, ist in ${plz} alles ausgebucht.`}
                    </h2>
                    {nextDays.length ? (
                      <>
                        <p className="type-body-s text-ink-muted">An diesen Tagen sind noch Termine frei:</p>
                        <ul className="flex flex-wrap gap-2">
                          {nextDays.map((d) => (
                            <li key={d.date}>
                              <Link
                                href={searchHref({ ...state, datum: d.date })}
                                scroll={false}
                                className="inline-flex h-touch items-center gap-2 rounded-xs border border-line bg-surface-raised px-4 type-label num text-ink transition-colors duration-fast hover:border-ink"
                              >
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
                      <Link href={searchHref({ ...state, sofort: false, bewertung: false, sprache: null, zeit: null })} className="type-label-s text-accent underline underline-offset-[0.2em]">
                        Ohne Filter suchen
                      </Link>
                    ) : null}
                    {!nextDays.length ? <WaitlistForm postalCode={plz} categorySlug={category?.slug} cta="Benachrichtigen, wenn frei" /> : null}
                  </section>
                ) : (
                  <section className="flex max-w-reading flex-col items-start gap-4 py-10" aria-labelledby="leer-titel">
                    <span aria-hidden className="block h-0.5 w-6 bg-ink" />
                    <h2 id="leer-titel" className="type-display-s">
                      {filtersActive ? "Mit diesen Filtern ist gerade nichts frei." : `In ${plz} ist in den nächsten 7${NBSP}Tagen nichts frei.`}
                    </h2>
                    <p className="type-body-s text-ink-muted">
                      {filtersActive
                        ? "Lockern Sie die Filter oder wählen Sie einen späteren Tag."
                        : `Für ${what} haben die Profis in Ihrer Nähe derzeit keine freien Termine. Wählen Sie einen späteren Tag oder lassen Sie sich benachrichtigen.`}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {filtersActive ? (
                        <ButtonLink href={searchHref({ ...state, sofort: false, bewertung: false, sprache: null, zeit: null })} variant="secondary">
                          Filter zurücksetzen
                        </ButtonLink>
                      ) : null}
                      {service && category ? (
                        <ButtonLink href={searchHref({ ...state, leistung: null, dauer: null })} variant="secondary">
                          {`Alle ${category.name}-Leistungen`}
                        </ButtonLink>
                      ) : null}
                    </div>
                    {!filtersActive ? <WaitlistForm postalCode={plz} categorySlug={category?.slug} cta="Benachrichtigen, wenn frei" /> : null}
                  </section>
                )}
              </SearchResultsRegion>
            </div>

            <aside aria-label="Ihre Suche und Filter" className="hidden lg:col-span-4 lg:col-start-9 lg:block">
              <div className="sticky top-[calc(var(--header-height)+2rem)] flex flex-col gap-8 border-l border-line pl-8">
                <div className="flex flex-col gap-3">
                  <p className="type-overline text-ink-muted">Ihre Suche</p>
                  <dl className="flex flex-col divide-y divide-line">
                    <div className="flex justify-between gap-4 py-2.5">
                      <dt className="shrink-0 type-body-s text-ink-muted hyphens-none">Ort</dt>
                      <dd className="text-right type-body-s num">{`${plz}${city ? ` ${city}` : ""}`}</dd>
                    </div>
                    <div className="flex justify-between gap-4 py-2.5">
                      <dt className="shrink-0 type-body-s text-ink-muted hyphens-none">Behandlung</dt>
                      <dd className="text-right type-body-s">{what}</dd>
                    </div>
                    <div className="flex justify-between gap-4 py-2.5">
                      <dt className="shrink-0 type-body-s text-ink-muted hyphens-none">Wann</dt>
                      <dd className="text-right type-body-s">
                        {`${datum ? dayLabel(datum) : "So bald wie möglich"}${zeit ? ` · ${TIME_OF_DAY_LABEL[zeit]}` : ""}`}
                      </dd>
                    </div>
                    {sprache ? (
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="shrink-0 type-body-s text-ink-muted hyphens-none">Sprache</dt>
                        <dd className="text-right type-body-s">{languageName(sprache)}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
                <InlineFilters />
                <p className="type-caption text-ink-muted">
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
