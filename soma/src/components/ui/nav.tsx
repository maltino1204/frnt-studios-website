"use client";

import Link from "next/link";
import { ViewTransition } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { CountPill } from "./feedback";

export type BottomNavItem = { href: string; label: string; icon: LucideIcon; active?: boolean; count?: number };

/**
 * Mobile bottom navigation (design-guideline v2 §8 "Navigation"): glass bar
 * with safe-area padding; the active item sits in a soft pill that glides to
 * the next item on navigation (shared view transition). Hidden from lg.
 */
export function BottomNav({ items, label = "Hauptnavigation", className }: { items: BottomNavItem[]; label?: string; className?: string }) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "fixed inset-x-0 bottom-0 z-(--z-bottom-nav) glass-strong shadow-[0_-1px_0_var(--glass-hairline),0_-12px_32px_-18px_rgb(23_22_31/0.22)] pb-[env(safe-area-inset-bottom)] lg:hidden",
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
                      <span aria-hidden className="absolute inset-0 animate-settle rounded-full bg-ink/[0.07]" />
                    </ViewTransition>
                  ) : null}
                  <I size={22} strokeWidth={it.active ? 2 : 1.5} absoluteStrokeWidth aria-hidden className="relative" />
                  {it.count ? (
                    <CountPill accent className="absolute -top-0.5 right-1.5">
                      {it.count}
                    </CountPill>
                  ) : null}
                </span>
                <span className={cn("type-caption", it.active && "font-[620]")}>{it.label}</span>
                {it.count ? <span className="sr-only">, {it.count} offen</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
