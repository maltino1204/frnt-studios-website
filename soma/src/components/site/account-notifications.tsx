"use client";

import Link from "next/link";
import { Bell, CalendarCheck, CalendarX2, CheckCheck, ChevronRight, CircleCheck, Gift, Hourglass, Star, Wallet, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CountPill, EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";
import { markNotificationsReadAction, updateNotificationPreferencesAction } from "@/server/actions/account";
import type { NotificationDTO, NotificationPreferencesDTO } from "@/server/dto";

// SMS and push are not built (BRAND_STRATEGY § 7.3): their switches stay hidden until they ship; the stored values are kept.
const PREFS: Array<{ key: keyof NotificationPreferencesDTO; label: string; description: string }> = [
  { key: "emailBookings", label: "Buchungen per E-Mail", description: "Bestätigung, Absage, Änderungen." },
  { key: "emailReminders", label: "Erinnerungen per E-Mail", description: "24\u00a0Stunden vor deinem Termin." },
  { key: "emailMarketing", label: "Neuigkeiten von SOMA", description: "Gelegentlich, jederzeit abbestellbar." },
];

function iconFor(type: string): LucideIcon {
  if (type === "booking.confirmed") return CalendarCheck;
  if (type === "booking.requested") return Hourglass;
  if (type === "booking.cancelled" || type === "booking.declined" || type === "booking.expired") return CalendarX2;
  if (type === "booking.completed") return CircleCheck;
  if (type.startsWith("review.")) return Star;
  if (type.startsWith("referral.") || type.startsWith("credit.")) return Gift;
  if (type.startsWith("payout.")) return Wallet;
  return Bell;
}

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
    <div className="flex flex-col divide-y divide-line overflow-hidden rounded-card bg-surface-raised px-5 shadow-raised md:px-6">
      {PREFS.map((p) => (
        <Switch key={p.key} label={p.label} description={p.description} checked={prefs[p.key]} onChange={(e) => change(p.key, e.target.checked)} className="py-3.5" />
      ))}
    </div>
  );
}

/**
 * In-app inbox with mark-as-read. Relative times ("vor 5 Minuten") start from the
 * server's render time, so server HTML and hydration agree (N11), and move to the
 * client clock only after mount (then once a minute).
 */
export function NotificationInbox({ items, renderedAt }: { items: NotificationDTO[]; renderedAt: number }) {
  const [list, setList] = useState(items);
  const [now, setNow] = useState(renderedAt);
  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);
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
      <div className="rounded-card bg-surface-raised px-5 shadow-raised md:px-7">
        <EmptyState title="Alles gelesen." seed="konto-mitteilungen" className="py-8">
          Neuigkeiten zu deinen Terminen erscheinen hier.
        </EmptyState>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-card bg-surface-raised shadow-raised">
      <div className="flex min-h-14 items-center justify-between gap-4 border-b border-line px-4 py-2 md:px-5">
        <p className="flex items-center gap-2 type-label-s text-ink" aria-live="polite">
          {unread ? (
            <>
              <CountPill accent>{unread}</CountPill>
              {`${unread} ungelesen`}
            </>
          ) : (
            <>
              <Icon icon={CheckCheck} size={16} className="text-success" />
              Alles gelesen
            </>
          )}
        </p>
        {unread ? (
          <Button variant="ghost" size="s" onClick={markAll} loading={pending} icon={<Icon icon={CheckCheck} />} className="-mr-2">
            Alle als gelesen markieren
          </Button>
        ) : null}
      </div>
      <ul className="flex flex-col">
        {list.map((n) => {
          const isUnread = !n.readAt;
          const body = (
            <>
              <span
                aria-hidden
                className={cn(
                  "relative inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-base",
                  isUnread ? "bg-surface-sunken text-ink" : "bg-surface-sunken text-ink-muted",
                )}
              >
                <Icon icon={iconFor(n.type)} size={16} />
                {isUnread ? <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-ink shadow-[0_0_0_2px_var(--color-surface-raised)]" /> : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-start justify-between gap-3">
                  <span className={cn("type-body-s text-ink", isUnread && "font-semibold")}>
                    {isUnread ? <span className="sr-only">Ungelesen: </span> : null}
                    {n.title}
                  </span>
                  <span className="shrink-0 pt-px type-caption text-ink-muted">{formatRelative(n.createdAt, new Date(now))}</span>
                </span>
                {n.body ? <span className="block type-body-s text-ink-muted">{n.body}</span> : null}
              </span>
              {n.href ? <Icon icon={ChevronRight} size={16} className="mt-2.5 shrink-0 text-ink-muted transition-transform duration-fast group-hover:translate-x-0.5" /> : null}
            </>
          );
          const cls = cn(
            "group flex w-full items-start gap-3.5 px-4 py-3.5 text-left transition-colors duration-fast focus-ring md:px-5",
            isUnread ? "bg-surface-tint hover:bg-surface-pressed" : "hover:bg-surface-sunken",
          );
          return (
            <li key={n.id} className="border-b border-line last:border-b-0">
              {n.href ? (
                <Link href={n.href} onClick={() => markOne(n.id)} className={cls}>
                  {body}
                </Link>
              ) : (
                <button type="button" onClick={() => markOne(n.id)} className={cls}>
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
