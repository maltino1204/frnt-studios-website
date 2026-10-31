"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Copy, Plus, X } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Select, Switch } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { setWeeklyHoursAction } from "@/server/actions/pro";
import type { WeeklyHoursDTO } from "@/server/dto";
import { WEEKDAYS, proError } from "./labels";
import { timeOptions } from "./time";

type Win = { start: string; end: string };
type Week = Record<number, Win[]>;

const START_OPTIONS = timeOptions(30, 0, 23 * 60 + 30);
const END_OPTIONS = timeOptions(30, 30, 24 * 60);
const toMin = (t: string) => (t === "24:00" ? 1440 : Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)));

function fromDto(list: WeeklyHoursDTO[]): Week {
  const w: Week = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
  for (const h of list) w[h.weekday].push({ start: h.start, end: h.end });
  return w;
}

function dayError(wins: Win[]): string | null {
  for (const w of wins) if (toMin(w.end) <= toMin(w.start)) return "Das Ende muss nach dem Beginn liegen.";
  const sorted = [...wins].sort((a, b) => toMin(a.start) - toMin(b.start));
  for (let i = 1; i < sorted.length; i++) if (toMin(sorted[i].start) < toMin(sorted[i - 1].end)) return "Zeitfenster dürfen sich nicht überschneiden.";
  return null;
}

