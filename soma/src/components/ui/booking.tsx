"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { dateParts, formatTime, berlinDateKey } from "@/lib/format";
import { Icon } from "./icon";

export type DateCell = { key: string; date: string | Date; available: boolean };

/**
 * Date strip: horizontal snap scroll of day cells (56×72), radiogroup semantics with arrow keys.
 * Today reads "Heute" with a roof line; booked-out days are disabled.
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
      <button type="button" onClick={() => scrollBy(-1)} aria-label="Frühere Tage" className="hidden size-touch shrink-0 items-center justify-center rounded-xs hover:bg-surface-sunken lg:inline-flex">
        <Icon icon={ChevronLeft} />
      </button>
      <div
        ref={scroller}
        role="radiogroup"
        aria-label={label}
        onKeyDown={onKey}
        className="-mx-(--space-gutter) flex snap-x scroll-px-(--space-gutter) gap-1 overflow-x-auto px-(--space-gutter) pt-5 pb-1 scrollbar-none lg:mx-0 lg:scroll-px-0 lg:px-0"
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
                "relative flex h-[72px] w-14 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-xs transition-colors duration-fast",
                isSel ? "bg-ink text-ink-inverse" : d.available ? "text-ink hover:bg-surface-sunken" : "text-ink-disabled",
              )}
            >
              {showMonth ? (
                <span aria-hidden className="absolute -top-5 left-1 type-caption text-ink-muted">
                  {p.month}
                </span>
              ) : null}
              {isToday ? <span aria-hidden className={cn("absolute top-2 h-0.5 w-3", isSel ? "bg-ink-inverse" : "bg-ink")} /> : null}
              <span className={cn("type-caption", isSel ? "text-ink-inverse" : d.available ? "text-ink-muted" : "")}>
                {isToday ? "Heute" : p.weekday}
              </span>
              <span className={cn("type-heading-m num", !d.available && "line-through decoration-1")}>{p.day}</span>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={() => scrollBy(1)} aria-label="Spätere Tage" className="hidden size-touch shrink-0 items-center justify-center rounded-xs hover:bg-surface-sunken lg:inline-flex">
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

/** Time slots grouped under Morgens / Nachmittags / Abends. Unavailable times are never rendered. */
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
                    "h-touch rounded-xs border type-label num transition-colors duration-fast",
                    isSel ? "border-ink bg-ink text-ink-inverse" : "border-line bg-surface-raised text-ink hover:border-ink",
                  )}
                >
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
