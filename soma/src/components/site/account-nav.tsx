"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Compass, Heart, LogOut, User, type LucideIcon } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { CountPill } from "@/components/ui/feedback";
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
    <header className="sticky top-0 z-(--z-header) border-b border-line bg-surface">
      <div className="mx-auto flex h-(--header-height) w-full max-w-content items-center justify-between gap-6 px-(--space-gutter)">
        <Link href={routes.home()} aria-label="SOMA – zur Startseite" className="text-ink">
          <Wordmark />
        </Link>
        <nav aria-label="Konto" className="hidden h-full items-stretch gap-8 lg:flex">
          {ITEMS.map((it) => {
            const active = it.match(pathname);
            return (
              <Link
                key={it.label}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center type-label transition-colors duration-fast",
                  active ? "text-ink before:absolute before:top-0 before:left-0 before:h-0.5 before:w-4 before:bg-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href={routes.account.notifications()}
          className="relative -mr-3 inline-flex size-touch items-center justify-center rounded-xs text-ink hover:bg-surface-sunken"
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

/** Mobile bottom navigation: Entdecken · Termine · Favoriten · Konto (design-guideline §8). */
export function AccountBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-(--z-bottom-nav) border-t border-line bg-surface-raised pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid h-(--bottom-nav-height) grid-cols-4">
        {ITEMS.map((it) => {
          const active = it.match(pathname);
          const I = it.icon;
          return (
            <li key={it.label} className="flex">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn("relative flex flex-1 flex-col items-center justify-center gap-1", active ? "text-ink" : "text-ink-muted hover:text-ink")}
              >
                {active ? <span aria-hidden className="absolute top-0 h-0.5 w-4 bg-ink" /> : null}
                <I size={24} strokeWidth={active ? 1.75 : 1.5} absoluteStrokeWidth aria-hidden />
                <span className="type-caption">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop side rail with all account sections. */
export function AccountRail() {
  const pathname = usePathname();
  return (
    <nav aria-label="Kontobereiche" className="sticky top-[calc(var(--header-height)+2.5rem)] flex flex-col">
      <ul className="flex flex-col">
        {ACCOUNT_SECTIONS.map((s) => {
          const active = s.href === "/konto" ? pathname === "/konto" : pathname.startsWith(s.href);
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-10 items-center py-2 pl-4 type-body-s transition-colors duration-fast",
                  active ? "font-semibold text-ink before:absolute before:top-2 before:bottom-2 before:left-0 before:w-0.5 before:bg-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <form action={signOutAction} className="mt-6 border-t border-line pt-4">
        <button type="submit" className="inline-flex min-h-10 items-center gap-2 pl-4 type-body-s text-ink-muted hover:text-ink">
          <LogOut size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
          Abmelden
        </button>
      </form>
    </nav>
  );
}
