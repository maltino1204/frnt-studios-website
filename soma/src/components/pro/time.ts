import { berlinDateKey, formatDayShort, formatTime, TIME_ZONE } from "@/lib/format";

/** Small isomorphic Europe/Berlin helpers for the provider app (no dependencies). */

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function berlinParts(d: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour, mi: +p.minute };
}

/** Offset of Berlin wall clock vs UTC at an instant, in minutes (60 or 120). */
function offsetAt(d: Date): number {
  const p = berlinParts(d);
  return Math.round((Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi) - Math.floor(d.getTime() / 60_000) * 60_000) / 60_000);
}

/** Berlin wall time ("2026-11-02", "14:30") → ISO UTC instant. "24:00" means the next midnight. */
export function berlinToIso(date: string, time: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let t = guess - offsetAt(new Date(guess)) * 60_000;
  t = guess - offsetAt(new Date(t)) * 60_000;
  return new Date(t).toISOString();
}

/** "YYYY-MM-DD" + n days */
export function addDaysKey(date: string, n: number): string {
  const [y, mo, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** ISO weekday (1 = Mo … 7 = So) of a local date key. */
export function weekdayOfKey(date: string): number {
  const [y, mo, d] = date.split("-").map(Number);
  const wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return wd === 0 ? 7 : wd;
}

/** Hour (0–23) in Berlin. */
export function berlinHour(d: Date = new Date()): number {
  return berlinParts(d).h;
}

/** Berlin "HH:MM" of an instant. */
export function berlinTime(iso: string | Date): string {
  const p = berlinParts(typeof iso === "string" ? new Date(iso) : iso);
  return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}

export { berlinDateKey };

/** "Guten Morgen" / "Guten Tag" / "Guten Abend" by Berlin time. */
export function greetingFor(d: Date = new Date()): string {
  const h = berlinHour(d);
  if (h < 5) return "Guten Abend";
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

/** Time options in steps for selects: ["06:00", "06:30", …]. */
export function timeOptions(stepMinutes = 30, from = 0, to = 24 * 60): string[] {
  const out: string[] = [];
  for (let m = from; m <= to; m += stepMinutes) {
    out.push(m === 1440 ? "24:00" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

/** "Mo., 2. Nov. – Fr., 6. Nov." or "Mo., 2. Nov. · 14:00–18:00" */
export function formatTimeOffRange(t: { start: string; end: string }): string {
  const s = new Date(t.start);
  const e = new Date(t.end);
  const allDay = berlinTime(s) === "00:00" && berlinTime(e) === "00:00";
  if (allDay) {
    const lastDay = new Date(e.getTime() - 60_000);
    return berlinDateKey(s) === berlinDateKey(lastDay) ? `${formatDayShort(s)} · ganztägig` : `${formatDayShort(s)} – ${formatDayShort(lastDay)}`;
  }
  return berlinDateKey(s) === berlinDateKey(e) ? `${formatDayShort(s)} · ${formatTime(s)}–${formatTime(e)}` : `${formatDayShort(s)}, ${formatTime(s)} – ${formatDayShort(e)}, ${formatTime(e)}`;
}

