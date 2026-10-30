"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Switch } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";
import { markNotificationsReadAction, updateNotificationPreferencesAction } from "@/server/actions/account";
import type { NotificationDTO, NotificationPreferencesDTO } from "@/server/dto";

const PREFS: Array<{ key: keyof NotificationPreferencesDTO; label: string; description: string }> = [
  { key: "emailBookings", label: "Buchungen per E-Mail", description: "Bestätigung, Absage, Änderungen – mit Kalenderdatei." },
  { key: "emailReminders", label: "Erinnerungen per E-Mail", description: "24 Stunden vor Ihrem Termin." },
  { key: "smsReminders", label: "Erinnerungen per SMS", description: "Kurz vor dem Termin, wenn die Fachkraft unterwegs ist." },
  { key: "pushBookings", label: "Push-Mitteilungen", description: "Für die installierte App auf Ihrem Smartphone." },
  { key: "emailMarketing", label: "Neuigkeiten von SOMA", description: "Gelegentlich, jederzeit abbestellbar." },
];

/** Preferences save on every change (optimistic, reverted on error). */
export function NotificationPrefs({ initial }: { initial: NotificationPreferencesDTO }) {
  const [prefs, setPrefs] = useState(initial);
  const [, start] = useTransition();
  const toast = useToast();
  const change = (key: keyof NotificationPreferencesDTO, value: boolean) => {
    const prev = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    start(async () => {
      const r = await updateNotificationPreferencesAction(next);
      if (!r.ok) {
        setPrefs(prev);
        toast.show(r.error, { kind: "error" });
      } else toast.show("Gespeichert.");
    });
  };
  return (
    <div className="flex flex-col divide-y divide-line border-y border-line">
      {PREFS.map((p) => (
        <Switch key={p.key} label={p.label} description={p.description} checked={prefs[p.key]} onChange={(e) => change(p.key, e.target.checked)} className="py-3" />
      ))}
    </div>
  );
}

/** In-app inbox with mark-as-read. */
export function NotificationInbox({ items }: { items: NotificationDTO[] }) {
  const [list, setList] = useState(items);
  const [pending, start] = useTransition();
  const router = useRouter();
  const unread = list.filter((n) => !n.readAt).length;
  const markAll = () =>
    start(async () => {
      const r = await markNotificationsReadAction("all");
      if (r.ok) {
        setList((l) => l.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
        router.refresh();
      }
    });
  const markOne = (id: string) => {
    setList((l) => l.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)));
    void markNotificationsReadAction([id]).then(() => router.refresh());
  };
  if (!list.length) {
    return (
      <EmptyState title="Alles gelesen." className="py-2">
        Neuigkeiten zu Ihren Terminen erscheinen hier.
      </EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <p className="type-body-s text-ink-muted" aria-live="polite">
          {unread ? `${unread} ungelesen` : "Alles gelesen"}
        </p>
        {unread ? (
          <Button variant="ghost" size="s" onClick={markAll} loading={pending}>
            Alle als gelesen markieren
          </Button>
        ) : null}
      </div>
      <ul className="flex flex-col border-t border-line">
        {list.map((n) => {
          const body = (
            <>
              <span className="flex items-start justify-between gap-3">
                <span className={cn("type-body-s text-ink", !n.readAt && "font-semibold")}>{n.title}</span>
                <span className="shrink-0 type-caption text-ink-muted">{formatRelative(n.createdAt)}</span>
              </span>
              {n.body ? <span className="block type-body-s text-ink-muted">{n.body}</span> : null}
            </>
          );
          return (
            <li key={n.id} className="relative border-b border-line">
              {!n.readAt ? <span aria-hidden className="absolute top-5 -left-3 size-2 rounded-full bg-accent lg:-left-4" /> : null}
              {n.href ? (
                <Link href={n.href} onClick={() => markOne(n.id)} className="flex flex-col gap-1 py-3.5 hover:bg-surface-sunken">
                  {!n.readAt ? <span className="sr-only">Ungelesen: </span> : null}
                  {body}
                </Link>
              ) : (
                <button type="button" onClick={() => markOne(n.id)} className="flex w-full flex-col gap-1 py-3.5 text-left hover:bg-surface-sunken">
                  {!n.readAt ? <span className="sr-only">Ungelesen: </span> : null}
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
