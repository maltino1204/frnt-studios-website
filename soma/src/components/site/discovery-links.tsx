import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AuraArt } from "@/components/ui/aura";
import { Icon } from "@/components/ui/icon";
import { surfaceClasses } from "@/components/ui/surface";
import { cn } from "@/lib/cn";

export type LinkGridItem = { href: string; name: string; meta?: string | null; muted?: boolean; tone?: string };

/**
 * Link cards (cities, categories): a small seeded aura swatch, the name and a
 * caption in a level-1 card that lifts on hover. Muted items (no supply yet)
 * stay flat on the page so the live ones lead.
 */
export function LinkGrid({ items, columns = 2, size = "s", className }: { items: LinkGridItem[]; columns?: 1 | 2 | 3; size?: "s" | "m"; className?: string }) {
  return (
    <ul className={cn("grid gap-3 lg:gap-4", columns >= 2 && "md:grid-cols-2", columns === 3 && "lg:grid-cols-3", className)}>
      {items.map((it) => (
        <li key={it.href} className="min-w-0">
          <Link
            href={it.href}
            className={cn(
              "group flex h-full min-h-20 items-center gap-4 p-3 pr-4",
              it.muted ? "rounded-card bg-surface-sunken/70 transition-colors duration-fast hover:bg-surface-sunken focus-ring" : surfaceClasses({ interactive: true }),
            )}
          >
            <span aria-hidden className={cn("relative size-12 shrink-0 overflow-hidden rounded-tile", it.muted ? "opacity-50 grayscale-[0.4]" : "shadow-raised", size === "m" && "md:size-14")}>
              <AuraArt seed={it.name} tone={it.tone} grain={false} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={cn("truncate", size === "m" ? "type-heading-l" : "type-heading-m", it.muted ? "text-ink-muted" : "text-ink")}>{it.name}</span>
              {it.meta ? <span className="truncate type-caption text-ink-muted num">{it.meta}</span> : null}
            </span>
            <Icon
              icon={ArrowRight}
              size={18}
              className="shrink-0 text-ink-muted transition-[color,translate] duration-base ease-settle group-hover:translate-x-0.5 group-hover:text-ink"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** "2 Profis" / "Noch keine Profis" */
export function providerCountLabel(n: number): string {
  return n === 0 ? "Noch keine Profis" : n === 1 ? "1 Profi" : `${n} Profis`;
}
