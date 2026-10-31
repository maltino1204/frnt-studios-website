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
import { RouteTransition } from "@/components/ui/motion";
import { BottomNav, LinkPending } from "@/components/ui/nav";
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
      <a href="#pro-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-(--z-toast) focus:rounded-full focus:bg-surface-raised focus:px-4 focus:py-3 focus:type-label focus:shadow-float">
        Zum Inhalt springen
      </a>

      {/* Desktop sidebar (240px) */}
      <div className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
      <aside className="sticky top-0 flex h-dvh flex-col" aria-label="Profi-Navigation">
        <div className="flex h-18 items-center gap-3 px-6">
          <Link href={routes.pro.root()} aria-label="SOMA Pro – Heute" className="inline-flex min-h-touch items-center gap-2.5 rounded-control text-ink focus-ring">
            <Wordmark className="h-5! w-auto" />
            <ProBadge />
          </Link>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-3 pt-3 pb-6">
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
        <div className="m-3 flex flex-col gap-3 rounded-card bg-surface-raised p-4 shadow-raised">
          <div className="flex items-center gap-3">
            <Avatar src={avatarUrl} name={displayName} size={40} />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate type-label text-ink">{displayName}</span>
              <Status tone={PROVIDER_STATUS_TONE[status]} className="min-h-5! self-start px-2! py-0.5! type-caption!">
                {PROVIDER_STATUS_LABEL[status]}
              </Status>
            </div>
          </div>
          <div className="flex flex-col border-t border-line pt-2">
            {publicHref ? (
              <Link href={publicHref} className="inline-flex min-h-9 items-center gap-2 rounded-control type-label-s text-ink-muted transition-colors hover:text-ink focus-ring">
                <ExternalLink size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                Öffentliches Profil
              </Link>
            ) : null}
            <form action={signOutAction}>
              <button type="submit" className="inline-flex min-h-9 items-center gap-2 rounded-control type-label-s text-ink-muted transition-colors hover:text-ink focus-ring">
                <LogOut size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </aside>
      </div>

      {/* Mobile top bar (glass) */}
      <header className="sticky top-0 z-(--z-header) flex h-14 items-center justify-between glass-strong px-(--space-gutter) shadow-[0_1px_0_var(--glass-hairline)] lg:hidden">
        <Link href={routes.pro.root()} aria-label="SOMA Pro – Heute" className="inline-flex min-h-touch items-center gap-2.5 rounded-control text-ink focus-ring">
          <Wordmark className="h-[18px]! w-auto" />
          <ProBadge />
        </Link>
        {status !== "approved" ? (
          <Status tone={PROVIDER_STATUS_TONE[status]} className="type-caption!">
            {PROVIDER_STATUS_LABEL[status]}
          </Status>
        ) : (
          <Link href={routes.pro.profile()} className="-mr-1 inline-flex size-touch items-center justify-center rounded-full pressable focus-ring">
            <Avatar src={avatarUrl} name={displayName} size={32} />
            <span className="sr-only">Dein Profil</span>
          </Link>
        )}
      </header>

      <RouteTransition as="main" id="pro-main" className="flex min-w-0 flex-1 flex-col pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+2rem)] lg:pb-16">
        {children}
      </RouteTransition>

      {/* Mobile bottom navigation (glass) */}
      <BottomNav items={bottom.map((it) => ({ href: it.href, label: it.label, icon: it.icon, active: it.match(pathname), count: it.count }))} />
    </div>
  );
}

/** "Pro" marker next to the wordmark: a small ink pill with an aura dot. */
function ProBadge() {
  return (
    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-ink px-2 text-[11px] leading-none font-[620] tracking-[0.02em] text-ink-inverse">
      <span aria-hidden className="size-1.5 rounded-full bg-aura" />
      Pro
    </span>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex h-10 items-center gap-3 rounded-control px-3 type-body-s font-[520] transition-[background-color,color,box-shadow] duration-fast pressable focus-ring",
          active ? "bg-surface-raised text-ink shadow-raised" : "text-ink-muted hover:bg-ink/[0.04] hover:text-ink",
        )}
      >
        {active ? null : <LinkPending />}
        <item.icon size={18} strokeWidth={active ? 1.9 : 1.5} absoluteStrokeWidth aria-hidden className={cn("shrink-0", active && "text-accent")} />
        <span className="flex-1">{item.label}</span>
        {item.count ? <CountPill accent>{item.count}</CountPill> : null}
      </Link>
    </li>
  );
}
