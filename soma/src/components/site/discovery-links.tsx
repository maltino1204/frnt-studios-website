import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export type LinkGridItem = { href: string; name: string; meta?: string | null; muted?: boolean };

/** Hairline link rows (cities, categories) with a display name and a caption: a list, not cards. */
export function LinkGrid({ items, columns = 2, size = "s", className }: { items: LinkGridItem[]; columns?: 1 | 2 | 3; size?: "s" | "m"; className?: string }) {
  return (
    <ul
      className={cn(
        "grid border-t border-line",
        columns >= 2 && "md:grid-cols-2 md:gap-x-6",
        columns === 3 && "lg:grid-cols-3",
        className,
      )}
    >
      {items.map((it) => (
        <li key={it.href} className="border-b border-line">
          <Link href={it.href} className="group flex min-h-20 items-center justify-between gap-4 py-4">
            <span className="flex min-w-0 flex-col gap-1">
              <span className={cn(size === "m" ? "type-display-m" : "type-display-s", it.muted ? "text-ink-muted" : "text-ink")}>{it.name}</span>
              {it.meta ? <span className="type-caption text-ink-muted num">{it.meta}</span> : null}
            </span>
            <Icon
              icon={ArrowRight}
              className="shrink-0 text-ink-muted transition-[color,transform] duration-fast group-hover:translate-x-0.5 group-hover:text-ink"
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
