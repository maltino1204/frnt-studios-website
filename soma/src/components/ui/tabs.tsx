import Link from "next/link";
import { ViewTransition, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CountPill } from "./feedback";

export type TabItem = { href: string; label: ReactNode; count?: number; active?: boolean };

const ident = (s: string) => s.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "tabs";

/**
 * Link tabs: 44px, active ink with a 2px bar under the label, hairline below.
 * The bar glides to the new tab on navigation (shared view transition).
 */
export function TabLinks({ items, className, label }: { items: TabItem[]; className?: string; label: string }) {
  const name = `tab-indicator-${ident(label)}`;
  return (
    <nav aria-label={label} className={cn("-mx-(--space-gutter) overflow-x-auto border-b border-line px-(--space-gutter) scrollbar-none md:mx-0 md:px-0", className)}>
      <ul className="flex gap-1">
        {items.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={cn(
                "group relative isolate inline-flex h-touch items-center gap-2 px-2.5 type-label whitespace-nowrap transition-colors duration-fast focus-ring rounded-control",
                t.active ? "text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              <span aria-hidden className="absolute inset-x-0 inset-y-1.5 -z-10 rounded-control bg-surface-sunken opacity-0 transition-opacity duration-fast group-hover:opacity-100" />
              {t.label}
              {t.count ? <CountPill accent={t.active}>{t.count}</CountPill> : null}
              {t.active ? (
                <ViewTransition name={name} share="soma-morph" default="none">
                  <span aria-hidden className="absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-ink" />
                </ViewTransition>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
