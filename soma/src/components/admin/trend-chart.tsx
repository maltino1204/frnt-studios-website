"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { smoothPath } from "@/components/ui/chart";
import { cn } from "@/lib/cn";
import { formatPrice, LOCALE, TIME_ZONE } from "@/lib/format";

export type TrendTone = "accent" | "violet" | "compare";
export type TrendSeries = { key: string; label: string; tone: TrendTone; values: number[] };

/* No Oxblood in the console (BRAND_STRATEGY § 5): the primary series is Espresso. */
const STROKE: Record<TrendTone, string> = {
  accent: "var(--color-ink)",
  violet: "var(--color-chart-2)",
  compare: "var(--color-chart-5)",
};

const dayFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: "numeric", month: "short" });
const dayLongFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, weekday: "short", day: "numeric", month: "short" });
/** dates are local 'YYYY-MM-DD'; anchor at noon UTC so the Berlin day never shifts */
const asDate = (d: string) => new Date(`${d}T12:00:00Z`);

const formatCount = (n: number) => n.toLocaleString(LOCALE);
const formatEuro = (cents: number) => formatPrice(Math.round(cents / 100) * 100);
const axisCount = (n: number) => (n >= 10_000 ? `${(n / 1000).toLocaleString(LOCALE, { maximumFractionDigits: 0 })} T` : n.toLocaleString(LOCALE, { maximumFractionDigits: 1 }));
const axisEuro = (cents: number) => (cents >= 100_000 ? `${(cents / 100_000).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} T€` : `${Math.round(cents / 100).toLocaleString(LOCALE)} €`);

/** A round step (1, 2, 2.5, 5 × 10ⁿ) so that `ticks` steps cover `v` (same rule as the kit AreaChart). */
function niceStep(v: number, ticks: number): number {
  const raw = Math.max(v, 1) / Math.max(ticks, 1);
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp;
}

/**
 * Admin trend chart in the kit AreaChart language (brand § 3.7): series 1 as a 2 px monotone Espresso line over
 * a flat 7 % tint (no gradient), series 2 (taupe-deep) with a fainter tint, dashed `chart-grid` gridlines,
 * tabular ticks in a right gutter and a marked last point (Paper dot, 2 px ring).
 *
 * Pointer and keyboard: hovering (or focusing and using ← → Home End) shows a crosshair and
 * one Paper tooltip listing every series; a polite live region announces the day for
 * screen readers. The values are also available as a table below the chart.
 */
