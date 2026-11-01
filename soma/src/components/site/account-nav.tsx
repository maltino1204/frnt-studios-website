"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Compass, Heart, LogOut, User, type LucideIcon } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { CountPill } from "@/components/ui/feedback";
import { BottomNav } from "@/components/ui/nav";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { signOutAction } from "@/server/actions/auth";
import { ACCOUNT_SECTIONS } from "./account-sections";

type NavItem = { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean };

const ITEMS: NavItem[] = [
  { href: routes.home(), label: "Entdecken", icon: Compass, match: () => false },
  { href: routes.account.bookings(), label: "Termine", icon: CalendarDays, match: (p) => p.startsWith("/konto/termine") },
  { href: routes.account.favorites(), label: "Favoriten", icon: Heart, match: (p) => p.startsWith("/konto/favoriten") },
  {
    href: routes.account.root(),
    label: "Konto",
    icon: User,
    match: (p) => p === "/konto" || (p.startsWith("/konto/") && !p.startsWith("/konto/termine") && !p.startsWith("/konto/favoriten")),
  },
];


/** Compact account header; the bottom-nav items move here from lg. */
export function AccountHeader({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-(--z-header) glass-strong shadow-[0_1px_0_var(--color-line)]">
      <div className="mx-auto flex h-(--header-height) w-full max-w-content items-center justify-between gap-6 px-(--space-gutter)">
        <Link href={routes.home()} aria-label="SOMA – zur Startseite" className="-mx-2 inline-flex min-h-touch items-center rounded-control px-2 text-ink focus-ring">
          <Wordmark />
        </Link>
        <nav aria-label="Konto" className="hidden items-center gap-1 lg:flex">
          {ITEMS.map((it) => {
            const active = it.match(pathname);
            return (
              <Link
                key={it.label}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-10 items-center rounded-full px-4 type-label transition-colors duration-fast pressable focus-ring",
                  active ? "bg-surface-sunken text-ink" : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
                )}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href={routes.account.notifications()}
          className="relative -mr-3 inline-flex size-touch items-center justify-center rounded-full text-ink pressable focus-ring hover:bg-ink/5"
        >
          <Bell size={22} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
          <span className="sr-only">{unread ? `Benachrichtigungen, ${unread} ungelesen` : "Benachrichtigungen"}</span>
          {unread ? (
            <span aria-hidden className="absolute top-1 right-0.5">
              <CountPill accent>{unread > 9 ? "9+" : unread}</CountPill>
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}

/** Mobile bottom navigation: Entdecken · Termine · Favoriten · Konto (glass Paper bar, brand § 9.3). */
export function AccountBottomNav() {
  const pathname = usePathname();
  return <BottomNav items={ITEMS.map((it) => ({ href: it.href, label: it.label, icon: it.icon, active: it.match(pathname) }))} />;
}

/** Desktop side rail with all account sections. */
export function AccountRail() {
  const pathname = usePathname();
  return (
    <nav aria-label="Kontobereiche" className="sticky top-[calc(var(--header-height)+2.5rem)] flex flex-col">
      <ul className="flex flex-col gap-0.5">
        {ACCOUNT_SECTIONS.map((s) => {
          const active = s.href === "/konto" ? pathname === "/konto" : pathname.startsWith(s.href);
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-10 items-center rounded-control px-3 py-2 type-body-s transition-[background-color,color,box-shadow] duration-fast focus-ring",
                  active ? "bg-surface-sunken font-semibold text-ink" : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
                )}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <form action={signOutAction} className="mt-6 border-t border-line pt-4">
        <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-control px-3 type-body-s text-ink-muted transition-colors hover:text-ink focus-ring">
          <LogOut size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
          Abmelden
        </button>
      </form>
    </nav>
  );
}
