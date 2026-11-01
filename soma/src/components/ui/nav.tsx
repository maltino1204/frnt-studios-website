"use client";

import Link, { useLinkStatus } from "next/link";
import { ViewTransition } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { CountPill } from "./feedback";

/**
 * Pending hint for navigation links (useLinkStatus). When the next page takes a moment (the /pro and /admin
 * overviews render without a loading.tsx skeleton, so they paint complete on first load, A5-9), a soft fill
 * fades in after 100 ms. Always rendered (no layout shift); place it inside a `relative` Link.
 */
export function LinkPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-control bg-ink/[0.06] opacity-0 transition-opacity duration-base ease-calm",
        pending && "opacity-100 delay-100",
        className,
      )}
    />
  );
}

export type BottomNavItem = { href: string; label: string; icon: LucideIcon; active?: boolean; count?: number };

/**
 * Mobile bottom navigation (brand § 9.3 "Navigation"): a Paper glass bar with a hairline and safe-area padding;
 * 4 items, 22 px icons, 11 px labels. Active: Espresso, stroke 1.9, a Linen pill behind that glides to the next
 * item on navigation (shared view transition). Inactive: umber-deep. Hidden from lg.
 */
export function BottomNav({ items, label = "Hauptnavigation", className }: { items: BottomNavItem[]; label?: string; className?: string }) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "fixed inset-x-0 bottom-0 z-(--z-bottom-nav) glass-strong shadow-bar pb-[env(safe-area-inset-bottom)] lg:hidden",
        className,
      )}
    >
      <ul className="mx-auto grid h-(--bottom-nav-height) max-w-xl px-1.5" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((it) => {
          const I = it.icon;
          return (
            <li key={it.label} className="flex">
              <Link
                href={it.href}
                aria-current={it.active ? "page" : undefined}
                className={cn(
                  "group relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-control pressable focus-ring",
                  it.active ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                <span className="relative flex h-8 w-14 items-center justify-center">
                  {it.active ? (
                    <ViewTransition name={`${label.replace(/[^a-zA-Z]/g, "")}-pill`} share="soma-morph" default="none">
                      <span aria-hidden className="absolute inset-0 animate-settle rounded-full bg-surface-sunken" />
                    </ViewTransition>
                  ) : (
                    <LinkPending className="rounded-full" />
                  )}
                  <I size={22} strokeWidth={it.active ? 1.9 : 1.5} absoluteStrokeWidth aria-hidden className="relative" />
                  {it.count ? (
                    <CountPill accent className="absolute -top-0.5 right-1.5">
                      {it.count}
                    </CountPill>
                  ) : null}
                </span>
                <span className={cn("text-[12px] leading-[1.2] font-[540]", it.active && "font-semibold")}>{it.label}</span>
                {it.count ? <span className="sr-only">, {it.count} offen</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
