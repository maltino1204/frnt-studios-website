"use client";

import { ChevronDown, ChevronLeft, MapPin, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { DateStrip } from "@/components/ui/booking";
import { Button } from "@/components/ui/button";
import { Chip, ChipRow, chipClasses } from "@/components/ui/chip";
import { CountPill } from "@/components/ui/feedback";
import { Input, RadioRow, Select, Switch } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";
import { berlinDateKey, formatDuration } from "@/lib/format";
import {
  dayLabel,
  languageName,
  localNoon,
  SORT_LABEL,
  TIME_OF_DAY_LABEL,
  TIME_OF_DAY_RANGE,
} from "@/components/site/checkout-format";
import { activeFilterCount, searchHref, type CatalogLite, type SearchState } from "./search-state";

/* ------------------------------------------------------------------------- */
/* Navigation context: every control navigates via a transition so the list  */
/* stays visible (dimmed, aria-busy) until the new results arrive.           */
/* ------------------------------------------------------------------------- */
const NavCtx = createContext<{ go: (patch: Partial<SearchState>) => void; pending: boolean; state: SearchState } | null>(null);

function useNav() {
  const ctx = useContext(NavCtx);
  if (!ctx) throw new Error("SearchNavProvider missing");
  return ctx;
}

export function SearchNavProvider({ state, children }: { state: SearchState; children: ReactNode }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (patch: Partial<SearchState>) => {
    const next = { ...state, ...patch };
    start(() => router.push(searchHref(next), { scroll: false }));
  };
  return <NavCtx.Provider value={{ go, pending, state }}>{children}</NavCtx.Provider>;
}

/** Wraps the result list: dims and marks busy while a new search loads. */
export function SearchResultsRegion({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useNav();
  return (
    <div aria-busy={pending || undefined} className={cn("transition-opacity duration-fast", pending && "opacity-50", className)}>
      {children}
    </div>
  );
}

function next14(): { key: string; date: Date; available: boolean }[] {
  const today = berlinDateKey();
  return Array.from({ length: 14 }, (_, i) => {
    const key = berlinDateKey(new Date(localNoon(today).getTime() + i * 86_400_000));
    return { key, date: localNoon(key), available: true };
  });
}

/* ------------------------------------------------------------------------- */
/* Header chips: PLZ · Leistung · Datum (+ filter chip on mobile)            */
/* ------------------------------------------------------------------------- */
export function SearchChips({ catalog, showFilterChip = true }: { catalog: CatalogLite; showFilterChip?: boolean }) {
  const { state } = useNav();
  const [open, setOpen] = useState<null | "plz" | "leistung" | "datum" | "filter">(null);
  const close = () => setOpen(null);
  const category = catalog.find((c) => c.slug === state.kategorie);
  const service = category?.services.find((s) => s.slug === state.leistung);
  const serviceLabel = service
    ? `${service.name}${state.dauer && service.durations.length > 1 ? ` · ${formatDuration(state.dauer)}` : ""}`
    : category
      ? category.name
      : "Alle Behandlungen";
  const dateLabel = `${state.datum ? dayLabel(state.datum) : "So bald wie möglich"}${state.zeit ? ` · ${TIME_OF_DAY_LABEL[state.zeit]}` : ""}`;
  const filters = activeFilterCount(state);

  return (
    <>
      <ChipRow label="Suche anpassen" className="lg:mx-0 lg:flex-wrap lg:px-0">
        <button type="button" className={chipClasses(false)} onClick={() => setOpen("plz")} aria-haspopup="dialog">
          <Icon icon={MapPin} size={16} />
          <span className="num">{state.plz}</span>
          {state.cityName ? <span className="font-normal text-ink-muted">{state.cityName}</span> : null}
          <Icon icon={ChevronDown} size={16} />
        </button>
        <button type="button" className={chipClasses(false, "condensed")} onClick={() => setOpen("leistung")} aria-haspopup="dialog">
          {serviceLabel}
          <Icon icon={ChevronDown} size={16} />
        </button>
        <button type="button" className={chipClasses(false)} onClick={() => setOpen("datum")} aria-haspopup="dialog">
          {dateLabel}
          <Icon icon={ChevronDown} size={16} />
        </button>
        {showFilterChip ? (
          <button type="button" className={chipClasses(filters > 0, "lg:hidden")} onClick={() => setOpen("filter")} aria-haspopup="dialog">
            <Icon icon={SlidersHorizontal} size={16} />
            Sortieren & Filtern
            {filters > 0 ? <CountPill className="bg-ink-inverse! text-ink!">{filters}</CountPill> : null}
          </button>
        ) : null}
      </ChipRow>
      {/* Sheets mount only while open: the kit's Sheet uses a fixed title id. */}
      {open === "plz" ? <PlzSheet open onClose={close} /> : null}
      {open === "leistung" ? <ServiceSheet open onClose={close} catalog={catalog} /> : null}
      {open === "datum" ? <DateSheet open onClose={close} /> : null}
      {open === "filter" ? <FilterSheet open onClose={close} /> : null}
    </>
  );
}

function PlzSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, go } = useNav();
  const [value, setValue] = useState(state.plz ?? "");
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!/^\d{5}$/.test(v)) return setError("Bitte geben Sie eine fünfstellige Postleitzahl ein.");
    onClose();
    go({ plz: v, cityName: null });
  };
  return (
    <Sheet open={open} onClose={onClose} title="Wo findet die Behandlung statt?">
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <Input
          label="Postleitzahl"
          name="plz"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          placeholder="z. B. 10115"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 5))}
          error={error}
          hint="Wir zeigen nur Profis, deren Einsatzgebiet Ihre Adresse abdeckt."
          autoFocus
        />
        <Button type="submit" size="l" block>
          Übernehmen
        </Button>
      </form>
    </Sheet>
  );
}

