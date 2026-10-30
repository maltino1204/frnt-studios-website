import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CountPill } from "./feedback";

export type TabItem = { href: string; label: ReactNode; count?: number; active?: boolean };

/** Link tabs: 44px, 24px gaps, active ink with 2px bar, full-width hairline below. */
export function TabLinks({ items, className, label }: { items: TabItem[]; className?: string; label: string }) {
  return (
    <nav aria-label={label} className={cn("-mx-(--space-gutter) overflow-x-auto border-b border-line px-(--space-gutter) scrollbar-none md:mx-0 md:px-0", className)}>
      <ul className="flex gap-6">
        {items.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-touch items-center gap-2 type-label whitespace-nowrap transition-colors duration-fast",
                t.active ? "text-ink after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
              {t.count ? <CountPill>{t.count}</CountPill> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
