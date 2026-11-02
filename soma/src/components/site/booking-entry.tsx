"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, CircleAlert, LocateFixed, X } from "lucide-react";
import {
  useActionState,
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { DateStrip, type DateCell } from "@/components/ui/booking";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Photo } from "@/components/ui/photo";
import { Sheet } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { SuccessCheck } from "@/components/ui/success";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { berlinDateKey, formatDayShort } from "@/lib/format";
import { images } from "@/lib/images";
import { routes, type SearchParams } from "@/lib/routes";
import { joinWaitlistAction } from "@/server/actions/booking";
import { lookupPostalCodeAction, nearestPostalCodeAction } from "@/server/actions/site-ext";
import { initialActionState } from "@/server/actions/types";
import type { PostalCodeDTO } from "@/server/dto";
import { durationsLabel, fromPrice, type EntryCategory, type EntryService } from "./discovery-copy";
import { keepValuesOnSubmit } from "./keep-values";

/* ------------------------------------------------------------------------ */
/* Types & helpers                                                          */
/* ------------------------------------------------------------------------ */
export type TimeWindow = NonNullable<SearchParams["zeit"]>;
export type WhenMode = "asap" | "today" | "tomorrow" | "date";
export type When = { mode: WhenMode; date: string | null; window: TimeWindow | null };
/** What the visitor has entered so far; shared between entries on one page (landing hero ↔ booking bar/sheet). */
export type BookingDraft = { plz: string; categorySlug: string | null; serviceId: string | null; when: When };
type Loc =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok"; data: PostalCodeDTO }
  | { status: "outside"; data: PostalCodeDTO }
  | { status: "unknown" }
  | { status: "error"; message: string };

const STORAGE_KEY = "soma:last-plz";
/** The middle dot with a no-break space on both sides (brand § 4.4: Instrument Sans sets "·" tight). */
const DOT = "\u00a0·\u00a0";
const PICK_EVENT = "soma:booking-entry:set";
const HORIZON_DAYS = 60;

const WINDOWS: Array<{ value: TimeWindow; label: string; range: string }> = [
  { value: "morgens", label: "Morgens", range: "7–12" },
  { value: "mittags", label: "Nachmittags", range: "12–17" },
  { value: "abends", label: "Abends", range: "17–22" },
];

function addDays(key: string, n: number): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function whenLabel(w: When): string {
  const day =
    w.mode === "asap" ? "So bald wie möglich" : w.mode === "today" ? "Heute" : w.mode === "tomorrow" ? "Morgen" : w.date ? formatDayShort(`${w.date}T12:00:00Z`) : "Datum wählen";
  const win = w.window ? WINDOWS.find((x) => x.value === w.window)?.label : null;
  return win ? `${day}${DOT}${win}` : day;
}

function whenDate(w: When): string | undefined {
  const today = berlinDateKey();
  if (w.mode === "today") return today;
  if (w.mode === "tomorrow") return addDays(today, 1);
  if (w.mode === "date") return w.date ?? undefined;
  return undefined;
}

const TIME_WINDOWS = new Set<string>(["morgens", "mittags", "abends"]);

/** `?datum=` deep link → the Wann? mode ("Heute", "Morgen" or a date within the picker horizon); null if invalid. */
function whenFromDate(date: string | null): Pick<When, "mode" | "date"> | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const today = berlinDateKey();
  if (date < today || date > addDays(today, HORIZON_DAYS - 1)) return null;
  if (date === today) return { mode: "today", date: null };
  if (date === addDays(today, 1)) return { mode: "tomorrow", date: null };
  return { mode: "date", date };
}

function readStoredPlz(): string | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v && /^\d{5}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

function storePlz(plz: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, plz);
  } catch {
    /* private mode / blocked storage: remembering is a convenience only */
  }
}

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 64rem)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

/** Lets service lists elsewhere on the page preselect the entry ("Massage wählen"). */
export function pickInBookingEntry(detail: { categorySlug: string; serviceId?: string | null }) {
  window.dispatchEvent(new CustomEvent(PICK_EVENT, { detail }));
}