function ServiceSheet({ open, onClose, catalog }: { open: boolean; onClose: () => void; catalog: CatalogLite }) {
  const { state, go } = useNav();
  const [cat, setCat] = useState<string | null>(state.kategorie);
  const category = catalog.find((c) => c.slug === cat);
  const apply = (patch: Partial<SearchState>) => {
    onClose();
    go({ ...patch, datum: state.datum });
  };
  return (
    <Sheet open={open} onClose={onClose} title={category ? category.name : "Was dürfen wir für Sie tun?"}>
      {!category ? (
        <ul className="flex flex-col">
          <li className="border-b border-line">
            <button
              type="button"
              onClick={() => apply({ kategorie: null, leistung: null, dauer: null })}
              className="flex min-h-touch w-full items-center justify-between py-3.5 text-left type-body text-ink hover:text-ink-muted"
            >
              Alle Behandlungen
            </button>
          </li>
          {catalog.map((c) => (
            <li key={c.slug} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => setCat(c.slug)}
                className={cn(
                  "flex min-h-touch w-full items-center justify-between py-3.5 text-left type-body text-ink hover:text-ink-muted",
                  state.kategorie === c.slug && "font-semibold",
                )}
              >
                {c.name}
                <span className="type-caption text-ink-muted">{c.services.length} Leistungen</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => setCat(null)} className="-ml-2 inline-flex h-touch items-center gap-1 self-start px-2 type-label-s text-ink hover:bg-surface-sunken">
            <Icon icon={ChevronLeft} size={16} />
            Alle Kategorien
          </button>
          <ul className="flex flex-col">
            <li className="border-b border-line">
              <button
                type="button"
                onClick={() => apply({ kategorie: category.slug, leistung: null, dauer: null })}
                className={cn("flex min-h-touch w-full items-center py-3.5 text-left type-body text-ink hover:text-ink-muted", state.kategorie === category.slug && !state.leistung && "font-semibold")}
              >
                {`Alle ${category.name}-Leistungen`}
              </button>
            </li>
            {category.services.map((s) => {
              const selected = state.leistung === s.slug;
              return (
                <li key={s.slug} className="flex flex-col gap-2 border-b border-line py-3 last:border-b-0">
                  {s.durations.length > 1 ? (
                    <>
                      <p className={cn("type-body text-ink", selected && "font-semibold")}>{s.name}</p>
                      <div className="flex flex-wrap gap-2" role="group" aria-label={`Dauer für ${s.name}`}>
                        {s.durations.map((d) => (
                          <Chip
                            key={d}
                            selected={selected && state.dauer === d}
                            showCheck
                            onClick={() => apply({ kategorie: category.slug, leistung: s.slug, dauer: d })}
                          >
                            {formatDuration(d)}
                          </Chip>
                        ))}
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => apply({ kategorie: category.slug, leistung: s.slug, dauer: null })}
                      className={cn("flex min-h-touch w-full items-center justify-between gap-4 text-left type-body text-ink hover:text-ink-muted", selected && "font-semibold")}
                    >
                      {s.name}
                      <span className="shrink-0 type-caption text-ink-muted num">{formatDuration(s.defaultDuration)}</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Sheet>
  );
}

function DateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, go } = useNav();
  const days = useMemo(next14, []);
  const today = days[0].key;
  const tomorrow = days[1].key;
  const [datum, setDatum] = useState<string | null>(state.datum);
  const [zeit, setZeit] = useState<string | null>(state.zeit);
  const [custom, setCustom] = useState(!!state.datum && state.datum !== today && state.datum !== tomorrow);
  const apply = () => {
    onClose();
    go({ datum, zeit });
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Wann passt es Ihnen?"
      footer={
        <Button size="l" block onClick={apply}>
          Übernehmen
        </Button>
      }
    >
      <div className="flex flex-col gap-6 [&_[role=radiogroup]]:scroll-px-(--space-gutter)" style={{ ["--space-gutter" as string]: "1.25rem" }}>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Tag">
          <Chip selected={!datum && !custom} showCheck onClick={() => { setDatum(null); setCustom(false); }}>
            So bald wie möglich
          </Chip>
          <Chip selected={datum === today && !custom} showCheck onClick={() => { setDatum(today); setCustom(false); }}>
            Heute
          </Chip>
          <Chip selected={datum === tomorrow && !custom} showCheck onClick={() => { setDatum(tomorrow); setCustom(false); }}>
            Morgen
          </Chip>
          <Chip selected={custom} showCheck onClick={() => setCustom(true)}>
            Datum wählen
          </Chip>
        </div>
        {custom ? (
          <div className="flex flex-col gap-4">
            <DateStrip days={days} selected={datum} onSelect={setDatum} label="Datum wählen" />
            <Input
              label="Anderes Datum"
              type="date"
              min={today}
              max={berlinDateKey(new Date(Date.now() + 60 * 86_400_000))}
              value={datum ?? ""}
              onChange={(e) => setDatum(e.target.value || null)}
              hint="Buchbar bis zu 60 Tage im Voraus."
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-3">
          <p className="type-overline text-ink-muted">Tageszeit</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tageszeit">
            <Chip selected={!zeit} showCheck onClick={() => setZeit(null)}>
              Ganzer Tag
            </Chip>
            {Object.keys(TIME_OF_DAY_LABEL).map((z) => (
              <Chip key={z} selected={zeit === z} showCheck onClick={() => setZeit(z)} aria-label={`${TIME_OF_DAY_LABEL[z]}, ${TIME_OF_DAY_RANGE[z]}`}>
                {TIME_OF_DAY_LABEL[z]}
                <span className={cn("font-normal", zeit === z ? "text-ink-inverse" : "text-ink-muted")}>{TIME_OF_DAY_RANGE[z].replace(" Uhr", "")}</span>
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------------- */
/* Filters: drawer on mobile (apply on submit), inline aside on desktop       */
/* ------------------------------------------------------------------------- */
type FilterValues = Pick<SearchState, "sort" | "sofort" | "bewertung" | "sprache" | "zeit">;
const LANGS = ["de", "en", "tr", "fr", "es", "it", "pl", "ru", "ar"];

function FilterFields({
  value,
  onChange,
  idPrefix,
  compact,
}: {
  value: FilterValues;
  onChange: (v: FilterValues) => void;
  idPrefix: string;
  /** desktop aside: select for sorting, chips for the time of day */
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col", compact ? "gap-6" : "gap-8")}>
      {compact ? (
        <Select id={`${idPrefix}-sort`} label="Sortieren nach" value={value.sort} onChange={(e) => onChange({ ...value, sort: e.target.value })}>
          {Object.entries(SORT_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
      ) : (
        <fieldset className="flex flex-col">
          <legend className="mb-1 type-overline text-ink-muted">Sortieren nach</legend>
          {Object.entries(SORT_LABEL).map(([k, label]) => (
            <RadioRow
              key={k}
              id={`${idPrefix}-sort-${k}`}
              name={`${idPrefix}-sort`}
              label={label}
              checked={value.sort === k}
              onChange={() => onChange({ ...value, sort: k })}
            />
          ))}
        </fieldset>
      )}
      {compact ? (
        <div className="flex flex-col gap-2">
          <p className="type-label-s text-ink" id={`${idPrefix}-zeit-label`}>
            Tageszeit
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`${idPrefix}-zeit-label`}>
            <Chip selected={!value.zeit} onClick={() => onChange({ ...value, zeit: null })}>
              Ganzer Tag
            </Chip>
            {Object.keys(TIME_OF_DAY_LABEL).map((z) => (
              <Chip key={z} selected={value.zeit === z} onClick={() => onChange({ ...value, zeit: z })} title={TIME_OF_DAY_RANGE[z]}>
                {TIME_OF_DAY_LABEL[z]}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}
      <fieldset className="flex flex-col divide-y divide-line border-y border-line">
        <legend className={cn("mb-1 type-overline text-ink-muted", compact && "sr-only")}>Filter</legend>
        <Switch
          id={`${idPrefix}-sofort`}
          label="Nur sofort bestätigt"
          description={compact ? undefined : "Ohne Wartezeit auf die Zusage der Fachkraft."}
          checked={value.sofort}
          onChange={(e) => onChange({ ...value, sofort: e.target.checked })}
        />
        <Switch
          id={`${idPrefix}-bewertung`}
          label="Bewertung ab 4,5"
          checked={value.bewertung}
          onChange={(e) => onChange({ ...value, bewertung: e.target.checked })}
        />
      </fieldset>
      <Select
        id={`${idPrefix}-sprache`}
        label="Sprache der Fachkraft"
        value={value.sprache ?? ""}
        onChange={(e) => onChange({ ...value, sprache: e.target.value || null })}
      >
        <option value="">Alle Sprachen</option>
        {LANGS.map((l) => (
          <option key={l} value={l}>
            {languageName(l)}
          </option>
        ))}
      </Select>
    </div>
  );
}

const pickFilters = (s: SearchState): FilterValues => ({ sort: s.sort, sofort: s.sofort, bewertung: s.bewertung, sprache: s.sprache, zeit: s.zeit });
const NO_FILTERS: Omit<FilterValues, "zeit"> = { sort: "empfohlen", sofort: false, bewertung: false, sprache: null };

function FilterSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, go } = useNav();
  const [value, setValue] = useState<FilterValues>(pickFilters(state));
  return (
    <Sheet
      open={open}
      onClose={onClose}
      variant="drawer"
      title="Sortieren & Filtern"
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setValue({ ...value, ...NO_FILTERS })}>
            Zurücksetzen
          </Button>
          <Button
            size="l"
            className="flex-1"
            onClick={() => {
              onClose();
              go(value);
            }}
          >
            Ergebnisse anzeigen
          </Button>
        </div>
      }
    >
      <FilterFields value={value} onChange={setValue} idPrefix="fs" />
    </Sheet>
  );
}

/** Desktop aside: filters apply immediately. */
export function InlineFilters() {
  const { state, go } = useNav();
  const count = activeFilterCount(state);
  return (
    <div className="flex flex-col gap-6">
      <FilterFields value={pickFilters(state)} onChange={(v) => go(v)} idPrefix="fi" compact />
      {count > 0 ? (
        <Button variant="secondary" onClick={() => go({ ...NO_FILTERS })} className="self-start">
          Filter zurücksetzen
        </Button>
      ) : null}
    </div>
  );
}

/** 14-day strip under the chips (only when a service is chosen). */
export function SearchDateStrip() {
  const { state, go } = useNav();
  const days = useMemo(next14, []);
  return (
    <div className="flex flex-col gap-1 [&_[role=radiogroup]]:scroll-px-(--space-gutter) lg:[&_[role=radiogroup]]:scroll-px-0">
      <DateStrip days={days} selected={state.datum} onSelect={(d) => go({ datum: d })} label="Tag wählen" />
      {state.datum ? (
        <button type="button" onClick={() => go({ datum: null })} className="inline-flex h-touch items-center self-start type-label-s text-accent underline decoration-1 underline-offset-[0.2em] hover:text-accent-hover">
          Alle Tage anzeigen
        </button>
      ) : null}
    </div>
  );
}