export function TrendChart({
  title,
  dates,
  series,
  unit = "count",
  height = 148,
  ticks = 3,
  className,
}: {
  title: string;
  dates: string[];
  series: TrendSeries[];
  /** "euro": values are cents */
  unit?: "count" | "euro";
  height?: number;
  ticks?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const plot = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const n = dates.length;
  const format = unit === "euro" ? formatEuro : formatCount;
  const fmtAxis = unit === "euro" ? axisEuro : axisCount;

  const W = 600;
  const H = height;
  const pad = { t: 8, b: 4 };
  const peak = Math.max(0, ...series.flatMap((s) => s.values));
  const step = niceStep(peak, ticks);
  const max = step * Math.max(1, Math.ceil(peak / step));
  const x = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const xPct = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const grid = Array.from({ length: Math.round(max / step) }, (_, i) => step * (i + 1));

  const paths = useMemo(
    () =>
      series.map((s) => {
        const pts = s.values.map((v, i) => [x(i), y(v)] as [number, number]);
        const line = smoothPath(pts);
        return { key: s.key, line, area: pts.length > 1 ? `${line}L${W},${H}L0,${H}Z` : "" };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, max, H, n],
  );

  const summary = useMemo(
    () =>
      series
        .map((s) => {
          const total = s.values.reduce((a, v) => a + v, 0);
          const top = Math.max(0, ...s.values);
          const pi = s.values.indexOf(top);
          return `${s.label}: gesamt ${format(total)}, Höchstwert ${format(top)} am ${dates[pi] ? dayFmt.format(asDate(dates[pi])) : "—"}, zuletzt ${format(s.values[n - 1] ?? 0)}`;
        })
        .join(". "),
    [series, dates, format, n],
  );

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
    } else if (e.key === "Home") {
      e.preventDefault();
      setIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setIndex(n - 1);
    } else if (e.key === "Escape") setIndex(null);
  };

  const labelIdx = n > 4 ? [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1] : n > 1 ? [0, n - 1] : [0];
  const lead = series[0];

  return (
    <figure className={cn("flex min-w-0 flex-col gap-3", className)}>
      <figcaption className="sr-only">{title}</figcaption>
      {series.length > 1 ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Legende">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-2 type-caption text-ink-muted">
              <span aria-hidden className="h-0.5 w-3.5 rounded-full" style={{ background: STROKE[s.tone] }} />
              {s.label}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="relative pr-12">
        {/* y ticks in a right gutter, centred on their gridline */}
        <div aria-hidden className="pointer-events-none absolute top-0 right-0 w-11" style={{ height: H }}>
          {grid.map((g) => (
            <span key={g} className="absolute right-0 -translate-y-1/2 type-caption whitespace-nowrap text-ink-muted num" style={{ top: `${(y(g) / H) * 100}%` }}>
              {fmtAxis(g)}
            </span>
          ))}
        </div>
        <div
          ref={plot}
          tabIndex={0}
          role="group"
          aria-label={`${title}. ${summary}. Pfeiltasten zeigen einzelne Tage.`}
          aria-describedby={`${uid}-live`}
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={() => setIndex(null)}
          onFocus={() => setIndex((i) => i ?? n - 1)}
          onBlur={() => setIndex(null)}
          onKeyDown={onKey}
          className="relative touch-pan-y rounded-[6px] focus-ring"
          style={{ height: H }}
        >
          <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            {grid.map((g) => (
              <line key={g} x1={0} x2={W} y1={y(g)} y2={y(g)} stroke="var(--color-chart-grid)" strokeWidth={1} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
            ))}
            <line x1={0} x2={W} y1={H - 0.5} y2={H - 0.5} stroke="var(--color-line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            {[...paths].reverse().map((p) => {
              const si = paths.indexOf(p);
              const s = series[si];
              return (
                <g key={p.key}>
                  {p.area && s.tone !== "compare" ? <path d={p.area} fill={STROKE[s.tone]} fillOpacity={si === 0 ? 0.07 : 0.04} /> : null}
                  <path
                    d={p.line}
                    fill="none"
                    stroke={STROKE[s.tone]}
                    strokeWidth={si === 0 ? 2 : 1.75}
                    strokeDasharray={s.tone === "compare" ? "4 4" : undefined}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}
          </svg>

          {/* last point of the lead series (HTML so it stays round) */}
          {n > 0 && lead && index === null ? (
            <span
              aria-hidden
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-raised"
              style={{
                left: `${xPct(n - 1)}%`,
                top: y(lead.values[n - 1] ?? 0),
                boxShadow: `0 0 0 2px ${STROKE[lead.tone]}`,
              }}
            />
          ) : null}

          {index !== null && n > 0 ? (
            <>
              <span aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-line-strong/60" style={{ left: `${xPct(index)}%` }} />
              {series.map((s) => (
                <span
                  key={s.key}
                  aria-hidden
                  className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-raised transition-[top,left] duration-instant"
                  style={{ left: `${xPct(index)}%`, top: y(s.values[index] ?? 0), boxShadow: `0 0 0 2px ${STROKE[s.tone]}` }}
                />
              ))}
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute top-0 z-10 flex min-w-40 animate-fade-in flex-col gap-1.5 rounded-tile bg-surface-raised px-3 py-2.5 shadow-float",
                  xPct(index) > 55 ? "-translate-x-[calc(100%+12px)]" : "translate-x-3",
                )}
                style={{ left: `${xPct(index)}%` }}
              >
                <p className="type-caption text-ink-muted num">{dayLongFmt.format(asDate(dates[index]))}</p>
                {series.map((s) => (
                  <p key={s.key} className="flex items-center gap-2 type-caption whitespace-nowrap">
                    <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: STROKE[s.tone] }} />
                    <span className="text-ink-muted">{s.label}</span>
                    <span className="ml-auto pl-3 type-label-s text-ink num">{format(s.values[index] ?? 0)}</span>
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
              className={cn("absolute whitespace-nowrap", k === 0 ? "left-0" : k === labelIdx.length - 1 ? "right-0" : "-translate-x-1/2", k > 0 && k < labelIdx.length - 1 && "max-sm:hidden")}
              style={k === 0 || k === labelIdx.length - 1 ? undefined : { left: `${xPct(i)}%` }}
            >
              {dates[i] ? dayFmt.format(asDate(dates[i])) : ""}
            </span>
          ))}
        </div>
        <p id={`${uid}-live`} className="sr-only" aria-live="polite">
          {index !== null && dates[index] ? `${dayLongFmt.format(asDate(dates[index]))}: ${series.map((s) => `${s.label} ${format(s.values[index] ?? 0)}`).join(", ")}` : ""}
        </p>
      </div>
      <details className="group/tbl">
        <summary className="inline-flex w-fit cursor-pointer list-none items-center gap-1 rounded-full py-0.5 pr-2 pl-1 type-caption text-ink-muted transition-colors duration-fast hover:text-ink focus-ring [&::-webkit-details-marker]:hidden">
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 transition-transform duration-fast ease-standard group-open/tbl:rotate-90">
            <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Werte als Tabelle
        </summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-tile bg-surface-sunken/60 ring-1 ring-line ring-inset">
          <table className="w-full type-caption num">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="text-ink-muted">
                <th scope="col" className="sticky top-0 bg-surface-sunken px-3 py-1.5 text-left font-[520]">
                  Datum
                </th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="sticky top-0 bg-surface-sunken px-3 py-1.5 text-right font-[520]">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((d, i) => (
                <tr key={d} className="border-t border-line">
                  <th scope="row" className="px-3 py-1 text-left font-normal text-ink-muted">
                    {dayLongFmt.format(asDate(d))}
                  </th>
                  {series.map((s) => (
                    <td key={s.key} className="px-3 py-1 text-right text-ink">
                      {format(s.values[i] ?? 0)}
                    </td>
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