/* ------------------------------------------------------------------------ */
/* Popover (desktop pickers, anchored under their segment)                  */
/* ------------------------------------------------------------------------ */
function Popover({
  open,
  onClose,
  anchorRef,
  label,
  children,
  className,
  placement = "below",
  maxHeight,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  label: string;
  children: ReactNode;
  className?: string;
  /** "above" when the space under the anchor is too small (the landing sill sits low in the hero) */
  placement?: "below" | "above";
  /** px; caps the popover to the space available on its side */
  maxHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const inside = (t: EventTarget | null) => !!t && (ref.current?.contains(t as Node) || anchorRef.current?.contains(t as Node));
    const onDown = (e: PointerEvent) => {
      if (!inside(e.target)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        anchorRef.current?.focus();
      }
    };
    const onFocus = (e: FocusEvent) => {
      if (!inside(e.target)) onClose();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    const raf = requestAnimationFrame(() => {
      ref.current
        ?.querySelector<HTMLElement>("[aria-pressed='true'], [aria-checked='true'], button:not([disabled]), [href], input")
        ?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open, onClose, anchorRef]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      data-placement={placement}
      style={maxHeight ? { maxHeight } : undefined}
      className={cn(
        "absolute left-0 z-(--z-overlay) flex max-h-[min(34rem,70dvh)] flex-col overflow-hidden rounded-card bg-surface-raised text-ink shadow-overlay animate-dialog-in",
        placement === "above" ? "bottom-[calc(100%+0.75rem)] origin-bottom-left" : "top-[calc(100%+0.75rem)] origin-top-left",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Was? picker: categories → services                                       */
/* ------------------------------------------------------------------------ */
function WasPicker({
  catalog,
  categorySlug,
  serviceId,
  onPick,
}: {
  catalog: EntryCategory[];
  categorySlug: string | null;
  serviceId: string | null;
  onPick: (categorySlug: string | null, serviceId: string | null) => void;
}) {
  const [view, setView] = useState<string | null>(categorySlug);
  const current = catalog.find((c) => c.slug === view) ?? null;
  const rootRef = useRef<HTMLDivElement>(null);
  const prevView = useRef(view);

  // Drilling in or out unmounts the focused button: keep keyboard focus inside the picker (the selected or first
  // option inside a category, the category you came from on the way back), or the popover would close on next Tab.
  useEffect(() => {
    const prev = prevView.current;
    prevView.current = view;
    if (prev === view) return;
    const root = rootRef.current;
    if (!root) return;
    const target = view
      ? (root.querySelector<HTMLElement>("li [aria-pressed='true']") ?? root.querySelector<HTMLElement>("li button"))
      : root.querySelector<HTMLElement>(`[data-cat="${prev}"]`);
    target?.focus({ preventScroll: true });
  }, [view]);

  if (current) {
    return (
      <div ref={rootRef} className="flex flex-col">
        <button
          type="button"
          onClick={() => setView(null)}
          className="-mx-2 mb-2 inline-flex min-h-touch items-center gap-1.5 self-start rounded-full px-3 type-label-s text-ink-muted pressable focus-ring hover:bg-surface-sunken hover:text-ink"
        >
          <Icon icon={ChevronLeft} size={16} />
          Alle Behandlungen
        </button>
        <ul className="flex flex-col">
          <li>
            <PickRow
              selected={categorySlug === current.slug && !serviceId}
              onClick={() => onPick(current.slug, null)}
              title={`${current.name}: alle Leistungen`}
              meta={current.tagline ?? undefined}
            />
          </li>
          {current.services.map((s) => (
            <li key={s.id}>
              <PickRow selected={serviceId === s.id} onClick={() => onPick(current.slug, s.id)} title={s.name} meta={serviceMeta(s)} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div ref={rootRef}>
    <ul className="flex flex-col">
      <li>
        <PickRow selected={!categorySlug} onClick={() => onPick(null, null)} title="Alle Behandlungen" meta="Alle verfügbaren Profis in deiner Nähe" />
      </li>
      {catalog.map((c) => (
        <li key={c.slug}>
          <button
            type="button"
            data-cat={c.slug}
            onClick={() => setView(c.slug)}
            aria-pressed={categorySlug === c.slug}
            className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-4 rounded-control px-2 py-2.5 text-left pressable focus-ring hover:bg-surface-sunken/70"
          >
            <Photo
              src={c.imagePath ?? images.category(c.slug)}
              alt=""
              tone={c.slug}
              sizes="40px"
              className="aspect-square w-11 shrink-0 rounded-[10px] shadow-raised"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={cn("type-heading-s", categorySlug === c.slug && "underline decoration-1 underline-offset-4")}>{c.name}</span>
              {c.tagline ? <span className="type-caption text-ink-muted">{c.tagline}</span> : null}
            </span>
            <Icon icon={ChevronRight} className="shrink-0 text-ink-muted transition-transform duration-fast group-hover:translate-x-0.5" />
          </button>
        </li>
      ))}
    </ul>
    </div>
  );
}

function serviceMeta(s: EntryService): string {
  const p = fromPrice(s.fromCents);
  return [durationsLabel(s.durations), p].filter(Boolean).join(DOT);
}

function PickRow({ selected, onClick, title, meta }: { selected: boolean; onClick: () => void; title: string; meta?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="-mx-2 flex min-h-14 w-[calc(100%+1rem)] items-center justify-between gap-4 rounded-control px-2 py-3 text-left pressable focus-ring hover:bg-surface-sunken/70"
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={cn("type-body text-ink", selected && "font-semibold")}>{title}</span>
        {meta ? <span className="type-caption text-ink-muted num">{meta}</span> : null}
      </span>
      <span
        aria-hidden
        className={cn(
          "size-5 shrink-0 rounded-full border bg-surface-raised transition-[border-width,border-color] duration-spring ease-spring",
          selected ? "border-[6px] border-ink" : "border-line-strong",
        )}
      />
    </button>
  );
}

/* ------------------------------------------------------------------------ */
/* Wann? picker: day chips, optional date strip, optional time window       */
/* ------------------------------------------------------------------------ */
function WannPicker({ when, onChange }: { when: When; onChange: (w: When) => void }) {
  const today = berlinDateKey();
  const days: DateCell[] = Array.from({ length: HORIZON_DAYS }, (_, i) => {
    const key = addDays(today, i);
    return { key, date: `${key}T12:00:00Z`, available: true };
  });
  const modes: Array<{ value: WhenMode; label: string }> = [
    { value: "asap", label: "So bald wie möglich" },
    { value: "today", label: "Heute" },
    { value: "tomorrow", label: "Morgen" },
    { value: "date", label: "Datum wählen" },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="type-label-s text-ink-muted" id="wann-tag">
          Tag
        </p>
        <div role="group" aria-labelledby="wann-tag" className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <Chip
              key={m.value}
              selected={when.mode === m.value}
              showCheck
              onClick={() => onChange({ ...when, mode: m.value, date: m.value === "date" ? (when.date ?? addDays(today, 2)) : null })}
            >
              {m.label}
            </Chip>
          ))}
        </div>
        {when.mode === "date" ? (
          // The strip bleeds by --space-gutter; pin it to the sheet/popover padding (20px).
          <div className="[--space-gutter:1.25rem]">
            <DateStrip
              className="mt-1"
              days={days}
              selected={when.date}
              onSelect={(key) => onChange({ ...when, mode: "date", date: key })}
              label="Datum wählen"
            />
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-3">
        <p className="type-label-s text-ink-muted" id="wann-zeit">
          Tageszeit <span className="font-normal">(optional)</span>
        </p>
        <div role="group" aria-labelledby="wann-zeit" className="flex flex-wrap gap-2">
          {WINDOWS.map((w) => (
            <Chip
              key={w.value}
              selected={when.window === w.value}
              showCheck
              onClick={() => onChange({ ...when, window: when.window === w.value ? null : w.value })}
            >
              {w.label}
              <span className={cn("num", when.window === w.value ? "text-ink-inverse/70" : "text-ink-muted")}>{w.range}</span>
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Waitlist (unserved PLZ)                                                  */
/* ------------------------------------------------------------------------ */
function Waitlist({ postalCode, categorySlug }: { postalCode: string; categorySlug: string | null }) {
  const [state, action, pending] = useActionState(joinWaitlistAction, initialActionState);
  if (state?.ok) {
    return (
      <p className="flex items-center gap-3 type-body-s text-ink">
        <SuccessCheck size={32} glow={false} />
        <span>Eingetragen. Wir melden uns, sobald Profis in {postalCode} buchbar sind.</span>
      </p>
    );
  }
  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="postalCode" value={postalCode} />
      {categorySlug ? <input type="hidden" name="categorySlug" value={categorySlug} /> : null}
      <Input
        label="E-Mail für die Benachrichtigung"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="name@beispiel.de"
        required
        className="flex-1"
        error={state && !state.ok ? (state.fieldErrors?.email ?? state.error) : null}
      />
      <SubmitButton variant="secondary" className="h-12 sm:shrink-0" loading={pending}>
        Benachrichtigen
      </SubmitButton>
    </form>
  );
}

/* ------------------------------------------------------------------------ */
/* Booking entry                                                            */
/* ------------------------------------------------------------------------ */
export type BookingEntryProps = {
  catalog: EntryCategory[];
  defaultCategory?: string | null;
  defaultService?: string | null;
  /** example PLZ for the placeholder, e.g. the city's first PLZ on SEO pages */
  postalExample?: string;
  /**
   * "hero": single 72px bar from lg; "compact": stacked rows at every width (side columns, booking sheet);
   * "sill": the landing hero bar (docs/landing/LANDING_DESIGN_SPEC.md § 4.1.6): width from `--lp-sill-w`, tighter
   * segments at 1024–1279, popovers flip upward, anchored status panel.
   */
  variant?: "hero" | "compact" | "sill";
  id?: string;
  className?: string;
  /**
   * Hero place switch (landing § 4.1.5): placeholder, screen-reader suffix and a visible caption context of Wo?
   * („Wo? · Im Hotel“; aria-hidden, the sr suffix carries it). Applied only while the field is empty.
   */
  placeHint?: { placeholder?: string; srLabel?: string; context?: string | null } | null;
  /** "auto" opens a desktop popover upward when the space below it is too small. Default: "auto" for sill, else "below". */
  popoverPlacement?: "below" | "auto";
  /** "anchored": the unserved-PLZ panel overlays the page from lg instead of pushing it down. Default: "anchored" for sill. */
  statusLayout?: "flow" | "anchored";
  /** "inline": Was?/Wann? expand inside the form (disclosure) instead of a popover or a second sheet (landing booking sheet). */
  pickerLayout?: "auto" | "inline";
  /** Seed values (another entry's draft). When given, it replaces the ?plz=/?leistung=… deep links of the URL. */
  initialDraft?: Partial<BookingDraft> | null;
  /** Called with every change of PLZ, service or time. */
  onDraftChange?: (draft: BookingDraft) => void;
  /** Values written by another entry; applied whenever `version` changes, unless focus is inside this entry. */
  syncDraft?: { draft: Partial<BookingDraft>; version: number } | null;
  /** `data-cta` on the submit button (analytics hook, docs/landing/INTEGRATION.md § 7) */
  ctaId?: string;
};

const POPOVER_MAX_PX = 544; // 34rem, the popovers' max-height

/**
 * Hero booking entry (product-spec J1 Screen 1, design-guideline §8 "Search bar").
 * Wo? (PLZ) · Was? (category → service) · Wann? (day + window) → /suche.
 * Without JavaScript the form is a plain GET to /suche (docs/landing/INTEGRATION.md C1).
 */
export function BookingEntry({
  catalog,
  defaultCategory = null,
  defaultService = null,
  postalExample = "10115",
  variant = "hero",
  id = "termin",
  className,
  placeHint = null,
  popoverPlacement,
  statusLayout,
  pickerLayout = "auto",
  initialDraft = null,
  onDraftChange,
  syncDraft = null,
  ctaId,
}: BookingEntryProps) {
  const router = useRouter();
  const uid = useId();
  const desktop = useIsDesktop();
  const sill = variant === "sill";
  const bar = variant === "hero" || sill;
  const inline = pickerLayout === "inline";
  const flip = (popoverPlacement ?? (sill ? "auto" : "below")) === "auto";
  const anchored = (statusLayout ?? (sill ? "anchored" : "flow")) === "anchored";

  // A seeded PLZ is state from the first render, so the first draft report never says "no PLZ".
  const [plz, setPlz] = useState(() => (initialDraft?.plz && /^\d{5}$/.test(initialDraft.plz) ? initialDraft.plz : ""));
  const [loc, setLoc] = useState<Loc>({ status: "idle" });
  const [plzError, setPlzError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [categorySlug, setCategorySlug] = useState<string | null>(initialDraft?.categorySlug ?? defaultCategory);
  const [serviceId, setServiceId] = useState<string | null>(initialDraft?.serviceId ?? defaultService);
  const [when, setWhen] = useState<When>(initialDraft?.when ?? { mode: "asap", date: null, window: null });
  const [open, setOpen] = useState<null | "was" | "wann">(null);
  const [popPlace, setPopPlace] = useState<{ placement: "below" | "above"; maxHeight?: number }>({ placement: "below" });
  const [hint, setHint] = useState(placeHint);
  const [dismissedPanel, setDismissedPanel] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Inline pickers (the landing's booking sheet): the panel and aria-expanded follow the tap at once, the list (with its
  // photos) renders right after as a deferred render, so the tap paints its frame first (audit-2 N-12 / RT-7).
  const listOpen = useDeferredValue(open);

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasRef = useRef<HTMLButtonElement>(null);
  const wannRef = useRef<HTMLButtonElement>(null);
  const reqRef = useRef(0);
  const draftCb = useRef(onDraftChange);
  draftCb.current = onDraftChange;

  const category = catalog.find((c) => c.slug === categorySlug) ?? null;
  const service = category?.services.find((s) => s.id === serviceId) ?? null;

  const resolve = useCallback(async (value: string) => {
    const req = ++reqRef.current;
    setLoc({ status: "checking" });
    const res = await lookupPostalCodeAction(value);
    if (req !== reqRef.current) return;
    if (!res.ok) return setLoc({ status: "error", message: res.error });
    if (!res.data) return setLoc({ status: "unknown" });
    // A known PLZ is "the last PLZ used" (privacy policy § Cookies und Speicher): remember it for the next entry.
    storePlz(value);
    setLoc(res.data.isLaunchCity ? { status: "ok", data: res.data } : { status: "outside", data: res.data });
  }, []);

  // A PLZ typed (or restored by the browser) before this entry hydrated: React keeps the field's DOM value during
  // hydration but would reset it to the state ("") on the next render (the landing hydrates its hero entry after the
  // shell; audit 2, N-3). Adopt it with the same lookup as typing; it wins over the seed below. The caret stays put.
  const typedEarly = useRef(false);
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const raw = el.value;
    const v = raw.replace(/\D/g, "").slice(0, 5);
    if (!v || v === plz) return;
    typedEarly.current = true;
    setPlz(v);
    setPlzError(null);
    if (v.length === 5) void resolve(v);
    if (document.activeElement === el && raw !== v) {
      const at = Math.min(el.selectionStart ?? v.length, v.length);
      // after React has written the cleaned value (the update from this layout effect commits synchronously)
      queueMicrotask(() => {
        if (document.activeElement === el) el.setSelectionRange(at, at);
      });
    }
    // Mount only: the DOM value before the first commit is what counts.
  }, []);

  // Seed: another entry's draft, else the deep links (?plz= ?kategorie= ?leistung= ?datum= ?zeit=) on static pages, else
  // the remembered PLZ (convenience only). A PLZ the visitor typed before hydration is kept.
  useEffect(() => {
    const valid = (v: string | null | undefined): v is string => !!v && /^\d{5}$/.test(v);
    if (initialDraft) {
      if (typedEarly.current) return;
      if (valid(initialDraft.plz)) void resolve(initialDraft.plz);
      else {
        const stored = readStoredPlz();
        if (stored) {
          setPlz(stored);
          void resolve(stored);
        }
      }
      return;
    }
    const q = new URLSearchParams(window.location.search);
    const fromUrl = q.get("plz");
    const initial = typedEarly.current ? null : valid(fromUrl) ? fromUrl : readStoredPlz();
    if (initial) {
      setPlz(initial);
      void resolve(initial);
    }
    const svc = q.get("leistung");
    // `leistung` may be a service slug (shareable URLs), an id, or a category slug ("all services", as on /suche).
    const match = svc ? catalog.flatMap((c) => c.services.map((x) => ({ c, x }))).find(({ x }) => x.slug === svc || x.id === svc) : null;
    const cat = catalog.find((c) => c.slug === (match ? null : svc)) ?? catalog.find((c) => c.slug === q.get("kategorie"));
    if (match) {
      setCategorySlug(match.c.slug);
      setServiceId(match.x.id);
    } else if (cat) {
      setCategorySlug(cat.slug);
      setServiceId(null);
    }
    const day = whenFromDate(q.get("datum"));
    const zeit = q.get("zeit");
    const windowParam = zeit && TIME_WINDOWS.has(zeit) ? (zeit as TimeWindow) : null;
    if (day || windowParam) setWhen({ mode: day?.mode ?? "asap", date: day?.date ?? null, window: windowParam });
    // Mount only: later prop changes must not overwrite the visitor's choices.
  }, []);

  // Report every change (the landing shares one draft between the hero entry and the booking bar/sheet).
  useEffect(() => {
    draftCb.current?.({ plz, categorySlug, serviceId, when });
  }, [plz, categorySlug, serviceId, when]);

  // Values from another entry on the page (never while the visitor is typing in this one).
  useEffect(() => {
    if (!syncDraft) return;
    if (formRef.current?.contains(document.activeElement)) return;
    const d = syncDraft.draft;
    if (d.plz !== undefined && d.plz !== plz) {
      reqRef.current++;
      setPlz(d.plz);
      setPlzError(null);
      if (/^\d{5}$/.test(d.plz)) void resolve(d.plz);
      else setLoc({ status: "idle" });
    }
    if (d.categorySlug !== undefined) setCategorySlug(d.categorySlug);
    if (d.serviceId !== undefined) setServiceId(d.serviceId);
    if (d.when !== undefined) setWhen(d.when);
    // Only a new version counts; the current values are read, not watched.
  }, [syncDraft?.version]);

  // The place hint changes the placeholder and the label only while the field is empty (landing § 4.1.5).
  const empty = plz === "";
  useEffect(() => {
    if (empty) setHint(placeHint);
  }, [placeHint?.placeholder, placeHint?.srLabel, placeHint?.context, empty]);

  // Preselection from service lists on the same page.
  useEffect(() => {
    const onPick = (e: Event) => {
      const d = (e as CustomEvent<{ categorySlug: string; serviceId?: string | null }>).detail;
      if (!d) return;
      setCategorySlug(d.categorySlug);
      setServiceId(d.serviceId ?? null);
      const el = document.getElementById(id);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      if (!/^\d{5}$/.test(inputRef.current?.value ?? "")) inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener(PICK_EVENT, onPick);
    return () => window.removeEventListener(PICK_EVENT, onPick);
  }, [id]);

  const onPlzChange = (raw: string) => {
    const v = raw.replace(/\D/g, "").slice(0, 5);
    setPlz(v);
    setPlzError(null);
    if (v.length === 5) void resolve(v);
    else {
      reqRef.current++;
      setLoc({ status: "idle" });
    }
  };

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setLoc({ status: "error", message: "Dein Gerät gibt keinen Standort frei. Bitte gib deine Postleitzahl ein." });
      return;
    }
    setLocating(true);
    setPlzError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await nearestPostalCodeAction({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        if (!res.ok) return setLoc({ status: "error", message: res.error });
        if (!res.data) return setLoc({ status: "error", message: "Zu deinem Standort kennen wir keine Postleitzahl. Bitte gib sie ein." });
        reqRef.current++;
        storePlz(res.data.postalCode);
        setPlz(res.data.postalCode);
        setLoc(res.data.isLaunchCity ? { status: "ok", data: res.data } : { status: "outside", data: res.data });
      },
      (err) => {
        setLocating(false);
        // Copy deck § 01: a refusal is named as such; timeouts and missing fixes get the neutral line.
        setLoc({
          status: "error",
          message:
            err?.code === 1
              ? "Dein Gerät gibt keinen Standort frei. Bitte gib deine Postleitzahl ein."
              : "Dein Standort ist gerade nicht verfügbar. Bitte gib deine Postleitzahl ein.",
        });
      },
      { timeout: 10_000, maximumAge: 600_000 },
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(plz)) {
      setPlzError(plz ? "Bitte gib eine fünfstellige Postleitzahl ein." : "Bitte gib deine Postleitzahl ein.");
      inputRef.current?.focus();
      return;
    }
    if (loc.status === "unknown") {
      setPlzError("Diese Postleitzahl kennen wir nicht. Bitte prüf die Eingabe.");
      inputRef.current?.focus();
      return;
    }
    storePlz(plz);
    const href = routes.search({
      plz,
      kategorie: categorySlug ?? undefined,
      leistung: service?.slug ?? undefined,
      datum: whenDate(when),
      zeit: when.window ?? undefined,
    });
    startTransition(() => router.push(href));
  };

  const closePicker = useCallback(() => setOpen(null), []);
  const pick = (cat: string | null, svc: string | null) => {
    setCategorySlug(cat);
    setServiceId(svc);
    setOpen(null);
  };

  /** Desktop popovers: open upward when the space below the anchor is smaller than the popover (+ 24 px). */
  const placePopover = (anchor: HTMLElement | null) => {
    if (!flip || !anchor) return setPopPlace({ placement: "below" });
    const r = anchor.getBoundingClientRect();
    const headerBottom = Math.max(0, document.querySelector("header")?.getBoundingClientRect().bottom ?? 0);
    const need = Math.min(POPOVER_MAX_PX, window.innerHeight * 0.7);
    const below = window.innerHeight - r.bottom - 36;
    const above = r.top - headerBottom - 36;
    if (below >= need || below >= above) setPopPlace({ placement: "below", maxHeight: below < need ? Math.max(240, below) : undefined });
    else setPopPlace({ placement: "above", maxHeight: above < need ? Math.max(240, above) : undefined });
  };
  const toggle = (which: "was" | "wann") => {
    if (open === which) return setOpen(null);
    if (desktop && !inline) placePopover((which === "was" ? wasRef : wannRef).current);
    setOpen(which);
  };

  // Return focus to the trigger when a picker closes.
  const lastOpen = useRef<typeof open>(null);
  useEffect(() => {
    const prev = lastOpen.current;
    lastOpen.current = open;
    if (prev && !open) (prev === "was" ? wasRef : wannRef).current?.focus({ preventScroll: true });
  }, [open]);

  const wasValue = service ? service.name : category ? category.name : null;
  const errorId = `${uid}-plz-error`;
  const statusId = `${uid}-status`;
  const hintId = `${uid}-plz-hint`;
  const wasPanelId = `${uid}-was`;
  const wannPanelId = `${uid}-wann`;
  const invalid = Boolean(plzError) || loc.status === "unknown";
  // Reference the one message node that applies (the live region around it is not referenced, so it is read once).
  const describedBy = invalid ? errorId : loc.status === "error" ? hintId : undefined;
  const datum = whenDate(when);
  const showPanel = loc.status === "outside" && dismissedPanel !== loc.data.postalCode;

  // The anchored waitlist panel overlays the page under the sill; when the visitor's own input brings it up and it
  // runs past the viewport, bring it into view (never on load, so a remembered PLZ never scrolls the page).
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = panelRef.current;
    if (!showPanel || !anchored || !el || !formRef.current?.contains(document.activeElement)) return;
    if (el.getBoundingClientRect().bottom <= window.innerHeight) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [showPanel, anchored]);

  /* Segment chrome: stacked 64px rows on mobile (and compact), one 72px bar from lg (hero, sill). */
  const segment = cn(
    "relative flex min-w-0 flex-col justify-center px-5 after:absolute after:inset-x-5 after:bottom-0 after:h-px after:bg-line after:content-['']",
    bar ? "h-16 lg:h-full lg:px-6 lg:after:hidden" : "h-16",
    sill && "lg:px-4 xl:px-6",
  );
  const divider = bar ? "lg:before:absolute lg:before:inset-y-5 lg:before:left-0 lg:before:w-px lg:before:bg-line lg:before:content-['']" : "";
  const caption = "type-caption text-ink-muted";
  const cityHint = "-ml-[calc(0.6ch+0.25rem)] min-w-0 flex-1 truncate text-body text-ink-muted";
  const value = cn("block truncate text-body leading-snug text-ink", sill && "lg:condensed xl:[font-stretch:100%]");
  const trigger = (which: "was" | "wann") =>
    cn(
      "-mx-5 flex h-full items-center justify-between gap-3 px-5 text-left transition-colors duration-fast focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
      bar && "lg:-mx-6 lg:rounded-full lg:px-6 lg:hover:bg-surface-sunken/70",
      sill && "lg:-mx-4 lg:px-4 xl:-mx-6 xl:px-6",
      bar && open === which && "lg:bg-surface-sunken/70",
    );
  const triggerA11y = (which: "was" | "wann") =>
    inline
      ? { "aria-expanded": open === which, "aria-controls": which === "was" ? wasPanelId : wannPanelId }
      : { "aria-haspopup": "dialog" as const, "aria-expanded": open === which };

  const wasPicker = <WasPicker catalog={catalog} categorySlug={categorySlug} serviceId={serviceId} onPick={pick} />;
  const wannPicker = <WannPicker when={when} onChange={setWhen} />;
  const placeholder = hint?.placeholder ?? `PLZ, z. B. ${postalExample}`;
  const srLabel = hint?.srLabel ?? "Postleitzahl";

  return (
    <div
      id={id}
      data-booking-entry={variant}
      className={cn(
        "relative w-full scroll-mt-28",
        variant === "hero" && "lg:w-[min(55rem,calc(100vw-2*var(--space-gutter)))]",
        sill && "lg:w-[var(--lp-sill-w,min(55rem,100%))]",
        className,
      )}
    >
      <form
        ref={formRef}
        role="search"
        aria-label="Termin finden"
        action="/suche"
        method="get"
        noValidate
        onSubmit={submit}
        className={cn(
          "flex flex-col rounded-card bg-surface-raised text-ink shadow-float ring-inset transition-shadow duration-base",
          invalid ? "ring-2 ring-danger" : "ring-1 ring-line-mid",
          bar && "lg:grid lg:h-[4.5rem] lg:grid-cols-[1.2fr_1.1fr_1.25fr_auto] lg:items-center lg:rounded-full",
        )}
      >
        {/* Wo? */}
        <div className={cn(segment, "rounded-t-card pr-1 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-focus", bar && "lg:rounded-full lg:pr-2")}>
          <label htmlFor={`${uid}-plz`} className={caption}>
            Wo?
            {hint?.context ? <span aria-hidden data-place-context="">{`${DOT}${hint.context}`}</span> : null}
            <span className="sr-only"> {srLabel}</span>
          </label>
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              id={`${uid}-plz`}
              name="plz"
              value={plz}
              onChange={(e) => onPlzChange(e.target.value)}
              inputMode="numeric"
              autoComplete="postal-code"
              enterKeyHint="search"
              maxLength={5}
              placeholder={placeholder}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              className={cn(
                "h-7 min-w-0 bg-transparent p-0 type-body num text-ink placeholder:text-ink-muted focus:outline-none",
                loc.status === "ok" || loc.status === "outside" ? "w-[5.6ch] shrink-0" : "flex-1",
                // Sill at 1024–1279 (spec § 4.1.1 "condensed values"): the placeholder „PLZ, z. B. 60306“ needs 115.5 px of 115.
                sill && "lg:condensed xl:[font-stretch:100%]",
              )}
            />
            {loc.status === "ok" ? (
              // text-body, not type-body: its `text-wrap: pretty` would cancel truncate's nowrap. The negative margin takes
              // back the field's spare 0.6ch and the 4 px gap, so the dot has one no-break space on each side.
              <span className={cityHint}>{`${DOT}${loc.data.cityName}`}</span>
            ) : loc.status === "outside" ? (
              <span className={cityHint}>{`${DOT}noch nicht verfügbar`}</span>
            ) : loc.status === "checking" ? (
              <span className="flex flex-1 items-center text-ink-muted">
                <Spinner size={16} />
                <span className="sr-only">Postleitzahl wird geprüft</span>
              </span>
            ) : null}
            <button
              type="button"
              onClick={locate}
              aria-label="Standort verwenden"
              title="Standort verwenden"
              data-cta={ctaId ? `${ctaId}-locate` : undefined}
              className="-my-2 inline-flex size-touch shrink-0 items-center justify-center rounded-full text-ink-muted pressable focus-ring hover:bg-surface-sunken hover:text-ink"
            >
              {locating ? <Spinner size={20} /> : <Icon icon={LocateFixed} />}
            </button>
          </div>
        </div>

        {/* Was? */}
        <div className={cn(segment, divider)}>
          <button ref={wasRef} type="button" onClick={() => toggle("was")} {...triggerA11y("was")} className={trigger("was")}>
            <span className="flex min-w-0 flex-col">
              <span className={caption}>Was?</span>
              <span className={cn(value, !wasValue && "text-ink-muted")}>{wasValue ?? "Alle Behandlungen"}</span>
            </span>
            <Icon icon={ChevronDown} className={cn("shrink-0 text-ink-muted transition-transform duration-base", open === "was" && "rotate-180", bar && "lg:hidden")} />
          </button>
          {desktop && !inline ? (
            <Popover
              open={open === "was"}
              onClose={closePicker}
              anchorRef={wasRef}
              label="Behandlung wählen"
              className="w-[25rem]"
              placement={popPlace.placement}
              maxHeight={popPlace.maxHeight}
            >
              <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-3">{wasPicker}</div>
            </Popover>
          ) : null}
        </div>
        {inline && open === "was" ? (
          <div id={wasPanelId} role="group" aria-label="Behandlung wählen" aria-busy={listOpen !== "was" || undefined} className="border-b border-line px-5 py-3">
            {listOpen === "was" ? wasPicker : <div aria-hidden style={{ height: 56 + catalog.length * 64 }} />}
          </div>
        ) : null}

        {/* Wann? */}
        <div className={cn(segment, divider, "after:hidden", inline && open === "wann" && "after:block")}>
          <button ref={wannRef} type="button" onClick={() => toggle("wann")} {...triggerA11y("wann")} className={trigger("wann")}>
            <span className="flex min-w-0 flex-col">
              <span className={caption}>Wann?</span>
              <span className={value}>{whenLabel(when)}</span>
            </span>
            <Icon icon={ChevronDown} className={cn("shrink-0 text-ink-muted transition-transform duration-base", open === "wann" && "rotate-180", bar && "lg:hidden")} />
          </button>
          {desktop && !inline ? (
            <Popover
              open={open === "wann"}
              onClose={closePicker}
              anchorRef={wannRef}
              label="Zeitpunkt wählen"
              className="w-[29rem]"
              placement={popPlace.placement}
              maxHeight={popPlace.maxHeight}
            >
              <div className="min-h-0 overflow-y-auto overscroll-contain p-5">{wannPicker}</div>
              <div className="flex justify-end border-t border-line px-5 py-3">
                <Button
                  size="s"
                  onClick={() => {
                    setOpen(null);
                    wannRef.current?.focus();
                  }}
                >
                  Fertig
                </Button>
              </div>
            </Popover>
          ) : null}
        </div>
        {inline && open === "wann" ? (
          <div id={wannPanelId} role="group" aria-label="Zeitpunkt wählen" aria-busy={listOpen !== "wann" || undefined} className="flex flex-col gap-4 px-5 py-4">
            {listOpen === "wann" ? wannPicker : <div aria-hidden className="h-[13.5rem]" />}
            <Button size="m" variant="secondary" className="self-start" onClick={closePicker}>
              Fertig
            </Button>
          </div>
        ) : null}

        <div className={cn("p-2 pt-1", bar && "lg:p-0 lg:pr-2.5")}>
          <Button type="submit" variant="accent" size="l" block loading={pending} data-cta={ctaId}>
            Freie Termine finden
          </Button>
        </div>

        {/* No-JS fallback (C1): the picker choices travel as plain GET fields; with JS, `submit` pushes the same URL. */}
        {categorySlug ? <input type="hidden" name="kategorie" value={categorySlug} /> : null}
        {service ? <input type="hidden" name="leistung" value={service.slug} /> : null}
        {datum ? <input type="hidden" name="datum" value={datum} /> : null}
        {when.window ? <input type="hidden" name="zeit" value={when.window} /> : null}
      </form>

      {/* Loading, for screen readers (the button shows a spinner and aria-busy). */}
      <span role="status" className="sr-only">
        {pending ? "Termine werden gesucht …" : ""}
      </span>

      {/* Status & messages */}
      <div id={statusId} aria-live="polite" className="empty:hidden">
        {plzError ? (
          <p id={errorId} className="mt-3 flex items-start gap-1.5 type-caption text-danger">
            <Icon icon={CircleAlert} size={16} className="mt-px shrink-0" />
            {plzError}
          </p>
        ) : loc.status === "unknown" ? (
          <p id={errorId} className="mt-3 flex items-start gap-1.5 type-caption text-danger">
            <Icon icon={CircleAlert} size={16} className="mt-px shrink-0" />
            Diese Postleitzahl kennen wir nicht. Bitte prüf die Eingabe.
          </p>
        ) : loc.status === "error" ? (
          <p id={hintId} className="mt-3 type-caption text-ink-muted">{loc.message}</p>
        ) : loc.status === "outside" && showPanel ? (
          <div
            ref={panelRef}
            data-booking-panel="waitlist"
            className={cn(
              "relative mt-4 flex flex-col gap-3 rounded-card bg-surface-raised p-4 shadow-raised animate-rise sm:p-5",
              anchored && "lg:absolute lg:top-[calc(100%+0.75rem)] lg:left-0 lg:z-(--z-overlay) lg:mt-0 lg:w-[26.25rem] lg:pr-12 lg:shadow-overlay",
            )}
          >
            <p className="type-body-s text-ink">
              In {loc.data.postalCode} gibt es noch keine Profis auf {BRAND_NAME}. Sollen wir dir Bescheid geben, sobald es losgeht?
            </p>
            <Waitlist postalCode={loc.data.postalCode} categorySlug={categorySlug} />
            {anchored ? (
              <button
                type="button"
                onClick={() => {
                  setDismissedPanel(loc.data.postalCode);
                  inputRef.current?.focus({ preventScroll: true });
                }}
                aria-label="Schließen"
                title="Schließen"
                className="absolute top-2 right-2 hidden size-touch items-center justify-center rounded-full text-ink-muted pressable focus-ring hover:bg-surface-sunken hover:text-ink lg:inline-flex"
              >
                <Icon icon={X} size={18} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Mobile & tablet pickers: mounted only while open (the kit sheet uses a fixed title id). */}
      {!desktop && !inline && open === "was" ? (
        <Sheet open onClose={closePicker} title="Behandlung wählen">
          {wasPicker}
        </Sheet>
      ) : null}
      {!desktop && !inline && open === "wann" ? (
        <Sheet
          open
          onClose={closePicker}
          title="Zeitpunkt wählen"
          footer={
            <Button size="l" block onClick={closePicker}>
              Fertig
            </Button>
          }
        >
          {wannPicker}
        </Sheet>
      ) : null}
    </div>
  );
}
