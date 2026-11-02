import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import type { CategoryItem } from "./types";

/**
 * One row of the 02 index (spec § 4.3): one link per category, the sans list title, the tile line and the real price
 * floor. Shared by the interactive `IndexList` (which passes the intent handlers) and its static fallback.
 */
export function IndexRow({ item, i, onIntent }: { item: CategoryItem; i: number; onIntent?: (slug: string) => void }) {
  return (
    <li>
      <Link
        href={item.href}
        prefetch={false}
        onPointerEnter={onIntent ? () => onIntent(item.slug) : undefined}
        onFocus={onIntent ? () => onIntent(item.slug) : undefined}
        className="group grid min-h-[104px] grid-cols-[2.5rem_minmax(0,1fr)_auto_1.25rem] items-center gap-x-5 border-b border-line px-3 text-ink transition-[background-color,scale] duration-fast ease-standard hover:bg-surface-sunken focus-visible:bg-surface-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus active:scale-[0.99]"
      >
        <span className="type-label text-ink-muted num">{String(i + 1).padStart(2, "0")}</span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="type-heading-l">{item.name}</span>
          {item.tagline ? <span className="truncate type-body-s text-ink-muted">{item.tagline}</span> : null}
        </span>
        <span className="flex flex-col items-end gap-0.5 text-right">
          {item.price ? (
            <>
              <span className="type-label-s text-ink num">{item.price}</span>
              <span className="type-caption text-ink-muted">zzgl. Anfahrt</span>
            </>
          ) : null}
        </span>
        <Icon
          icon={ArrowUpRight}
          size={20}
          className="text-ink-muted transition-[translate,color] duration-base ease-settle group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
        />
      </Link>
    </li>
  );
}

/** The index without its preview: the static content the island boundary falls back to (audit-4 R4-1). */
export function StaticIndex({ items }: { items: CategoryItem[] }) {
  return (
    <div className="lp-cat-index">
      <ol className="lp-cat-list border-t border-line">
        {items.map((it, i) => (
          <IndexRow key={it.slug} item={it} i={i} />
        ))}
      </ol>
    </div>
  );
}
