"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CircleUserRound,
  ExternalLink,
  Inbox,
  LogOut,
  MapPinned,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { CountPill, Status } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { signOutAction } from "@/server/actions/auth";
import type { ProviderStatus } from "@/server/dto";
import { PROVIDER_STATUS_LABEL, PROVIDER_STATUS_TONE } from "./labels";

type NavItem = { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean; count?: number };

const PROFILE_SUBPAGES = ["/pro/profil", "/pro/leistungen", "/pro/einsatzgebiet", "/pro/verifizierung", "/pro/bewertungen", "/pro/einstellungen"];

function mainItems(requests: number): NavItem[] {
  return [
    { href: routes.pro.root(), label: "Heute", icon: Sun, match: (p) => p === "/pro" },
    { href: routes.pro.bookings(), label: "Termine", icon: Inbox, match: (p) => p.startsWith("/pro/termine"), count: requests },
    { href: routes.pro.calendar(), label: "Kalender", icon: CalendarDays, match: (p) => p.startsWith("/pro/kalender") },
    { href: routes.pro.earnings(), label: "Einnahmen", icon: Wallet, match: (p) => p.startsWith("/pro/einnahmen") },
  ];
}

const profileItems: NavItem[] = [
  { href: routes.pro.profile(), label: "Profil & Portfolio", icon: CircleUserRound, match: (p) => p.startsWith("/pro/profil") },
  { href: routes.pro.services(), label: "Leistungen & Preise", icon: Tag, match: (p) => p.startsWith("/pro/leistungen") },
  { href: routes.pro.area(), label: "Einsatzgebiet", icon: MapPinned, match: (p) => p.startsWith("/pro/einsatzgebiet") },
  { href: routes.pro.verification(), label: "Verifizierung", icon: ShieldCheck, match: (p) => p.startsWith("/pro/verifizierung") },
  { href: routes.pro.reviews(), label: "Bewertungen", icon: Star, match: (p) => p.startsWith("/pro/bewertungen") },
  { href: routes.pro.settings(), label: "Einstellungen", icon: Settings, match: (p) => p.startsWith("/pro/einstellungen") },
];

export function ProShell({
  children,
  displayName,
  avatarUrl,
  status,
  publicHref,
  openRequests,
}: {
  children: ReactNode;
  displayName: string;
  avatarUrl: string | null;
  status: ProviderStatus;
  publicHref: string | null;
  openRequests: number;
}) {
  const pathname = usePathname() ?? "/pro";
  const main = mainItems(openRequests);
  const bottom: NavItem[] = [
    ...main,
    { href: routes.pro.profile(), label: "Profil", icon: CircleUserRound, match: (p) => PROFILE_SUBPAGES.some((s) => p.startsWith(s)) },
  ];

  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <a href="#pro-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-(--z-toast) focus:bg-surface-raised focus:px-4 focus:py-3 focus:type-label">
        Zum Inhalt springen
      </a>

      {/* Desktop sidebar (240px) */}
      <div className="hidden w-60 shrink-0 border-r border-line bg-surface-sunken lg:block">
      <aside className="sticky top-0 flex h-dvh flex-col" aria-label="Profi-Navigation">
        <div className="flex h-18 items-center gap-3 px-6">
          <Link href={routes.pro.root()} aria-label="SOMA Pro – Heute" className="inline-flex items-center gap-3 text-ink">
            <Wordmark className="h-5! w-auto" />
            <span className="border-l border-line-strong pl-3 type-label-s text-ink-muted">Pro</span>
          </Link>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-3 pt-4 pb-6">
          <ul className="flex flex-col gap-0.5">
            {main.map((it) => (
              <SidebarLink key={it.href} item={it} active={it.match(pathname)} />
            ))}
          </ul>
          <div className="flex flex-col gap-2">
            <p className="px-3 type-overline text-ink-muted">Profil & Angebot</p>
            <ul className="flex flex-col gap-0.5">
              {profileItems.map((it) => (
                <SidebarLink key={it.href} item={it} active={it.match(pathname)} />
              ))}
            </ul>
          </div>
        </nav>
        <div className="flex flex-col gap-3 border-t border-line px-6 py-5">
          <div className="flex items-center gap-3">
            <Avatar src={avatarUrl} name={displayName} size={40} className="bg-surface-raised!" />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate type-label text-ink">{displayName}</span>
              <Status tone={PROVIDER_STATUS_TONE[status]} className="type-caption!">
                {PROVIDER_STATUS_LABEL[status]}
              </Status>
            </div>
          </div>
          <div className="flex flex-col">
            {publicHref ? (
              <Link href={publicHref} className="inline-flex min-h-9 items-center gap-2 type-label-s text-ink-muted hover:text-ink">
                <ExternalLink size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                Öffentliches Profil
              </Link>
            ) : null}
            <form action={signOutAction}>
              <button type="submit" className="inline-flex min-h-9 items-center gap-2 type-label-s text-ink-muted hover:text-ink">
                <LogOut size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </aside>
      </div>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-(--z-header) flex h-14 items-center justify-between border-b border-line bg-surface px-(--space-gutter) lg:hidden">
        <Link href={routes.pro.root()} aria-label="SOMA Pro – Heute" className="inline-flex items-center gap-3 text-ink">
          <Wordmark className="h-[18px]! w-auto" />
          <span className="border-l border-line-strong pl-3 type-label-s text-ink-muted">Pro</span>
        </Link>
        {status !== "approved" ? (
          <Status tone={PROVIDER_STATUS_TONE[status]} className="type-caption!">
            {PROVIDER_STATUS_LABEL[status]}
          </Status>
        ) : (
          <Link href={routes.pro.profile()} className="-mr-1 inline-flex size-touch items-center justify-center">
            <Avatar src={avatarUrl} name={displayName} size={32} />
            <span className="sr-only">Dein Profil</span>
          </Link>
        )}
      </header>

      <main id="pro-main" className="flex min-w-0 flex-1 flex-col pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+2rem)] lg:pb-16">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Hauptnavigation"
        className="fixed inset-x-0 bottom-0 z-(--z-bottom-nav) border-t border-line bg-surface-raised pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid h-(--bottom-nav-height) grid-cols-5">
          {bottom.map((it) => {
            const active = it.match(pathname);
            return (
              <li key={it.label} className="flex">
                <Link
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-fast",
                    active ? "text-ink" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {active ? <span aria-hidden className="absolute top-0 h-0.5 w-4 bg-ink" /> : null}
                  <span className="relative">
                    <it.icon size={24} strokeWidth={active ? 1.75 : 1.5} absoluteStrokeWidth aria-hidden />
                    {it.count ? (
                      <CountPill accent className="absolute -top-1.5 -right-2.5">
                        {it.count}
                      </CountPill>
                    ) : null}
                  </span>
                  <span className="type-caption">{it.label}</span>
                  {it.count ? <span className="sr-only">, {it.count} offen</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex h-11 items-center gap-3 rounded-xs px-3 type-body-s font-[520] transition-colors duration-fast",
          active ? "bg-surface-raised text-ink" : "text-ink-muted hover:bg-surface-raised/60 hover:text-ink",
        )}
      >
        {active ? <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 bg-ink" /> : null}
        <item.icon size={20} strokeWidth={active ? 1.75 : 1.5} absoluteStrokeWidth aria-hidden />
        <span className="flex-1">{item.label}</span>
        {item.count ? <CountPill accent>{item.count}</CountPill> : null}
      </Link>
    </li>
  );
}
