"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import { formatPrice, LOCALE, TIME_ZONE } from "@/lib/format";

export type ChartTone = "ink" | "accent" | "zinn" | "graphit";
export type ChartSeries = { key: string; label: string; tone: ChartTone; values: number[] };

const STROKE: Record<ChartTone, string> = {
  ink: "var(--color-ink)",
  accent: "var(--color-accent)",
  zinn: "var(--color-line-strong)",
  graphit: "var(--color-ink-muted)",
};

const dayFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: "numeric", month: "short" });
const dayLongFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, weekday: "short", day: "numeric", month: "short" });
/** dates are local 'YYYY-MM-DD'; anchor at noon UTC so the Berlin day never shifts */
const asDate = (d: string) => new Date(`${d}T12:00:00Z`);

const formatCount = (n: number) => n.toLocaleString(LOCALE);
const formatEuro = (cents: number) => formatPrice(Math.round(cents / 100) * 100);
const axisEuro = (cents: number) => (cents >= 100_000 ? `${(cents / 100_000).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} T€` : `${Math.round(cents / 100)} €`);

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(max));
  const f = max / exp;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return step * exp;
}

/**
 * Lightweight line chart (design-guideline §4 "Charts"): 1.5px lines, no fill,
 * 1px gridlines in `line`, one y-axis. Hover/focus shows a crosshair and one
 * tooltip listing every series; arrow keys move it. A table view is always
 * available below the chart.
 */
