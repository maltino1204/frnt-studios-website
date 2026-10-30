import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Filter toolbar above tables: a native GET form, so filters are shareable
 * URLs and work without JavaScript. Children are dense kit fields.
 */
export function FilterForm({
  action,
  children,
  resetHref,
  hidden,
  className,
  label = "Filter",
}: {
  action: string;
  children: ReactNode;
  resetHref?: string;
  hidden?: Record<string, string | undefined>;
  className?: string;
  label?: string;
}) {
  return (
    <form method="get" action={action} role="search" aria-label={label} className={cn("flex flex-wrap items-end gap-3", className)}>
      {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      {children}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="inline-flex h-control-s items-center rounded-xs bg-ink px-3 type-label-s text-ink-inverse transition-colors hover:bg-ink-hover"
        >
          Anwenden
        </button>
        {resetHref ? (
          <Link href={resetHref} className="inline-flex h-control-s items-center rounded-xs px-3 type-label-s text-ink hover:bg-surface-sunken">
            Zurücksetzen
          </Link>
        ) : null}
      </div>
    </form>
  );
}

/** Row of filter chips (ChipLinks) with a muted label. */
export function ChipFilter({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cn("flex min-w-0 items-center gap-3", className)}>
      <span className="hidden shrink-0 type-label-s text-ink-muted md:inline">{label}</span>
      <div className="-mx-(--space-gutter) flex min-w-0 gap-2 overflow-x-auto px-(--space-gutter) py-1 scrollbar-none md:mx-0 md:flex-wrap md:px-0">{children}</div>
    </div>
  );
}
