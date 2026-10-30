import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/** Visible breadcrumb trail; pair with `breadcrumbLd` for the same items. */
export function Breadcrumbs({ items, className }: { items: Array<{ name: string; path: string }>; className?: string }) {
  return (
    <nav aria-label="Brotkrümelnavigation" className={cn("-mx-1 overflow-x-auto scrollbar-none", className)}>
      <ol className="flex items-center gap-1 whitespace-nowrap px-1 type-caption text-ink-muted">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={it.path} className="flex items-center gap-1">
              {last ? (
                <span aria-current="page" className="text-ink">
                  {it.name}
                </span>
              ) : (
                <>
                  <Link href={it.path} className="inline-flex min-h-touch items-center hover:text-ink hover:underline hover:underline-offset-4">
                    {it.name}
                  </Link>
                  <Icon icon={ChevronRight} size={16} className="shrink-0" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