export function LineChart({
  title,
  dates,
  series,
  unit = "count",
  height = 132,
  className,
}: {
  title: string;
  dates: string[];
  series: ChartSeries[];
  /** "euro": values are cents */
  unit?: "count" | "euro";
  height?: number;
  className?: string;
}) {
  const id = useId();
  const plot = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const n = dates.length;
  const max = useMemo(() => niceMax(Math.max(0, ...series.flatMap((s) => s.values))), [series]);
  const format = unit === "euro" ? formatEuro : formatCount;
  const fmtAxis = unit === "euro" ? axisEuro : formatCount;
  const W = 1000;
  const x = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => height - (v / max) * height;
  const xPct = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);

  const summary = useMemo(() => {
    return series
      .map((s) => {
        const total = s.values.reduce((a, v) => a + v, 0);
        const peak = Math.max(...s.values);
        const pi = s.values.indexOf(peak);
        return `${s.label}: gesamt ${format(total)}, Höchstwert ${format(peak)} am ${dates[pi] ? dayFmt.format(asDate(dates[pi])) : "—"}, zuletzt ${format(s.values[n - 1] ?? 0)}`;
      })
      .join(". ");
  }, [series, dates, format, n]);

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const r = plot.current?.getBoundingClientRect();
    if (!r || n === 0) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setIndex(Math.round(ratio * (n - 1)));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (n === 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setIndex((i) => Math.min(n - 1, Math.max(0, (i ?? n - 1) + (e.key === "ArrowRight" ? 1 : -1))));
    } else if (e.key === "Home") setIndex(0);
    else if (e.key === "End") setIndex(n - 1);
    else if (e.key === "Escape") setIndex(null);
  };

  const ticks = [max, max / 2, 0];
  const labelIdx = n > 2 ? [0, Math.floor((n - 1) / 2), n - 1] : n === 2 ? [0, 1] : [0];

  return (
    <figure className={cn("flex min-w-0 flex-col gap-3", className)}>
      <figcaption className="sr-only">{title}</figcaption>
      {series.length > 1 ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Legende">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-2 type-caption text-ink-muted">
              <svg width="16" height="6" aria-hidden className="shrink-0">
                <line x1="0" y1="3" x2="16" y2="3" stroke={STROKE[s.tone]} strokeWidth="1.5" strokeDasharray={s.tone === "graphit" ? "3 2" : undefined} />
              </svg>
              {s.label}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <div className="relative w-10 shrink-0 type-caption text-ink-muted num" style={{ height }} aria-hidden>
          {ticks.map((t, i) => (
            <span key={i} className="absolute right-0 -translate-y-1/2 whitespace-nowrap" style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}>
              {fmtAxis(t)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div
            ref={plot}
            tabIndex={0}
            role="group"
            aria-label={`${title}. ${summary}. Pfeiltasten zeigen einzelne Tage.`}
            aria-describedby={`${id}-live`}
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={() => setIndex(null)}
            onFocus={() => setIndex((i) => i ?? n - 1)}
            onBlur={() => setIndex(null)}
            onKeyDown={onKey}
            className="relative touch-pan-y rounded-xs outline-offset-4"
            style={{ height }}
          >
            <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
              {ticks.map((t, i) => (
                <line key={i} x1="0" x2={W} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ))}
              {series.map((s) => (
                <polyline
                  key={s.key}
                  fill="none"
                  stroke={STROKE[s.tone]}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={s.tone === "graphit" ? "4 3" : undefined}
                  vectorEffect="non-scaling-stroke"
                  points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
                />
              ))}
            </svg>
            {/* end-point markers (HTML so they stay round) */}
            {n > 0 && index === null
              ? series.map((s) => (
                  <span
                    key={s.key}
                    aria-hidden
                    className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ left: `${xPct(n - 1)}%`, top: y(s.values[n - 1] ?? 0), background: STROKE[s.tone] }}
                  />
                ))
              : null}
            {index !== null && n > 0 ? (
              <>
                <span aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-line-strong" style={{ left: `${xPct(index)}%` }} />
                {series.map((s) => (
                  <span
                    key={s.key}
                    aria-hidden
                    className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface-raised"
                    style={{ left: `${xPct(index)}%`, top: y(s.values[index] ?? 0), background: STROKE[s.tone] }}
                  />
                ))}
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute top-0 z-10 flex min-w-36 flex-col gap-1.5 rounded-xs bg-surface-raised px-3 py-2.5 shadow-float",
                    xPct(index) > 60 ? "-translate-x-[calc(100%+12px)]" : "translate-x-3",
                  )}
                  style={{ left: `${xPct(index)}%` }}
                >
                  <p className="type-caption text-ink-muted num">{dayLongFmt.format(asDate(dates[index]))}</p>
                  {series.map((s) => (
                    <p key={s.key} className="flex items-center gap-2 type-caption whitespace-nowrap">
                      <svg width="12" height="6" aria-hidden className="shrink-0">
                        <line x1="0" y1="3" x2="12" y2="3" stroke={STROKE[s.tone]} strokeWidth="1.5" strokeDasharray={s.tone === "graphit" ? "3 2" : undefined} />
                      </svg>
                      <span className="type-label-s text-ink num">{format(s.values[index] ?? 0)}</span>
                      <span className="text-ink-muted">{s.label}</span>
                    </p>
                  ))}
                </div>
              </>
            ) : null}
          </div>
          <div className="relative mt-2 h-4 type-caption text-ink-muted num" aria-hidden>
            {labelIdx.map((i, k) => (
              <span
                key={i}
                className={cn("absolute whitespace-nowrap", k === 0 ? "left-0" : k === labelIdx.length - 1 ? "right-0" : "-translate-x-1/2")}
                style={k === 0 || k === labelIdx.length - 1 ? undefined : { left: `${xPct(i)}%` }}
              >
                {dates[i] ? dayFmt.format(asDate(dates[i])) : ""}
              </span>
            ))}
          </div>
          <p id={`${id}-live`} className="sr-only" aria-live="polite">
            {index !== null && dates[index]
              ? `${dayLongFmt.format(asDate(dates[index]))}: ${series.map((s) => `${s.label} ${format(s.values[index] ?? 0)}`).join(", ")}`
              : ""}
          </p>
        </div>
      </div>
      <details className="group">
        <summary className="w-fit cursor-pointer rounded-xs type-caption text-ink-muted underline-offset-4 hover:text-ink hover:underline">Werte als Tabelle</summary>
        <div className="mt-2 max-h-64 overflow-auto border border-line">
          <table className="w-full type-caption num">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="border-b border-line-strong text-ink-muted">
                <th scope="col" className="px-3 py-1.5 text-left font-[520]">Datum</th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="px-3 py-1.5 text-right font-[520]">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((d, i) => (
                <tr key={d} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-3 py-1 text-left font-normal text-ink-muted">{dayLongFmt.format(asDate(d))}</th>
                  {series.map((s) => (
                    <td key={s.key} className="px-3 py-1 text-right">{format(s.values[i] ?? 0)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
