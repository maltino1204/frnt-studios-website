"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { dateParts, formatTime, berlinDateKey } from "@/lib/format";
import { Icon } from "./icon";

export type DateCell = { key: string; date: string | Date; available: boolean };

/**
 * Date strip (brand § 9.3): horizontal snap scroll of day tiles (56×72, radius 12), radiogroup semantics with
 * arrow keys. Today reads "Heute" and carries a small arch mark under the number; the selected day is an Espresso
 * fill; booked-out days are struck through and disabled ("ausgebucht").
 */
export function DateStrip({
  days,
  selected,
  onSelect,
  label = "Datum wählen",
  className,
}: {
  days: DateCell[];
  selected: string | null;
  onSelect: (key: string) => void;
  label?: string;
  className?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const today = berlinDateKey();
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    const enabled = days.filter((d) => d.available);
    const idx = enabled.findIndex((d) => d.key === selected);
    const next = enabled[Math.min(Math.max(idx + (e.key === "ArrowRight" ? 1 : -1), 0), enabled.length - 1)];
    if (next) {
      onSelect(next.key);
      scroller.current?.querySelector<HTMLButtonElement>(`[data-key="${next.key}"]`)?.focus();
    }
  };
  const scrollBy = (dir: number) => scroller.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  let lastMonth = "";
  return (
    <div className={cn("relative flex items-center gap-1", className)}>
      <button type="button" onClick={() => scrollBy(-1)} aria-label="Frühere Tage" className="hidden size-touch shrink-0 items-center justify-center rounded-full pressable focus-ring hover:bg-surface-sunken lg:inline-flex">
        <Icon icon={ChevronLeft} />
      </button>
      <div
        ref={scroller}
        role="radiogroup"
        aria-label={label}
        onKeyDown={onKey}
        className="-mx-(--space-gutter) flex snap-x scroll-px-(--space-gutter) gap-1.5 overflow-x-auto px-(--space-gutter) pt-5 pb-2 scrollbar-none lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {days.map((d) => {
          const p = dateParts(d.date);
          const isToday = d.key === today;
          const isSel = d.key === selected;
          const showMonth = p.month !== lastMonth;
          lastMonth = p.month;
          return (
            <button
              key={d.key}
              type="button"
              role="radio"
              data-key={d.key}
              aria-checked={isSel}
              tabIndex={isSel || (!selected && d.available) ? 0 : -1}
              disabled={!d.available}
              aria-label={`${isToday ? "Heute, " : ""}${p.weekday} ${p.day}. ${p.month}${d.available ? "" : " – ausgebucht"}`}
              onClick={() => onSelect(d.key)}
              className={cn(
                "relative flex h-[72px] w-14 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-tile pressable focus-ring",
                isSel
                  ? "bg-selected text-ink-inverse"
                  : d.available
                    ? "bg-surface-raised text-ink shadow-[0_0_0_1px_var(--color-line-mid)] hover:shadow-[0_0_0_1px_var(--color-line-strong)]"
                    : "bg-surface-sunken text-ink-disabled",
              )}
            >
              {showMonth ? (
                <span aria-hidden className="absolute -top-5 left-1 type-caption text-ink-muted">
                  {p.month}
                </span>
              ) : null}
              {isToday ? (
                <span
                  aria-hidden
                  className={cn("absolute bottom-2 h-[7px] w-3.5 border-[1.5px] border-b-0 border-current [border-radius:50%_50%_0_0/100%_100%_0_0]", isSel ? "text-ink-inverse" : "text-ink")}
                />
              ) : null}
              <span className={cn("type-caption", isSel ? "text-ink-inverse" : d.available ? "text-ink-muted" : "")}>
                {isToday ? "Heute" : p.weekday}
              </span>
              <span className={cn("type-heading-m num", !d.available && "line-through decoration-1")}>{p.day}</span>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={() => scrollBy(1)} aria-label="Spätere Tage" className="hidden size-touch shrink-0 items-center justify-center rounded-full pressable focus-ring hover:bg-surface-sunken lg:inline-flex">
        <Icon icon={ChevronRight} />
      </button>
    </div>
  );
}

export type Slot = { start: string; end?: string };

function bucket(iso: string): "Morgens" | "Nachmittags" | "Abends" {
  const h = Number(formatTime(iso).slice(0, 2));
  return h < 12 ? "Morgens" : h < 17 ? "Nachmittags" : "Abends";
}

/** Time slots grouped under Morgens / Nachmittags / Abends (radius 12, tabular); the chosen slot is Espresso with a check. Unavailable times are never rendered. */
export function TimeSlots({
  slots,
  selected,
  onSelect,
  empty,
  className,
}: {
  slots: Slot[];
  selected: string | null;
  onSelect: (start: string) => void;
  empty?: ReactNode;
  className?: string;
}) {
  if (!slots.length) return <div className={className}>{empty ?? <p className="type-body-s text-ink-muted">Keine freien Termine an diesem Tag.</p>}</div>;
  const groups = new Map<string, Slot[]>();
  for (const s of slots) {
    const b = bucket(s.start);
    groups.set(b, [...(groups.get(b) ?? []), s]);
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} role="radiogroup" aria-label="Uhrzeit wählen">
      {[...groups.entries()].map(([name, list]) => (
        <div key={name} className="flex flex-col gap-3">
          <p className="type-overline text-ink-muted">{name}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {list.map((s) => {
              const isSel = s.start === selected;
              return (
                <button
                  key={s.start}
                  type="button"
                  role="radio"
                  aria-checked={isSel}
                  onClick={() => onSelect(s.start)}
                  className={cn(
                    "inline-flex h-touch items-center justify-center gap-1.5 rounded-tile border type-label num pressable focus-ring",
                    isSel ? "border-selected bg-selected text-ink-inverse" : "border-line-mid bg-surface-raised text-ink hover:border-line-strong",
                  )}
                >
                  {isSel ? <Icon icon={Check} size={16} className="-ml-1 animate-pop" /> : null}
                  {formatTime(s.start)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
