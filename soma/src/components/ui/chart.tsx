import { cn } from "@/lib/cn";

/*
 * Charts (design-guideline v2 §4 "Charts", §11 "Data looks expensive").
 * Small, dependency-free SVG. Server components.
 */

export type ChartPoint = { label: string; value: number };

/** Monotone cubic path (Fritsch–Carlson): smooth, never overshoots the data. */
export function smoothPath(pts: Array<[number, number]>): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    m.push((pts[i + 1][1] - pts[i][1]) / (dx[i] || 1));
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  const f = (v: number) => v.toFixed(2);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${f(pts[i][0] + h)},${f(pts[i][1] + t[i] * h)} ${f(pts[i + 1][0] - h)},${f(pts[i + 1][1] - t[i + 1] * h)} ${f(pts[i + 1][0])},${f(pts[i + 1][1])}`;
  }
  return d;
}

/** A round step (1, 2, 2.5, 5 × 10ⁿ) so that `ticks` steps cover `v`. */
function niceStep(v: number, ticks: number): number {
  const raw = Math.max(v, 1) / Math.max(ticks, 1);
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp;
}

const de = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 1 });

/**
 * Area chart (brand § 3.7 charts): a 2 px line over a flat 8 % tint of the series colour (no gradient) and a
 * marked last point. The primary series is chart-1 (Oxblood), comparisons chart-5 (slate), dashed. Accessible as one image with a text summary (role="img"): always
 * pass `summary`, e.g. "Umsatz der letzten 8 Wochen: von 3.120 € auf 4.820 €,
 * Höchstwert in KW 44." Pair it with the key figure as real text.
 */
export function AreaChart({
  data,
  compare,
  summary,
  height = 200,
  ticks = 3,
  unit = "",
  tone = "accent",
  showXLabels = true,
  className,
}: {
  data: ChartPoint[];
  /** optional comparison series (same length), drawn dashed in pewter */
  compare?: number[];
  summary: string;
  height?: number;
  /** horizontal gridlines incl. the top one */
  ticks?: number;
  /** appended to y-axis labels, e.g. " €" */
  unit?: string;
  tone?: "accent" | "violet" | "ink";
  showXLabels?: boolean;
  className?: string;
}) {
  const W = 600;
  const H = height;
  const pad = { t: 10, b: 6 };
  const values = data.map((d) => d.value);
  const step = niceStep(Math.max(...values, ...(compare ?? []), 0), ticks);
  const max = step * Math.max(1, Math.ceil(Math.max(...values, ...(compare ?? []), 0) / step));
  const x = (i: number) => (data.length < 2 ? W / 2 : (i / (data.length - 1)) * W);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const pts = values.map((v, i) => [x(i), y(v)] as [number, number]);
  const line = smoothPath(pts);
  const area = pts.length ? `${line}L${W},${H}L0,${H}Z` : "";
  const cmp = compare?.length === data.length ? smoothPath(compare.map((v, i) => [x(i), y(v)] as [number, number])) : null;
  const stroke = tone === "violet" ? "var(--color-chart-2)" : tone === "ink" ? "var(--color-ink)" : "var(--color-chart-1)";
  const last = pts[pts.length - 1];
  const gridValues = Array.from({ length: Math.round(max / step) }, (_, i) => step * (i + 1));

  return (
    <figure role="img" aria-label={summary} className={cn("flex flex-col gap-2", className)}>
      <div className="relative pr-14" style={{ height }}>
        {/* y labels in a right gutter, centred on their gridline */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-12">
          {gridValues.map((g) => (
            <span key={g} className="absolute right-0 -translate-y-1/2 type-caption whitespace-nowrap text-ink-muted num" style={{ top: `${(y(g) / H) * 100}%` }}>
              {de(g)}
              {unit}
            </span>
          ))}
        </div>
        <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-y-0 left-0 h-full w-[calc(100%-3.5rem)] overflow-visible">
          {gridValues.map((g) => (
            <line key={g} x1={0} x2={W} y1={y(g)} y2={y(g)} stroke="var(--color-chart-grid)" strokeWidth={1} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
          ))}
          <line x1={0} x2={W} y1={H - 0.5} y2={H - 0.5} stroke="var(--color-line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {area ? <path d={area} fill={stroke} fillOpacity={0.08} /> : null}
          {cmp ? <path d={cmp} fill="none" stroke="var(--color-chart-5)" strokeWidth={1.5} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" /> : null}
          {line ? <path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" /> : null}
        </svg>
        {last ? (
          <span
            aria-hidden
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-raised"
            style={{ left: `calc((100% - 3.5rem) * ${(last[0] / W).toFixed(4)})`, top: `${(last[1] / H) * 100}%`, boxShadow: `0 0 0 2px ${stroke}` }}
          />
        ) : null}
      </div>
      {showXLabels && data.length > 1 ? (
        <div aria-hidden className="flex justify-between pr-14 type-caption text-ink-muted num">
          {data.map((d, i) => (
            <span key={i} className={cn(data.length > 8 && i % 2 === 1 && "max-sm:invisible")}>
              {d.label}
            </span>
          ))}
        </div>
      ) : null}
    </figure>
  );
}
