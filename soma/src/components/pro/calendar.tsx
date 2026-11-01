import Link from "next/link";
import { cn } from "@/lib/cn";
import { berlinDateKey, dateParts, formatTime } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { ProviderBookingDTO, TimeOffDTO, WeeklyHoursDTO } from "@/server/dto";
import { isLive, proStatus } from "./bookings";
import { WEEKDAYS, customerLabel } from "./labels";
import { addDaysKey, berlinTime, berlinToIso, formatTimeOffRange, weekdayOfKey } from "./time";
import { DateTile } from "./ui";

/*
 * Kalender "Übersicht": a Linear-grade week grid (md+) and a stacked week
 * list on phones. Bookable windows are white on a sunken day, time off is
 * amber, appointments are tinted blocks by status. Server component.
 */

const HOUR_PX = 52;
const toMin = (t: string) => (t === "24:00" ? 1440 : Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)));

export type WeekData = {
  monday: string;
  weeklyHours: WeeklyHoursDTO[];
  timeOff: TimeOffDTO[];
  bookings: ProviderBookingDTO[];
  now: number;
};

type Day = {
  key: string;
  weekday: number;
  today: boolean;
  past: boolean;
  windows: { start: number; end: number }[];
  off: { start: number; end: number; label: string; reason: string | null }[];
  bookings: { b: ProviderBookingDTO; start: number; end: number; lane: number }[];
  lanes: number;
};

/** ISO week number of a Monday key. */
export function isoWeek(mondayKey: string): number {
  const [y, m, d] = mondayKey.split("-").map(Number);
  const thu = new Date(Date.UTC(y, m - 1, d + 3));
  const jan1 = new Date(Date.UTC(thu.getUTCFullYear(), 0, 1));
  return Math.ceil(((thu.getTime() - jan1.getTime()) / 86_400_000 + 1) / 7);
}

export function buildWeek({ monday, weeklyHours, timeOff, bookings, now }: WeekData): Day[] {
  const todayKey = berlinDateKey(now);
  return Array.from({ length: 7 }, (_, i) => {
    const key = addDaysKey(monday, i);
    const wd = weekdayOfKey(key);
    const dayStart = Date.parse(berlinToIso(key, "00:00"));
    const dayEnd = Date.parse(berlinToIso(addDaysKey(key, 1), "00:00"));
    const minOf = (t: number) => Math.max(0, Math.min(1440, Math.round((t - dayStart) / 60_000)));
    const windows = weeklyHours.filter((h) => h.weekday === wd).map((h) => ({ start: toMin(h.start), end: toMin(h.end) }));
    const off = timeOff
      .filter((t) => Date.parse(t.start) < dayEnd && Date.parse(t.end) > dayStart)
      .map((t) => ({ start: minOf(Date.parse(t.start)), end: minOf(Date.parse(t.end)), label: formatTimeOffRange(t), reason: t.reason }));
    const list = bookings
      .filter((b) => {
        const t = Date.parse(b.startsAt);
        return t >= dayStart && t < dayEnd;
      })
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    const laneEnds: number[] = [];
    const placed = list.map((b) => {
      const start = minOf(Date.parse(b.startsAt));
      const end = Math.max(start + 20, minOf(Date.parse(b.endsAt)));
      let lane = laneEnds.findIndex((e) => e <= start);
      if (lane === -1) lane = laneEnds.push(end) - 1;
      else laneEnds[lane] = end;
      return { b, start, end, lane };
    });
    return { key, weekday: wd, today: key === todayKey, past: key < todayKey, windows, off, bookings: placed, lanes: Math.max(1, laneEnds.length) };
  });
}

/** Visible hour range: 08–20 by default, widened to fit windows and appointments. */
function hourRange(days: Day[]): [number, number] {
  let lo = 8 * 60;
  let hi = 20 * 60;
  for (const d of days) {
    for (const w of d.windows) {
      lo = Math.min(lo, w.start);
      hi = Math.max(hi, w.end);
    }
    for (const x of d.bookings) {
      lo = Math.min(lo, x.start);
      hi = Math.max(hi, x.end);
    }
  }
  return [Math.floor(lo / 60), Math.min(24, Math.ceil(hi / 60))];
}