/** Weekly hours: several windows per day, replace-all save (setWeeklyHoursAction). */
export function WeeklyHoursEditor({
  initial,
  submitLabel = "Arbeitszeiten speichern",
  onSaved,
  stickySave = true,
}: {
  initial: WeeklyHoursDTO[];
  submitLabel?: string;
  onSaved?: () => void;
  stickySave?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [week, setWeek] = useState<Week>(() => fromDto(initial));
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const update = (fn: (w: Week) => Week) => {
    setWeek((w) => fn(structuredClone(w)));
    setDirty(true);
  };

  const errors = useMemo(() => Object.fromEntries(WEEKDAYS.map((d) => [d.n, dayError(week[d.n])])) as Record<number, string | null>, [week]);
  const totalMin = WEEKDAYS.reduce((a, d) => a + week[d.n].reduce((s, w) => s + Math.max(0, toMin(w.end) - toMin(w.start)), 0), 0);
  const hasErrors = Object.values(errors).some(Boolean);

  const save = () => {
    setError(null);
    if (hasErrors) {
      setError("Bitte korrigiere die markierten Tage.");
      return;
    }
    const windows = WEEKDAYS.flatMap((d) => week[d.n].map((w) => ({ weekday: d.n, start: w.start, end: w.end })));
    start(async () => {
      const res = await setWeeklyHoursAction(windows);
      if (!res.ok) {
        setError(proError(res.error));
        return;
      }
      setDirty(false);
      toast.show(res.message ?? "Verfügbarkeit gespeichert.");
      if (onSaved) onSaved();
      else router.refresh();
    });
  };

  const copyMonday = () =>
    update((w) => {
      for (const n of [2, 3, 4, 5]) w[n] = w[1].map((x) => ({ ...x }));
      return w;
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 rounded-card bg-surface-raised p-5 shadow-raised lg:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <p className="type-label-s text-ink-muted">Pro Woche buchbar</p>
            <p className="type-stat" aria-live="polite">
              {(totalMin / 60).toLocaleString("de-DE", { maximumFractionDigits: 1 })}
              <span className="ml-1.5 type-heading-m text-ink-muted">Std.</span>
            </p>
          </div>
          <Button variant="secondary" size="s" onClick={copyMonday} disabled={!week[1].length} icon={<Icon icon={Copy} size={16} />}>
            Montag auf Di–Fr übertragen
          </Button>
        </div>
        <WeekOverview week={week} errors={errors} />
      </div>
      <div className="overflow-hidden rounded-card bg-surface-raised shadow-raised">
      <div aria-hidden className="hidden items-center gap-6 border-b border-line bg-surface/60 px-5 py-2.5 type-label-s text-ink-muted md:flex">
        <span className="w-44 shrink-0">Tag</span>
        <span className="flex flex-1 gap-2">
          <span className="flex-1">Beginn</span>
          <span className="w-3" />
          <span className="flex-1">Ende</span>
          <span className="w-11" />
        </span>
      </div>
      <ul className="divide-y divide-line">
        {WEEKDAYS.map((d) => {
          const wins = week[d.n];
          const on = wins.length > 0;
          const err = errors[d.n];
          return (
            <li key={d.n} className={cn("flex flex-col gap-3 px-4 py-4 transition-colors duration-base sm:px-5 md:flex-row md:items-start md:gap-6", !on && "bg-surface/60", err && "bg-danger-soft/40")}>
              <div className="md:w-44 md:shrink-0">
                <Switch
                  label={<span className="type-label">{d.long}</span>}
                  description={on ? undefined : "Nicht verfügbar"}
                  checked={on}
                  onChange={(e) =>
                    update((w) => {
                      w[d.n] = e.target.checked ? [{ start: "09:00", end: "18:00" }] : [];
                      return w;
                    })
                  }
                  className="md:flex-row-reverse md:justify-end"
                />
              </div>
              {on ? (
                <div className="flex flex-1 animate-fade-in flex-col gap-2">
                  {wins.map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Select
                        label="Beginn"
                        hideLabel
                        className="flex-1"
                        value={w.start}
                        aria-invalid={err ? true : undefined}
                        onChange={(e) =>
                          update((x) => {
                            x[d.n][i].start = e.target.value;
                            return x;
                          })
                        }
                      >
                        {START_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Select>
                      <span aria-hidden className="w-3 text-center text-ink-muted">–</span>
                      <Select
                        label="Ende"
                        hideLabel
                        className="flex-1"
                        value={w.end}
                        aria-invalid={err ? true : undefined}
                        onChange={(e) =>
                          update((x) => {
                            x[d.n][i].end = e.target.value;
                            return x;
                          })
                        }
                      >
                        {END_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t === "24:00" ? "24:00 (Mitternacht)" : t}
                          </option>
                        ))}
                      </Select>
                      <IconButton
                        label={`Zeitfenster ${w.start}–${w.end} am ${d.long} entfernen`}
                        className="hover:bg-danger-soft! hover:text-danger"
                        onClick={() =>
                          update((x) => {
                            x[d.n].splice(i, 1);
                            return x;
                          })
                        }
                      >
                        <Icon icon={X} />
                      </IconButton>
                    </div>
                  ))}
                  {err ? (
                    <p className="flex items-center gap-1.5 type-caption text-danger" role="alert">
                      <Icon icon={CircleAlert} size={16} />
                      {err}
                    </p>
                  ) : null}
                  {wins.length < 4 ? (
                    <Button
                      variant="ghost"
                      size="s"
                      className="self-start"
                      icon={<Icon icon={Plus} size={16} />}
                      onClick={() =>
                        update((x) => {
                          const last = x[d.n][x[d.n].length - 1];
                          const s = last ? Math.min(toMin(last.end) + 60, 22 * 60) : 9 * 60;
                          const fmt = (m: number) => (m >= 1440 ? "24:00" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
                          x[d.n].push({ start: fmt(s), end: fmt(Math.min(s + 120, 1440)) });
                          return x;
                        })
                      }
                    >
                      Zeitfenster hinzufügen
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      </div>

      <div aria-live="polite">{error ? <Notice kind="danger">{error}</Notice> : null}</div>

      <div
        className={cn(
          "flex items-center justify-between gap-4",
          stickySave &&
            "sticky bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] z-(--z-sticky-cta) -mx-(--space-gutter) glass-strong glass-edge px-(--space-gutter) py-3 shadow-bar lg:bottom-4 lg:mx-0 lg:rounded-card lg:px-5 lg:shadow-float",
        )}
      >
        <p className="flex items-center gap-2 type-caption text-ink-muted" aria-live="polite">
          <span aria-hidden className={cn("size-2 rounded-full transition-colors duration-base", dirty ? "bg-warning" : "bg-success")} />
          <span className="whitespace-nowrap sm:hidden">{dirty ? "Nicht gespeichert" : "Gespeichert"}</span>
          <span className="max-sm:hidden">{dirty ? "Ungespeicherte Änderungen" : "Alles gespeichert"}</span>
        </p>
        <Button size="l" loading={pending} onClick={save}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

/** Live week overview: one 0–24 h track per day with the bookable windows (decorative; the editor below is the source). */
function WeekOverview({ week, errors }: { week: Week; errors: Record<number, string | null> }) {
  return (
    <div aria-hidden className="flex flex-col gap-1.5">
      {WEEKDAYS.map((d) => (
        <div key={d.n} className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-3">
          <span className={cn("type-caption", week[d.n].length ? "text-ink" : "text-ink-muted")}>{d.short}</span>
          <span className="relative h-2.5 overflow-hidden rounded-full bg-surface-sunken inset-shadow-sunken">
            {week[d.n].map((w, i) => {
              const a = toMin(w.start);
              const b = toMin(w.end);
              if (b <= a) return null;
              return (
                <span
                  key={i}
                  className={cn("absolute inset-y-0 rounded-full transition-[left,width] duration-spring ease-settle", errors[d.n] ? "bg-danger" : "bg-ink")}
                  style={{ left: `${(a / 1440) * 100}%`, width: `${((b - a) / 1440) * 100}%` }}
                />
              );
            })}
          </span>
        </div>
      ))}
      <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3">
        <span />
        <span className="flex justify-between type-caption text-ink-muted num">
          {["0", "6", "12", "18", "24"].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </span>
      </div>
    </div>
  );
}
