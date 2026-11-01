"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { Input, Select, Switch } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { plural } from "@/lib/format";
import { routes } from "@/lib/routes";
import { addTimeOffAction, deleteTimeOffAction } from "@/server/actions/pro";
import type { TimeOffDTO } from "@/server/dto";
import { addDaysKey, berlinDateKey, berlinToIso, formatTimeOffRange, timeOptions } from "./time";
import { DateTile } from "./ui";
import { proError } from "./labels";

const REASONS = ["Urlaub", "Krank", "Fortbildung", "Privat"];
const TIMES = timeOptions(30, 0, 24 * 60);

export function TimeOffEditor({ entries }: { entries: TimeOffDTO[] }) {
  const router = useRouter();
  const toast = useToast();
  const today = berlinDateKey();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [allDay, setAllDay] = useState(true);
  const [fromTime, setFromTime] = useState("09:00");
  const [toTime, setToTime] = useState("13:00");
  const [reason, setReason] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<number>(0);
  const [pending, start] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  const add = () => {
    setError(null);
    setFieldErrors({});
    setConflicts(0);
    if (!from || !to) return setFieldErrors({ from: "Bitte ein Datum wählen." });
    const startIso = berlinToIso(from, allDay ? "00:00" : fromTime);
    const endIso = allDay ? berlinToIso(addDaysKey(to, 1), "00:00") : berlinToIso(to, toTime);
    if (Date.parse(endIso) <= Date.parse(startIso)) return setFieldErrors({ end: "Das Ende muss nach dem Beginn liegen." });
    start(async () => {
      const res = await addTimeOffAction({ start: startIso, end: endIso, reason: reason.trim() || undefined });
      if (!res.ok) {
        setFieldErrors(res.fieldErrors ?? {});
        setError(proError(res.error));
        return;
      }
      setConflicts(res.data.conflictingBookings);
      toast.show("Abwesenheit eingetragen. In diesem Zeitraum kann niemand buchen.");
      setReason("");
      router.refresh();
    });
  };

  const remove = (id: string) => {
    setDeleting(id);
    start(async () => {
      const res = await deleteTimeOffAction(id);
      setDeleting(null);
      if (!res.ok) return toast.show(proError(res.error), { kind: "error" });
      toast.show("Abwesenheit entfernt.");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <section className="order-2 flex flex-col gap-4 lg:order-1 lg:col-span-6" aria-labelledby="to-list">
        <h2 id="to-list" className="type-heading-m">
          Eingetragen
        </h2>
        {entries.length ? (
          <ul className="divide-y divide-line overflow-hidden rounded-card bg-surface-raised shadow-raised">
            {entries.map((t) => (
              <li key={t.id} className={cn("flex min-h-18 items-center gap-4 px-4 py-3 transition-opacity duration-base sm:px-5", deleting === t.id && "opacity-50")}>
                <DateTile date={t.start} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-body-s font-[560] text-ink num">{formatTimeOffRange(t)}</span>
                  <span className="truncate type-caption text-ink-muted">{t.reason ?? "Ohne Grund"}</span>
                </div>
                <IconButton label={`Abwesenheit ${formatTimeOffRange(t)} entfernen`} onClick={() => remove(t.id)} disabled={deleting === t.id} className="hover:bg-danger-soft! hover:text-danger">
                  <Icon icon={Trash} />
                </IconButton>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-card bg-surface-raised px-5 shadow-raised">
            <EmptyState className="py-6!" seed="pro-abwesenheit" title="Keine Abwesenheiten.">
              Trage Urlaub, Fortbildungen oder freie Nachmittage ein – dann bietet SOMA in dieser Zeit keine Termine an.
            </EmptyState>
          </div>
        )}
      </section>

      <section className="order-1 flex flex-col gap-5 self-start rounded-card bg-surface-raised p-5 shadow-raised lg:order-2 lg:col-span-6 lg:p-6" aria-labelledby="to-add">
        <h2 id="to-add" className="type-heading-m">
          Abwesenheit eintragen
        </h2>
        <Switch label="Ganztägig" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Von"
            type="date"
            value={from}
            min={today}
            onChange={(e) => {
              setFrom(e.target.value);
              if (e.target.value > to) setTo(e.target.value);
            }}
            error={fieldErrors.from ?? fieldErrors.start}
          />
          <Input label="Bis" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} error={fieldErrors.end} />
        </div>
        {!allDay ? (
          <div className="grid grid-cols-2 gap-3">
            <Select label="Ab" value={fromTime} onChange={(e) => setFromTime(e.target.value)}>
              {TIMES.slice(0, -1).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
            <Select label="Bis" value={toTime} onChange={(e) => setToTime(e.target.value)}>
              {TIMES.slice(1).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Input label="Grund" optional maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} hint="Nur für dich sichtbar." error={fieldErrors.reason} />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Grund vorschlagen">
            {REASONS.map((r) => (
              <Chip key={r} selected={reason === r} onClick={() => setReason(r)}>
                {r}
              </Chip>
            ))}
          </div>
        </div>
        <div aria-live="polite" className="flex flex-col gap-3">
          {error ? <Notice kind="danger">{error}</Notice> : null}
          {conflicts > 0 ? (
            <Notice kind="warning" title={`${plural(conflicts, "Termin liegt", "Termine liegen")} in diesem Zeitraum.`}>
              Bestehende Termine werden nicht automatisch storniert. Bitte prüf sie unter <Link href={`${routes.pro.bookings()}?tab=bevorstehend`}>Termine</Link>.
            </Notice>
          ) : null}
        </div>
        <Button size="l" onClick={add} loading={pending && !deleting} icon={<Icon icon={Plus} />} className="self-start max-sm:w-full">
          Abwesenheit eintragen
        </Button>
      </section>
    </div>
  );
}
