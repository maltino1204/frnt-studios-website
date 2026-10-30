"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import {
  CalendarRange,
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  ListTree,
  LogOut,
  MapPin,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Percent,
  Scale,
  Star,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Mark } from "@/components/brand/logo";
import { Icon } from "@/components/ui/icon";
import { CountPill } from "@/components/ui/feedback";
import { Sheet } from "@/components/ui/sheet";
import { initials } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { signOutAction } from "@/server/actions/auth";

type NavItem = { href: string; label: string; icon: LucideIcon; count?: "verification" | "disputes" };
type NavGroup = { label: string; items: NavItem[] };

export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Betrieb",
    items: [
      { href: routes.admin.root(), label: "Übersicht", icon: LayoutDashboard },
      { href: routes.admin.bookings(), label: "Buchungen", icon: CalendarRange },
      { href: routes.admin.disputes(), label: "Streitfälle", icon: Scale, count: "disputes" },
    ],
  },
  {
    label: "Marktplatz",
    items: [
      { href: routes.admin.providers(), label: "Profis & Verifizierung", icon: UserCheck, count: "verification" },
      { href: routes.admin.users(), label: "Nutzer", icon: Users },
      { href: "/admin/bewertungen", label: "Bewertungen", icon: Star },
      { href: routes.admin.categories(), label: "Kategorien & Leistungen", icon: ListTree },
      { href: routes.admin.regions(), label: "Regionen", icon: MapPin },
    ],
  },
  {
    label: "Finanzen",
    items: [
      { href: routes.admin.payments(), label: "Zahlungen & Auszahlungen", icon: CreditCard },
      { href: routes.admin.commissions(), label: "Provisionen", icon: Percent },
    ],
  },
  {
    label: "System",
    items: [
      { href: routes.admin.content(), label: "Inhalte", icon: FileText },
      { href: routes.admin.audit(), label: "Protokoll", icon: History },
    ],
  },
];

export type ShellProps = {
  user: { name: string; email: string };
  demo: boolean;
  counts: { verification: number; disputes: number };
  initialCollapsed: boolean;
  children: ReactNode;
};

