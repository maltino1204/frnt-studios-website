"use client";

/*
 * BookingEntry's pickers and its waitlist form (booking-entry.tsx): Was? (categories with their photos → services),
 * Wann? (day chips, the date strip, time windows), the unserved-PLZ waitlist and the kit sheet the mobile pickers
 * open in. Their own chunk: the entry loads it in the first idle period after it mounts, or at once on intent, so
 * the photos (`next/image`, the image registry), the date strip and the forms are not in a page's first load
 * (audit-2 RT-5; the landing hero renders the entry closed).
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { DateStrip, type DateCell } from "@/components/ui/booking";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Photo } from "@/components/ui/photo";
import { SuccessCheck } from "@/components/ui/success";
import { cn } from "@/lib/cn";
import { berlinDateKey } from "@/lib/format";
import { images } from "@/lib/images";
import { joinWaitlistAction } from "@/server/actions/booking";
import { initialActionState } from "@/server/actions/types";
import { addDays, DOT, HORIZON_DAYS, WINDOWS, type When, type WhenMode } from "./booking-entry-shared";
import { durationsLabel, fromPrice, type EntryCategory, type EntryService } from "./discovery-copy";
import { keepValuesOnSubmit } from "./keep-values";

export { Sheet } from "@/components/ui/sheet";

/* ------------------------------------------------------------------------ */
/* Was? picker: categories → services                                       */
/* ------------------------------------------------------------------------ */
export function WasPicker({
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
export function WannPicker({ when, onChange }: { when: When; onChange: (w: When) => void }) {
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
export function Waitlist({ postalCode, categorySlug }: { postalCode: string; categorySlug: string | null }) {
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

