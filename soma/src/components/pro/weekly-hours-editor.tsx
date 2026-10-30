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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="type-body-s text-ink-muted">
          <span className="font-semibold text-ink num">{(totalMin / 60).toLocaleString("de-DE", { maximumFractionDigits: 1 })} Std.</span> pro Woche buchbar
        </p>
        <Button variant="ghost" size="s" onClick={copyMonday} disabled={!week[1].length} icon={<Icon icon={Copy} size={16} />}>
          Montag auf Di–Fr übertragen
        </Button>
      </div>

      <ul className="border-y border-line">
        {WEEKDAYS.map((d) => {
          const wins = week[d.n];
          const on = wins.length > 0;
          const err = errors[d.n];
          return (
            <li key={d.n} className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0 md:flex-row md:items-start md:gap-6">
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
                <div className="flex flex-1 flex-col gap-2">
                  {wins.map((w, i) => (
                    <div key={i} className="flex items-end gap-2">
                      <Select
                        label="Beginn"
                        hideLabel={i > 0}
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
                      <span aria-hidden className="pb-3 text-ink-muted">–</span>
                      <Select
                        label="Ende"
                        hideLabel={i > 0}
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
                        className="mb-0.5"
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

      <div aria-live="polite">{error ? <Notice kind="danger">{error}</Notice> : null}</div>

      <div
        className={cn(
          "flex items-center justify-between gap-4",
          stickySave &&
            "sticky bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] z-(--z-sticky-cta) -mx-(--space-gutter) border-t border-line bg-surface-raised px-(--space-gutter) py-3 shadow-bar lg:bottom-0 lg:mx-0 lg:border lg:px-5",
        )}
      >
        <p className="type-caption text-ink-muted">{dirty ? "Ungespeicherte Änderungen" : "Alles gespeichert"}</p>
        <Button size="l" loading={pending} onClick={save}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