function isActive(pathname: string, href: string): boolean {
  if (href === routes.admin.root()) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const RAIL_COOKIE = "soma_admin_rail";

/** Admin chrome: 248px sidebar (64px rail) from lg, top bar + sheet menu below. */
export function AdminShell({ user, demo, counts, initialCollapsed, children }: ShellProps) {
  const pathname = usePathname() ?? routes.admin.root();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const asideRef = useRef<HTMLElement>(null);

  // The sticky sidebar fills the visible viewport: while content above the shell
  // (e.g. the demo ribbon) is on screen, it is shortened by that amount so the
  // footer (user, environment badge) never sits below the fold.
  useEffect(() => {
    const el = asideRef.current;
    if (!el) return;
    let offset = 0;
    let raf = 0;
    const update = () => {
      el.style.height = `calc(100dvh - ${Math.max(0, offset - window.scrollY)}px)`;
    };
    const measure = () => {
      offset = (el.parentElement?.getBoundingClientRect().top ?? 0) + window.scrollY;
      update();
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${RAIL_COOKIE}=${next ? "1" : "0"}; path=/admin; max-age=31536000; samesite=lax`;
  };

  const current = ADMIN_NAV.flatMap((g) => g.items).find((i) => isActive(pathname, i.href));

  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <a
        href="#inhalt"
        className="sr-only z-(--z-toast) bg-ink px-4 py-2 text-ink-inverse focus:not-sr-only focus:fixed focus:top-2 focus:left-2 type-label-s"
      >
        Zum Inhalt springen
      </a>

      {/* Desktop sidebar */}
      <aside
        ref={asideRef}
        aria-label="Admin-Navigation"
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface-sunken lg:flex",
          collapsed ? "w-16" : "w-62",
        )}
      >
        <div className={cn("flex h-14 shrink-0 items-center border-b border-line", collapsed ? "justify-center" : "justify-between pr-2 pl-5")}>
          {collapsed ? (
            <Link href={routes.admin.root()} className="flex size-10 items-center justify-center rounded-xs" aria-label="Admin – Übersicht" title="Admin – Übersicht">
              <Mark className="h-6 text-ink" />
            </Link>
          ) : (
            <Link href={routes.admin.root()} className="flex items-center gap-3 rounded-xs">
              <Mark className="h-6 text-ink" />
              <span className="type-heading-s">Admin</span>
              <span className="sr-only"> – Übersicht</span>
            </Link>
          )}
          {collapsed ? null : (
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Navigation ausklappen" : "Navigation einklappen"}
            aria-expanded={!collapsed}
            title={collapsed ? "Navigation ausklappen" : "Navigation einklappen"}
            className="inline-flex size-9 items-center justify-center rounded-xs text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <Icon icon={collapsed ? PanelLeftOpen : PanelLeftClose} />
          </button>
          )}
        </div>
        <nav aria-label="Bereiche" className="min-h-0 flex-1 overflow-y-auto py-2">
          <NavGroups pathname={pathname} counts={counts} collapsed={collapsed} />
          {collapsed ? (
            <div className="mt-2 flex justify-center border-t border-line pt-2">
              <button
                type="button"
                onClick={toggle}
                aria-label="Navigation ausklappen"
                aria-expanded={false}
                title="Navigation ausklappen"
                className="inline-flex size-9 items-center justify-center rounded-xs text-ink-muted transition-colors hover:bg-surface hover:text-ink"
              >
                <Icon icon={PanelLeftOpen} />
              </button>
            </div>
          ) : null}
        </nav>
        <SidebarFooter user={user} demo={demo} collapsed={collapsed} />
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-(--z-header) flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface-sunken pr-1 pl-4 lg:hidden">
        <Link href={routes.admin.root()} className="flex min-w-0 items-center gap-3">
          <Mark className="h-5 shrink-0 text-ink" />
          <span className="type-heading-s">Admin</span>
          {current && current.href !== routes.admin.root() ? (
            <span className="truncate type-body-s text-ink-muted">· {current.label}</span>
          ) : null}
          <span className="sr-only"> – zur Übersicht</span>
        </Link>
        <div className="flex items-center gap-1">
          {demo ? <EnvBadge compact /> : null}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Menü öffnen"
            aria-haspopup="dialog"
            className="relative inline-flex size-touch items-center justify-center rounded-xs text-ink hover:bg-surface"
          >
            <Icon icon={Menu} />
            {counts.verification + counts.disputes > 0 ? (
              <span aria-hidden className="absolute top-2.5 right-2.5 size-2 rounded-full bg-accent" />
            ) : null}
          </button>
        </div>
      </header>
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Admin" className="bg-surface-sunken">
        <div className="-mx-5 -my-5 py-2" onClick={(e) => (e.target as HTMLElement).closest("a") && setMenuOpen(false)}>
          <NavGroups pathname={pathname} counts={counts} collapsed={false} touch />
          <SidebarFooter user={user} demo={demo} collapsed={false} />
        </div>
      </Sheet>

      <main id="inhalt" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
        <div className="mx-auto w-full max-w-dashboard px-(--space-gutter) pt-6 pb-16 lg:px-8 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}

function NavGroups({ pathname, counts, collapsed, touch }: { pathname: string; counts: ShellProps["counts"]; collapsed: boolean; touch?: boolean }) {
  return (
    <>
      {ADMIN_NAV.map((g, gi) => (
        <div key={g.label} className={cn(gi > 0 && (collapsed ? "mt-2 border-t border-line pt-2" : "mt-4"))}>
          {collapsed ? null : <p className="px-5 pt-2 pb-1.5 type-overline text-ink-muted">{g.label}</p>}
          <ul className={cn("flex flex-col gap-px", collapsed ? "px-2" : "px-2")}>
            {g.items.map((item) => {
              const active = isActive(pathname, item.href);
              const count = item.count ? counts[item.count] : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? (count ? `${item.label} (${count})` : item.label) : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xs type-body-s transition-colors duration-fast",
                      touch ? "h-touch px-3" : "h-9",
                      collapsed ? "justify-center px-0" : "px-3",
                      active
                        ? "bg-surface-raised font-[520] text-ink before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:bg-ink"
                        : "text-ink-muted hover:bg-surface hover:text-ink",
                    )}
                  >
                    <Icon icon={item.icon} className="shrink-0" strokeWidth={active ? 1.75 : 1.5} />
                    {collapsed ? (
                      count ? <span aria-hidden className="absolute top-1.5 right-2 size-1.5 rounded-full bg-accent" /> : null
                    ) : (
                      <>
                        <span className={cn("min-w-0 flex-1 truncate", item.label.length > 20 && "condensed")}>{item.label}</span>
                        {count ? <CountPill accent>{count}</CountPill> : null}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

function EnvBadge({ compact }: { compact?: boolean }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 bg-warning-soft px-2 type-caption whitespace-nowrap text-warning", compact && "h-6")}>
      <span aria-hidden className="size-1.5 rounded-full bg-warning" />
      {compact ? "Demo" : "Demo-Umgebung"}
    </span>
  );
}

function SidebarFooter({ user, demo, collapsed }: { user: ShellProps["user"]; demo: boolean; collapsed: boolean }) {
  const [pending, start] = useTransition();
  const signOut = () => start(() => signOutAction());
  if (collapsed) {
    return (
      <div className="flex shrink-0 flex-col items-center gap-2 border-t border-line py-3">
        {demo ? <span title="Demo-Umgebung" aria-label="Demo-Umgebung" className="size-2 rounded-full bg-warning" /> : null}
        <span title={`${user.name} · ${user.email}`} className="inline-flex size-8 items-center justify-center rounded-full bg-surface-raised type-caption font-semibold text-ink-muted">
          {initials(user.name)}
        </span>
        <button
          type="button"
          onClick={signOut}
          disabled={pending}
          aria-label="Abmelden"
          title="Abmelden"
          className="inline-flex size-9 items-center justify-center rounded-xs text-ink-muted hover:bg-surface hover:text-ink"
        >
          <Icon icon={LogOut} />
        </button>
      </div>
    );
  }
  return (
    <div className="flex shrink-0 flex-col gap-3 border-t border-line px-5 py-4">
      {demo ? (
        <div>
          <EnvBadge />
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <span aria-hidden className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-raised type-caption font-semibold text-ink-muted">
          {initials(user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate type-label-s text-ink">{user.name}</p>
          <p className="truncate type-caption text-ink-muted">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={pending}
          aria-label="Abmelden"
          title="Abmelden"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-xs text-ink-muted hover:bg-surface hover:text-ink"
        >
          <Icon icon={LogOut} />
        </button>
      </div>
    </div>
  );
}