type Tone = { block: string; bar: string; text: string };
function toneOf(b: ProviderBookingDTO, now: number): Tone {
  if (isLive(b, now)) return { block: "bg-info-soft ring-1 ring-info-line", bar: "bg-info", text: "text-ink" };
  if (b.status === "requested") return { block: "bg-warning-soft ring-1 ring-warning/30", bar: "bg-warning", text: "text-ink" };
  const st = proStatus(b, now);
  if (st.tone === "warning") return { block: "bg-warning-soft ring-1 ring-warning/20", bar: "bg-warning", text: "text-ink" };
  if (b.status === "completed" || Date.parse(b.endsAt) <= now) return { block: "bg-surface-sunken ring-1 ring-line", bar: "bg-ink-disabled", text: "text-ink-muted" };
  return { block: "bg-surface-stone ring-1 ring-line-emphasis/40", bar: "bg-ink", text: "text-ink" };
}

const statusWord = (b: ProviderBookingDTO, now: number) => (isLive(b, now) ? "Läuft jetzt" : proStatus(b, now).label);

/** Desktop week grid with a time axis. */
export function WeekGrid({ data }: { data: WeekData }) {
  const days = buildWeek(data);
  const [h0, h1] = hourRange(days);
  const hours = h1 - h0;
  const height = hours * HOUR_PX;
  const y = (min: number) => ((min - h0 * 60) / 60) * HOUR_PX;
  const nowMin = (() => {
    const t = berlinTime(new Date(data.now));
    return toMin(t);
  })();

  return (
    <div className="hidden overflow-hidden rounded-card bg-surface-raised shadow-raised md:block">
      <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-line">
        <div />
        {days.map((d) => {
          const p = dateParts(berlinToIso(d.key, "12:00"));
          return (
            <div key={d.key} className={cn("flex flex-col items-center gap-1 border-l border-line py-3", d.today && "bg-surface-tint")}>
              <span className={cn("type-caption", d.today ? "font-semibold text-ink" : "text-ink-muted")}>{d.today ? "Heute" : WEEKDAYS[d.weekday - 1].short}</span>
              <span
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-full type-label num",
                  d.today ? "bg-ink text-ink-inverse shadow-ink" : d.past ? "text-ink-muted" : "text-ink",
                )}
              >
                {p.day}
              </span>
              <span className="type-caption text-ink-muted num">
                {d.off.length && d.off.some((o) => o.start === 0 && o.end === 1440) ? "abwesend" : d.windows.length ? d.windows.map((w) => `${String(Math.floor(w.start / 60))}–${String(Math.ceil(w.end / 60))}`).join(", ") : "frei"}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]" style={{ height: height + 16 }}>
        <div aria-hidden className="relative">
          {Array.from({ length: hours + 1 }, (_, i) => (
            <span key={i} className="absolute right-2 -translate-y-1/2 type-caption text-ink-muted num" style={{ top: i * HOUR_PX + 8 }}>
              {String(h0 + i).padStart(2, "0")}:00
            </span>
          ))}
        </div>
        {days.map((d) => (
          <div key={d.key} className={cn("relative border-l border-line", d.today ? "bg-surface-tint" : "bg-surface-sunken/70")}>
            <div className="absolute inset-x-0 top-2" style={{ height }}>
              {/* bookable windows */}
              {d.windows.map((w, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="absolute inset-x-0 bg-surface-raised"
                  style={{ top: y(Math.max(w.start, h0 * 60)), height: y(Math.min(w.end, h1 * 60)) - y(Math.max(w.start, h0 * 60)) }}
                />
              ))}
              {/* hour lines */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: `repeating-linear-gradient(to bottom, var(--color-line) 0 1px, transparent 1px ${HOUR_PX}px)` }}
              />
              {/* time off */}
              {d.off.map((o, i) => {
                const top = y(Math.max(o.start, h0 * 60));
                const bottom = y(Math.min(o.end, h1 * 60));
                if (bottom <= top) return null;
                return (
                  <span
                    key={i}
                    className="absolute inset-x-1 z-[1] flex items-start overflow-hidden rounded-[10px] bg-warning-soft px-2 py-1.5 ring-1 ring-warning/20 ring-inset"
                    style={{
                      top,
                      height: bottom - top,
                      backgroundImage: "repeating-linear-gradient(135deg, rgb(135 88 0 / 0.07) 0 6px, transparent 6px 12px)",
                    }}
                  >
                    <span className="type-caption font-[560] text-warning">Abwesend{o.reason ? ` · ${o.reason}` : ""}</span>
                  </span>
                );
              })}
              {/* appointments */}
              {d.bookings.map(({ b, start, end, lane }) => {
                const tone = toneOf(b, data.now);
                const top = y(Math.max(start, h0 * 60));
                const h = Math.max(26, y(Math.min(end, h1 * 60)) - top - 3);
                const width = 100 / d.lanes;
                const live = isLive(b, data.now);
                return (
                  <Link
                    key={b.id}
                    href={routes.pro.booking(b.id)}
                    className={cn(
                      "group absolute z-[2] flex overflow-hidden rounded-[10px] shadow-[0_1px_2px_rgb(37_33_31/0.06)] ring-inset transition-[box-shadow,translate] duration-fast focus-ring hover:-translate-y-px hover:shadow-float",
                      tone.block,
                    )}
                    style={{ top: top + 1, height: h, left: `calc(${lane * width}% + 4px)`, width: `calc(${width}% - 8px)` }}
                  >
                    <span aria-hidden className={cn("w-[3px] shrink-0", tone.bar)} />
                    {/* A5-4: the name comes from the content, so it starts with the visible text; the rest is sr-only. */}
                    <span className={cn("flex min-w-0 flex-col px-2 py-1", tone.text)}>
                      <span className="flex items-center gap-1 text-[11.5px] leading-tight font-[600] num">
                        {live ? (
                          <span aria-hidden className="relative size-1.5 rounded-full bg-info">
                          </span>
                        ) : null}
                        {formatTime(b.startsAt)}
                        <span className="sr-only">{`–${formatTime(b.endsAt)}`}</span>
                        {b.status === "requested" ? <span className="font-[520] text-warning"> · Anfrage</span> : null}
                      </span>
                      <span className={h >= 40 ? "truncate text-[12px] leading-snug font-[520]" : "sr-only"}>
                        <span className="sr-only">, </span>
                        {b.serviceName}
                      </span>
                      <span className={h >= 60 ? "truncate text-[12px] leading-snug text-ink-muted" : "sr-only"}>
                        <span className="sr-only">, </span>
                        {customerLabel(b.customer)}
                      </span>
                      {b.status === "requested" ? null : <span className="sr-only">{`, ${statusWord(b, data.now)}`}</span>}
                    </span>
                  </Link>
                );
              })}
              {/* now line */}
              {d.today && nowMin >= h0 * 60 && nowMin <= h1 * 60 ? (
                <span aria-hidden className="pointer-events-none absolute inset-x-0 z-[3] h-0.5 -translate-y-1/2 bg-ink" style={{ top: y(nowMin) }}>
                  <span className="absolute top-1/2 -left-1 size-2.5 -translate-y-1/2 rounded-full bg-ink shadow-[0_0_0_3px_var(--color-surface-raised)]" />
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <Legend />
    </div>
  );
}

function Legend() {
  const items = [
    { label: "Buchbar", swatch: "bg-surface-raised ring-1 ring-line-mid" },
    { label: "Bestätigt", swatch: "bg-surface-stone ring-1 ring-line-emphasis/40" },
    { label: "Anfrage", swatch: "bg-warning-soft ring-1 ring-warning/30" },
    { label: "Vorbei", swatch: "bg-surface-sunken ring-1 ring-line-mid" },
    { label: "Abwesend", swatch: "bg-warning-soft ring-1 ring-warning/20" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-5 py-3">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-2 type-caption text-ink-muted">
          <span aria-hidden className={cn("size-3 rounded-[4px]", i.swatch)} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Phone: the same week as stacked day cards. */
export function WeekList({ data }: { data: WeekData }) {
  const days = buildWeek(data);
  return (
    <ol className="flex flex-col gap-2.5 md:hidden" aria-label="Termine im Zeitraum">
      {days.map((d) => {
        const allDayOff = d.off.some((o) => o.start === 0 && o.end === 1440);
        const line = d.off.length
          ? `Abwesend · ${d.off.map((o) => `${o.label}${o.reason ? ` (${o.reason})` : ""}`).join(", ")}`
          : d.windows.length
            ? `Buchbar ${d.windows.map((w) => `${fmt(w.start)}–${fmt(w.end)}`).join(", ")}`
            : "Nicht buchbar";
        return (
          <li
            key={d.key}
            className={cn(
              "flex gap-3 rounded-card p-3 transition-colors",
              d.today ? "bg-surface-raised shadow-raised ring-1 ring-ink" : d.bookings.length ? "bg-surface-raised shadow-raised" : "bg-surface-sunken/70",
            )}
          >
            <DateTile date={berlinToIso(d.key, "12:00")} today={d.today} size="s" />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-0.5">
              <p className={cn("type-caption", d.off.length ? "font-[520] text-warning" : "text-ink-muted")}>
                {d.today ? <span className="font-semibold text-ink">Heute · </span> : null}
                {line}
              </p>
              {d.bookings.length ? (
                <ul className="-mx-1.5 flex flex-col">
                  {d.bookings.map(({ b }) => {
                    const st = proStatus(b, data.now);
                    const live = isLive(b, data.now);
                    const dot = live ? "bg-info" : b.status === "requested" || st.tone === "warning" ? "bg-warning" : b.status === "completed" || Date.parse(b.endsAt) <= data.now ? "bg-ink-disabled" : "bg-success";
                    return (
                      <li key={b.id}>
                        <Link href={routes.pro.booking(b.id)} className="flex min-h-touch items-center gap-2.5 rounded-control px-1.5 py-1 transition-colors duration-fast focus-ring hover:bg-surface-tint">
                          <span className="w-11 shrink-0 type-label-s num text-ink">{formatTime(b.startsAt)}</span>
                          <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", dot)} />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate type-body-s font-[520] text-ink">{b.serviceName}</span>
                            <span className="truncate type-caption text-ink-muted">
                              {customerLabel(b.customer)} · {live ? "Läuft jetzt" : st.label}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : !allDayOff && d.windows.length ? (
                <p className="type-body-s text-ink-muted">Keine Termine</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function fmt(min: number) {
  return min >= 1440 ? "24:00" : `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/** Week figures for the header chips: appointments, open requests, bookable hours. */
export function weekFigures(data: WeekData) {
  const days = buildWeek(data);
  const appts = days.reduce((a, d) => a + d.bookings.filter((x) => x.b.status !== "requested").length, 0);
  const requests = days.reduce((a, d) => a + d.bookings.filter((x) => x.b.status === "requested").length, 0);
  const bookableMin = days.reduce(
    (a, d) =>
      a +
      d.windows.reduce((s, w) => {
        const blocked = d.off.reduce((x, o) => x + Math.max(0, Math.min(w.end, o.end) - Math.max(w.start, o.start)), 0);
        return s + Math.max(0, w.end - w.start - blocked);
      }, 0),
    0,
  );
  return { appts, requests, bookableHours: Math.round(bookableMin / 6) / 10 };
}
